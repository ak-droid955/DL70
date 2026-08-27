// Ported from server/src/gameData.ts (the Node/Socket.IO version), which was
// itself ported 1:1 from the design handoff's delhi-game-data.js. This copy
// changes only the seat-loading I/O — every constant and the resolveTurn()
// algorithm are byte-for-byte the same. Keep both copies in sync if the rules
// ever change.
//
// The raw constituency GeoJSON (delhi_AC.json, ~75KB of polygon coordinates)
// is fetched over HTTP from this same repo rather than bundled as a local
// import: Edge Functions here are deployed by pasting file contents through
// an MCP tool call, and that's not a safe way to move ~2000 floating-point
// coordinate pairs verbatim — a single transcribed digit would silently
// corrupt a seat's shape without erroring. Fetching the file this repo
// already carries at a known path sidesteps that entirely. It's fetched once
// per warm instance and cached, same lifetime as the old singleton below.
import type { Player, Room, Seat, TurnEvent } from './types.ts';
import {
  VOTE_BANKS,
  VOTE_BANK_IDS,
  loadConstituencyVoteBanks,
  validateConstituencyVoteBanks,
  type ConstituencyVoteBanks,
  type VoteBankId
} from './voteBanks.ts';

const DELHI_AC_GEOJSON_URL =
  'https://raw.githubusercontent.com/ak-droid955/DL70/claude/delhi-election-game-multiplayer-9wddq3/supabase/functions/_shared/data/delhi_AC.json';

export const MAX_TURNS_DEFAULT = 10;
export const BUDGET_PER_TURN_DEFAULT = 300; // in ₹ thousands

// Campaign Rungs: every constituency has TOTAL_RUNGS rungs. A rung costs a
// fixed amount (MAX_PER_RUNG, per constituency, in ₹K); spending that amount
// climbs one rung. The first player to reach the final rung permanently wins
// (locks) the seat. On a player's FIRST turn spending in a seat they may climb
// at most FIRST_ENTRY_MAX_RUNGS rungs.
export const TOTAL_RUNGS = 10;
export const FIRST_ENTRY_MAX_RUNGS = 3;

// Fixed ₹K cost to climb one rung, per constituency (AC_NO -> ₹K). Sourced from
// the game's per-constituency spending table.
const MAX_PER_RUNG: Record<string, number> = {
  '1': 65, '2': 75, '3': 65, '4': 65, '5': 75, '6': 80, '7': 65, '8': 65, '9': 75, '10': 60,
  '11': 80, '12': 60, '13': 75, '14': 70, '15': 75, '16': 70, '17': 75, '18': 75, '19': 80, '20': 80,
  '21': 80, '22': 80, '23': 65, '24': 65, '25': 70, '26': 60, '27': 85, '28': 75, '29': 70, '30': 80,
  '31': 90, '32': 85, '33': 90, '34': 85, '35': 70, '36': 75, '37': 70, '38': 60, '39': 90, '40': 110,
  '41': 85, '42': 75, '43': 80, '44': 75, '45': 80, '46': 85, '47': 60, '48': 60, '49': 80, '50': 100,
  '51': 105, '52': 75, '53': 80, '54': 105, '55': 60, '56': 60, '57': 90, '58': 85, '59': 80, '60': 75,
  '61': 80, '62': 70, '63': 60, '64': 70, '65': 85, '66': 80, '67': 80, '68': 65, '69': 100, '70': 90
};
const MAX_PER_RUNG_FALLBACK = 75; // used only if an acNo is somehow missing from the table above

export function maxPerRungFor(acNo: string): number {
  return MAX_PER_RUNG[acNo] ?? MAX_PER_RUNG_FALLBACK;
}

// Vote Bank leadership reward. Unlike the old one-time "claim" bonus this
// replaces, leadership is re-evaluated every turn and the current leader of
// each Vote Bank is paid this bonus again each turn they remain the leader —
// so contesting a rival's Vote Bank lead is a way to cut off their income,
// not just a one-off race. Reuses the same budget-bonus mechanism the game
// already had (added to the leader's next-turn budgetThisTurn) rather than a
// separate currency.
export const VOTE_BANK_LEADER_BONUS_BASE = 60; // ₹K, paid each turn to each Vote Bank's current leader
// Geographic-relevance rule for that bonus: how much of the base bonus a
// leader actually receives this turn depends on how strongly this turn's own
// seat spending concentrated in constituencies where the Vote Bank they lead
// is strong (a spend-weighted average of that Vote Bank's strength across the
// seats they spent in this turn). A leader who spent nothing this turn gets
// the floor multiplier. Both the strength needed for full effect and the
// floor are configurable.
export const VOTE_BANK_BONUS_FULL_EFFECT_STRENGTH = 60; // strength value at/above which the bonus is undiscounted
export const VOTE_BANK_BONUS_MIN_MULTIPLIER = 0.4; // floor multiplier when spend is concentrated elsewhere (or nowhere)

// NOTE: order and length must stay identical to PARTY_COLOR_SWATCHES in
// client/src/lib/types.ts — a colour is stored by its index in this array.
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

export { VOTE_BANKS, VOTE_BANK_IDS };
export type { VoteBankId };

export function cleanName(n: string | undefined | null): string {
  return (n || '').replace(/\s*\(SC\)\s*$/i, '').replace(/\(SC\)/i, '').trim();
}

export function computeThreshold(electors: number): number {
  return Math.min(320, Math.max(40, Math.round(electors / 1000)));
}

// Deterministic elector estimate: real Delhi CEO 2025 totals (electorate ~1.55Cr,
// largest Vikaspuri ~4.62L, smallest Delhi Cantt ~78.9K) distributed across seats
// by relative constituency polygon area (outer/rural seats are larger & more populous).
export function estimateElectors(features: GeoJSON.Feature[]): number[] {
  const REAL_MIN = 78893,
    REAL_MAX = 462184,
    REAL_TOTAL = 15524858;
  const areas = features.map((f) => parseFloat((f.properties as any)?.Shape_Area) || 1);
  const minA = Math.min(...areas),
    maxA = Math.max(...areas);
  const raw = areas.map((a) => REAL_MIN + ((a - minA) / (maxA - minA || 1)) * (REAL_MAX - REAL_MIN));
  const rawTotal = raw.reduce((s, v) => s + v, 0);
  const scale = REAL_TOTAL / rawTotal;
  return raw.map((v) => Math.min(REAL_MAX, Math.max(REAL_MIN, Math.round(v * scale))));
}

type Ring = number[][];

function extractPolys(geom: GeoJSON.Geometry): Ring[] {
  if (geom.type === 'Polygon') return [geom.coordinates[0] as Ring];
  if (geom.type === 'MultiPolygon') return geom.coordinates.map((p) => p[0] as Ring);
  if (geom.type === 'GeometryCollection') return geom.geometries.flatMap(extractPolys);
  return [];
}
function ringArea(ring: Ring): number {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
}
function ringCentroid(ring: Ring): [number, number] {
  let cx = 0,
    cy = 0,
    area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const x0 = ring[i][0],
      y0 = ring[i][1],
      x1 = ring[i + 1][0],
      y1 = ring[i + 1][1];
    const f = x0 * y1 - x1 * y0;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
    area += f;
  }
  area /= 2;
  if (Math.abs(area) < 1e-12) return ring[0] as [number, number];
  return [cx / (6 * area), cy / (6 * area)];
}
export function featureCentroid(geom: GeoJSON.Geometry): [number, number] | null {
  const polys = extractPolys(geom);
  let best: Ring | null = null,
    bestArea = -1;
  polys.forEach((ring) => {
    const a = Math.abs(ringArea(ring));
    if (a > bestArea) {
      bestArea = a;
      best = ring;
    }
  });
  if (!best) return null;
  const c = ringCentroid(best);
  return [c[1], c[0]];
}

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

let cachedStaticSeats: Record<string, StaticSeat> | null = null;
let warmPromise: Promise<void> | null = null;

// Fetches and computes the static seat table, if not already cached. Call
// this once at the top of each Edge Function's request handler, before any
// code path that might take a Postgres row lock — resolveTurn() and the rest
// of the room-mutation logic call the synchronous loadStaticSeats() below,
// which assumes the cache is already warm and throws if it isn't.
export async function warmStaticSeatsCache(): Promise<void> {
  if (cachedStaticSeats) return;
  if (!warmPromise) {
    warmPromise = (async () => {
      const res = await fetch(DELHI_AC_GEOJSON_URL);
      if (!res.ok) throw new Error(`Failed to fetch constituency data: ${res.status}`);
      const data = (await res.json()) as GeoJSON.FeatureCollection;
      computeStaticSeats(data);
    })().catch((err) => {
      warmPromise = null; // allow a retry on the next call after a transient failure
      throw err;
    });
  }
  return warmPromise;
}

function computeStaticSeats(data: GeoJSON.FeatureCollection): void {
  const electors = estimateElectors(data.features);
  const acNos = data.features.map((f) => String((f.properties as any).AC_NO));
  validateConstituencyVoteBanks(acNos);
  const voteBanks = loadConstituencyVoteBanks();
  const seats: Record<string, StaticSeat> = {};
  data.features.forEach((f, i) => {
    const acNo = acNos[i];
    const elec = electors[i];
    const vb = voteBanks.get(acNo) as ConstituencyVoteBanks;
    seats[acNo] = {
      acNo,
      name: cleanName((f.properties as any).AC_NAME),
      pcName: (f.properties as any).PC_NAME,
      electors: elec,
      threshold: computeThreshold(elec),
      maxPerRung: maxPerRungFor(acNo),
      centroid: featureCentroid(f.geometry),
      geometry: f.geometry,
      primaryVoteBank: vb.primaryVoteBank,
      secondaryVoteBanks: vb.secondaryVoteBanks,
      voteBankStrength: vb.voteBankStrength
    };
  });
  cachedStaticSeats = seats;
}

// Synchronous accessor used by resolveTurn() and the room store — assumes
// warmStaticSeatsCache() has already been awaited once at the top of the
// request handler (see index.ts for both Edge Functions).
export function loadStaticSeats(): Record<string, StaticSeat> {
  if (!cachedStaticSeats) {
    throw new Error('Static seat data not loaded — call warmStaticSeatsCache() first.');
  }
  return cachedStaticSeats;
}

// Locks every still-unlocked seat to whoever's currently leading it (or 'INDEPENDENT'
// if nobody's bid on it at all). Used both on the final turn and when a match is
// ended early, so both paths settle every seat by the same rule.
export function forceLockRemainingSeats(room: Room): TurnEvent[] {
  const events: TurnEvent[] = [];
  Object.values(room.seats).forEach((seat) => {
    if (seat.locked) return;
    const entries = Object.entries(seat.progress || {});
    if (!entries.length) {
      seat.locked = 'INDEPENDENT';
      return;
    }
    entries.sort((a, b) => b[1] - a[1]);
    const [leaderId] = entries[0];
    seat.locked = leaderId;
    events.push({ type: 'forced_lock', acNo: seat.acNo, seatName: seat.name, playerId: leaderId });
    room.players[leaderId].seatsWon = (room.players[leaderId].seatsWon || 0) + 1;
  });
  return events;
}

// Resolves one blind turn in-place on the room object; returns { events, perPlayerSpend, isFinalTurn }.
export function resolveTurn(room: Room): { events: TurnEvent[]; perPlayerSpend: Record<string, number>; isFinalTurn: boolean } {
  const seats = room.seats,
    players = room.players;
  const submissions = (room.pendingTurn && room.pendingTurn.submissions) || {};
  const events: TurnEvent[] = [];
  const perPlayerSpend: Record<string, number> = {};
  Object.keys(players).forEach((pid) => (perPlayerSpend[pid] = 0));
  const isFinalTurn = room.turn >= room.maxTurns;

  const seatSpendersThisTurn: Record<string, { playerId: string; amt: number }[]> = {};
  Object.entries(submissions).forEach(([pid, sub]) => {
    Object.entries((sub && sub.seatSpends) || {}).forEach(([acNo, amt]) => {
      if (amt > 0) {
        seatSpendersThisTurn[acNo] = seatSpendersThisTurn[acNo] || [];
        seatSpendersThisTurn[acNo].push({ playerId: pid, amt });
      }
    });
  });

  // Spend this turn, per player per seat — feeds both Vote Bank influence
  // generation and the geographic-relevance multiplier on any Vote Bank
  // leadership bonus, below. Every rung costs a fixed amount, so a rung's spend
  // applies in full (no contest fees).
  const effectiveSpendThisTurn: Record<string, Record<string, number>> = {};
  // Each seat's progress as it stood before this turn — used to break ties when
  // two players reach the final rung on the same turn (whoever was ahead wins).
  const priorProgressBySeat: Record<string, Record<string, number>> = {};

  Object.entries(seatSpendersThisTurn).forEach(([acNo, spenders]) => {
    const seat = seats[acNo];
    if (!seat || seat.locked) return;
    const rungTenTotal = maxPerRungFor(acNo) * TOTAL_RUNGS; // money at the final rung
    priorProgressBySeat[acNo] = { ...seat.progress };
    spenders.forEach(({ playerId, amt }) => {
      // amt is validated at submit time (whole rungs, first-entry cap, ≤ final
      // rung); clamp to the rung-10 ceiling here too so nothing is overspent.
      const before = seat.progress[playerId] || 0;
      const applied = Math.max(0, Math.min(amt, rungTenTotal - before));
      if (applied <= 0) return;
      seat.progress[playerId] = before + applied;
      perPlayerSpend[playerId] += applied;
      effectiveSpendThisTurn[playerId] = effectiveSpendThisTurn[playerId] || {};
      effectiveSpendThisTurn[playerId][acNo] = (effectiveSpendThisTurn[playerId][acNo] || 0) + applied;
    });
  });

  // Vote Bank influence: campaigning in a constituency generates influence
  // with that seat's Vote Banks in proportion to each bank's strength there
  // (not something players spend on directly) — accumulates across turns and
  // across every constituency a player campaigns in.
  const staticSeats = loadStaticSeats();
  Object.entries(effectiveSpendThisTurn).forEach(([playerId, bySeat]) => {
    Object.entries(bySeat).forEach(([acNo, effective]) => {
      const staticSeat = staticSeats[acNo];
      if (!staticSeat) return;
      VOTE_BANK_IDS.forEach((bankId) => {
        const strength = staticSeat.voteBankStrength[bankId];
        const gained = (effective * strength) / 100;
        if (gained <= 0) return;
        room.voteBankInfluence[bankId][playerId] = (room.voteBankInfluence[bankId][playerId] || 0) + gained;
      });
    });
  });

  // Vote Bank leadership is re-evaluated every turn (never permanent, unlike a
  // seat lock) — whoever has the most accumulated influence leads. The
  // current leader of each bank is paid a recurring bonus, scaled down unless
  // this turn's own spend concentrated in constituencies where that bank is
  // actually strong (the "geographic relevance" rule) — a leader coasting on
  // old influence without campaigning anywhere this turn gets the floor rate.
  VOTE_BANKS.forEach((bank) => {
    const influence = room.voteBankInfluence[bank.id];
    const entries = Object.entries(influence).filter(([, amt]) => amt > 0);
    const previousLeaderId = room.voteBankLeaders[bank.id];
    if (!entries.length) {
      room.voteBankLeaders[bank.id] = null;
      return;
    }
    entries.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    const [leaderId] = entries[0];
    room.voteBankLeaders[bank.id] = leaderId;
    if (leaderId !== previousLeaderId) {
      events.push({
        type: 'vote_bank_leader_change',
        voteBankId: bank.id,
        voteBankName: bank.name,
        playerId: leaderId,
        previousLeaderId
      });
    }

    const spendBySeat = effectiveSpendThisTurn[leaderId];
    let weightedStrength = 0;
    if (spendBySeat) {
      let totalSpend = 0;
      let weightedSum = 0;
      Object.entries(spendBySeat).forEach(([acNo, amt]) => {
        const s = staticSeats[acNo];
        if (!s) return;
        totalSpend += amt;
        weightedSum += amt * s.voteBankStrength[bank.id];
      });
      weightedStrength = totalSpend > 0 ? weightedSum / totalSpend : 0;
    }
    const multiplier = Math.min(1, Math.max(VOTE_BANK_BONUS_MIN_MULTIPLIER, weightedStrength / VOTE_BANK_BONUS_FULL_EFFECT_STRENGTH));
    const bonusAmount = Math.round(VOTE_BANK_LEADER_BONUS_BASE * multiplier);
    if (bonusAmount > 0) {
      players[leaderId].pendingBonus = (players[leaderId].pendingBonus || 0) + bonusAmount;
      events.push({ type: 'vote_bank_bonus', voteBankId: bank.id, voteBankName: bank.name, playerId: leaderId, amount: bonusAmount });
    }
  });

  // A seat locks the moment a player reaches the final rung. If two players
  // reach it on the same blind turn, whoever was ahead going into the turn wins
  // (ties broken deterministically); normally only one player tops out at once.
  Object.values(seats).forEach((seat) => {
    if (seat.locked) return;
    const rungTenTotal = maxPerRungFor(seat.acNo) * TOTAL_RUNGS;
    const atTop = Object.entries(seat.progress || {}).filter(([, amt]) => amt >= rungTenTotal);
    if (!atTop.length) return;
    const prior = priorProgressBySeat[seat.acNo] || {};
    atTop.sort((a, b) => (prior[b[0]] || 0) - (prior[a[0]] || 0) || (a[0] < b[0] ? -1 : 1));
    const winnerId = atTop[0][0];
    seat.locked = winnerId;
    events.push({ type: 'lock', acNo: seat.acNo, seatName: seat.name, playerId: winnerId });
    players[winnerId].seatsWon = (players[winnerId].seatsWon || 0) + 1;
  });

  if (isFinalTurn) {
    events.push(...forceLockRemainingSeats(room));
  }

  Object.values(players).forEach((p) => {
    const spent = perPlayerSpend[p.id] || 0;
    // Whatever a player didn't spend this turn (including everything, if they
    // were timed out before submitting) rolls into next turn's budget.
    const rollover = Math.max(0, (p.budgetThisTurn || 0) - spent);
    p.totalSpent = (p.totalSpent || 0) + spent;
    p.ready = false;
    p.budgetThisTurn = rollover + room.budgetPerTurn + (p.pendingBonus || 0);
    p.pendingBonus = 0;
  });

  return { events, perPlayerSpend, isFinalTurn };
}
