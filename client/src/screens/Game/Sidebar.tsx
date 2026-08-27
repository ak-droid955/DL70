import { VOTE_BANKS } from '../../lib/types';
import { useGame } from '../../state/GameProvider';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { state } = useGame();
  const room = state.room!;

  return (
    <div className={styles.sidebar}>
      <div className={styles.heading}>Vote Banks</div>
      <div className={styles.list}>
        {VOTE_BANKS.map((bank) => {
          const influence = room.voteBankInfluence[bank.id] || {};
          const leaderId = room.voteBankLeaders[bank.id];
          const leader = leaderId ? room.players[leaderId] : null;
          const myInfluence = state.myPlayerId ? influence[state.myPlayerId] || 0 : 0;
          const maxInfluence = Math.max(1, ...Object.values(influence));
          const pct = Math.min(100, Math.round((myInfluence / maxInfluence) * 100));
          const isMine = !!leaderId && leaderId === state.myPlayerId;
          const barColor = leader ? leader.color : 'var(--orange)';

          return (
            <div className={styles.card} key={bank.id}>
              <div className={styles.cardTop}>
                <div className={styles.name}>{bank.name}</div>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ background: barColor, width: `${pct}%` }} />
              </div>
              <div className={styles.leaderTag} style={{ color: barColor }}>
                {leader ? `${leader.partyName}${isMine ? ' (you)' : ''} leads` : 'Uncontested'}
              </div>
              <div className={styles.yourInfluence}>Your influence: {Math.round(myInfluence)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
