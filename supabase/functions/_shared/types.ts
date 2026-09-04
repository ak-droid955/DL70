// Mirrors server/src/types.ts (Node/Socket.IO version) exactly — this is a
// transport/persistence migration, not a rules change. Keep both in sync if
// the game's data shape ever changes on either side.
import type { VoteBankId } from './voteBanks.ts';

export interface Player {
  id: string;
  name: string;
  partyName: string;
  partyCode: string;
  color: string;
  symbol: string | null;
  seatsWon: number;
  totalSpent: number;
  ready: boolean;
  budgetThisTurn: number;
  pendingBonus: number;
}

export interface Seat {
  acNo: string;
  name: string;
  pcName: string;
  electors: number;
  threshold: number;
  locked: string | null; // playerId | 'INDEPENDENT' | null
  progress: Record<string, number>; // playerId -> amount
}

export interface TurnSubmission {
  seatSpends: Record<string, number>;
}

export interface PendingTurn {
  turnNumber: number;
  submissions: Record<string, TurnSubmission>;
}

export type TurnEvent =
  | { type: 'conflict'; acNo: string; playerId: string; fee: number; seatName: string }
  | { type: 'lock'; acNo: string; seatName: string; playerId: string }
  | { type: 'forced_lock'; acNo: string; seatName: string; playerId: string }
  | {
      type: 'vote_bank_conquered';
      voteBankId: VoteBankId;
      voteBankName: string;
      playerId: string;
      amount: number;
      seatsHeld: number;
      seatsTotal: number;
    };

export interface TurnLogEntry {
  turn: number;
  events: TurnEvent[];
  perPlayerSpend: Record<string, number>;
}

export interface Room {
  code: string;
  phase: 'lobby' | 'playing' | 'gameover';
  turn: number;
  maxTurns: number;
  budgetPerTurn: number;
  // Per-turn time limit in seconds, chosen by the host at room creation.
  // null means "No Limit" — turns only resolve once every player submits.
  turnTimerSeconds: number | null;
  // Epoch ms at which the current turn auto-resolves. null when untimed, in
  // the lobby, or after the game is over. Lets clients render a live countdown.
  turnDeadline: number | null;
  hostId: string;
  players: Record<string, Player>;
  seats: Record<string, Seat>;
  // Cumulative campaign influence per Vote Bank per player, built up across
  // turns from spend in constituencies where that Vote Bank is strong (see
  // resolveTurn in gameData.ts). Not something players spend on directly.
  voteBankInfluence: Record<VoteBankId, Record<string, number>>;
  // Who has conquered each Vote Bank — the player holding more than
  // VOTE_BANK_CONQUEST_THRESHOLD of its constituencies — or null while it is
  // still contested. Set once and never cleared: seat locks are permanent, so
  // a conquest can't be undone, and the bonus pays on the turn it is set.
  // NOTE: persisted in the `vote_bank_leaders` jsonb column, which predates
  // conquest (it used to hold each bank's influence leader). The column keeps
  // its old name so live rooms and older clients keep reading the same field.
  voteBankConquerors: Record<VoteBankId, string | null>;
  pendingTurn: PendingTurn;
  turnLog: TurnLogEntry[];
  createdAt: number;
  updatedAt: number;
}
