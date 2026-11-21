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

/** Single-player entry page: pick the party you will play as. */
export default function SinglePlayer() {
  const [selected, setSelected] = useState<PartyId | null>(null);

  return (
    <RoomShell variant="stage">
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
    </RoomShell>
  );
}
