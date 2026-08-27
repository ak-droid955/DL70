import { randomBytes } from 'node:crypto';
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
} from './gameData.js';
import type { Player, Room, TurnLogEntry } from './types.js';

const MAX_PLAYERS = 5;
const MAX_SYMBOL_BYTES = 250_000; // ~250KB data URL ceiling, guards against abuse
// Allowed per-turn time limits (seconds). Every room is timed; an invalid or
// absent choice falls back to DEFAULT_TURN_TIMER. Keep in sync with
// TURN_TIMER_OPTIONS on the client.
const TURN_TIMER_OPTIONS = [10, 30, 60, 120, 180, 300];
const DEFAULT_TURN_TIMER = 60;
// Rooms live only in memory, so an abandoned room (players closed the tab
// mid-game, or never started) would otherwise sit there forever, growing
// process memory without bound for as long as the server stays up. Anything
// untouched this long is swept — see sweepStaleRooms(), called periodically
// from index.ts.
const ROOM_MAX_IDLE_MS = 6 * 60 * 60 * 1000; // 6 hours

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

class RoomStore {
  private rooms = new Map<string, Room>();
  // playerId -> secret token, used to authorize rejoin. Never broadcast.
  private tokens = new Map<string, string>();
  // roomCode -> pending auto-resolve timeout for the current timed turn.
  private turnTimers = new Map<string, ReturnType<typeof setTimeout>>();
  // Injected from index.ts so a timer firing off-socket can still push the
  // updated room to everyone in the channel.
  private broadcast: (room: Room) => void = () => {};

  setBroadcaster(fn: (room: Room) => void): void {
    this.broadcast = fn;
  }

  private normalizeTurnTimer(seconds: number | null | undefined): number {
    return typeof seconds === 'number' && TURN_TIMER_OPTIONS.includes(seconds) ? seconds : DEFAULT_TURN_TIMER;
  }

  private clearTurnTimer(code: string): void {
    const t = this.turnTimers.get(code);
    if (t) {
      clearTimeout(t);
      this.turnTimers.delete(code);
    }
  }

  // (Re)starts the countdown for the room's current turn. No-op (and clears any
  // running timer) when the room is untimed or not in play. Sets turnDeadline so
  // clients can render the countdown; on expiry the turn is force-resolved with
  // whatever has been submitted so far.
  private startTurnTimer(room: Room): void {
    this.clearTurnTimer(room.code);
    if (room.phase !== 'playing' || !room.turnTimerSeconds) {
      room.turnDeadline = null;
      return;
    }
    room.turnDeadline = Date.now() + room.turnTimerSeconds * 1000;
    const timer = setTimeout(() => this.forceResolveTurn(room.code), room.turnTimerSeconds * 1000);
    this.turnTimers.set(room.code, timer);
  }

  // Fired when a timed turn's clock runs out: resolve the turn with the
  // submissions on hand (players who didn't submit simply spend nothing this
  // turn), then broadcast the new room state.
  private forceResolveTurn(code: string): void {
    const room = this.rooms.get(code);
    if (!room || room.phase !== 'playing') {
      this.clearTurnTimer(code);
      return;
    }
    this.settleTurn(room);
    room.updatedAt = Date.now();
    this.broadcast(room);
  }

  private roomCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let tries = 0; tries < 8; tries++) {
      let code = '';
      for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
      if (!this.rooms.has(code)) return code;
    }
    return 'R' + Math.floor(Math.random() * 900 + 100);
  }

  private makeToken(): string {
    return randomBytes(18).toString('base64url');
  }

  private validatePlayerInput(input: NewPlayerInput) {
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

  private makePlayer(input: NewPlayerInput): Player {
    const { name, partyName, partyCode, color, symbol } = this.validatePlayerInput(input);
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

  createRoom(input: NewPlayerInput): { room: Room; playerId: string; token: string } {
    const player = this.makePlayer(input);
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
    const code = this.roomCode();
    const now = Date.now();
    const voteBankInfluence: Room['voteBankInfluence'] = {} as Room['voteBankInfluence'];
    const voteBankLeaders: Room['voteBankLeaders'] = {} as Room['voteBankLeaders'];
    VOTE_BANK_IDS.forEach((id) => {
      voteBankInfluence[id] = {};
      voteBankLeaders[id] = null;
    });
    const room: Room = {
      code,
      phase: 'lobby',
      turn: 1,
      maxTurns: MAX_TURNS_DEFAULT,
      budgetPerTurn: BUDGET_PER_TURN_DEFAULT,
      turnTimerSeconds: this.normalizeTurnTimer(input.turnTimerSeconds),
      turnDeadline: null,
      hostId: player.id,
      players: { [player.id]: player },
      seats,
      voteBankInfluence,
      voteBankLeaders,
      pendingTurn: { turnNumber: 1, submissions: {} },
      turnLog: [],
      createdAt: now,
      updatedAt: now
    };
    this.rooms.set(code, room);
    const token = this.makeToken();
    this.tokens.set(player.id, token);
    return { room, playerId: player.id, token };
  }

  listOpenRooms(): OpenRoomSummary[] {
    return Array.from(this.rooms.values())
      .filter((room) => room.phase === 'lobby' && Object.keys(room.players).length < MAX_PLAYERS)
      .map((room) => ({
        code: room.code,
        playerCount: Object.keys(room.players).length,
        hostPartyName: room.players[room.hostId]?.partyName || 'Unknown',
        createdAt: room.createdAt
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  peekRoom(code: string): { code: string; phase: Room['phase']; playerCount: number } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) throw new RoomError('Room not found. Check the code.');
    if (room.phase !== 'lobby') throw new RoomError('That game already started.');
    if (Object.keys(room.players).length >= MAX_PLAYERS) throw new RoomError('Room is full (5 players).');
    return { code: room.code, phase: room.phase, playerCount: Object.keys(room.players).length };
  }

  joinRoom(code: string, input: NewPlayerInput): { room: Room; playerId: string; token: string } {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) throw new RoomError('Room not found. Check the code.');
    if (room.phase !== 'lobby') throw new RoomError('That game already started.');
    if (Object.keys(room.players).length >= MAX_PLAYERS) throw new RoomError('Room is full (5 players).');
    const player = this.makePlayer(input);
    room.players[player.id] = player;
    room.updatedAt = Date.now();
    const token = this.makeToken();
    this.tokens.set(player.id, token);
    return { room, playerId: player.id, token };
  }

  rejoin(code: string, playerId: string, token: string): Room {
    const room = this.rooms.get(code.toUpperCase());
    if (!room || !room.players[playerId]) throw new RoomError('Room not found.');
    if (this.tokens.get(playerId) !== token) throw new RoomError('Invalid session.');
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  startGame(code: string, playerId: string): Room {
    const room = this.requireRoom(code);
    if (room.hostId !== playerId) throw new RoomError('Only the host can start the campaign.');
    if (room.phase !== 'lobby') throw new RoomError('Game already started.');
    if (Object.keys(room.players).length < 2) throw new RoomError('Need at least 2 players to start.');
    room.phase = 'playing';
    this.startTurnTimer(room); // arms the first turn's countdown (no-op if untimed)
    room.updatedAt = Date.now();
    return room;
  }

  submitTurn(code: string, playerId: string, seatSpends: Record<string, number>): { room: Room; resolved: TurnLogEntry | null } {
    const room = this.requireRoom(code);
    const player = room.players[playerId];
    if (!player) throw new RoomError('Player not found in this room.');
    if (room.phase !== 'playing') throw new RoomError('Game is not in progress.');
    if (player.ready) return { room, resolved: null }; // already submitted this turn, no-op

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
    const resolved = allReady ? this.settleTurn(room) : null;
    return { room, resolved };
  }

  // Resolves the current turn and advances the room: either ends the game on
  // the final turn or opens the next turn and (re)arms its countdown. Shared by
  // the all-players-submitted path and the timer-expiry path.
  private settleTurn(room: Room): TurnLogEntry {
    const resolvedTurnNumber = room.turn;
    const { events, perPlayerSpend } = resolveTurn(room);
    const entry: TurnLogEntry = { turn: resolvedTurnNumber, events, perPlayerSpend };
    room.turnLog.push(entry);
    if (resolvedTurnNumber >= room.maxTurns) {
      room.phase = 'gameover';
      this.clearTurnTimer(room.code);
      room.turnDeadline = null;
    } else {
      room.turn = resolvedTurnNumber + 1;
      room.pendingTurn = { turnNumber: room.turn, submissions: {} };
      this.startTurnTimer(room);
    }
    return entry;
  }

  endMatch(code: string, playerId: string): Room {
    const room = this.requireRoom(code);
    if (room.hostId !== playerId) throw new RoomError('Only the host can end the match.');
    if (room.phase !== 'playing') throw new RoomError('Match is not in progress.');
    forceLockRemainingSeats(room);
    room.phase = 'gameover';
    this.clearTurnTimer(room.code);
    room.turnDeadline = null;
    room.updatedAt = Date.now();
    return room;
  }

  private requireRoom(code: string): Room {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) throw new RoomError('Room not found.');
    return room;
  }

  // Deletes any room untouched for longer than ROOM_MAX_IDLE_MS, and the
  // rejoin tokens for the players in it. Returns how many were removed, for
  // logging.
  sweepStaleRooms(): number {
    const cutoff = Date.now() - ROOM_MAX_IDLE_MS;
    let removed = 0;
    this.rooms.forEach((room, code) => {
      if (room.updatedAt < cutoff) {
        Object.keys(room.players).forEach((playerId) => this.tokens.delete(playerId));
        this.clearTurnTimer(code);
        this.rooms.delete(code);
        removed++;
      }
    });
    return removed;
  }
}

export const roomStore = new RoomStore();
