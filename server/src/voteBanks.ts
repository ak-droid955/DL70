// Vote Banks: demographic/economic/electoral constituencies that exist across
// Delhi, distinct from the 70 geographic Assembly seats and from the 7 Lok
// Sabha parliamentary segments. A player's campaign spend in a seat generates
// influence with that seat's Vote Banks in proportion to how strong each Vote
// Bank is there (see resolveTurn in gameData.ts) — Vote Banks are not
// something a player spends on directly.
//
// IMPORTANT — data provenance: the *set* of 70 Assembly constituencies (their
// names/numbers) is exact, sourced from the real Delhi CEO/ECI boundary data
// already bundled in this repo (data/delhi_AC.json). The *assignment* of each
// seat's primary/secondary Vote Banks below is a documented GAME DESIGN
// INFERENCE built from well-known, publicly reported characteristics of each
// area (dominant trade/industry, presence of large unauthorised colonies,
// rural/village character, government housing concentration, historically
// migrant or religious-minority-majority localities, etc.) — it is not drawn
// from a constituency-level census or ECI demographic dataset (no such public
// dataset exists at this granularity). Strength values are relative GAME
// WEIGHTS on a 0-100 scale, not literal population percentages.

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

export const VOTE_BANK_IDS: VoteBankId[] = VOTE_BANKS.map((g) => g.id);

// These four are explicitly called out as not geographically concentrated —
// present to some real degree in nearly every constituency — so they get a
// higher baseline strength than the more geographically-concentrated banks
// even in seats where they aren't the primary or a listed secondary.
const CROSS_CUTTING: VoteBankId[] = ['transport_unions', 'govt_staff', 'women_shg', 'students_youth'];

interface ConstituencyVoteBankEntry {
  acNo: string;
  name: string; // matches delhi_AC.json's cleaned AC_NAME, for cross-check only
  primary: VoteBankId;
  // Listed most- to least-significant; length 2-4 per the spec.
  secondary: VoteBankId[];
}

// One row per Assembly constituency (AC_NO 1-70), derived from each area's
// well-known trade/industry/settlement character. See file header re:
// provenance — this is a documented design inference, not official statistics.
const CONSTITUENCY_VOTE_BANKS: ConstituencyVoteBankEntry[] = [
  { acNo: '1', name: 'Nerela', primary: 'farmers', secondary: ['unauthorised_colonies', 'transport_unions', 'women_shg'] },
  { acNo: '2', name: 'Burari', primary: 'purvanchali_migrant', secondary: ['farmers', 'unauthorised_colonies', 'transport_unions'] },
  { acNo: '3', name: 'Timarpur', primary: 'students_youth', secondary: ['rwa', 'traders', 'community_religious'] },
  { acNo: '4', name: 'Adarsh Nagar', primary: 'unauthorised_colonies', secondary: ['traders', 'transport_unions', 'purvanchali_migrant'] },
  { acNo: '5', name: 'Badli', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'farmers', 'purvanchali_migrant'] },
  { acNo: '6', name: 'Rithala', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'purvanchali_migrant', 'women_shg'] },
  { acNo: '7', name: 'Bawana', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'farmers', 'purvanchali_migrant'] },
  { acNo: '8', name: 'Mundka', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'farmers', 'purvanchali_migrant'] },
  { acNo: '9', name: 'Kirari', primary: 'unauthorised_colonies', secondary: ['purvanchali_migrant', 'transport_unions', 'women_shg'] },
  { acNo: '10', name: 'Sultan Pur Majra', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'purvanchali_migrant', 'farmers'] },
  { acNo: '11', name: 'Nangloi Jat', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'traders', 'farmers'] },
  { acNo: '12', name: 'Mangol Puri', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'women_shg', 'purvanchali_migrant'] },
  { acNo: '13', name: 'Rohini', primary: 'rwa', secondary: ['traders', 'students_youth', 'women_shg'] },
  { acNo: '14', name: 'Shalimar Bagh', primary: 'rwa', secondary: ['traders', 'students_youth', 'women_shg'] },
  { acNo: '15', name: 'Shakur Basti', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'purvanchali_migrant', 'women_shg'] },
  { acNo: '16', name: 'Tri Nagar', primary: 'traders', secondary: ['transport_unions', 'unauthorised_colonies', 'community_religious'] },
  { acNo: '17', name: 'Wazirpur', primary: 'traders', secondary: ['transport_unions', 'unauthorised_colonies', 'purvanchali_migrant'] },
  { acNo: '18', name: 'Model Town', primary: 'rwa', secondary: ['traders', 'students_youth', 'women_shg'] },
  { acNo: '19', name: 'Sadar Bazar', primary: 'traders', secondary: ['transport_unions', 'community_religious', 'purvanchali_migrant'] },
  { acNo: '20', name: 'Chandni Chowk', primary: 'traders', secondary: ['community_religious', 'transport_unions', 'purvanchali_migrant'] },
  { acNo: '21', name: 'Matia Mahal', primary: 'community_religious', secondary: ['traders', 'purvanchali_migrant', 'unauthorised_colonies'] },
  { acNo: '22', name: 'Ballimaran', primary: 'traders', secondary: ['community_religious', 'purvanchali_migrant', 'unauthorised_colonies'] },
  { acNo: '23', name: 'Karol Bagh', primary: 'traders', secondary: ['rwa', 'transport_unions', 'students_youth'] },
  { acNo: '24', name: 'Patel Nagar', primary: 'traders', secondary: ['rwa', 'transport_unions', 'women_shg'] },
  { acNo: '25', name: 'Moti Nagar', primary: 'traders', secondary: ['transport_unions', 'rwa', 'unauthorised_colonies'] },
  { acNo: '26', name: 'Madipur', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'women_shg', 'traders'] },
  { acNo: '27', name: 'Rajouri Garden', primary: 'traders', secondary: ['rwa', 'students_youth', 'women_shg'] },
  { acNo: '28', name: 'Hari Nagar', primary: 'traders', secondary: ['rwa', 'transport_unions', 'women_shg'] },
  { acNo: '29', name: 'Tilak Nagar', primary: 'traders', secondary: ['rwa', 'community_religious', 'women_shg'] },
  { acNo: '30', name: 'Janakpuri', primary: 'rwa', secondary: ['traders', 'students_youth', 'women_shg'] },
  { acNo: '31', name: 'Vikaspuri', primary: 'rwa', secondary: ['traders', 'students_youth', 'transport_unions'] },
  { acNo: '32', name: 'Uttam Nagar', primary: 'unauthorised_colonies', secondary: ['traders', 'transport_unions', 'purvanchali_migrant'] },
  { acNo: '33', name: 'Dwarka', primary: 'rwa', secondary: ['govt_staff', 'students_youth', 'women_shg'] },
  { acNo: '34', name: 'Matiala', primary: 'unauthorised_colonies', secondary: ['farmers', 'transport_unions', 'purvanchali_migrant'] },
  { acNo: '35', name: 'Najafgarh', primary: 'farmers', secondary: ['transport_unions', 'unauthorised_colonies', 'women_shg'] },
  { acNo: '36', name: 'Bijwasan', primary: 'farmers', secondary: ['transport_unions', 'unauthorised_colonies', 'govt_staff'] },
  { acNo: '37', name: 'Palam', primary: 'transport_unions', secondary: ['unauthorised_colonies', 'farmers', 'purvanchali_migrant'] },
  { acNo: '38', name: 'Delhi Cantt', primary: 'govt_staff', secondary: ['rwa', 'transport_unions', 'women_shg'] },
  { acNo: '39', name: 'Rajinder Nagar', primary: 'students_youth', secondary: ['traders', 'rwa', 'govt_staff'] },
  { acNo: '40', name: 'New Delhi', primary: 'govt_staff', secondary: ['rwa', 'students_youth', 'women_shg'] },
  { acNo: '41', name: 'Jangpura', primary: 'rwa', secondary: ['traders', 'unauthorised_colonies', 'community_religious'] },
  { acNo: '42', name: 'Kasturba Nagar', primary: 'govt_staff', secondary: ['rwa', 'women_shg', 'students_youth'] },
  { acNo: '43', name: 'Malviya Nagar', primary: 'rwa', secondary: ['students_youth', 'traders', 'women_shg'] },
  { acNo: '44', name: 'R.K. Puram', primary: 'govt_staff', secondary: ['rwa', 'students_youth', 'women_shg'] },
  { acNo: '45', name: 'Mehrauli', primary: 'farmers', secondary: ['unauthorised_colonies', 'transport_unions', 'traders'] },
  { acNo: '46', name: 'Chhatarpur', primary: 'farmers', secondary: ['unauthorised_colonies', 'transport_unions', 'rwa'] },
  { acNo: '47', name: 'Deoli', primary: 'unauthorised_colonies', secondary: ['farmers', 'transport_unions', 'women_shg'] },
  { acNo: '48', name: 'Ambedkar Nagar', primary: 'unauthorised_colonies', secondary: ['women_shg', 'transport_unions', 'purvanchali_migrant'] },
  { acNo: '49', name: 'Sangam Vihar', primary: 'unauthorised_colonies', secondary: ['purvanchali_migrant', 'women_shg', 'transport_unions'] },
  { acNo: '50', name: 'Greater Kailash', primary: 'rwa', secondary: ['traders', 'students_youth', 'women_shg'] },
  { acNo: '51', name: 'Kalkaji', primary: 'rwa', secondary: ['unauthorised_colonies', 'community_religious', 'women_shg'] },
  { acNo: '52', name: 'Tughlakabad', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'farmers', 'purvanchali_migrant'] },
  { acNo: '53', name: 'Badarpur', primary: 'unauthorised_colonies', secondary: ['transport_unions', 'purvanchali_migrant', 'farmers'] },
  { acNo: '54', name: 'Okhla', primary: 'community_religious', secondary: ['traders', 'purvanchali_migrant', 'unauthorised_colonies'] },
  { acNo: '55', name: 'Trilokpuri', primary: 'unauthorised_colonies', secondary: ['purvanchali_migrant', 'women_shg', 'transport_unions'] },
  { acNo: '56', name: 'Kondli', primary: 'unauthorised_colonies', secondary: ['purvanchali_migrant', 'transport_unions', 'women_shg'] },
  { acNo: '57', name: 'Patparganj', primary: 'rwa', secondary: ['traders', 'transport_unions', 'students_youth'] },
  { acNo: '58', name: 'Laxmi Nagar', primary: 'traders', secondary: ['students_youth', 'transport_unions', 'purvanchali_migrant'] },
  { acNo: '59', name: 'Vishwas Nagar', primary: 'traders', secondary: ['transport_unions', 'unauthorised_colonies', 'purvanchali_migrant'] },
  { acNo: '60', name: 'Krishna Nagar', primary: 'traders', secondary: ['rwa', 'women_shg', 'community_religious'] },
  { acNo: '61', name: 'Gandhi Nagar', primary: 'traders', secondary: ['transport_unions', 'purvanchali_migrant', 'community_religious'] },
  { acNo: '62', name: 'Shahdara', primary: 'traders', secondary: ['transport_unions', 'purvanchali_migrant', 'unauthorised_colonies'] },
  { acNo: '63', name: 'Seemapuri', primary: 'unauthorised_colonies', secondary: ['purvanchali_migrant', 'transport_unions', 'women_shg'] },
  { acNo: '64', name: 'Rohtas Nagar', primary: 'traders', secondary: ['purvanchali_migrant', 'transport_unions', 'unauthorised_colonies'] },
  { acNo: '65', name: 'Seelam Pur', primary: 'community_religious', secondary: ['traders', 'purvanchali_migrant', 'unauthorised_colonies'] },
  { acNo: '66', name: 'Ghonda', primary: 'traders', secondary: ['unauthorised_colonies', 'purvanchali_migrant', 'transport_unions'] },
  { acNo: '67', name: 'Babarpur', primary: 'unauthorised_colonies', secondary: ['traders', 'purvanchali_migrant', 'transport_unions'] },
  { acNo: '68', name: 'Gokalpur', primary: 'unauthorised_colonies', secondary: ['purvanchali_migrant', 'transport_unions', 'women_shg'] },
  { acNo: '69', name: 'Mustafabad', primary: 'community_religious', secondary: ['purvanchali_migrant', 'unauthorised_colonies', 'traders'] },
  { acNo: '70', name: 'Karawal Nagar', primary: 'unauthorised_colonies', secondary: ['purvanchali_migrant', 'transport_unions', 'farmers'] }
];

// Turns a {primary, secondary} entry into strength values for all 10 banks.
// Fixed tiers (rather than 700 hand-picked numbers) keep the relative-strength
// requirements honest and consistent: primary is always highest, each
// secondary is meaningfully below the last, and banks not called out for a
// seat still get a small non-zero baseline (higher for the four cross-cutting
// banks, which are present to some degree nearly everywhere).
const PRIMARY_STRENGTH = 85;
const SECONDARY_STRENGTHS = [60, 50, 42, 36] as const;
const CROSS_CUTTING_BASELINE = 25;
const CONCENTRATED_BASELINE = 10;

function buildStrength(entry: ConstituencyVoteBankEntry): Record<VoteBankId, number> {
  const strength = {} as Record<VoteBankId, number>;
  VOTE_BANK_IDS.forEach((id) => {
    strength[id] = CROSS_CUTTING.includes(id) ? CROSS_CUTTING_BASELINE : CONCENTRATED_BASELINE;
  });
  entry.secondary.forEach((id, i) => {
    strength[id] = SECONDARY_STRENGTHS[i] ?? SECONDARY_STRENGTHS[SECONDARY_STRENGTHS.length - 1];
  });
  strength[entry.primary] = PRIMARY_STRENGTH;
  return strength;
}

export interface ConstituencyVoteBanks {
  acNo: string;
  primaryVoteBank: VoteBankId;
  secondaryVoteBanks: VoteBankId[];
  voteBankStrength: Record<VoteBankId, number>;
}

let cached: Map<string, ConstituencyVoteBanks> | null = null;

export function loadConstituencyVoteBanks(): Map<string, ConstituencyVoteBanks> {
  if (cached) return cached;
  const map = new Map<string, ConstituencyVoteBanks>();
  CONSTITUENCY_VOTE_BANKS.forEach((entry) => {
    map.set(entry.acNo, {
      acNo: entry.acNo,
      primaryVoteBank: entry.primary,
      secondaryVoteBanks: entry.secondary,
      voteBankStrength: buildStrength(entry)
    });
  });
  cached = map;
  return map;
}

// Validates the dataset's structural invariants. Throws on the first
// violation found; called once at server startup (see gameData.ts) so a bad
// edit to the table above fails fast instead of silently producing a broken
// game.
export function validateConstituencyVoteBanks(staticAcNos: string[]): void {
  const rows = CONSTITUENCY_VOTE_BANKS;
  const seen = new Set<string>();
  if (rows.length !== 70) {
    throw new Error(`Expected exactly 70 constituency Vote Bank rows, found ${rows.length}`);
  }
  const staticSet = new Set(staticAcNos);
  rows.forEach((row) => {
    if (seen.has(row.acNo)) throw new Error(`Duplicate acNo ${row.acNo} in CONSTITUENCY_VOTE_BANKS`);
    seen.add(row.acNo);
    if (!staticSet.has(row.acNo)) {
      throw new Error(`acNo ${row.acNo} in CONSTITUENCY_VOTE_BANKS does not match any real seat`);
    }
    if (!VOTE_BANK_IDS.includes(row.primary)) {
      throw new Error(`Invalid primary Vote Bank "${row.primary}" for acNo ${row.acNo}`);
    }
    if (row.secondary.length < 2 || row.secondary.length > 4) {
      throw new Error(`acNo ${row.acNo} must have 2-4 secondary Vote Banks, has ${row.secondary.length}`);
    }
    if (row.secondary.includes(row.primary)) {
      throw new Error(`acNo ${row.acNo}: primary Vote Bank must not also appear in secondary list`);
    }
    const secondarySet = new Set(row.secondary);
    if (secondarySet.size !== row.secondary.length) {
      throw new Error(`acNo ${row.acNo}: secondary Vote Banks must not repeat`);
    }
    row.secondary.forEach((id) => {
      if (!VOTE_BANK_IDS.includes(id)) throw new Error(`Invalid secondary Vote Bank "${id}" for acNo ${row.acNo}`);
    });
  });
  staticAcNos.forEach((acNo) => {
    if (!seen.has(acNo)) throw new Error(`Real seat acNo ${acNo} is missing from CONSTITUENCY_VOTE_BANKS`);
  });
}
