import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

// Each party's election symbol, shown as an emoji until real logo artwork
// is added.
const PARTIES = [
  { id: 'bjp', name: 'BJP', symbol: '🪷', symbolLabel: 'Lotus' },
  { id: 'aap', name: 'Aam Aadmi Party', symbol: '🧹', symbolLabel: 'Broom' },
  { id: 'inc', name: 'Indian National Congress', symbol: '✋', symbolLabel: 'Hand' }
] as const;

/** Single-player entry page: pick the party you will play as. */
export default function SinglePlayer() {
  return (
    <RoomShell variant="stage">
      <div className={`${shellStyles.card} ${styles.card}`}>
        <h1 className={styles.heading}>Select Your Party</h1>
        <div className={styles.grid}>
          {PARTIES.map((party) => (
            <div key={party.id} className={styles.slot}>
              <span className={styles.logo} role="img" aria-label={`${party.symbolLabel} symbol`}>
                {party.symbol}
              </span>
              <span className={styles.name}>{party.name}</span>
            </div>
          ))}
        </div>
      </div>
    </RoomShell>
  );
}
