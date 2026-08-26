// Ported 1:1 from the design handoff's delhi-game-data.js.
// This is the authoritative, server-side copy of the game's pure logic —
// same constants and same resolveTurn() algorithm, only the seat-loading
// I/O (fetch -> fs.readFileSync) and typings changed.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Player, Room, Seat, TurnEvent } from './types.js';
import {
  VOTE_BANKS,
  VOTE_BANK_IDS,
  loadConstituencyVoteBanks,
  validateConstituencyVoteBanks,
  type ConstituencyVoteBanks,
  type VoteBankId
} from './voteBanks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const MAX_TURNS_DEFAULT = 10;
export const BUDGET_PER_TURN_DEFAULT = 300; // in ₹ thousands
export const CONFLICT_FEE_PER_EXTRA = 5; // ₹K deducted per extra contestant sharing a seat this turn
export const LOCK_MARGIN_RATIO = 0.2; // leader must beat runner-up by this fraction of threshold to lock

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

export const PARTY_COLOR_SWATCHES = [
  'oklch(62% 0.19 25)', // red
  'oklch(66% 0.17 55)', // orange
  'oklch(72% 0.15 95)', // gold
  'oklch(64% 0.15 140)', // green
  'oklch(60% 0.13 195)', // teal
  'oklch(58% 0.16 250)', // blue
  'oklch(60% 0.18 300)', // purple
  'oklch(62% 0.19 340)' // magenta
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
  centroid: [number, number] | null;
  geometry: GeoJSON.Geometry;
  primaryVoteBank: VoteBankId;
  secondaryVoteBanks: VoteBankId[];
  voteBankStrength: Record<VoteBankId, number>;
}

let cachedStaticSeats: Record<string, StaticSeat> | null = null;

export function loadStaticSeats(): Record<string, StaticSeat> {
  if (cachedStaticSeats) return cachedStaticSeats;
  const raw = readFileSync(join(__dirname, 'data', 'delhi_AC.json'), 'utf-8');
  const data = JSON.parse(raw) as GeoJSON.FeatureCollection;
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
      centroid: featureCentroid(f.geometry),
      geometry: f.geometry,
      primaryVoteBank: vb.primaryVoteBank,
      secondaryVoteBanks: vb.secondaryVoteBanks,
      voteBankStrength: vb.voteBankStrength
    };
  });
  cachedStaticSeats = seats;
  return seats;
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

  // Effective (post-conflict-fee) spend this turn, per player per seat — feeds
  // both Vote Bank influence generation and the geographic-relevance
  // multiplier on any Vote Bank leadership bonus, below.
  const effectiveSpendThisTurn: Record<string, Record<string, number>> = {};

  Object.entries(seatSpendersThisTurn).forEach(([acNo, spenders]) => {
    const seat = seats[acNo];
    if (!seat || seat.locked) return;
    const n = spenders.length;
    const conflictFee = n >= 2 ? CONFLICT_FEE_PER_EXTRA * (n - 1) : 0;
    spenders.forEach(({ playerId, amt }) => {
      const effective = Math.max(0, amt - conflictFee);
      seat.progress[playerId] = (seat.progress[playerId] || 0) + effective;
      perPlayerSpend[playerId] += amt;
      if (conflictFee > 0) events.push({ type: 'conflict', acNo, playerId, fee: conflictFee, seatName: seat.name });
      if (effective > 0) {
        effectiveSpendThisTurn[playerId] = effectiveSpendThisTurn[playerId] || {};
        effectiveSpendThisTurn[playerId][acNo] = (effectiveSpendThisTurn[playerId][acNo] || 0) + effective;
      }
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

  Object.values(seats).forEach((seat) => {
    if (seat.locked) return;
    const entries = Object.entries(seat.progress || {});
    if (!entries.length) return;
    entries.sort((a, b) => b[1] - a[1]);
    const [leaderId, leaderAmt] = entries[0];
    const runnerUpAmt = entries[1] ? entries[1][1] : 0;
    const margin = leaderAmt - runnerUpAmt;
    if (leaderAmt >= seat.threshold && margin >= seat.threshold * LOCK_MARGIN_RATIO) {
      seat.locked = leaderId;
      events.push({ type: 'lock', acNo: seat.acNo, seatName: seat.name, playerId: leaderId });
      players[leaderId].seatsWon = (players[leaderId].seatsWon || 0) + 1;
    }
  });

  if (isFinalTurn) {
    events.push(...forceLockRemainingSeats(room));
  }

  Object.values(players).forEach((p) => {
    p.totalSpent = (p.totalSpent || 0) + (perPlayerSpend[p.id] || 0);
    p.ready = false;
    p.budgetThisTurn = room.budgetPerTurn + (p.pendingBonus || 0);
    p.pendingBonus = 0;
  });

  return { events, perPlayerSpend, isFinalTurn };
}
