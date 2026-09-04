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

// Tiers of the server's per-seat Vote Bank strength values (see
// supabase/functions/_shared/voteBanks.ts): a bank is a seat's PRIMARY at 85,
// a listed secondary from 36 up, and carries only a baseline below that. The
// map and the Vote Bank panel read strength through these.
export const VOTE_BANK_PRIMARY_MIN = 85;
export const VOTE_BANK_STRONG_MIN = 36;

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
  maxPerRung: number; // fixed ₹K cost to climb one Campaign Rung in this seat
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
  // Party colours already claimed in that room — no two players in one room
  // may share a colour, so the setup screen greys these out.
  takenColors: string[];
  createdAt: number;
}

// NOTE: order and length must stay identical to PARTY_COLOR_SWATCHES in
// server/src/gameData.ts — the server stores a colour by its index here.
// Campaign Rungs: every seat has TOTAL_RUNGS rungs, each costing the seat's
// fixed maxPerRung. First to the final rung wins; a player's first turn in a
// seat may climb at most FIRST_ENTRY_MAX_RUNGS rungs. Keep in sync with the
// server (gameData.ts).
export const TOTAL_RUNGS = 10;
export const FIRST_ENTRY_MAX_RUNGS = 3;

export const PARTY_COLOR_SWATCHES = [
  'oklch(58% 0.19 25)', // red
  'oklch(62% 0.22 355)', // crimson
  'oklch(65% 0.18 45)', // orange
  'oklch(68% 0.15 35)', // burnt orange
  'oklch(72% 0.15 95)', // gold
  'oklch(70% 0.14 65)', // amber
  'oklch(55% 0.15 145)', // green
  'oklch(60% 0.14 120)', // lime
  'oklch(55% 0.09 190)', // teal
  'oklch(55% 0.13 165)', // emerald
  'oklch(55% 0.16 260)', // blue
  'oklch(60% 0.12 220)', // sky
  'oklch(55% 0.20 295)', // purple
  'oklch(55% 0.18 275)', // indigo
  'oklch(55% 0.20 340)', // magenta
  'oklch(55% 0.20 310)', // pink
  'oklch(45% 0.16 25)', // maroon
  'oklch(78% 0.16 55)', // marigold
  'oklch(50% 0.13 145)', // forest
  'oklch(40% 0.10 220)', // navy
  'oklch(85% 0.10 95)', // cream
  'oklch(35% 0.05 40)', // ink brown
  'oklch(80% 0.03 75)', // stone
  'oklch(70% 0.20 15)' // rose
];

// Per-turn time-limit options for the room timer, shown as a slider on the
// setup screen. Every room is timed: the scale starts at 10s and is capped at
// 5m. Keep the numeric values in sync with TURN_TIMER_OPTIONS on the server
// (rooms.ts).
export const TURN_TIMER_OPTIONS: { label: string; seconds: number }[] = [
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
  { label: 'Cash', emoji: '💵' },
  { label: 'Bow & Arrow', emoji: '🏹' },
  { label: 'Lantern', emoji: '🏮' },
  { label: 'Umbrella', emoji: '☂️' },
  { label: 'Star', emoji: '⭐' },
  { label: 'Coconut', emoji: '🥥' },
  { label: 'Flag', emoji: '🚩' },
  { label: 'Rocket', emoji: '🚀' },
  { label: 'Wheat', emoji: '🌾' },
  { label: 'Lightning', emoji: '⚡' },
  { label: 'Bell', emoji: '🔔' },
  { label: 'Tractor', emoji: '🚜' },
  { label: 'Book', emoji: '📖' },
  { label: 'Kite', emoji: '🪁' },
  { label: 'School Bag', emoji: '🎒' },
  { label: 'Jar', emoji: '🏺' }
];
