import aapSymbol from '../assets/parties/aap.png';
import bjpSymbol from '../assets/parties/bjp.png';
import incSymbol from '../assets/parties/inc.png';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

// Each party's election symbol (square, transparent-background PNGs).
const PARTIES = [
  { id: 'bjp', name: 'BJP', symbol: bjpSymbol, symbolLabel: 'Lotus' },
  { id: 'aap', name: 'Aam Aadmi Party', symbol: aapSymbol, symbolLabel: 'Broom' },
  { id: 'inc', name: 'Indian National Congress', symbol: incSymbol, symbolLabel: 'Hand' }
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
              <img className={styles.logo} src={party.symbol} alt={`${party.symbolLabel} symbol`} />
              <span className={styles.name}>{party.name}</span>
            </div>
          ))}
        </div>
      </div>
    </RoomShell>
  );
}
