import RoomShell, { shellStyles } from './RoomShell';
import styles from './SinglePlayer.module.css';

/** Single-player entry page. Deliberately blank for now; content to come. */
export default function SinglePlayer() {
  return (
    <RoomShell variant="stage">
      <div className={`${shellStyles.card} ${styles.card}`} />
    </RoomShell>
  );
}
