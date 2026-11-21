import { useEffect, useState } from 'react';
import aapSymbol from '../assets/parties/aap.png';
import bjpSymbol from '../assets/parties/bjp.png';
import incSymbol from '../assets/parties/inc.png';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

// One row in the party details card. An array value renders as chips.
type StatRow = { label: string; value: string | readonly string[] };

// Each party's election symbol (square, transparent-background PNGs) and the
// stats shown in the floating details card when the party is picked. Vote
// share is from the 2025 Delhi assembly election.
const PARTIES: readonly {
  id: 'bjp' | 'aap' | 'inc';
  name: string;
  symbol: string;
  symbolLabel: string;
  stats: readonly StatRow[];
}[] = [
  {
    id: 'bjp',
    name: 'Bharatiya Janata Party',
    symbol: bjpSymbol,
    symbolLabel: 'Lotus',
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
    symbol: aapSymbol,
    symbolLabel: 'Broom',
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
    symbol: incSymbol,
    symbolLabel: 'Hand',
    stats: [
      { label: 'Last election', value: '6.3%' },
      { label: 'Ideologies', value: ['Secularism', 'Social liberalism'] },
      { label: 'Founders', value: ['A. O. Hume', 'Dadabhai Naoroji'] },
      { label: 'Delhi CMs', value: ['Sheila Dikshit'] },
      { label: 'Jurisdiction', value: 'National' },
      { label: 'Founded', value: '1885' }
    ]
  }
];

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

type PartyId = (typeof PARTIES)[number]['id'] | typeof CUSTOM_PARTY.id;

const MODES = [
  { id: 'one-vs-many', label: '1 vs Many' },
  { id: 'alliance', label: 'Alliance Mode' },
  { id: 'historical', label: 'Historical Elections' }
] as const;

type ModeId = (typeof MODES)[number]['id'];

/** Single-player entry page: pick the party you will play as, and a mode. */
export default function SinglePlayer() {
  const [selected, setSelected] = useState<PartyId | null>(null);
  const [mode, setMode] = useState<ModeId | null>(null);
  // The side panel opens on every party click and can be closed without
  // clearing the selection.
  const [panelOpen, setPanelOpen] = useState(false);

  const pick = (id: PartyId) => {
    setSelected(id);
    setPanelOpen(true);
  };

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const real = PARTIES.find((p) => p.id === selected);
  const detail = selected === CUSTOM_PARTY.id ? CUSTOM_PARTY : real;

  return (
    <RoomShell variant="stage">
      <div className={`${styles.column} ${panelOpen ? styles.columnShifted : ''}`}>
        <div className={`${shellStyles.card} ${styles.card}`}>
          <h1 className={styles.heading}>Select Your Party</h1>
          <div className={styles.grid} role="radiogroup" aria-label="Party">
            {PARTIES.map((party) => {
              const isSelected = selected === party.id;
              return (
                <button
                  key={party.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.slot} ${isSelected ? styles.slotSelected : ''}`}
                  onClick={() => pick(party.id)}
                >
                  <img className={styles.logo} src={party.symbol} alt={`${party.symbolLabel} symbol`} />
                  <span className={styles.name}>{party.name}</span>
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
              <span className={styles.plus} aria-hidden="true">
                +
              </span>
              <span className={styles.name}>{CUSTOM_PARTY.name}</span>
            </button>
          </div>
        </div>

        {/* Game modes, in their own card below the party card. Single choice;
            nothing acts on the chosen mode yet. */}
        <div className={`${shellStyles.card} ${styles.card} ${styles.modeCard}`}>
          <h2 className={styles.heading}>Select Mode</h2>
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

          {/* Appears once a mode is picked. What it leads to is still to come. */}
          {mode && (
            <button type="button" className={styles.nextBtn}>
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Party details: a small floating card that slides in on the right.
          Stays mounted so it can animate out. */}
      <aside
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
              <img className={styles.panelLogo} src={real.symbol} alt={`${real.symbolLabel} symbol`} />
            ) : (
              <span className={`${styles.plus} ${styles.panelPlus}`} aria-hidden="true">
                +
              </span>
            )}
            <h2 className={styles.panelName}>{detail.name}</h2>
            <dl className={styles.stats}>
              {detail.stats.map((row) => (
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
              ))}
            </dl>
          </>
        )}
      </aside>
    </RoomShell>
  );
}
