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
  { id: 'unauthorised_colonies', name: 'JJ Colony Clusters', short: 'JJ' },
  { id: 'govt_staff', name: 'Govt / DTC / DJB Staff', short: 'GS' },
  { id: 'women_shg', name: 'Women & SHG Groups', short: 'WS' },
  { id: 'farmers', name: 'Delhi Dehat', short: 'FM' },
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
  turnTimerSeconds: number | null; // per-turn limit; null = No Limit
  turnDeadline: number | null; // epoch ms the current turn auto-resolves; null when untimed
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

// NOTE: order and length must stay identical to PARTY_COLOR_SWATCHES in
// server/src/gameData.ts — the server stores a colour by its index here.
export const PARTY_COLOR_SWATCHES = [
  'oklch(62% 0.19 25)', // red
  'oklch(64% 0.2 15)', // crimson
  'oklch(66% 0.17 55)', // orange
  'oklch(68% 0.16 40)', // burnt orange
  'oklch(72% 0.15 95)', // gold
  'oklch(74% 0.14 75)', // amber
  'oklch(64% 0.15 140)', // green
  'oklch(66% 0.16 120)', // lime
  'oklch(60% 0.13 195)', // teal
  'oklch(62% 0.13 165)', // emerald
  'oklch(58% 0.16 250)', // blue
  'oklch(62% 0.14 220)', // sky
  'oklch(60% 0.18 300)', // purple
  'oklch(58% 0.17 275)', // indigo
  'oklch(62% 0.19 340)', // magenta
  'oklch(64% 0.18 320)' // pink
];

// Per-turn time-limit options for the room timer, shown as a slider on the
// setup screen. `seconds: null` is the "No Limit" position (timing off — turns
// resolve only when every player submits). The timed scale starts at 10s and is
// capped at 5m. Keep the numeric values in sync with TURN_TIMER_OPTIONS on the
// server (rooms.ts).
export const TURN_TIMER_OPTIONS: { label: string; seconds: number | null }[] = [
  { label: 'No Limit', seconds: null },
  { label: '10s', seconds: 10 },
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 }
];

// Preset election symbols offered on the setup screen. The chosen emoji is
// rendered to a PNG data URL (see GameProvider.pickSymbol) so it travels
// through the same `symbol` field as an uploaded image.
export const PARTY_SYMBOLS: { label: string; emoji: string }[] = [
  { label: 'Broom', emoji: '🧹' },
  { label: 'Lotus', emoji: '🪷' },
  { label: 'Hand', emoji: '✋' },
  { label: 'Bicycle', emoji: '🚲' },
  { label: 'Elephant', emoji: '🐘' },
  { label: 'Bow & Arrow', emoji: '🏹' },
  { label: 'Lantern', emoji: '🏮' },
  { label: 'Umbrella', emoji: '☂️' },
  { label: 'Star', emoji: '⭐' },
  { label: 'Coconut', emoji: '🥥' }
];
