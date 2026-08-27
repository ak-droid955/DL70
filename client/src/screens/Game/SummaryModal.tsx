import type { TurnLogEntry } from '../../lib/types';
import { useGame } from '../../state/GameProvider';
import styles from './SummaryModal.module.css';

export default function SummaryModal({ lastLog }: { lastLog: TurnLogEntry }) {
  const { state, dismissSummary } = useGame();
  const room = state.room!;
  const players = Object.values(room.players);

  const summaryButtonLabel = lastLog.turn >= room.maxTurns ? 'See Final Results' : `Continue to Turn ${lastLog.turn + 1}`;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.heading}>End of Turn {lastLog.turn}</div>
        <div className={styles.rows}>
          {players.map((p) => {
            const evs = lastLog.events.filter((e) => e.playerId === p.id);
            const locks = evs.filter((e) => e.type === 'lock' || e.type === 'forced_lock').map((e) => (e as any).seatName);
            const newLeaderships = evs.filter((e) => e.type === 'vote_bank_leader_change').map((e) => (e as any).voteBankName);
            const bonuses = evs.filter((e) => e.type === 'vote_bank_bonus') as Extract<
              TurnLogEntry['events'][number],
              { type: 'vote_bank_bonus' }
            >[];
            const conflicts = evs.filter((e) => e.type === 'conflict');
            const spent = lastLog.perPlayerSpend[p.id] || 0;
            const nothing = !locks.length && !newLeaderships.length && !bonuses.length && !conflicts.length;

            return (
              <div className={styles.row} key={p.id}>
                <div className={styles.rowTop}>
                  <div className={styles.dot} style={{ background: p.color }} />
                  <div className={styles.partyName}>{p.partyName}</div>
                  <div className={styles.spent}>spent ₹{spent}K</div>
                </div>
                {locks.length > 0 && <div className={styles.line}>Won: {locks.join(', ')}</div>}
                {newLeaderships.length > 0 && (
                  <div className={`${styles.line} ${styles.groups}`}>Took over Vote Bank lead: {newLeaderships.join(', ')}</div>
                )}
                {bonuses.length > 0 && (
                  <div className={`${styles.line} ${styles.groups}`}>
                    Vote Bank bonus: {bonuses.map((b) => `${b.voteBankName} +₹${b.amount}K`).join(', ')}
                  </div>
                )}
                {conflicts.length > 0 && (
                  <div className={`${styles.line} ${styles.conflict}`}>Paid contest fees in {conflicts.length} seat(s)</div>
                )}
                {nothing && <div className={`${styles.line} ${styles.nothing}`}>No seats or Vote Banks gained this turn</div>}
              </div>
            );
          })}
        </div>
        <button className={styles.continueBtn} onClick={dismissSummary}>
          {summaryButtonLabel}
        </button>
      </div>
    </div>
  );
}
