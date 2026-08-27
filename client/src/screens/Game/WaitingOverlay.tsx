import { useGame } from '../../state/GameProvider';
import styles from './WaitingOverlay.module.css';

export default function WaitingOverlay() {
  const { state } = useGame();
  const room = state.room!;
  const players = Object.values(room.players);
  const notReadyLabel = players.filter((p) => !p.ready).map((p) => p.partyName).join(', ') + ' still deciding';

  return (
    <div className={styles.overlay}>
      <div className={styles.spinner} />
      <div className={styles.title}>Waiting for other campaigns…</div>
      <div className={styles.subtitle}>{notReadyLabel}</div>
    </div>
  );
}
