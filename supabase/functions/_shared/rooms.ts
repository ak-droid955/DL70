// Ported from server/src/rooms.ts (the Node/Socket.IO version's in-memory
// RoomStore). Same validation rules and the same resolveTurn/settleTurn
// sequencing, but state lives in the `rooms` Postgres table instead of a
// `Map`, and each mutating action takes the row lock itself (`SELECT ... FOR
// UPDATE` inside a transaction) instead of relying on a single Node process's
// natural serialization. Rejoin tokens live in `player_tokens` (service-role
// only — RLS denies anon/authenticated entirely) instead of a private Map.
import { randomBytes } from 'node:crypto';
import { sql } from './db.ts';
import {
  BUDGET_PER_TURN_DEFAULT,
  FIRST_ENTRY_MAX_RUNGS,
  MAX_TURNS_DEFAULT,
  PARTY_COLOR_SWATCHES,
  TOTAL_RUNGS,
  VOTE_BANK_IDS,
  forceLockRemainingSeats,
  loadStaticSeats,
  maxPerRungFor,
  resolveTurn
} from './gameData.ts';
import type { Player, Room, TurnLogEntry } from './types.ts';

const MAX_PLAYERS = 5;
const MAX_SYMBOL_BYTES = 250_000; // ~250KB data URL ceiling, guards against abuse
// Allowed per-turn time limits (seconds). Every room is timed; an invalid or
// absent choice falls back to DEFAULT_TURN_TIMER. Keep in sync with
// TURN_TIMER_OPTIONS on the client.
const TURN_TIMER_OPTIONS = [10, 30, 60, 120, 180, 300];
const DEFAULT_TURN_TIMER = 60;

export interface NewPlayerInput {
  name: string;
  partyName: string;
  partyCode?: string;
  colorIndex: number;
  symbol: string | null;
  // Only read when creating a room (the host sets the pace for everyone).
  turnTimerSeconds?: number | null;
}

export interface OpenRoomSummary {
  code: string;
  playerCount: number;
  hostPartyName: string;
  createdAt: number;
}

export class RoomError extends Error {}

function normalizeTurnTimer(seconds: number | null | undefined): number {
  return typeof seconds === 'number' && TURN_TIMER_OPTIONS.includes(seconds) ? seconds : DEFAULT_TURN_TIMER;
}

function randomRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
  return code;
}

function makeToken(): string {
  return randomBytes(18).toString('base64url');
}

function validatePlayerInput(input: NewPlayerInput) {
  const name = (input.name || '').trim().slice(0, 40);
  const partyName = (input.partyName || '').trim().slice(0, 60);
  if (!name || !partyName) throw new RoomError('Enter your name and party name');
  // Optional short party code/abbreviation, e.g. "AAP". Uppercased, alphanumerics only, max 6.
  const partyCode = (input.partyCode || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  let symbol = input.symbol || null;
  if (symbol) {
    if (typeof symbol !== 'string' || !symbol.startsWith('data:image/') || symbol.length > MAX_SYMBOL_BYTES) {
      symbol = null;
    }
  }
  const colorIndex = Number.isInteger(input.colorIndex) ? input.colorIndex : 0;
  const color = PARTY_COLOR_SWATCHES[((colorIndex % PARTY_COLOR_SWATCHES.length) + PARTY_COLOR_SWATCHES.length) % PARTY_COLOR_SWATCHES.length];
  return { name, partyName, partyCode, color, symbol };
}

function makePlayer(input: NewPlayerInput): Player {
  const { name, partyName, partyCode, color, symbol } = validatePlayerInput(input);
  return {
    id: 'p_' + randomBytes(6).toString('hex'),
    name,
    partyName,
    partyCode,
    color,
    symbol,
    seatsWon: 0,
    totalSpent: 0,
    ready: false,
    budgetThisTurn: BUDGET_PER_TURN_DEFAULT,
    pendingBonus: 0
  };
}

// (Re)starts the countdown for the room's current turn: sets turnDeadline so
// clients can render a countdown and so checkExpiry() knows when to
// force-resolve. No real timer is armed here — Edge Functions can't hold one
// across invocations — expiry is instead detected the next time any client
// pings checkExpiry (see index.ts), which every client does on an interval
// while turnDeadline is set.
function startTurnTimer(room: Room): void {
  if (room.phase !== 'playing' || !room.turnTimerSeconds) {
    room.turnDeadline = null;
    return;
  }
  room.turnDeadline = Date.now() + room.turnTimerSeconds * 1000;
}

// Resolves the current turn and advances the room: either ends the game on
// the final turn or opens the next turn and (re)arms its countdown. Shared by
// the all-players-submitted path and the timer-expiry path.
function settleTurn(room: Room): TurnLogEntry {
  const resolvedTurnNumber = room.turn;
  const { events, perPlayerSpend } = resolveTurn(room);
  const entry: TurnLogEntry = { turn: resolvedTurnNumber, events, perPlayerSpend };
  room.turnLog.push(entry);
  if (resolvedTurnNumber >= room.maxTurns) {
    room.phase = 'gameover';
    room.turnDeadline = null;
  } else {
    room.turn = resolvedTurnNumber + 1;
    room.pendingTurn = { turnNumber: room.turn, submissions: {} };
    startTurnTimer(room);
  }
  return entry;
}

// postgres.js doesn't reliably auto-parse jsonb columns back into objects
// through the Supavisor pooler (they can come back as raw JSON text), so
// every jsonb column is parsed explicitly here rather than trusted as-is.
function asJson<T>(value: T | string): T {
  return typeof value === 'string' ? (JSON.parse(value) as T) : value;
}

function rowToRoom(row: Record<string, any>): Room {
  return {
    code: row.code,
    phase: row.phase,
    turn: row.turn,
    maxTurns: row.max_turns,
    budgetPerTurn: row.budget_per_turn,
    turnTimerSeconds: row.turn_timer_seconds,
    turnDeadline: row.turn_deadline ? new Date(row.turn_deadline).getTime() : null,
    hostId: row.host_id,
    players: asJson(row.players),
    seats: asJson(row.seats),
    voteBankInfluence: asJson(row.vote_bank_influence),
    voteBankLeaders: asJson(row.vote_bank_leaders),
    pendingTurn: asJson(row.pending_turn),
    turnLog: asJson(row.turn_log),
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  };
}

// NOTE: jsonb columns are written with sql.json(), NOT
// `${JSON.stringify(x)}::jsonb`. Passing a pre-stringified value makes
// postgres.js send it as a *text* parameter, which lands in the column as a
// JSON string ("{\"a\":1}") rather than a JSON object ({"a":1}) — the value
// ends up double-encoded, every read has to JSON.parse it back out, and SQL
// against the column (jsonb_object_keys, ->>, the cleanup job) fails with
// "cannot call jsonb_object_keys on a scalar". sql.json() serializes once and
// tags the parameter as json so it stores as a real object.
async function persistRoom(tx: typeof sql, room: Room): Promise<void> {
  await tx`
    update rooms set
      phase = ${room.phase},
      turn = ${room.turn},
      max_turns = ${room.maxTurns},
      budget_per_turn = ${room.budgetPerTurn},
      turn_timer_seconds = ${room.turnTimerSeconds},
      turn_deadline = ${room.turnDeadline ? new Date(room.turnDeadline).toISOString() : null},
      host_id = ${room.hostId},
      players = ${sql.json(room.players as never)},
      seats = ${sql.json(room.seats as never)},
      vote_bank_influence = ${sql.json(room.voteBankInfluence as never)},
      vote_bank_leaders = ${sql.json(room.voteBankLeaders as never)},
      pending_turn = ${sql.json(room.pendingTurn as never)},
      turn_log = ${sql.json(room.turnLog as never)},
      updated_at = ${new Date(room.updatedAt).toISOString()}
    where code = ${room.code}
  `;
}

// Loads the room row with a row lock, lets `fn` mutate the plain JS object in
// place (throwing RoomError aborts the whole transaction, so a rejected
// action never partially persists), then writes it back. Returns the final
// persisted room; anything else an action needs to return is captured by the
// caller via a closed-over variable (see submitTurn).
//
// `fn` returning false means "nothing changed" and skips the write entirely.
// That matters because an `update` always produces a new row version and so
// always fires a Postgres Changes event, even when every column is written
// back unchanged: without this, the checkExpiry ping every client sends every
// couple of seconds would broadcast a room update to the whole room on every
// tick, re-rendering the map for everybody several times a second.
async function withRoomLock(code: string, fn: (room: Room) => boolean | void | Promise<boolean | void>): Promise<Room> {
  return sql.begin(async (tx) => {
    const rows = await tx`select * from rooms where code = ${code.toUpperCase()} for update`;
    if (!rows.length) throw new RoomError('Room not found.');
    const room = rowToRoom(rows[0]);
    const changed = await fn(room);
    if (changed !== false) await persistRoom(tx as unknown as typeof sql, room);
    return room;
  });
}

class RoomStore {
  async createRoom(input: NewPlayerInput): Promise<{ room: Room; playerId: string; token: string }> {
    const player = makePlayer(input);
    const staticSeats = loadStaticSeats();
    const seats: Room['seats'] = {};
    Object.values(staticSeats).forEach((s) => {
      seats[s.acNo] = {
        acNo: s.acNo,
        name: s.name,
        pcName: s.pcName,
        electors: s.electors,
        threshold: s.threshold,
        locked: null,
        progress: {}
      };
    });
    const voteBankInfluence: Room['voteBankInfluence'] = {} as Room['voteBankInfluence'];
    const voteBankLeaders: Room['voteBankLeaders'] = {} as Room['voteBankLeaders'];
    VOTE_BANK_IDS.forEach((id) => {
      voteBankInfluence[id] = {};
      voteBankLeaders[id] = null;
    });
    const now = new Date().toISOString();
    const turnTimerSeconds = normalizeTurnTimer(input.turnTimerSeconds);

    let code = '';
    for (let tries = 0; tries < 8 && !code; tries++) {
      const candidate = randomRoomCode();
      const inserted = await sql`
        insert into rooms (
          code, phase, turn, max_turns, budget_per_turn, turn_timer_seconds, turn_deadline, host_id,
          players, seats, vote_bank_influence, vote_bank_leaders, pending_turn, turn_log, created_at, updated_at
        ) values (
          ${candidate}, 'lobby', 1, ${MAX_TURNS_DEFAULT}, ${BUDGET_PER_TURN_DEFAULT}, ${turnTimerSeconds}, null, ${player.id},
          ${sql.json({ [player.id]: player } as never)}, ${sql.json(seats as never)},
          ${sql.json(voteBankInfluence as never)}, ${sql.json(voteBankLeaders as never)},
          ${sql.json({ turnNumber: 1, submissions: {} } as never)}, '[]'::jsonb, ${now}, ${now}
        )
        on conflict (code) do nothing
        returning code
      `;
      if (inserted.length) code = candidate;
    }
    if (!code) throw new RoomError('Could not allocate a room code, please try again.');

    const token = makeToken();
    await sql`insert into player_tokens (player_id, room_code, token) values (${player.id}, ${code}, ${token})`;
    const rows = await sql`select * from rooms where code = ${code}`;
    return { room: rowToRoom(rows[0]), playerId: player.id, token };
  }

  async listOpenRooms(): Promise<OpenRoomSummary[]> {
    const rows = await sql`select code, players, host_id, created_at from rooms where phase = 'lobby'`;
    return rows
      .map((row) => {
        const players = asJson<Record<string, Player>>(row.players);
        return {
          code: row.code as string,
          playerCount: Object.keys(players).length,
          hostPartyName: players[row.host_id]?.partyName || 'Unknown',
          createdAt: new Date(row.created_at).getTime()
        };
      })
      .filter((r) => r.playerCount < MAX_PLAYERS)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async peekRoom(code: string): Promise<{ code: string; phase: Room['phase']; playerCount: number }> {
    const rows = await sql`select code, phase, players from rooms where code = ${code.toUpperCase()}`;
    if (!rows.length) throw new RoomError('Room not found. Check the code.');
    const row = rows[0];
    const playerCount = Object.keys(asJson<Record<string, Player>>(row.players)).length;
    if (row.phase !== 'lobby') throw new RoomError('That game already started.');
    if (playerCount >= MAX_PLAYERS) throw new RoomError('Room is full (5 players).');
    return { code: row.code, phase: row.phase, playerCount };
  }

  async joinRoom(code: string, input: NewPlayerInput): Promise<{ room: Room; playerId: string; token: string }> {
    const player = makePlayer(input);
    const room = await withRoomLock(code, (room) => {
      if (room.phase !== 'lobby') throw new RoomError('That game already started.');
      if (Object.keys(room.players).length >= MAX_PLAYERS) throw new RoomError('Room is full (5 players).');
      room.players[player.id] = player;
      room.updatedAt = Date.now();
    });
    const token = makeToken();
    await sql`insert into player_tokens (player_id, room_code, token) values (${player.id}, ${room.code}, ${token})`;
    return { room, playerId: player.id, token };
  }

  async rejoin(code: string, playerId: string, token: string): Promise<Room> {
    const rows = await sql`select * from rooms where code = ${code.toUpperCase()}`;
    if (!rows.length) throw new RoomError('Room not found.');
    const room = rowToRoom(rows[0]);
    if (!room.players[playerId]) throw new RoomError('Room not found.');
    const tokenRows = await sql`select token from player_tokens where player_id = ${playerId}`;
    if (!tokenRows.length || tokenRows[0].token !== token) throw new RoomError('Invalid session.');
    return room;
  }

  // Leaving is only allowed from the lobby: once a campaign is underway a
  // player's id is woven through every seat's progress and the Vote Bank
  // influence tables, so pulling them out would corrupt the game state. The
  // last player out takes the room with them, and a departing host hands the
  // role to whoever joined next.
  async leaveRoom(code: string, playerId: string, token: string): Promise<{ roomClosed: boolean }> {
    const tokenRows = await sql`select token from player_tokens where player_id = ${playerId}`;
    if (!tokenRows.length || tokenRows[0].token !== token) throw new RoomError('Invalid session.');

    let roomClosed = false;
    await sql.begin(async (tx) => {
      const rows = await tx`select * from rooms where code = ${code.toUpperCase()} for update`;
      if (!rows.length) throw new RoomError('Room not found.');
      const room = rowToRoom(rows[0]);
      if (!room.players[playerId]) throw new RoomError('You are not in this room.');
      if (room.phase !== 'lobby') throw new RoomError('The campaign has already started.');

      delete room.players[playerId];
      const remaining = Object.keys(room.players);
      if (!remaining.length) {
        await tx`delete from rooms where code = ${room.code}`;
        roomClosed = true;
        return;
      }
      if (room.hostId === playerId) room.hostId = remaining[0];
      room.updatedAt = Date.now();
      await persistRoom(tx as unknown as typeof sql, room);
    });

    await sql`delete from player_tokens where player_id = ${playerId}`;
    return { roomClosed };
  }

  async startGame(code: string, playerId: string): Promise<Room> {
    return withRoomLock(code, (room) => {
      if (room.hostId !== playerId) throw new RoomError('Only the host can start the campaign.');
      if (room.phase !== 'lobby') throw new RoomError('Game already started.');
      if (Object.keys(room.players).length < 2) throw new RoomError('Need at least 2 players to start.');
      room.phase = 'playing';
      startTurnTimer(room); // arms the first turn's countdown (no-op if untimed)
      room.updatedAt = Date.now();
    });
  }

  async submitTurn(
    code: string,
    playerId: string,
    seatSpends: Record<string, number>
  ): Promise<{ room: Room; resolved: TurnLogEntry | null }> {
    let resolved: TurnLogEntry | null = null;
    const room = await withRoomLock(code, (room) => {
      const player = room.players[playerId];
      if (!player) throw new RoomError('Player not found in this room.');
      if (room.phase !== 'playing') throw new RoomError('Game is not in progress.');
      if (player.ready) return false; // already submitted this turn, no-op

      // Spending is by whole Campaign Rungs: a submitted amount is snapped down to
      // a whole number of rungs at the seat's fixed per-rung cost, capped so a
      // player can never pass the final rung, and — on their first turn spending
      // in a seat — capped at FIRST_ENTRY_MAX_RUNGS rungs.
      const cleanSeatSpends: Record<string, number> = {};
      let total = 0;
      Object.entries(seatSpends || {}).forEach(([acNo, amt]) => {
        const seat = room.seats[acNo];
        if (!seat || seat.locked) return;
        const perRung = maxPerRungFor(acNo);
        const committed = seat.progress[playerId] || 0;
        const currentRungs = Math.floor(committed / perRung);
        const firstEntry = committed <= 0;
        const roomToTop = TOTAL_RUNGS - currentRungs;
        const maxAddRungs = firstEntry ? Math.min(FIRST_ENTRY_MAX_RUNGS, roomToTop) : roomToTop;
        const requestedRungs = Math.max(0, Math.floor((Number(amt) || 0) / perRung));
        const rungs = Math.min(requestedRungs, Math.max(0, maxAddRungs));
        const spend = rungs * perRung;
        if (spend <= 0) return;
        cleanSeatSpends[acNo] = spend;
        total += spend;
      });

      if (total > player.budgetThisTurn) {
        throw new RoomError('Spend exceeds your remaining budget this turn.');
      }

      room.pendingTurn.submissions[playerId] = { seatSpends: cleanSeatSpends };
      player.ready = true;
      room.updatedAt = Date.now();

      const allReady = Object.values(room.players).every((p) => p.ready);
      if (allReady) resolved = settleTurn(room);
    });
    return { room, resolved };
  }

  async endMatch(code: string, playerId: string): Promise<Room> {
    return withRoomLock(code, (room) => {
      if (room.hostId !== playerId) throw new RoomError('Only the host can end the match.');
      if (room.phase !== 'playing') throw new RoomError('Match is not in progress.');
      forceLockRemainingSeats(room);
      room.phase = 'gameover';
      room.turnDeadline = null;
      room.updatedAt = Date.now();
    });
  }

  // Pinged periodically by any client with an active turnDeadline (see the
  // client's GameProvider) in place of the Node version's setTimeout — force-
  // resolves the turn if the deadline has passed, otherwise a harmless no-op.
  // Idempotent: once resolved the phase/turn guard means a second ping (from
  // another client, or a retry) does nothing.
  async checkExpiry(code: string): Promise<Room> {
    return withRoomLock(code, (room) => {
      if (room.phase !== 'playing' || !room.turnDeadline || Date.now() < room.turnDeadline) return false;
      settleTurn(room);
      room.updatedAt = Date.now();
    });
  }
}

export const roomStore = new RoomStore();
