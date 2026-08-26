import type { VoteBankId } from './voteBanks.js';

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
  | { type: 'vote_bank_leader_change'; voteBankId: VoteBankId; voteBankName: string; playerId: string; previousLeaderId: string | null }
  | { type: 'vote_bank_bonus'; voteBankId: VoteBankId; voteBankName: string; playerId: string; amount: number };

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
  hostId: string;
  players: Record<string, Player>;
  seats: Record<string, Seat>;
  // Cumulative campaign influence per Vote Bank per player, built up across
  // turns from spend in constituencies where that Vote Bank is strong (see
  // resolveTurn in gameData.ts). Not something players spend on directly.
  voteBankInfluence: Record<VoteBankId, Record<string, number>>;
  // Current leader (highest cumulative influence) per Vote Bank, recomputed
  // every resolved turn. null until at least one player has any influence.
  voteBankLeaders: Record<VoteBankId, string | null>;
  pendingTurn: PendingTurn;
  turnLog: TurnLogEntry[];
  createdAt: number;
  updatedAt: number;
}
