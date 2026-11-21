import { useState } from 'react';
import aapSymbol from '../assets/parties/aap.png';
import bjpSymbol from '../assets/parties/bjp.png';
import incSymbol from '../assets/parties/inc.png';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

// Each party's election symbol (square, transparent-background PNGs).
const PARTIES = [
  { id: 'bjp', name: 'Bharatiya Janata Party', symbol: bjpSymbol, symbolLabel: 'Lotus' },
  { id: 'aap', name: 'Aam Aadmi Party', symbol: aapSymbol, symbolLabel: 'Broom' },
  { id: 'inc', name: 'Indian National Congress', symbol: incSymbol, symbolLabel: 'Hand' }
] as const;

type PartyId = (typeof PARTIES)[number]['id'];

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
                  onClick={() => setSelected(party.id)}
                >
                  <img className={styles.logo} src={party.symbol} alt={`${party.symbolLabel} symbol`} />
                  <span className={styles.name}>{party.name}</span>
                </button>
              );
            })}
          </div>

          {/* Appears once a party is picked. What it leads to is still to come. */}
          {selected && (
            <button type="button" className={styles.nextBtn}>
              Next →
            </button>
          )}
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
        </div>
      </div>
    </RoomShell>
  );
}
