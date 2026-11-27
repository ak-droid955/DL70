import { useEffect, useMemo, useRef, useState } from 'react';
import aapSymbol from '../assets/parties/aap.png';
import bjpSymbol from '../assets/parties/bjp.png';
import incSymbol from '../assets/parties/inc.png';
import sadSymbol from '../assets/parties/sad.png';
import cpimSymbol from '../assets/parties/cpim.png';
import bspSymbol from '../assets/parties/bsp.png';
import jduSymbol from '../assets/parties/jdu.png';
import rjdSymbol from '../assets/parties/rjd.png';
import cjpSymbol from '../assets/parties/cjp.png';
import arvindKejriwal from '../assets/candidates/aap/arvind-kejriwal.webp';
import atishi from '../assets/candidates/aap/atishi.webp';
import manishSisodia from '../assets/candidates/aap/manish-sisodia.webp';
import saurabhBharadwaj from '../assets/candidates/aap/saurabh-bharadwaj.webp';
import abhijeetDipke from '../assets/candidates/cjp/abhijeet-dipke.webp';
import ashutoshRanka from '../assets/candidates/cjp/ashutosh-ranka.webp';
import placeholderLeader from '../assets/candidates/placeholder.webp';
import devenderYadav from '../assets/candidates/inc/devender-yadav.webp';
import sandeepDikshit from '../assets/candidates/inc/sandeep-dikshit.webp';
import harshMalhotra from '../assets/candidates/bjp/harsh-malhotra.webp';
import kapilMishra from '../assets/candidates/bjp/kapil-mishra.webp';
import parveshVerma from '../assets/candidates/bjp/parvesh-verma.webp';
import rekhaGupta from '../assets/candidates/bjp/rekha-gupta.webp';
import madanLalKhurana from '../assets/candidates/bjp/madan-lal-khurana.webp';
import sushmaSwaraj from '../assets/candidates/bjp/sushma-swaraj.webp';
import sahibSinghVerma from '../assets/candidates/bjp/sahib-singh-verma.webp';
import vijayKumarMalhotra from '../assets/candidates/bjp/vijay-kumar-malhotra.webp';
import sheilaDikshit from '../assets/candidates/inc/sheila-dikshit.webp';
import harshVardhan from '../assets/candidates/bjp/harsh-vardhan.webp';
import vijayGoel from '../assets/candidates/bjp/vijay-goel.webp';
import kiranBedi from '../assets/candidates/bjp/kiran-bedi.webp';
import manojTiwari from '../assets/candidates/bjp/manoj-tiwari.webp';
import virendraSachdeva from '../assets/candidates/bjp/virendra-sachdeva.webp';
import ajayMaken from '../assets/candidates/inc/ajay-maken.webp';
import kirtiAzad from '../assets/candidates/inc/kirti-azad.webp';
import mayawati from '../assets/candidates/bsp/mayawati.webp';
import kanshiRam from '../assets/candidates/bsp/kanshi-ram.webp';
import manjinderSinghSirsa from '../assets/candidates/sad/manjinder-singh-sirsa.webp';
import { PROFANITY_MESSAGE, hasProfanity } from '../lib/profanity';
import { useGame } from '../state/GameProvider';
import DistrictList from './DistrictList';
import MiniSeatMap from './MiniSeatMap';
import ParliamentArch from './ParliamentArch';
import RoomShell, { shellStyles } from './RoomShell';
import SeatContest, { type ContestParty, type ContestRow } from './SeatContest';
import SeatShare from './SeatShare';
import OpponentAlliances, { type OpponentAlliance } from './OpponentAlliances';
import styles from './SinglePlayer.module.css';

// One row in the party details card. An array value renders as chips.
type StatRow = { label: string; value: string | readonly string[] };

// Each party's election symbol (square, transparent-background PNGs) and the
// stats shown in the floating details card when the party is picked. Vote
// share is from the 2025 Delhi assembly election. Parties without a symbol
// yet show an empty placeholder box. Row 1 sits before the Custom Party tile,
// row 2 on the line below it.
const PARTIES: readonly {
  id: 'bjp' | 'aap' | 'inc' | 'sad' | 'cpim' | 'bsp' | 'jdu' | 'rjd' | 'cjp';
  name: string;
  /** Initials shown on the party and alliance partner tiles. */
  short: string;
  symbol?: string;
  symbolLabel?: string;
  row: 1 | 2;
  stats: readonly StatRow[];
}[] = [
  {
    id: 'bjp',
    name: 'Bharatiya Janata Party',
    short: 'BJP',
    symbol: bjpSymbol,
    symbolLabel: 'Lotus',
    row: 1,
    stats: [
      { label: 'Last election', value: '45.6%' },
      { label: 'Ideologies', value: ['Hindu nationalism', 'Conservatism'] },
      { label: 'Founders', value: ['Atal Bihari Vajpayee', 'L. K. Advani'] },
      { label: 'Delhi CMs', value: ['Madan Lal Khurana', 'Sahib Singh Verma', 'Sushma Swaraj', 'Rekha Gupta'] },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '1980' }
    ]
  },
  {
    id: 'aap',
    name: 'Aam Aadmi Party',
    short: 'AAP',
    symbol: aapSymbol,
    symbolLabel: 'Broom',
    row: 1,
    stats: [
      { label: 'Last election', value: '43.6%' },
      { label: 'Ideologies', value: ['Populism', 'Anti-corruption'] },
      { label: 'Founders', value: ['Arvind Kejriwal'] },
      { label: 'Delhi CMs', value: ['Arvind Kejriwal', 'Atishi'] },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '2012' }
    ]
  },
  {
    id: 'inc',
    name: 'Indian National Congress',
    short: 'INC',
    symbol: incSymbol,
    symbolLabel: 'Hand',
    row: 1,
    stats: [
      { label: 'Last election', value: '6.3%' },
      { label: 'Ideologies', value: ['Secularism', 'Social liberalism'] },
      { label: 'Founders', value: ['A. O. Hume', 'Dadabhai Naoroji'] },
      { label: 'Delhi CMs', value: ['Sheila Dikshit'] },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '1885' }
    ]
  },
  {
    id: 'sad',
    name: 'Shiromani Akali Dal',
    short: 'SAD',
    symbol: sadSymbol,
    symbolLabel: 'Scales',
    row: 1,
    stats: [
      { label: 'Last election', value: '—' },
      { label: 'Ideologies', value: ['Sikh interests', 'Regionalism'] },
      { label: 'Founders', value: '—' },
      { label: 'Delhi CMs', value: '—' },
      { label: 'Jurisdiction', value: 'State (Punjab)' },
      { label: 'Founded', value: '1920' }
    ]
  },
  {
    id: 'cpim',
    name: 'Communist Party of India (Marxist)',
    short: 'CPI(M)',
    symbol: cpimSymbol,
    symbolLabel: 'Hammer, sickle and star',
    row: 2,
    stats: [
      { label: 'Last election', value: '—' },
      { label: 'Ideologies', value: ['Communism', 'Marxism–Leninism'] },
      { label: 'Founders', value: '—' },
      { label: 'Delhi CMs', value: '—' },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '1964' }
    ]
  },
  {
    id: 'bsp',
    name: 'Bahujan Samaj Party',
    short: 'BSP',
    symbol: bspSymbol,
    symbolLabel: 'Elephant',
    row: 2,
    stats: [
      { label: 'Last election', value: '—' },
      { label: 'Ideologies', value: ['Ambedkarism', 'Social justice'] },
      { label: 'Founders', value: ['Kanshi Ram'] },
      { label: 'Delhi CMs', value: '—' },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '1984' }
    ]
  },
  {
    id: 'jdu',
    name: 'Janata Dal (United)',
    short: 'JD(U)',
    symbol: jduSymbol,
    symbolLabel: 'Arrow',
    row: 2,
    stats: [
      { label: 'Last election', value: '—' },
      { label: 'Ideologies', value: ['Socialism', 'Secularism'] },
      { label: 'Founders', value: ['George Fernandes', 'Sharad Yadav', 'Nitish Kumar'] },
      { label: 'Delhi CMs', value: '—' },
      { label: 'Jurisdiction', value: 'State (Bihar)' },
      { label: 'Founded', value: '2003' }
    ]
  },
  {
    id: 'rjd',
    name: 'Rashtriya Janata Dal',
    short: 'RJD',
    symbol: rjdSymbol,
    symbolLabel: 'Lantern',
    row: 2,
    stats: [
      { label: 'Last election', value: '—' },
      { label: 'Ideologies', value: ['Socialism', 'Social justice'] },
      { label: 'Founders', value: ['Lalu Prasad Yadav'] },
      { label: 'Delhi CMs', value: '—' },
      { label: 'Jurisdiction', value: 'State (Bihar)' },
      { label: 'Founded', value: '1997' }
    ]
  },
  {
    id: 'cjp',
    name: 'Cockroach Janata Party',
    short: 'CJP',
    symbol: cjpSymbol,
    symbolLabel: 'Cockroach',
    row: 2,
    stats: [
      { label: 'Last election', value: '—' },
      { label: 'Ideologies', value: ['Social justice', 'Populism', 'Liberalism', 'Secularism'] },
      { label: 'Founders', value: ['Abhijeet Dipke', 'Ashutosh Ranka', 'Saurav Das'] },
      { label: 'Delhi CMs', value: '—' },
      { label: 'Jurisdiction', value: '—' },
      { label: 'Founded', value: '2026' }
    ]
  }
];

// Alliance Mode seat sharing: of Delhi's 70 seats, each alliance partner
// gets at least 10% (7 seats), and your own party keeps at least as
// many. That allows up to 9 partners, i.e. every other party.
const TOTAL_SEATS = 70;
const MIN_PARTNER_SHARE = 0.1;
const MIN_PARTNER_SEATS = Math.ceil(TOTAL_SEATS * MIN_PARTNER_SHARE);
const MAX_PARTNERS = Math.floor((TOTAL_SEATS - MIN_PARTNER_SEATS) / MIN_PARTNER_SEATS);

type Shares = Partial<Record<PartyId, number>>;

/** Starting seat shares for `ids`: the 70 seats split evenly between your
 *  party and the partners (50-50 with one partner), any odd seats going to
 *  your party. */
function evenShares(ids: PartyId[]): Shares {
  const each = Math.floor(TOTAL_SEATS / (ids.length + 1));
  const next: Shares = {};
  ids.forEach((id) => (next[id] = each));
  return next;
}

/** A party's symbol, or an empty placeholder box until one is added. */
function PartySymbol({ src, label, className }: { src?: string; label?: string; className: string }) {
  return src ? (
    <img className={className} src={src} alt={`${label ?? 'Party'} symbol`} />
  ) : (
    <span className={`${className} ${styles.symbolPlaceholder}`} aria-hidden="true" />
  );
}

// Build-your-own option, shown after the real parties with a plus mark.
const CUSTOM_PARTY: { id: 'custom'; name: string; stats: readonly StatRow[] } = {
  id: 'custom',
  name: 'Custom Party',
  stats: [
    { label: 'Last election', value: '—' },
    { label: 'Ideologies', value: ['Your choice'] },
    { label: 'Founders', value: ['You'] },
    { label: 'Delhi CMs', value: '—' },
    { label: 'Jurisdiction', value: 'Delhi' },
    { label: 'Founded', value: 'Today' }
  ]
};

// Ideologies a Custom Party can pick from (up to MAX_IDEOLOGIES), shown in
// two groups: Indian political traditions first, then general ones.
const IDEOLOGY_GROUPS = [
  {
    label: 'Indian',
    options: [
      'Gandhism',
      'Hindutva',
      'Integral humanism',
      'Ambedkarism',
      'Nehruvian socialism',
      'Lohiaite socialism',
      'Dravidianism',
      'Sarvodaya',
      'Swadeshi',
      'Social justice',
      'Kisan politics',
      'Federalism'
    ]
  },
  {
    label: 'General',
    options: [
      'Centrism',
      'Conservatism',
      'Liberalism',
      'Social democracy',
      'Socialism',
      'Secularism',
      'Nationalism',
      'Populism',
      'Regionalism',
      'Welfarism',
      'Environmentalism',
      'Anti-corruption'
    ]
  }
] as const;
const MAX_IDEOLOGIES = 2;

type PartyId = (typeof PARTIES)[number]['id'] | typeof CUSTOM_PARTY.id;

// Each mode's explainer, shown under the mode buttons once one is picked.
// A Delhi majority is 36 of the 70 seats.
const MODES = [
  {
    id: 'one-vs-many',
    label: '1 vs Many',
    tagline: 'You against everyone',
    description:
      'Take on every other party at once, each played by the computer. Win 36 seats on your own.'
  },
  {
    id: 'alliance',
    label: 'Alliance Mode',
    tagline: 'Pick your partners',
    description:
      "Team up with other parties before the vote. The alliance's seats count together towards 36."
  },
  {
    id: 'historical',
    label: 'Historical Elections',
    tagline: "Replay Delhi's past",
    description:
      'Start from the real results of a past Delhi assembly election and see if you can change how it turned out.'
  }
] as const;

type ModeId = (typeof MODES)[number]['id'];

// Every Delhi Legislative Assembly election since the assembly was restored
// in 1993, listed on the Historical Elections page, with the game's parties
// that contested it on their own symbol. Only these can be played as, or
// played against, in that election.
//
// Source: Wikipedia's "<year> Delhi Legislative Assembly election" pages
// (party-wise results tables) and statisticstimes.com, read November 2026.
// Left out where the pages don't list the party: CPI(M) after 2013, and SAD
// in 2008 (that candidate was from the separate SAD (Amritsar)). SAD in 2015
// had one candidate on its own symbol; its other three ran on BJP's.
//
// Pre-poll alliances among those parties are kept as they were: allies are
// shown together, and the party you pick plays alongside its allies rather
// than against them. 2013/2015: BJP with SAD; 2020: NDA (BJP, JD(U)) and
// UPA (INC, RJD); 2025: NDA (BJP, JD(U)). Partners outside the game (LJP)
// are left out.
type HistoricalAlliance = { name: string; parties: readonly PartyId[] };
const HISTORICAL_ELECTIONS: readonly {
  year: number;
  assembly: string;
  parties: readonly PartyId[];
  alliances?: readonly HistoricalAlliance[];
}[] = [
  { year: 1993, assembly: '1st Assembly', parties: ['bjp', 'inc', 'bsp', 'cpim'] },
  { year: 1998, assembly: '2nd Assembly', parties: ['inc', 'bjp', 'bsp'] },
  { year: 2003, assembly: '3rd Assembly', parties: ['inc', 'bjp', 'bsp'] },
  { year: 2008, assembly: '4th Assembly', parties: ['inc', 'bjp', 'bsp', 'jdu', 'rjd'] },
  {
    year: 2013,
    assembly: '5th Assembly',
    parties: ['bjp', 'aap', 'inc', 'bsp', 'jdu', 'sad', 'cpim'],
    alliances: [{ name: 'NDA', parties: ['bjp', 'sad'] }]
  },
  {
    year: 2015,
    assembly: '6th Assembly',
    parties: ['aap', 'bjp', 'inc', 'bsp', 'sad'],
    alliances: [{ name: 'NDA', parties: ['bjp', 'sad'] }]
  },
  {
    year: 2020,
    assembly: '7th Assembly',
    parties: ['aap', 'bjp', 'inc', 'bsp', 'jdu', 'rjd'],
    alliances: [
      { name: 'NDA', parties: ['bjp', 'jdu'] },
      { name: 'UPA', parties: ['inc', 'rjd'] }
    ]
  },
  {
    year: 2025,
    assembly: '8th Assembly',
    parties: ['bjp', 'aap', 'inc', 'bsp', 'jdu'],
    alliances: [{ name: 'NDA', parties: ['bjp', 'jdu'] }]
  }
];

/** The alliance `party` was in at `year`'s election, if any. */
function historicalAllianceOf(year: number | null, party: PartyId | null): HistoricalAlliance | undefined {
  if (year === null || party === null) return undefined;
  return HISTORICAL_ELECTIONS.find((e) => e.year === year)?.alliances?.find((a) => a.parties.includes(party));
}

// Who you play against on the candidate page: Delhi's main contenders, or
// every other party in the game. Parties you play as or ally with are left
// out either way.
const STANDARD_PARTIES: readonly PartyId[] = ['bjp', 'aap', 'inc'];
const OPPONENT_OPTIONS = [
  { id: 'standard', label: 'Play Standard', tagline: 'The main contenders' },
  { id: 'all', label: 'Play All', tagline: 'Every party in the race' }
] as const;
type OpponentsId = (typeof OPPONENT_OPTIONS)[number]['id'];

// Each party's colour (Wikipedia's party colours, from Module:Political
// party, except AAP in dark blue and JD(U) in purple), used for the seats
// ticked on the candidate page (map and arch); the party picker stays
// uncoloured. A Custom Party uses the page's ink colour.
const PARTY_COLORS: Partial<Record<PartyId, string>> = {
  bjp: '#FF9933',
  aap: '#0A3A86',
  inc: '#00BFFF',
  sad: '#0F204A',
  cpim: '#CC0D0D',
  bsp: '#22409A',
  jdu: '#6B2D9A',
  rjd: '#056D05',
  cjp: '#5A2F12'
};

// Leaders you can play as on the candidate page, per party. A party without
// its own list yet gets numbered placeholder slots with blank pictures.
type Candidate = { name: string; image?: string };
const PLACEHOLDER_CANDIDATES: readonly Candidate[] = [1, 2, 3, 4].map((n) => ({ name: `Candidate ${n}` }));
// Smaller parties field one candidate, their Delhi unit's head, shown with a
// generic leader silhouette until a portrait is added.
const delhiChief = (name: string): readonly Candidate[] => [{ name, image: placeholderLeader }];
const CANDIDATES: Partial<Record<PartyId, readonly Candidate[]>> = {
  bjp: [
    { name: 'Rekha Gupta', image: rekhaGupta },
    { name: 'Parvesh Verma', image: parveshVerma },
    { name: 'Kapil Mishra', image: kapilMishra },
    { name: 'Harsh Malhotra', image: harshMalhotra },
    { name: 'Manjinder Singh Sirsa', image: manjinderSinghSirsa },
    { name: 'Manoj Tiwari', image: manojTiwari }
  ],
  aap: [
    { name: 'Arvind Kejriwal', image: arvindKejriwal },
    { name: 'Atishi', image: atishi },
    { name: 'Manish Sisodia', image: manishSisodia },
    { name: 'Saurabh Bharadwaj', image: saurabhBharadwaj }
  ],
  inc: [
    { name: 'Sandeep Dikshit', image: sandeepDikshit },
    { name: 'Devender Yadav', image: devenderYadav }
  ],
  cjp: [
    { name: 'Abhijeet Dipke', image: abhijeetDipke },
    { name: 'Ashutosh Ranka', image: ashutoshRanka }
  ],
  // Delhi unit heads: SAD president, CPI(M) state secretary, RJD, JD(U) and
  // BSP state presidents.
  sad: delhiChief('Paramjit Singh Sarna'),
  cpim: delhiChief('Anurag Saxena'),
  rjd: delhiChief('Manoj Chaudhary'),
  jdu: delhiChief('Shailendra Kumar'),
  bsp: delhiChief('Laxman Singh')
};

// Historical Elections: CM candidates per election and party, the leaders
// who fronted (or were the main contenders to lead) that party in that
// election. Portraits already in the game are reused; everyone else gets the
// leader silhouette until their photo is added. BSP is fronted by its national leader (Kanshi Ram,
// then Mayawati) until 2015, and its Delhi president after. CPI(M), JD(U)
// and RJD by their national leader at the time (general secretary or party
// president); SAD by its Delhi face, Manjinder Singh Sirsa.
const PORTRAITS: Readonly<Record<string, string>> = {
  'Arvind Kejriwal': arvindKejriwal,
  Atishi: atishi,
  'Manish Sisodia': manishSisodia,
  'Saurabh Bharadwaj': saurabhBharadwaj,
  'Rekha Gupta': rekhaGupta,
  'Parvesh Verma': parveshVerma,
  'Sandeep Dikshit': sandeepDikshit,
  'Devender Yadav': devenderYadav,
  'Madan Lal Khurana': madanLalKhurana,
  'Sushma Swaraj': sushmaSwaraj,
  'Sahib Singh Verma': sahibSinghVerma,
  'Vijay Kumar Malhotra': vijayKumarMalhotra,
  'Sheila Dikshit': sheilaDikshit,
  'Harsh Vardhan': harshVardhan,
  'Vijay Goel': vijayGoel,
  'Kiran Bedi': kiranBedi,
  'Manoj Tiwari': manojTiwari,
  'Virendra Sachdeva': virendraSachdeva,
  'Ajay Maken': ajayMaken,
  'Kirti Azad': kirtiAzad,
  Mayawati: mayawati,
  'Kanshi Ram': kanshiRam,
  'Manjinder Singh Sirsa': manjinderSinghSirsa
};
const leaders = (...names: string[]): readonly Candidate[] =>
  names.map((name) => ({ name, image: PORTRAITS[name] ?? placeholderLeader }));
const HISTORICAL_CANDIDATES: Readonly<Record<number, Partial<Record<PartyId, readonly Candidate[]>>>> = {
  1993: {
    cpim: leaders('Harkishan Singh Surjeet'),
    bsp: leaders('Kanshi Ram'),
    bjp: leaders('Madan Lal Khurana', 'Sahib Singh Verma', 'Vijay Kumar Malhotra'),
    inc: leaders('H. K. L. Bhagat', 'Jag Parvesh Chandra')
  },
  1998: {
    bsp: leaders('Kanshi Ram'),
    bjp: leaders('Sushma Swaraj', 'Sahib Singh Verma', 'Madan Lal Khurana'),
    inc: leaders('Sheila Dikshit')
  },
  2003: {
    bsp: leaders('Mayawati'),
    bjp: leaders('Madan Lal Khurana', 'Vijay Kumar Malhotra'),
    inc: leaders('Sheila Dikshit')
  },
  2008: {
    jdu: leaders('Sharad Yadav'),
    rjd: leaders('Lalu Prasad Yadav'),
    bsp: leaders('Mayawati'),
    bjp: leaders('Vijay Kumar Malhotra', 'Harsh Vardhan'),
    inc: leaders('Sheila Dikshit')
  },
  2013: {
    jdu: leaders('Sharad Yadav'),
    sad: leaders('Manjinder Singh Sirsa'),
    cpim: leaders('Prakash Karat'),
    bsp: leaders('Mayawati'),
    bjp: leaders('Harsh Vardhan', 'Vijay Goel'),
    aap: leaders('Arvind Kejriwal', 'Manish Sisodia'),
    inc: leaders('Sheila Dikshit')
  },
  2015: {
    sad: leaders('Manjinder Singh Sirsa'),
    bsp: leaders('Mayawati'),
    bjp: leaders('Kiran Bedi', 'Satish Upadhyay'),
    aap: leaders('Arvind Kejriwal', 'Manish Sisodia'),
    inc: leaders('Ajay Maken')
  },
  2020: {
    jdu: leaders('Nitish Kumar'),
    rjd: leaders('Lalu Prasad Yadav'),
    bsp: leaders('Laxman Singh'),
    bjp: leaders('Manoj Tiwari', 'Parvesh Verma'),
    aap: leaders('Arvind Kejriwal', 'Manish Sisodia'),
    inc: leaders('Subhash Chopra', 'Kirti Azad')
  },
  2025: {
    jdu: leaders('Nitish Kumar'),
    bsp: leaders('Laxman Singh'),
    bjp: leaders('Rekha Gupta', 'Parvesh Verma', 'Virendra Sachdeva'),
    aap: leaders('Arvind Kejriwal', 'Atishi', 'Manish Sisodia'),
    inc: leaders('Devender Yadav', 'Sandeep Dikshit')
  }
};

/** Single-player entry page: pick the party you will play as, and a mode. */
export default function SinglePlayer() {
  const [selected, setSelected] = useState<PartyId | null>(null);
  const [mode, setMode] = useState<ModeId | null>(null);
  // Which page of the flow is showing: the party/mode picker, the candidate
  // picker that follows Next for 1 vs Many and Alliance Mode, or the
  // Historical Elections page (empty for now). Kept in this component so the
  // picks survive going back.
  const [page, setPage] = useState<'pick' | 'candidate' | 'historical' | 'historicalParty'>('pick');
  // Election picked from the Historical Elections menu.
  const [historicalYear, setHistoricalYear] = useState<number | null>(null);
  // Party you play as in that election; cleared when the election changes.
  const [historicalParty, setHistoricalParty] = useState<PartyId | null>(null);
  // CM candidate picked on the page after that (index into its list).
  const [historicalCandidate, setHistoricalCandidate] = useState<number | null>(null);
  // Which of the party's candidates is picked on the candidate page.
  const [candidate, setCandidate] = useState<number | null>(null);
  // Parties picked as alliance partners (Alliance Mode only).
  const [partners, setPartners] = useState<ReadonlySet<PartyId>>(() => new Set());
  // Standard or all-party opposition, picked under Add Your Candidates.
  const [opponents, setOpponents] = useState<OpponentsId | null>(null);
  // 1 vs Many: the parties ticked as opponents. null until changed, which
  // means the default: Delhi's main parties (BJP, AAP, INC) other than yours.
  const [opponentTicks, setOpponentTicks] = useState<ReadonlySet<PartyId> | null>(null);
  // Alliances among the opponents: named groups of two or more party ids.
  const [opponentAlliances, setOpponentAlliances] = useState<OpponentAlliance[]>([]);
  // Seats each alliance partner contests; your party takes the rest.
  const [shares, setShares] = useState<Shares>({});
  const togglePartner = (id: PartyId) => {
    const next = new Set(partners);
    if (next.has(id)) next.delete(id);
    else if (next.size < MAX_PARTNERS) next.add(id);
    else return;
    setPartners(next);
    // Picking or dropping a partner restarts the sliders at an even split.
    setShares(evenShares(PARTIES.map((p) => p.id).filter((p) => next.has(p))));
    setSeatOverrides({});
  };
  const partnerSeats = (id: PartyId) => shares[id] ?? MIN_PARTNER_SEATS;
  // Move one partner's slider, keeping the minimum for your own party.
  const setShare = (id: PartyId, seats: number) => {
    const others = [...partners].filter((p) => p !== id).reduce((a, p) => a + partnerSeats(p), 0);
    const most = TOTAL_SEATS - MIN_PARTNER_SEATS - others;
    setShares((cur) => ({ ...cur, [id]: Math.max(MIN_PARTNER_SEATS, Math.min(most, seats)) }));
  };
  // Whether Next has been pressed on the candidate page, revealing the "Add
  // Your Candidates" box. Scrolls it into view when it appears.
  const [showSeats, setShowSeats] = useState(false);
  const seatsCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showSeats) seatsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [showSeats]);
  // Seat outlines for the mini map on the candidate page.
  const { state } = useGame();
  const seats = useMemo(() => Object.values(state.staticSeats ?? {}), [state.staticSeats]);
  // Alliance Mode: a random order of the seats, dealt out in turn to your
  // party and each partner by their seat share. Shuffle deals a new order.
  const [shuffles, setShuffles] = useState(0);
  // Alliance Mode: seats given by hand to a particular ally (seat number to
  // party), kept ahead of the random deal. Shuffling clears them.
  const [seatOverrides, setSeatOverrides] = useState<Record<string, PartyId>>({});
  // Seat clicked on the candidate page's map, whose contest is shown below it.
  const [pickedSeat, setPickedSeat] = useState<string | null>(null);
  const seatOrder = useMemo(() => {
    const order = seats.map((s) => s.acNo);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seats, shuffles]);
  // Constituencies ticked in the district list; shown in the party's colour
  // on the mini map and the arch diagram.
  const [tickedSeats, setTickedSeats] = useState<ReadonlySet<string>>(() => new Set());
  const toggleSeat = (acNo: string) =>
    setTickedSeats((cur) => {
      const next = new Set(cur);
      if (next.has(acNo)) next.delete(acNo);
      else next.add(acNo);
      return next;
    });
  const setSeats = (acNos: string[], on: boolean) =>
    setTickedSeats((cur) => {
      const next = new Set(cur);
      acNos.forEach((n) => (on ? next.add(n) : next.delete(n)));
      return next;
    });
  // The side panel opens on every party click and can be closed without
  // clearing the selection.
  const [panelOpen, setPanelOpen] = useState(false);
  // Symbol the player uploads for their Custom Party, centre-cropped to a
  // square PNG data URL. Local to this page for now.
  const [customSymbol, setCustomSymbol] = useState<string | null>(null);
  // Name for the Custom Party, editable from its details card via the pen.
  const [customName, setCustomName] = useState<string>(CUSTOM_PARTY.name);
  const [editingName, setEditingName] = useState(false);
  // Ideologies picked for the Custom Party, and whether the picker is open.
  const [customIdeologies, setCustomIdeologies] = useState<string[]>([]);
  const [ideologyPickerOpen, setIdeologyPickerOpen] = useState(false);
  const toggleIdeology = (idea: string) =>
    setCustomIdeologies((cur) =>
      cur.includes(idea) ? cur.filter((i) => i !== idea) : cur.length < MAX_IDEOLOGIES ? [...cur, idea] : cur
    );
  const [nameDraft, setNameDraft] = useState('');

  const startEditingName = () => {
    setNameDraft(customName);
    setEditingName(true);
  };
  // Live check against the shared English + Hinglish profanity list.
  const nameBlocked = hasProfanity(nameDraft);
  // Enter: only saves a clean, non-blank name; an abusive one stays in the
  // field with the error showing.
  const saveName = () => {
    if (nameBlocked) return;
    const trimmed = nameDraft.trim();
    if (trimmed) setCustomName(trimmed);
    setEditingName(false);
  };
  // Clicking away: keep a clean name, otherwise drop the edit.
  const finishEditingName = () => {
    if (!nameBlocked) saveName();
    else setEditingName(false);
  };

  const onCustomSymbolFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 192;
        canvas.height = 192;
        canvas
          .getContext('2d')
          ?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 192, 192);
        setCustomSymbol(canvas.toDataURL('image/png'));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const pick = (id: PartyId) => {
    if (id !== selected) {
      // A party with a single candidate has them picked already.
      setCandidate(CANDIDATES[id]?.length === 1 ? 0 : null);
      // A party can't be its own alliance partner.
      setPartners((cur) => {
        if (!cur.has(id)) return cur;
        const next = new Set(cur);
        next.delete(id);
        return next;
      });
    }
    setSelected(id);
    setPanelOpen(true);
    setIdeologyPickerOpen(false);
  };

  // The details card is only up while a party is being looked at: it closes
  // on Escape or on any click outside both the card and the party tiles
  // (clicking another tile just switches it).
  const panelRef = useRef<HTMLElement>(null);
  const partyGridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || partyGridRef.current?.contains(target)) return;
      setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [panelOpen]);

  const activeMode = MODES.find((m) => m.id === mode);
  const canProceed = mode !== null && (mode === 'historical' || selected !== null);
  const real = PARTIES.find((p) => p.id === selected);
  const detail = selected === CUSTOM_PARTY.id ? CUSTOM_PARTY : real;

  const goNext = () => {
    if (mode === 'one-vs-many' || mode === 'alliance') {
      setPanelOpen(false);
      setPage('candidate');
      // Open the new page at its top rather than wherever Next was.
      window.scrollTo(0, 0);
    } else if (mode === 'historical') {
      setPanelOpen(false);
      setPage('historical');
      window.scrollTo(0, 0);
    }
  };

  // Historical Elections: a row of past Delhi elections above a box where
  // you pick your party from those that contested the picked election. The
  // rest of that election's parties are your opponents. The header's back
  // link returns to the picker with the mode kept.
  // Historical Elections, after Next: pick the CM candidate you play as,
  // from the picked party's leaders in that election. Back returns to the
  // election page with the picks kept.
  if (page === 'historicalParty') {
    const hParty = PARTIES.find((p) => p.id === historicalParty);
    const hAlliance = historicalAllianceOf(historicalYear, historicalParty);
    const lineup =
      (historicalYear && historicalParty && HISTORICAL_CANDIDATES[historicalYear]?.[historicalParty]) ||
      PLACEHOLDER_CANDIDATES;
    return (
      <RoomShell variant="booth" onBack={() => setPage('historical')}>
        <div className={`${shellStyles.card} ${styles.card} ${styles.candidateCard} ${styles.historyCmCard}`}>
          <h1 className={`${styles.heading} ${styles.candidateHeading}`}>Select Your CM Candidate</h1>
          {hParty && (
            <p className={styles.candidateSub}>
              {hParty.name} · {historicalYear}
              {hAlliance && ` · ${hAlliance.name}`}
            </p>
          )}
          <div className={styles.lineup} role="radiogroup" aria-label="Candidate">
            {lineup.map((c, i) => {
              const on = historicalCandidate === i;
              return (
                <div key={c.name} className={styles.lineupSlot}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={c.name}
                    className={`${styles.candidateBox} ${on ? styles.candidateBoxSelected : ''}`}
                    onClick={() => setHistoricalCandidate(i)}
                  >
                    {c.image ? (
                      <img className={`${styles.candidatePhoto} ${styles.candidateImg}`} src={c.image} alt="" />
                    ) : (
                      <span className={styles.candidatePhoto} aria-hidden="true" />
                    )}
                    <span className={styles.candidateParty}>
                      <PartySymbol src={hParty?.symbol} label={hParty?.symbolLabel} className={styles.candidateSymbol} />
                      <span className={styles.candidateName}>{c.name}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </RoomShell>
    );
  }

  if (page === 'historical') {
    const election = HISTORICAL_ELECTIONS.find((e) => e.year === historicalYear);
    const contested = election
      ? election.parties.map((id) => PARTIES.find((p) => p.id === id)!).filter(Boolean)
      : [];
    // Tiles in display order: each alliance as one group (lead party first),
    // then the parties that stood alone.
    const allied = new Set(election?.alliances?.flatMap((a) => a.parties) ?? []);
    const partyGroups: { alliance?: HistoricalAlliance; parties: typeof contested }[] = [
      ...(election?.alliances ?? []).map((a) => ({
        alliance: a,
        parties: a.parties.map((id) => PARTIES.find((p) => p.id === id)!).filter(Boolean)
      })),
      ...contested.filter((p) => !allied.has(p.id)).map((p) => ({ parties: [p] }))
    ];
    const pickedAlliance = historicalAllianceOf(historicalYear, historicalParty);
    return (
      <RoomShell variant="booth" onBack={() => setPage('pick')}>
        <div className={`${shellStyles.card} ${styles.card} ${styles.historyCard}`}>
          <h1 className={styles.heading}>Historical Elections</h1>
          <div className={styles.historyLayout}>
            <div className={styles.historyMenu} role="radiogroup" aria-label="Election">
              {HISTORICAL_ELECTIONS.map((e) => {
                const on = historicalYear === e.year;
                return (
                  <button
                    key={e.year}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`${styles.historyItem} ${on ? styles.historyItemOn : ''}`}
                    onClick={() => {
                      if (e.year !== historicalYear) {
                        setHistoricalParty(null);
                        setHistoricalCandidate(null);
                      }
                      setHistoricalYear(e.year);
                    }}
                  >
                    <span className={styles.historyYear}>{e.year}</span>
                    <span className={styles.historyAssembly}>{e.assembly}</span>
                  </button>
                );
              })}
            </div>
            <div className={`${styles.historyBox} ${election ? styles.historyBoxFilled : ''}`}>
              {!election ? (
                <p className={styles.historyEmpty}>Pick an election to see the parties that contested it.</p>
              ) : (
                <>
                  <h2 className={styles.historyBoxHeading}>Select Your Party</h2>
                  <div className={styles.historyParties} role="radiogroup" aria-label="Party">
                    {partyGroups.map((group) => {
                      const tiles = group.parties.map((party) => {
                        const on = historicalParty === party.id;
                        return (
                          <button
                            key={party.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            className={`${styles.slot} ${on ? styles.slotSelected : ''}`}
                            onClick={() => {
                              if (party.id !== historicalParty) setHistoricalCandidate(null);
                              setHistoricalParty(party.id);
                            }}
                            aria-label={party.name}
                            title={party.name}
                          >
                            <PartySymbol src={party.symbol} label={party.symbolLabel} className={styles.logo} />
                            <span className={styles.name}>{party.short}</span>
                          </button>
                        );
                      });
                      // Allies sit together in a labelled group.
                      return group.alliance ? (
                        <div key={group.alliance.name} className={styles.historyAlliance}>
                          <span className={styles.historyAllianceName}>{group.alliance.name}</span>
                          <div className={styles.historyAllianceTiles}>{tiles}</div>
                        </div>
                      ) : (
                        tiles
                      );
                    })}
                  </div>
                  {pickedAlliance && (
                    <p className={styles.historyAllyNote}>
                      Playing in the {pickedAlliance.name} with{' '}
                      {pickedAlliance.parties
                        .filter((id) => id !== historicalParty)
                        .map((id) => PARTIES.find((p) => p.id === id)?.short)
                        .join(', ')}
                      .
                    </p>
                  )}
                  {/* Next opens the next page once a party is picked. */}
                  {historicalParty ? (
                    <button
                      type="button"
                      className={`${styles.nextBtn} ${styles.historyNext}`}
                      onClick={() => {
                        setPage('historicalParty');
                        window.scrollTo(0, 0);
                      }}
                    >
                      Next →
                    </button>
                  ) : (
                    <p className={styles.nextHint}>Select your party to continue.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </RoomShell>
    );
  }

  // 1 vs Many and Alliance Mode: pick which of your own party's leaders you
  // play as. Start Game doesn't do anything yet.
  if (page === 'candidate' && selected) {
    const party = real
      ? { name: real.name, symbol: real.symbol, alt: `${real.symbolLabel ?? 'Party'} symbol`, custom: false }
      : { name: customName, symbol: customSymbol, alt: 'Your party symbol', custom: true };
    const partyColor = PARTY_COLORS[selected] ?? 'var(--ink)';
    // Alliance Mode: each partner's seat share, and what's left for you.
    const partnerList = PARTIES.filter((p) => partners.has(p.id)).map((p) => ({
      id: p.id,
      short: p.short,
      name: p.name,
      symbol: p.symbol,
      symbolLabel: p.symbolLabel,
      color: PARTY_COLORS[p.id] ?? 'var(--ink-muted)',
      seats: partnerSeats(p.id)
    }));
    const yourSeats = TOTAL_SEATS - partnerList.reduce((a, p) => a + p.seats, 0);
    // The parties you'd face under each opponent option.
    const rivals = PARTIES.filter((p) => p.id !== selected && !(mode === 'alliance' && partners.has(p.id)));
    const rivalNames = (list: typeof rivals) => list.map((p) => p.short).join(', ');
    const standardRivals = rivals.filter((p) => STANDARD_PARTIES.includes(p.id));
    const opponentText: Record<OpponentsId, string> = {
      standard: standardRivals.length
        ? `Face Delhi's main parties: ${rivalNames(standardRivals)}.`
        : 'All of Delhi’s main parties are on your side. Pick Play All to face the rest.',
      all: `Face every other party in the game: ${rivalNames(rivals)}.`
    };
    // 1 vs Many picks opponents by tick box instead (main parties ticked to
    // start); Play Standard / Play All just set the ticks, and stay lit while
    // the ticks match them.
    const oneVsMany = mode === 'one-vs-many';
    const tickedOpponents: ReadonlySet<PartyId> = new Set(
      [...(opponentTicks ?? STANDARD_PARTIES)].filter((id) => rivals.some((r) => r.id === id))
    );
    const sameSet = (list: typeof rivals) =>
      list.length === tickedOpponents.size && list.every((p) => tickedOpponents.has(p.id));
    const pickedOpponents: OpponentsId | null = oneVsMany
      ? sameSet(standardRivals) && standardRivals.length > 0
        ? 'standard'
        : sameSet(rivals)
          ? 'all'
          : null
      : opponents;
    const toggleOpponent = (id: PartyId) => {
      const next = new Set(tickedOpponents);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setOpponentTicks(next);
    };
    const activeOpponents = OPPONENT_OPTIONS.find((o) => o.id === pickedOpponents);
    // Your party, as a row in a seat's contest table.
    const youContest: ContestParty = {
      id: selected,
      short: real ? real.short : customName,
      name: party.name,
      symbol: party.symbol,
      symbolLabel: real?.symbolLabel,
      color: partyColor
    };
    // Which ally contests each seat on the map: seats given by hand first
    // (while that ally has seats left in its share), then the rest dealt
    // from the shuffled order, your party's share first, then each partner's.
    const side: (ContestParty & { seats: number })[] = [{ ...youContest, seats: yourSeats }, ...partnerList];
    const seatColors: Record<string, string> = {};
    const seatParty: Record<string, ContestParty> = {};
    {
      const left = new Map(side.map((p) => [p.id, p.seats]));
      for (const [acNo, id] of Object.entries(seatOverrides)) {
        const p = side.find((x) => x.id === id);
        if (p && (left.get(id) ?? 0) > 0) {
          seatParty[acNo] = p;
          left.set(id, (left.get(id) ?? 0) - 1);
        }
      }
      let i = 0;
      for (const acNo of seatOrder) {
        if (seatParty[acNo]) continue;
        while (i < side.length && (left.get(side[i].id) ?? 0) <= 0) i += 1;
        if (i >= side.length) break;
        seatParty[acNo] = side[i];
        left.set(side[i].id, (left.get(side[i].id) ?? 0) - 1);
      }
      Object.entries(seatParty).forEach(([acNo, p]) => (seatColors[acNo] = p.color));
    }
    // Hand a seat to another ally: one seat moves from the old ally's share
    // to the new one's, as long as the old one stays at or above the minimum.
    const seatsOf = (id: string) => side.find((p) => p.id === id)?.seats ?? 0;
    const canGive = (id: string) => seatsOf(id) - 1 >= MIN_PARTNER_SEATS;
    const moveSeat = (acNo: string, to: string) => {
      const from = seatParty[acNo]?.id;
      if (!from || from === to || !canGive(from)) return;
      setShares((cur) => {
        const next = { ...cur };
        if (from !== selected) next[from as PartyId] = partnerSeats(from as PartyId) - 1;
        if (to !== selected) next[to as PartyId] = partnerSeats(to as PartyId) + 1;
        return next;
      });
      setSeatOverrides((cur) => ({ ...cur, [acNo]: to as PartyId }));
    };
    // Everyone contesting the clicked seat: your side's candidate (your party,
    // or in Alliance Mode whichever ally the seat went to; in 1 vs Many only
    // if the seat is ticked), then the opponents picked, if any.
    const opponentParties: ContestParty[] = (
      oneVsMany
        ? rivals.filter((p) => tickedOpponents.has(p.id))
        : opponents === 'standard'
          ? standardRivals
          : opponents === 'all'
            ? rivals
            : []
    ).map((p) => ({
      id: p.id,
      short: p.short,
      name: p.name,
      symbol: p.symbol,
      symbolLabel: p.symbolLabel,
      color: PARTY_COLORS[p.id] ?? 'var(--ink-muted)'
    }));
    // Opponent alliances, keeping only parties still among the opponents
    // (the opponent option or your partners may have changed since).
    const opponentIds = new Set(opponentParties.map((p) => p.id));
    // None with Play Standard, which doesn't offer them.
    const validOpponentAlliances = (opponents === 'standard' ? [] : opponentAlliances)
      .map((a) => ({ ...a, members: a.members.filter((id) => opponentIds.has(id)) }))
      .filter((a) => a.members.length >= 2);
    const pickedSeatName = seats.find((st) => st.acNo === pickedSeat)?.name;
    // Your side's candidate in the clicked seat: in Alliance Mode the ally it
    // went to; in 1 vs Many your party, if the seat is ticked.
    const holder = pickedSeat
      ? mode === 'alliance'
        ? seatParty[pickedSeat]
        : tickedSeats.has(pickedSeat)
          ? youContest
          : undefined
      : undefined;
    const ownRows: ContestRow[] = holder ? [{ party: holder }] : [];
    // The clicked seat's table: just your side's candidate (opponents aren't
    // listed). An unticked 1 vs Many seat has no one yet.
    const seatContest =
      pickedSeat &&
      pickedSeatName &&
      (ownRows.length > 0 ? (
        <SeatContest
          seat={pickedSeatName}
          groups={[{ label: mode === 'alliance' ? 'Your alliance' : 'Your party', rows: ownRows }]}
        />
      ) : (
        <p className={styles.changeHint}>
          {pickedSeatName}: tick it in the district list to contest it.
        </p>
      ));
    // Alliance Mode, under the sliders: a "Change contestant party" dropdown
    // with a tick box per ally for the clicked seat. Ticking another ally
    // hands the seat over (not taking the current one below the minimum).
    const stuck = holder && !canGive(holder.id);
    const changeContestant = (
      <details className={styles.changeBox}>
        <summary className={styles.changeSummary}>Change contestant party</summary>
        <div className={styles.changeBody}>
          {!pickedSeat || !pickedSeatName ? (
            <p className={styles.changeHint}>Click a constituency on the map first.</p>
          ) : (
            <>
              <p className={styles.changeSeat}>{pickedSeatName}</p>
              <div className={styles.partnerGrid}>
                {side.map((p) => {
                  const on = p.id === holder?.id;
                  return (
                    <label
                      key={p.id}
                      className={`${styles.partnerRow} ${on ? styles.partnerRowOn : ''} ${stuck && !on ? styles.partnerRowOff : ''}`}
                      title={p.name}
                    >
                      <PartySymbol src={p.symbol ?? undefined} label={p.symbolLabel} className={styles.partnerSymbol} />
                      <span className={styles.partnerName}>{p.short}</span>
                      <input
                        type="checkbox"
                        className={styles.partnerTick}
                        checked={on}
                        disabled={stuck && !on}
                        onChange={() => moveSeat(pickedSeat, p.id)}
                        aria-label={`${p.name} contests ${pickedSeatName}`}
                      />
                    </label>
                  );
                })}
              </div>
              {stuck && (
                <p className={styles.changeHint}>
                  {holder.short} is at its minimum of {MIN_PARTNER_SEATS} seats, so this seat stays with it.
                </p>
              )}
            </>
          )}
        </div>
      </details>
    );
    // Next reveals the "Add Your Candidates" box. Start Game then appears at
    // the foot of the opponent column (and doesn't do anything yet).
    // Alliance Mode has no Next: Add Your Candidates shows as soon as a CM
    // candidate is picked and an ally ticked. 1 vs Many still uses Next.
    const seatsShown = mode === 'alliance' ? candidate !== null && partners.size > 0 : showSeats;
    const nextOrStart = !seatsShown && (
      <button type="button" className={`${styles.nextBtn} ${styles.startBtn}`} onClick={() => setShowSeats(true)}>
        Next →
      </button>
    );
    const startGame = seatsShown && (
      <button type="button" className={`${styles.nextBtn} ${styles.startBtn} ${styles.startGame}`}>
        Start Game
      </button>
    );
    return (
      // The header's back link returns to the party and mode picker.
      <RoomShell
        variant="booth"
        onBack={() => {
          setPage('pick');
          window.scrollTo(0, 0);
        }}
      >
        <div className={`${styles.column} ${styles.candidateColumn}`}>
          {/* The CM candidate picker, with Back / Start Game at its foot. In
              Alliance Mode the alliance partner picker sits beside it in a
              box of its own. */}
          <div className={mode === 'alliance' ? styles.pickerPair : styles.soloPicker}>
          <div className={`${shellStyles.card} ${styles.card} ${styles.candidateCard}`}>
            <div className={styles.cmSection}>
            <h1 className={`${styles.heading} ${styles.candidateHeading}`}>Select Your CM Candidate</h1>
            <p className={styles.candidateSub}>{party.name}</p>

            <div className={styles.lineup} role="radiogroup" aria-label="Candidate">
              {(CANDIDATES[selected] ?? PLACEHOLDER_CANDIDATES).map((c, i) => {
                const isSelected = candidate === i;
                return (
                  <div key={c.name} className={styles.lineupSlot}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={c.name}
                      className={`${styles.candidateBox} ${isSelected ? styles.candidateBoxSelected : ''}`}
                      onClick={() => setCandidate(i)}
                    >
                      {c.image ? (
                        <img className={`${styles.candidatePhoto} ${styles.candidateImg}`} src={c.image} alt="" />
                      ) : (
                        <span className={styles.candidatePhoto} aria-hidden="true" />
                      )}
                      <span className={styles.candidateParty}>
                        {party.symbol ? (
                          <img
                            className={`${styles.candidateSymbol} ${party.custom ? styles.customLogo : ''}`}
                            src={party.symbol}
                            alt={party.alt}
                          />
                        ) : party.custom ? (
                          <span className={`${styles.plus} ${styles.candidateSymbol}`} aria-hidden="true">
                            +
                          </span>
                        ) : (
                          <span
                            className={`${styles.candidateSymbol} ${styles.symbolPlaceholder}`}
                            aria-hidden="true"
                          />
                        )}
                        <span className={styles.candidateName}>{c.name}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            </div>

            {/* The hint until a candidate is picked, then (1 vs Many only) Next
                until it's pressed. Alliance Mode has no Next (see seatsShown).
                Going back is the header's back link. */}
            {(candidate === null || (mode !== 'alliance' && nextOrStart)) && (
              <div className={styles.cardFooter}>
                {candidate === null ? <p className={styles.nextHint}>Select a candidate to continue.</p> : nextOrStart}
              </div>
            )}
          </div>

          {/* Alliance Mode: pick partner parties from those you didn't
              choose to play as. Several can be picked. */}
          {mode === 'alliance' && (
            <div className={`${shellStyles.card} ${styles.card} ${styles.candidateCard}`}>
              <div className={styles.partnerSection}>
                <h2 className={`${styles.heading} ${styles.candidateHeading}`}>Select Your Alliance Partner</h2>
                <div className={styles.partnerGrid}>
                  {PARTIES.filter((p) => p.id !== selected).map((p) => {
                    const on = partners.has(p.id);
                    const full = !on && partners.size >= MAX_PARTNERS;
                    return (
                      <label
                        key={p.id}
                        className={`${styles.partnerRow} ${on ? styles.partnerRowOn : ''} ${full ? styles.partnerRowOff : ''}`}
                        title={p.name}
                      >
                        <PartySymbol src={p.symbol} label={p.symbolLabel} className={styles.partnerSymbol} />
                        <span className={styles.partnerName}>{p.short}</span>
                        <input
                          type="checkbox"
                          className={styles.partnerTick}
                          checked={on}
                          disabled={full}
                          onChange={() => togglePartner(p.id)}
                          aria-label={p.name}
                        />
                      </label>
                    );
                  })}
                </div>
                {partners.size >= MAX_PARTNERS && PARTIES.length - 1 > MAX_PARTNERS && (
                  <p className={styles.partnerLimit}>
                    Up to {MAX_PARTNERS} alliance partners: each must get at least {MIN_PARTNER_SHARE * 100}% of the seats.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Opponent selection, to the right of the alliance partner box (of
              the CM box in 1 vs Many) on wide screens, below them on narrower
              ones: two options, then the picked one's explainer. Shown from
              the start. Opponent Alliances sits right under it, as wide. */}
          <div className={styles.opponentStack}>
            <div
              className={`${shellStyles.card} ${styles.card} ${styles.modeCard} ${styles.opponentCard} ${activeOpponents ? '' : styles.modeCardCompact}`}
            >
              <h2 className={`${styles.heading} ${styles.candidateHeading}`}>Select Your Opponents</h2>
              <div className={styles.modeSplit}>
                <div className={styles.modes} role="radiogroup" aria-label="Opponents">
                  {OPPONENT_OPTIONS.map((o) => {
                    const isSelected = pickedOpponents === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={`${styles.modeBtn} ${isSelected ? styles.modeBtnSelected : ''}`}
                        onClick={() =>
                          oneVsMany
                            ? setOpponentTicks(new Set((o.id === 'standard' ? standardRivals : rivals).map((p) => p.id)))
                            : setOpponents(o.id)
                        }
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
                {activeOpponents && (
                  <div className={styles.modeRow}>
                    <div className={`${styles.modeInfo} ${styles.modeInfoShown}`} key={activeOpponents.id}>
                      <h3 className={styles.modeInfoTitle}>{activeOpponents.label}</h3>
                      <p className={styles.modeInfoTagline}>{activeOpponents.tagline}</p>
                      <p className={styles.modeInfoText}>{opponentText[activeOpponents.id]}</p>
                    </div>
                  </div>
                )}
              </div>
              {/* Play Standard: Start Game under the explainer (Alliance
                  Mode; 1 vs Many has it under the tick list). */}
              {!oneVsMany && opponents === 'standard' && startGame}
            </div>
            {/* 1 vs Many: tick which parties you face, main parties ticked to
                start. Start Game below once at least one is ticked. */}
            {oneVsMany && (
              <div className={`${shellStyles.card} ${styles.card} ${styles.allianceCard}`}>
                <h2 className={`${styles.heading} ${styles.candidateHeading}`}>Your Opponents</h2>
                <div className={styles.partnerGrid}>
                  {rivals.map((p) => {
                    const on = tickedOpponents.has(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`${styles.partnerRow} ${on ? styles.partnerRowOn : ''}`}
                        title={p.name}
                      >
                        <PartySymbol src={p.symbol} label={p.symbolLabel} className={styles.partnerSymbol} />
                        <span className={styles.partnerName}>{p.short}</span>
                        <input
                          type="checkbox"
                          className={styles.partnerTick}
                          checked={on}
                          onChange={() => toggleOpponent(p.id)}
                          aria-label={p.name}
                        />
                      </label>
                    );
                  })}
                </div>
                {tickedOpponents.size === 0 && <p className={styles.partnerLimit}>Tick at least one opponent.</p>}
                {tickedOpponents.size > 0 && startGame}
              </div>
            )}
            {/* Alliance Mode only, and not with Play Standard. Start Game
                sits below the alliances otherwise. */}
            {!oneVsMany && opponents !== 'standard' && (
              <div className={`${shellStyles.card} ${styles.card} ${styles.allianceCard}`}>
                <OpponentAlliances
                  parties={opponentParties}
                  alliances={validOpponentAlliances}
                  onChange={setOpponentAlliances}
                  hint={opponents ? undefined : 'Pick your opponents above first.'}
                />
                {/* Only once at least one opponent alliance is made. */}
                {validOpponentAlliances.length > 0 && startGame}
              </div>
            )}
          </div>

          {/* Shown once Next is pressed: a card split by a T into a titled
              top strip and two halves below: an arch diagram of the 70 seats
              on the left, and a mini map on the right. Under the arch, 1 vs
              Many has a district-by-district seat list (ticked seats show in
              the party's colour on the arch and map); Alliance Mode has
              seat-sharing sliders instead, shown on the arch. It sits in the
              same grid as the boxes above, under the CM candidate box. */}
          {seatsShown && (
          <div ref={seatsCardRef} className={`${shellStyles.card} ${styles.card} ${styles.modeCard} ${styles.tCard}`}>
            <div className={styles.tTop}>
              <h2 className={`${styles.heading} ${styles.tTitle}`}>Add Your Candidates</h2>
            </div>
            <div className={styles.tLeft}>
              {mode === 'alliance' ? (
                <>
                  <ParliamentArch
                    seats={TOTAL_SEATS}
                    label={String(TOTAL_SEATS)}
                    segments={[
                      { count: yourSeats, color: partyColor },
                      ...partnerList.map((p) => ({ count: p.seats, color: p.color }))
                    ]}
                  />
                  <SeatShare
                    total={TOTAL_SEATS}
                    min={MIN_PARTNER_SEATS}
                    minShare={MIN_PARTNER_SHARE}
                    you={{
                      id: selected,
                      short: real ? real.short : customName,
                      name: party.name,
                      symbol: party.symbol,
                      symbolLabel: real?.symbolLabel,
                      color: partyColor,
                      seats: yourSeats
                    }}
                    partners={partnerList}
                    onChange={(id, n) => setShare(id as PartyId, n)}
                  />
                  {changeContestant}
                </>
              ) : (
                <>
                  <ParliamentArch seats={TOTAL_SEATS} label={String(TOTAL_SEATS)} filled={tickedSeats.size} fillColor={partyColor} />
                  {seats.length > 0 && <DistrictList seats={seats} ticked={tickedSeats} onToggle={toggleSeat} onSetAll={setSeats} />}
                </>
              )}
            </div>
            <div className={styles.tRight}>
              {seats.length > 0 && (
                mode === 'alliance' ? (
                  <div className={styles.shareMap}>
                    <MiniSeatMap seats={seats} seatColors={seatColors} selected={pickedSeat} onSelect={setPickedSeat} />
                    <button type="button" className={styles.cardBack} onClick={() => {
                        setShuffles((n) => n + 1);
                        setSeatOverrides({});
                      }}>
                      🔀 Shuffle seats
                    </button>
                    {seatContest}
                  </div>
                ) : (
                  <div className={styles.shareMap}>
                    <MiniSeatMap
                      seats={seats}
                      highlighted={tickedSeats}
                      highlightColor={partyColor}
                      selected={pickedSeat}
                      onSelect={setPickedSeat}
                    />
                    {seatContest}
                  </div>
                )
              )}
            </div>
          </div>
          )}
          </div>
        </div>
      </RoomShell>
    );
  }

  return (
    <RoomShell variant="booth">
      <div className={`${styles.column} ${panelOpen ? styles.columnShifted : ''}`}>
        <div className={`${shellStyles.card} ${styles.card}`}>
          <h1 className={styles.heading}>Select Your Party</h1>
          <div ref={partyGridRef} className={styles.grid} role="radiogroup" aria-label="Party">
            {PARTIES.filter((party) => party.row === 1).map((party) => {
              const isSelected = selected === party.id;
              return (
                <button
                  key={party.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.slot} ${isSelected ? styles.slotSelected : ''}`}
                  onClick={() => pick(party.id)}
                  aria-label={party.name}
                  title={party.name}
                >
                  <PartySymbol src={party.symbol} label={party.symbolLabel} className={styles.logo} />
                  <span className={styles.name}>{party.short}</span>
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={selected === CUSTOM_PARTY.id}
              className={`${styles.slot} ${selected === CUSTOM_PARTY.id ? styles.slotSelected : ''}`}
              onClick={() => pick(CUSTOM_PARTY.id)}
            >
              {customSymbol ? (
                <img className={`${styles.logo} ${styles.customLogo}`} src={customSymbol} alt="Your party symbol" />
              ) : (
                <span className={styles.plus} aria-hidden="true">
                  +
                </span>
              )}
              <span className={styles.name}>{customName}</span>
            </button>
            {/* Second row starts after the Custom Party tile. */}
            <span className={styles.gridBreak} aria-hidden="true" />
            {PARTIES.filter((party) => party.row === 2).map((party) => {
              const isSelected = selected === party.id;
              return (
                <button
                  key={party.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.slot} ${isSelected ? styles.slotSelected : ''}`}
                  onClick={() => pick(party.id)}
                  aria-label={party.name}
                  title={party.name}
                >
                  <PartySymbol src={party.symbol} label={party.symbolLabel} className={styles.logo} />
                  <span className={styles.name}>{party.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Game modes, in their own card below the party card. Single choice;
            Next opens the chosen mode's page. */}
        {/* Until a mode is picked the card is only as wide as its buttons;
            picking one widens it to show the explainer beside them. */}
        <div className={`${shellStyles.card} ${styles.card} ${styles.modeCard} ${activeMode ? '' : styles.modeCardCompact}`}>
          <h2 className={styles.heading}>Select Mode</h2>
          {/* Mode buttons on the left; past a divider, the picked mode's
              explainer and Next on the right. */}
          <div className={styles.modeSplit}>
          <div className={styles.modes} role="radiogroup" aria-label="Game mode">
            {MODES.map((m) => {
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.modeBtn} ${isSelected ? styles.modeBtnSelected : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Explainer for the picked mode. */}
          {/* All three explainers share one grid cell so the box is always as
              tall as the longest one; only the picked mode's is visible. */}
          {activeMode && (
          <div className={styles.modeRow}>
            <div className={styles.modeInfoStack}>
              {MODES.map((m) => {
                const shown = m.id === activeMode.id;
                return (
                  <div
                    key={m.id}
                    className={`${styles.modeInfo} ${shown ? styles.modeInfoShown : ''}`}
                    aria-hidden={!shown}
                  >
                    <h3 className={styles.modeInfoTitle}>{m.label}</h3>
                    <p className={styles.modeInfoTagline}>{m.tagline}</p>
                    <p className={styles.modeInfoText}>{m.description}</p>
                  </div>
                );
              })}
            </div>

          {/* Next needs a mode, and a party too unless the mode is Historical
              Elections (which replays real parties, so none is picked).
              It opens the chosen mode's page. */}
          {mode && !canProceed && <p className={styles.nextHint}>Select your party above to continue.</p>}
          {canProceed && (
            <button type="button" className={styles.nextBtn} onClick={goNext}>
              Next →
            </button>
          )}
          </div>
          )}
          </div>
        </div>
      </div>

      {/* Party details: a small floating card that slides in on the right.
          Stays mounted so it can animate out. */}
      <aside
        ref={panelRef}
        className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}
        aria-hidden={!panelOpen}
        aria-label={detail ? `${detail.name} details` : undefined}
      >
        {detail && (
          <>
            <button
              type="button"
              className={styles.panelClose}
              onClick={() => setPanelOpen(false)}
              aria-label="Close"
              tabIndex={panelOpen ? 0 : -1}
            >
              ×
            </button>
            {real ? (
              <PartySymbol src={real.symbol} label={real.symbolLabel} className={styles.panelLogo} />
            ) : (
              // Custom Party: the plus (or the uploaded symbol) opens the
              // file picker / photo gallery.
              <label className={styles.uploadSymbol}>
                {customSymbol ? (
                  <img
                    className={`${styles.panelLogo} ${styles.customLogo}`}
                    src={customSymbol}
                    alt="Your party symbol"
                  />
                ) : (
                  <span className={`${styles.plus} ${styles.panelPlus}`} aria-hidden="true">
                    +
                  </span>
                )}
                <span className={styles.uploadHint}>{customSymbol ? 'Change symbol' : 'Upload symbol'}</span>
                <input
                  className={styles.fileInput}
                  type="file"
                  accept="image/*"
                  tabIndex={panelOpen ? 0 : -1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onCustomSymbolFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            {selected !== CUSTOM_PARTY.id ? (
              <h2 className={styles.panelName}>{detail.name}</h2>
            ) : editingName ? (
              <form
                className={styles.nameEdit}
                onSubmit={(e) => {
                  e.preventDefault();
                  saveName();
                }}
              >
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={finishEditingName}
                  onKeyDown={(e) => {
                    // Escape cancels the edit rather than closing the card.
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setEditingName(false);
                    }
                  }}
                  maxLength={40}
                  aria-label="Party name"
                  aria-invalid={nameBlocked}
                  aria-describedby={nameBlocked ? 'custom-name-error' : undefined}
                  className={`${styles.nameInput} ${nameBlocked ? styles.nameInputError : ''}`}
                  autoFocus
                />
                {nameBlocked && (
                  <p id="custom-name-error" className={styles.nameError} role="alert">
                    {PROFANITY_MESSAGE}
                  </p>
                )}
              </form>
            ) : (
              <div className={styles.nameRow}>
                <h2 className={styles.panelName}>{customName}</h2>
                <button
                  type="button"
                  className={styles.penBtn}
                  onClick={startEditingName}
                  aria-label="Edit party name"
                  tabIndex={panelOpen ? 0 : -1}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
            <dl className={styles.stats}>
              {detail.stats.map((row) => {
                // Custom Party's ideologies are chosen by the player.
                if (selected === CUSTOM_PARTY.id && row.label === 'Ideologies') {
                  return (
                    <div key={row.label} className={`${styles.statRow} ${styles.statRowWrap}`}>
                      <dt>{row.label}</dt>
                      <dd className={styles.chips}>
                        <button
                          type="button"
                          className={`${styles.chip} ${styles.chipButton}`}
                          aria-expanded={ideologyPickerOpen}
                          aria-controls="ideology-picker"
                          tabIndex={panelOpen ? 0 : -1}
                          onClick={() => setIdeologyPickerOpen((o) => !o)}
                        >
                          {customIdeologies.length ? customIdeologies.join(', ') : 'Your choice'}
                          <span aria-hidden="true">{ideologyPickerOpen ? ' ▴' : ' ▾'}</span>
                        </button>
                      </dd>
                      {ideologyPickerOpen && (
                        <div id="ideology-picker" className={styles.ideologyPicker}>
                          <p className={styles.ideologyHint}>
                            Pick up to {MAX_IDEOLOGIES} ({customIdeologies.length}/{MAX_IDEOLOGIES})
                          </p>
                          {IDEOLOGY_GROUPS.map((group) => (
                            <div key={group.label} className={styles.ideologyGroup}>
                              <p className={styles.ideologyGroupLabel}>{group.label}</p>
                              <div className={styles.ideologyOptions}>
                                {group.options.map((idea) => {
                                  const on = customIdeologies.includes(idea);
                                  const full = !on && customIdeologies.length >= MAX_IDEOLOGIES;
                                  return (
                                    <button
                                      key={idea}
                                      type="button"
                                      aria-pressed={on}
                                      disabled={full}
                                      className={`${styles.ideologyOption} ${on ? styles.ideologyOptionOn : ''}`}
                                      onClick={() => toggleIdeology(idea)}
                                    >
                                      {idea}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          {/* Confirms the picks and folds the list away. */}
                          {customIdeologies.length > 0 && (
                            <button
                              type="button"
                              className={styles.ideologyOk}
                              onClick={() => setIdeologyPickerOpen(false)}
                            >
                              OK
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={row.label} className={styles.statRow}>
                    <dt>{row.label}</dt>
                    {typeof row.value === 'string' ? (
                      <dd>{row.value}</dd>
                    ) : (
                      <dd className={styles.chips}>
                        {row.value.map((v) => (
                          <span key={v} className={styles.chip}>
                            {v}
                          </span>
                        ))}
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
          </>
        )}
      </aside>
    </RoomShell>
  );
}
