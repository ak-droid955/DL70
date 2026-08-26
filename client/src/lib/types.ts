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

export type VoteBankId =
  | 'traders'
  | 'transport_unions'
  | 'rwa'
  | 'unauthorised_colonies'
  | 'govt_staff'
  | 'women_shg'
  | 'farmers'
  | 'students_youth'
  | 'purvanchali_migrant'
  | 'community_religious';

export interface VoteBankDef {
  id: VoteBankId;
  name: string;
  short: string;
}

export const VOTE_BANKS: VoteBankDef[] = [
  { id: 'traders', name: 'Traders & Shopkeepers', short: 'TR' },
  { id: 'transport_unions', name: 'Auto & Transport Unions', short: 'AU' },
  { id: 'rwa', name: 'Resident Welfare Associations', short: 'RW' },
  { id: 'unauthorised_colonies', name: 'Unauthorised Colony Residents', short: 'JJ' },
  { id: 'govt_staff', name: 'Govt / DTC / DJB Staff', short: 'GS' },
  { id: 'women_shg', name: 'Women & SHG Groups', short: 'WS' },
  { id: 'farmers', name: 'Border Village Farmers', short: 'FM' },
  { id: 'students_youth', name: 'Students & Youth', short: 'SY' },
  { id: 'purvanchali_migrant', name: 'Purvanchali / Migrant Groups', short: 'PM' },
  { id: 'community_religious', name: 'Community & Religious Groups', short: 'CR' }
];

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
  voteBankInfluence: Record<VoteBankId, Record<string, number>>;
  voteBankLeaders: Record<VoteBankId, string | null>;
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
  primaryVoteBank: VoteBankId;
  secondaryVoteBanks: VoteBankId[];
  voteBankStrength: Record<VoteBankId, number>;
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
