import { useGame } from '../../state/GameProvider';
import styles from './BottomBar.module.css';

export default function BottomBar() {
  const { state, getMe, getRemaining, submitTurn } = useGame();
  const room = state.room!;
  const me = getMe();
  const players = Object.values(room.players);
  const scoreboard = players.slice().sort((a, b) => b.seatsWon - a.seatsWon);
  // `ready` only flips once the server has accepted the submission, so the
  // in-flight flag covers the window in between — otherwise a second click
  // lands before the first response comes back.
  const locked = !!(me && me.ready) || state.busy;

  return (
    <div className={styles.bar}>
      <div className={styles.scoreboard}>
        {scoreboard.map((p) => {
          const readyTag = room.phase === 'playing' ? (p.ready ? ' · ready' : ' · deciding') : '';
          return (
            <div
              className={styles.chip}
              key={p.id}
              style={{ borderColor: p.color, background: p.id === state.myPlayerId ? 'var(--bg)' : 'white' }}
            >
              {p.symbol && <div className={styles.chipSymbol} style={{ backgroundImage: `url(${p.symbol})` }} />}
              <div>
                <div className={styles.chipParty}>{p.partyName}</div>
                <div className={styles.chipStatus}>
                  {p.seatsWon} seats{readyTag}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.budget}>
        <div className={styles.budgetLabel}>MY BUDGET THIS TURN</div>
        <div className={styles.budgetValue}>₹{getRemaining()}K left</div>
      </div>

      <button
        className={styles.submitBtn}
        disabled={locked}
        onClick={submitTurn}
        style={{ background: locked ? 'var(--disabled)' : 'var(--navy)' }}
      >
        {me && me.ready ? 'Submitted' : state.busy ? 'Submitting…' : 'Submit Turn'}
      </button>
    </div>
  );
}
