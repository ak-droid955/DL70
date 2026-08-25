import { useGame } from '../state/GameProvider';
import styles from './Landing.module.css';

export default function Landing() {
  const { state, goCreate, goJoin, onJoinCodeChange } = useGame();

  return (
    <div className={styles.screen}>
      <div className={styles.title}>Vidhan Sabha Showdown</div>
      <div className={styles.subtitle}>
        A blind-bidding campaign game across all 70 Delhi assembly seats. 2–5 players, each from their own device — every
        player is a separate party's campaign HQ.
      </div>
      <div className={styles.actions}>
        <button className={styles.createBtn} onClick={goCreate}>
          Create Room
        </button>
        <div className={styles.joinRow}>
          <input
            className={styles.codeInput}
            value={state.joinCodeInput}
            onChange={(e) => onJoinCodeChange(e.target.value)}
            placeholder="ROOM CODE"
            maxLength={4}
          />
          <button className={styles.joinBtn} onClick={goJoin}>
            Join Room
          </button>
        </div>
      </div>
      {state.error && <div className={styles.error}>{state.error}</div>}
    </div>
  );
}
