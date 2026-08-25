// Pure data + logic helpers for the Delhi Vidhan Sabha election game.
// No React/DOM here — safe to import from the DC logic class.

export const GEOJSON_URL = 'state_ut/delhi/assembly/delhi_AC.json';
export const MAX_TURNS_DEFAULT = 10;
export const BUDGET_PER_TURN_DEFAULT = 300; // in ₹ thousands
export const CONFLICT_FEE_PER_EXTRA = 5; // ₹K deducted per extra contestant sharing a seat this turn
export const LOCK_MARGIN_RATIO = 0.2; // leader must beat runner-up by this fraction of threshold to lock
export const GROUP_BONUS = 60; // ₹K added to claimer's next-turn budget

export const PARTY_COLOR_SWATCHES = [
  'oklch(62% 0.19 25)',   // red
  'oklch(66% 0.17 55)',   // orange
  'oklch(72% 0.15 95)',   // gold
  'oklch(64% 0.15 140)',  // green
  'oklch(60% 0.13 195)',  // teal
  'oklch(58% 0.16 250)',  // blue
  'oklch(60% 0.18 300)',  // purple
  'oklch(62% 0.19 340)'   // magenta
];

export const GROUPS = [
  { id: 'traders', name: 'Traders & Shopkeepers', short: 'TR', ask: 90 },
  { id: 'transport', name: 'Auto & Transport Unions', short: 'AU', ask: 70 },
  { id: 'rwa', name: 'Resident Welfare Assoc.', short: 'RW', ask: 80 },
  { id: 'jj', name: 'Unauthorised Colony Residents', short: 'JJ', ask: 60 },
  { id: 'govt', name: 'Govt / DTC / DJB Staff', short: 'GS', ask: 100 },
  { id: 'women', name: 'Women & SHG Groups', short: 'WS', ask: 75 },
  { id: 'farmers', name: 'Border Village Farmers', short: 'FM', ask: 65 },
  { id: 'youth', name: 'Students & Youth', short: 'SY', ask: 55 },
  { id: 'purvanchali', name: 'Purvanchali / Migrant Groups', short: 'PM', ask: 85 },
  { id: 'religious', name: 'Community & Religious Groups', short: 'CR', ask: 95 }
];

export function cleanName(n) { return (n || '').replace(/\s*\(SC\)\s*$/i, '').replace(/\(SC\)/i, '').trim(); }

export function computeThreshold(electors) {
  return Math.min(320, Math.max(40, Math.round(electors / 1000)));
}

// Deterministic elector estimate: real Delhi CEO 2025 totals (electorate ~1.55Cr,
// largest Vikaspuri ~4.62L, smallest Delhi Cantt ~78.9K) distributed across seats
// by relative constituency polygon area (outer/rural seats are larger & more populous).
export function estimateElectors(features) {
  const REAL_MIN = 78893, REAL_MAX = 462184, REAL_TOTAL = 15524858;
  const areas = features.map(f => parseFloat(f.properties.Shape_Area) || 1);
  const minA = Math.min(...areas), maxA = Math.max(...areas);
  const raw = areas.map(a => REAL_MIN + ((a - minA) / (maxA - minA || 1)) * (REAL_MAX - REAL_MIN));
  const rawTotal = raw.reduce((s, v) => s + v, 0);
  const scale = REAL_TOTAL / rawTotal;
  return raw.map(v => Math.min(REAL_MAX, Math.max(REAL_MIN, Math.round(v * scale))));
}

function extractPolys(geom) {
  if (geom.type === 'Polygon') return [geom.coordinates[0]];
  if (geom.type === 'MultiPolygon') return geom.coordinates.map(p => p[0]);
  if (geom.type === 'GeometryCollection') return geom.geometries.flatMap(extractPolys);
  return [];
}
function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
}
function ringCentroid(ring) {
  let cx = 0, cy = 0, area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const x0 = ring[i][0], y0 = ring[i][1], x1 = ring[i + 1][0], y1 = ring[i + 1][1];
    const f = x0 * y1 - x1 * y0;
    cx += (x0 + x1) * f; cy += (y0 + y1) * f; area += f;
  }
  area /= 2;
  if (Math.abs(area) < 1e-12) return ring[0];
  return [cx / (6 * area), cy / (6 * area)];
}
export function featureCentroid(geom) {
  const polys = extractPolys(geom);
  let best = null, bestArea = -1;
  polys.forEach(ring => { const a = Math.abs(ringArea(ring)); if (a > bestArea) { bestArea = a; best = ring; } });
  if (!best) return null;
  const c = ringCentroid(best);
  return [c[1], c[0]];
}

export async function loadSeats() {
  const res = await fetch(GEOJSON_URL);
  const data = await res.json();
  const electors = estimateElectors(data.features);
  const seats = {};
  data.features.forEach((f, i) => {
    const acNo = f.properties.AC_NO;
    const elec = electors[i];
    seats[acNo] = {
      acNo,
      name: cleanName(f.properties.AC_NAME),
      pcName: f.properties.PC_NAME,
      electors: elec,
      threshold: computeThreshold(elec),
      locked: null,
      progress: {},
      centroid: featureCentroid(f.geometry),
      geometry: f.geometry
    };
  });
  return seats;
}

// Resolves one blind turn in-place on a cloned room object; returns { room, events }.
export function resolveTurn(room) {
  const seats = room.seats, groups = room.groups, players = room.players;
  const submissions = (room.pendingTurn && room.pendingTurn.submissions) || {};
  const events = [];
  const perPlayerSpend = {};
  Object.keys(players).forEach(pid => perPlayerSpend[pid] = 0);
  const isFinalTurn = room.turn >= room.maxTurns;

  const seatSpendersThisTurn = {};
  Object.entries(submissions).forEach(([pid, sub]) => {
    Object.entries((sub && sub.seatSpends) || {}).forEach(([acNo, amt]) => {
      if (amt > 0) {
        seatSpendersThisTurn[acNo] = seatSpendersThisTurn[acNo] || [];
        seatSpendersThisTurn[acNo].push({ playerId: pid, amt });
      }
    });
  });

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
    });
  });

  Object.entries(submissions).forEach(([pid, sub]) => {
    Object.entries((sub && sub.groupSpends) || {}).forEach(([gid, amt]) => {
      if (amt > 0) {
        const group = groups.find(g => g.id === gid);
        if (group && !group.claimedBy) {
          group.progress[pid] = (group.progress[pid] || 0) + amt;
          perPlayerSpend[pid] += amt;
        }
      }
    });
  });

  groups.forEach(group => {
    if (group.claimedBy) return;
    const qualifiers = Object.entries(group.progress || {}).filter(([, amt]) => amt >= group.ask);
    if (qualifiers.length) {
      qualifiers.sort((a, b) => b[1] - a[1]);
      const winnerId = qualifiers[0][0];
      group.claimedBy = winnerId;
      events.push({ type: 'group_claim', groupId: group.id, groupName: group.name, playerId: winnerId });
      players[winnerId].pendingBonus = (players[winnerId].pendingBonus || 0) + GROUP_BONUS;
    }
  });

  Object.values(seats).forEach(seat => {
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
    Object.values(seats).forEach(seat => {
      if (seat.locked) return;
      const entries = Object.entries(seat.progress || {});
      if (!entries.length) { seat.locked = 'INDEPENDENT'; return; }
      entries.sort((a, b) => b[1] - a[1]);
      const [leaderId] = entries[0];
      seat.locked = leaderId;
      events.push({ type: 'forced_lock', acNo: seat.acNo, seatName: seat.name, playerId: leaderId });
      players[leaderId].seatsWon = (players[leaderId].seatsWon || 0) + 1;
    });
  }

  Object.values(players).forEach(p => {
    p.totalSpent = (p.totalSpent || 0) + (perPlayerSpend[p.id] || 0);
    p.ready = false;
    p.budgetThisTurn = room.budgetPerTurn + (p.pendingBonus || 0);
    p.pendingBonus = 0;
  });

  return { events, perPlayerSpend, isFinalTurn };
}
