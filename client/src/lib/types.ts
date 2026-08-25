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
  progress: Record<string, number>;
}

export interface Group {
  id: string;
  name: string;
  short: string;
  ask: number;
  claimedBy: string | null;
  progress: Record<string, number>;
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
  pendingTurn: { turnNumber: number; submissions: Record<string, unknown> };
  turnLog: TurnLogEntry[];
}

// Static per-seat geo/reference data served once from GET /api/seats — doesn't
// change during a game, kept separate from the live Room so it's fetched once.
export interface StaticSeat {
  acNo: string;
  name: string;
  pcName: string;
  electors: number;
  threshold: number;
  centroid: [number, number] | null;
  geometry: GeoJSON.Geometry;
}

export interface OpenRoomSummary {
  code: string;
  playerCount: number;
  hostPartyName: string;
  createdAt: number;
}

export const PARTY_COLOR_SWATCHES = [
  'oklch(62% 0.19 25)',
  'oklch(66% 0.17 55)',
  'oklch(72% 0.15 95)',
  'oklch(64% 0.15 140)',
  'oklch(60% 0.13 195)',
  'oklch(58% 0.16 250)',
  'oklch(60% 0.18 300)',
  'oklch(62% 0.19 340)'
];
