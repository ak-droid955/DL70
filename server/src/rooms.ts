import { randomBytes } from 'node:crypto';
import {
  BUDGET_PER_TURN_DEFAULT,
  GROUPS,
  MAX_TURNS_DEFAULT,
  PARTY_COLOR_SWATCHES,
  forceLockRemainingSeats,
  loadStaticSeats,
  resolveTurn
} from './gameData.js';
import type { Player, Room, TurnLogEntry } from './types.js';

const MAX_PLAYERS = 5;
const MAX_SYMBOL_BYTES = 250_000; // ~250KB data URL ceiling, guards against abuse

export interface NewPlayerInput {
  name: string;
  partyName: string;
  colorIndex: number;
  symbol: string | null;
}

export class RoomError extends Error {}

class RoomStore {
  private rooms = new Map<string, Room>();
  // playerId -> secret token, used to authorize rejoin. Never broadcast.
  private tokens = new Map<string, string>();

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
    let symbol = input.symbol || null;
    if (symbol) {
      if (typeof symbol !== 'string' || !symbol.startsWith('data:image/') || symbol.length > MAX_SYMBOL_BYTES) {
        symbol = null;
      }
    }
    const colorIndex = Number.isInteger(input.colorIndex) ? input.colorIndex : 0;
    const color = PARTY_COLOR_SWATCHES[((colorIndex % PARTY_COLOR_SWATCHES.length) + PARTY_COLOR_SWATCHES.length) % PARTY_COLOR_SWATCHES.length];
    return { name, partyName, color, symbol };
  }

  private makePlayer(input: NewPlayerInput): Player {
    const { name, partyName, color, symbol } = this.validatePlayerInput(input);
    return {
      id: 'p_' + randomBytes(6).toString('hex'),
      name,
      partyName,
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
    const room: Room = {
      code,
      phase: 'lobby',
      turn: 1,
      maxTurns: MAX_TURNS_DEFAULT,
      budgetPerTurn: BUDGET_PER_TURN_DEFAULT,
      hostId: player.id,
      players: { [player.id]: player },
      seats,
      groups: GROUPS.map((g) => ({ ...g, claimedBy: null, progress: {} })),
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
    room.updatedAt = Date.now();
    return room;
  }

  submitTurn(
    code: string,
    playerId: string,
    seatSpends: Record<string, number>,
    groupSpends: Record<string, number>
  ): { room: Room; resolved: TurnLogEntry | null } {
    const room = this.requireRoom(code);
    const player = room.players[playerId];
    if (!player) throw new RoomError('Player not found in this room.');
    if (room.phase !== 'playing') throw new RoomError('Game is not in progress.');
    if (player.ready) return { room, resolved: null }; // already submitted this turn, no-op

    const cleanSeatSpends: Record<string, number> = {};
    let total = 0;
    Object.entries(seatSpends || {}).forEach(([acNo, amt]) => {
      const seat = room.seats[acNo];
      const n = Math.max(0, Math.floor(Number(amt) || 0));
      if (!seat || seat.locked || n <= 0) return;
      cleanSeatSpends[acNo] = n;
      total += n;
    });
    const cleanGroupSpends: Record<string, number> = {};
    Object.entries(groupSpends || {}).forEach(([gid, amt]) => {
      const group = room.groups.find((g) => g.id === gid);
      const n = Math.max(0, Math.floor(Number(amt) || 0));
      if (!group || group.claimedBy || n <= 0) return;
      cleanGroupSpends[gid] = n;
      total += n;
    });

    if (total > player.budgetThisTurn) {
      throw new RoomError('Spend exceeds your remaining budget this turn.');
    }

    room.pendingTurn.submissions[playerId] = { seatSpends: cleanSeatSpends, groupSpends: cleanGroupSpends };
    player.ready = true;
    room.updatedAt = Date.now();

    const allReady = Object.values(room.players).every((p) => p.ready);
    let resolved: TurnLogEntry | null = null;
    if (allReady) {
      const resolvedTurnNumber = room.turn;
      const { events, perPlayerSpend } = resolveTurn(room);
      const entry: TurnLogEntry = { turn: resolvedTurnNumber, events, perPlayerSpend };
      room.turnLog.push(entry);
      resolved = entry;
      if (resolvedTurnNumber >= room.maxTurns) {
        room.phase = 'gameover';
      } else {
        room.turn = resolvedTurnNumber + 1;
        room.pendingTurn = { turnNumber: room.turn, submissions: {} };
      }
    }
    return { room, resolved };
  }

  endMatch(code: string, playerId: string): Room {
    const room = this.requireRoom(code);
    if (room.hostId !== playerId) throw new RoomError('Only the host can end the match.');
    if (room.phase !== 'playing') throw new RoomError('Match is not in progress.');
    forceLockRemainingSeats(room);
    room.phase = 'gameover';
    room.updatedAt = Date.now();
    return room;
  }

  private requireRoom(code: string): Room {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) throw new RoomError('Room not found.');
    return room;
  }
}

export const roomStore = new RoomStore();
