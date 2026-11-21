import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

const SLOT_COUNT = 6;

/** Single-player entry page. A party picker with six empty slots for now; content to come. */
export default function SinglePlayer() {
  return (
    <RoomShell variant="stage">
      <div className={`${shellStyles.card} ${styles.card}`}>
        <h1 className={styles.heading}>Select Your Party</h1>
        <div className={styles.grid}>
          {Array.from({ length: SLOT_COUNT }, (_, i) => (
            <div key={i} className={styles.slot} />
          ))}
        </div>
      </div>
    </RoomShell>
  );
}
