import { useEffect, useState } from 'react';
import aapSymbol from '../assets/parties/aap.png';
import bjpSymbol from '../assets/parties/bjp.png';
import incSymbol from '../assets/parties/inc.png';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

// Each party's election symbol (square, transparent-background PNGs) and a
// short history shown in the side panel when the party is picked.
const PARTIES = [
  {
    id: 'bjp',
    name: 'Bharatiya Janata Party',
    symbol: bjpSymbol,
    symbolLabel: 'Lotus',
    history: [
      'Founded on 6 April 1980 as the successor to the Bharatiya Jana Sangh (1951), with Atal Bihari Vajpayee as its first president.',
      'It led national governments under Vajpayee from 1998 to 2004, and under Narendra Modi from 2014.',
      'In Delhi it won the first assembly election in 1993, then spent 27 years in opposition before winning 48 of 70 seats in 2025.'
    ]
  },
  {
    id: 'aap',
    name: 'Aam Aadmi Party',
    symbol: aapSymbol,
    symbolLabel: 'Broom',
    history: [
      'Founded on 26 November 2012 by Arvind Kejriwal and fellow activists from the India Against Corruption movement.',
      'It formed a short-lived government in Delhi after the 2013 election, then swept the assembly with 67 of 70 seats in 2015 and 62 in 2020.',
      'It also won Punjab in 2022 and became a recognised national party in 2023, before losing Delhi in 2025 with 22 seats.'
    ]
  },
  {
    id: 'inc',
    name: 'Indian National Congress',
    symbol: incSymbol,
    symbolLabel: 'Hand',
    history: [
      'Founded in 1885 in Bombay, it led the independence movement and governed India for most of the decades after 1947.',
      'In Delhi, Sheila Dikshit led it to three straight wins and served as Chief Minister from 1998 to 2013.',
      'It has not won a seat in the Delhi assembly in the 2015, 2020 or 2025 elections.'
    ]
  }
] as const;

// Build-your-own option, shown after the real parties with a plus mark.
const CUSTOM_PARTY = {
  id: 'custom',
  name: 'Custom Party',
  history: [
    'Start a party of your own: no legacy, no baggage, no vote bank yet.',
    'You choose the name, symbol and colour, and build support seat by seat.'
  ]
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
      <div className={styles.column}>
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

      {/* Party details, sliding in from the right. Stays mounted so it can
          animate out; the backdrop closes it on click. */}
      <div
        className={`${styles.backdrop} ${panelOpen ? styles.backdropOpen : ''}`}
        onClick={() => setPanelOpen(false)}
        aria-hidden="true"
      />
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
            <div className={styles.panelHistory}>
              {detail.history.map((para) => (
                <p key={para}>{para}</p>
              ))}
            </div>
          </>
        )}
      </aside>
    </RoomShell>
  );
}
