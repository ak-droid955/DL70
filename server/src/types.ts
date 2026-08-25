export interface Player {
  id: string;
  name: string;
  partyName: string;
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

export interface Group {
  id: string;
  name: string;
  short: string;
  ask: number;
  claimedBy: string | null;
  progress: Record<string, number>;
}

export interface TurnSubmission {
  seatSpends: Record<string, number>;
  groupSpends: Record<string, number>;
}

export interface PendingTurn {
  turnNumber: number;
  submissions: Record<string, TurnSubmission>;
}

export type TurnEvent =
  | { type: 'conflict'; acNo: string; playerId: string; fee: number; seatName: string }
  | { type: 'group_claim'; groupId: string; groupName: string; playerId: string }
  | { type: 'lock'; acNo: string; seatName: string; playerId: string }
  | { type: 'forced_lock'; acNo: string; seatName: string; playerId: string };

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
  groups: Group[];
  pendingTurn: PendingTurn;
  turnLog: TurnLogEntry[];
  createdAt: number;
  updatedAt: number;
}
