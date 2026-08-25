import { useGame } from '../../state/GameProvider';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { state, getMe, addGroupSpend, clearGroupDraft } = useGame();
  const room = state.room!;
  const me = getMe();

  return (
    <div className={styles.sidebar}>
      <div className={styles.heading}>Interest Groups</div>
      <div className={styles.list}>
        {room.groups.map((g) => {
          const total = Object.values(g.progress || {}).reduce((a, b) => a + b, 0) + (state.draftGroupSpends[g.id] || 0);
          const pct = Math.min(100, Math.round((total / g.ask) * 100));
          const claimedPlayer = g.claimedBy ? room.players[g.claimedBy] : null;
          const barColor = claimedPlayer ? claimedPlayer.color : 'var(--orange)';
          const canContribute = !g.claimedBy && room.phase === 'playing' && !(me && me.ready);
          const hasDraft = !!state.draftGroupSpends[g.id];

          return (
            <div className={styles.card} key={g.id}>
              <div className={styles.cardTop}>
                <div className={styles.name}>{g.name}</div>
                <div className={styles.ask}>₹{g.ask}K</div>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ background: barColor, width: `${pct}%` }} />
              </div>
              {claimedPlayer && (
                <div className={styles.claimedTag} style={{ color: barColor }}>
                  Won by {claimedPlayer.partyName}
                </div>
              )}
              {canContribute && (
                <div className={styles.contributeRow}>
                  <button className={styles.contributeBtn} onClick={() => addGroupSpend(g.id, 10)}>
                    +10K
                  </button>
                  <button className={styles.contributeBtn} onClick={() => addGroupSpend(g.id, 25)}>
                    +25K
                  </button>
                  {hasDraft && (
                    <button className={styles.clearBtn} onClick={() => clearGroupDraft(g.id)}>
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
