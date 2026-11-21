import { useEffect, useState } from 'react';
import aapSymbol from '../assets/parties/aap.png';
import bjpSymbol from '../assets/parties/bjp.png';
import incSymbol from '../assets/parties/inc.png';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

// Each party's election symbol (square, transparent-background PNGs) and the
// stats shown in the floating details card when the party is picked. Vote
// share is from the 2025 Delhi assembly election.
const PARTIES = [
  {
    id: 'bjp',
    name: 'Bharatiya Janata Party',
    symbol: bjpSymbol,
    symbolLabel: 'Lotus',
    stats: {
      lastElection: '45.6%',
      ideologies: ['Hindu nationalism', 'Conservatism'],
      jurisdiction: 'National',
      founded: '1980'
    }
  },
  {
    id: 'aap',
    name: 'Aam Aadmi Party',
    symbol: aapSymbol,
    symbolLabel: 'Broom',
    stats: {
      lastElection: '43.6%',
      ideologies: ['Populism', 'Anti-corruption'],
      jurisdiction: 'National',
      founded: '2012'
    }
  },
  {
    id: 'inc',
    name: 'Indian National Congress',
    symbol: incSymbol,
    symbolLabel: 'Hand',
    stats: {
      lastElection: '6.3%',
      ideologies: ['Secularism', 'Social liberalism'],
      jurisdiction: 'National',
      founded: '1885'
    }
  }
] as const;

// Build-your-own option, shown after the real parties with a plus mark.
const CUSTOM_PARTY = {
  id: 'custom',
  name: 'Custom Party',
  stats: {
    lastElection: '—',
    ideologies: ['Your choice'],
    jurisdiction: 'Delhi',
    founded: 'Today'
  }
} as const;

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
              <div className={styles.statRow}>
                <dt>Last election</dt>
                <dd>{detail.stats.lastElection}</dd>
              </div>
              <div className={styles.statRow}>
                <dt>Ideologies</dt>
                <dd className={styles.chips}>
                  {detail.stats.ideologies.map((i) => (
                    <span key={i} className={styles.chip}>
                      {i}
                    </span>
                  ))}
                </dd>
              </div>
              <div className={styles.statRow}>
                <dt>Jurisdiction</dt>
                <dd>{detail.stats.jurisdiction}</dd>
              </div>
              <div className={styles.statRow}>
                <dt>Founded</dt>
                <dd>{detail.stats.founded}</dd>
              </div>
            </dl>
          </>
        )}
      </aside>
    </RoomShell>
  );
}
