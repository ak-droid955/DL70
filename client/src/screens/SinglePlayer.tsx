import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

const SLOT_COUNT = 6;

/** Single-player entry page. Six empty slots for now; content to come. */
export default function SinglePlayer() {
  return (
    <RoomShell variant="stage">
      <div className={`${shellStyles.card} ${styles.card}`}>
        <div className={styles.grid}>
          {Array.from({ length: SLOT_COUNT }, (_, i) => (
            <div key={i} className={styles.slot} />
          ))}
        </div>
      </div>
    </RoomShell>
  );
}
