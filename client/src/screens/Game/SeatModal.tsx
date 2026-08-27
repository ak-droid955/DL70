import { FIRST_ENTRY_MAX_RUNGS, TOTAL_RUNGS, VOTE_BANKS } from '../../lib/types';
import { useGame } from '../../state/GameProvider';
import styles from './SeatModal.module.css';

const VOTE_BANK_NAME_BY_ID = Object.fromEntries(VOTE_BANKS.map((b) => [b.id, b.name]));

export default function SeatModal() {
  const { state, getMe, getRemaining, closeSeat, addSeatSpend, clearSeatDraft } = useGame();
  const room = state.room!;
  const me = getMe();
  const seat = state.selectedSeatAcNo ? room.seats[state.selectedSeatAcNo] : null;
  if (!seat) return null;
  const staticSeat = state.staticSeats?.[seat.acNo];
  const perRung = staticSeat?.maxPerRung ?? 75;

  const players = Object.values(room.players);
  const rows = players
    .map((p) => {
      const committed = seat.progress[p.id] || 0;
      const pending = p.id === state.myPlayerId ? state.draftSeatSpends[seat.acNo] || 0 : 0;
      const total = committed + pending;
      const rungs = Math.min(TOTAL_RUNGS, Math.floor(total / perRung));
      return {
        partyName: p.partyName,
        color: p.color,
        rungs,
        mineTag: p.id === state.myPlayerId ? ' (you)' : '',
        pct: Math.round((rungs / TOTAL_RUNGS) * 100)
      };
    })
    .sort((a, b) => b.rungs - a.rungs);

  // Rung caps for the current player in this seat.
  const myCommitted = me ? seat.progress[me.id] || 0 : 0;
  const myPending = state.draftSeatSpends[seat.acNo] || 0;
  const myCommittedRungs = Math.floor(myCommitted / perRung);
  const myDraftRungs = Math.floor(myPending / perRung);
  const firstEntry = myCommitted <= 0;
  const maxAddThisTurn = firstEntry ? FIRST_ENTRY_MAX_RUNGS : TOTAL_RUNGS - myCommittedRungs;
  const atTop = myCommittedRungs + myDraftRungs >= TOTAL_RUNGS;
  const canAffordRung = getRemaining() >= perRung;
  const canAddRung = myDraftRungs < maxAddThisTurn && !atTop && canAffordRung;

  const lockedPlayer = seat.locked && seat.locked !== 'INDEPENDENT' ? room.players[seat.locked] : null;
  const lockedLabel =
    seat.locked === 'INDEPENDENT'
      ? 'No campaign contested this seat — stays independent'
      : lockedPlayer
        ? `${lockedPlayer.partyName} has won this seat`
        : null;
  const lockedColor = lockedPlayer ? lockedPlayer.color : 'var(--text-muted)';
  const editable = !seat.locked && room.phase === 'playing' && !(me && me.ready);
  const hasDraft = !!state.draftSeatSpends[seat.acNo];

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <div className={styles.seatName}>{seat.name}</div>
            <div className={styles.seatSub}>
              Seat {seat.acNo} of 70 · {seat.pcName}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={closeSeat}>
            ✕
          </button>
        </div>

        <div className={styles.stats}>
          <div>
            <div className={styles.statLabel}>ELECTORS (EST.)</div>
            <div className={styles.statValue}>{seat.electors.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div className={styles.statLabel}>₹ PER RUNG</div>
            <div className={styles.statValue}>₹{perRung}K</div>
          </div>
        </div>

        {staticSeat && (
          <div className={styles.voteBankRow}>
            <div className={styles.voteBankLabel}>PRIMARY VOTE BANK</div>
            <div className={styles.voteBankPrimary}>{VOTE_BANK_NAME_BY_ID[staticSeat.primaryVoteBank]}</div>
            <div className={styles.voteBankLabel}>ALSO STRONG HERE</div>
            <div className={styles.voteBankSecondary}>
              {staticSeat.secondaryVoteBanks.map((id) => VOTE_BANK_NAME_BY_ID[id]).join(', ')}
            </div>
          </div>
        )}

        <div className={styles.body}>
          {rows.map((row) => (
            <div className={styles.row} key={row.partyName}>
              <div className={styles.rowTop}>
                <div className={styles.rowParty}>
                  {row.partyName}
                  {row.mineTag}
                </div>
                <div className={styles.rowTotal}>
                  Rung {row.rungs}/{TOTAL_RUNGS}
                </div>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ background: row.color, width: `${row.pct}%` }} />
              </div>
            </div>
          ))}

          {lockedLabel && (
            <div className={styles.lockedPill} style={{ color: lockedColor }}>
              {lockedLabel}
            </div>
          )}

          {editable && (
            <div className={styles.spendRow}>
              <button
                className={styles.spendBtn}
                disabled={!canAddRung}
                onClick={() => addSeatSpend(seat.acNo, perRung)}
              >
                +1 Rung (₹{perRung}K)
              </button>
              {hasDraft && (
                <button className={styles.clearBtn} onClick={() => clearSeatDraft(seat.acNo)}>
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
