import { useGame } from '../../state/GameProvider';
import styles from './WaitingOverlay.module.css';

export default function WaitingOverlay() {
  const { state } = useGame();
  const room = state.room!;
  const players = Object.values(room.players);
  // Between the last player submitting and the resolved turn arriving over
  // Realtime there is nobody left to name, and " still deciding" on its own
  // reads as a bug.
  const notReady = players.filter((p) => !p.ready).map((p) => p.partyName);
  const notReadyLabel = notReady.length ? `${notReady.join(', ')} still deciding` : 'Resolving the turn…';

  return (
    <div className={styles.overlay}>
      <div className={styles.spinner} />
      <div className={styles.title}>Waiting for other campaigns…</div>
      <div className={styles.subtitle}>{notReadyLabel}</div>
    </div>
  );
}
