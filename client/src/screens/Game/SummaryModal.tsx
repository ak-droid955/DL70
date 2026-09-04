import { TOTAL_RUNGS, VOTE_BANKS } from '../../lib/types';
import type { Player, TurnLogEntry, VoteBankId } from '../../lib/types';
import { voteBankArt } from '../../lib/voteBankArt';
import { useGame } from '../../state/GameProvider';
import styles from './SummaryModal.module.css';

const VOTE_BANK_BY_ID = Object.fromEntries(VOTE_BANKS.map((b) => [b.id, b]));

/** A seat where this player is level with at least one rival — neither is
 * ahead, so the seat is still anyone's. Named on the card as a Kaatein ki
 * Takkar (a neck-and-neck fight). */
interface Clash {
  acNo: string;
  seatName: string;
  rivals: Player[];
}

/** The party's election symbol, as used on the map and the seat ladder. Falls
 * back to the party code when a party never set one. */
function SymbolToken({ player, size }: { player: Player; size: 'lg' | 'sm' }) {
  return (
    <span
      className={size === 'lg' ? styles.symbolLg : styles.symbolSm}
      style={{
        borderColor: player.color,
        ...(player.symbol ? { backgroundImage: `url(${player.symbol})` } : { background: player.color })
      }}
      title={player.partyName}
    >
      {!player.symbol && <span className={styles.symbolCode}>{player.partyCode}</span>}
    </span>
  );
}

export default function SummaryModal({ lastLog }: { lastLog: TurnLogEntry }) {
  const { state, dismissSummary } = useGame();
  const room = state.room!;
  const players = Object.values(room.players);

  const summaryButtonLabel = lastLog.turn >= room.maxTurns ? 'See Final Results' : `Continue to Turn ${lastLog.turn + 1}`;

  // Seats where two or more campaigns sit on the very same rung. Read straight
  // off the board rather than from turn events, so a standoff that has been
  // running for turns still shows up. Locked seats are settled, and rung 0 is
  // everyone who never entered, so neither counts.
  const clashesByPlayer: Record<string, Clash[]> = {};
  Object.values(room.seats).forEach((seat) => {
    if (seat.locked) return;
    const perRung = state.staticSeats?.[seat.acNo]?.maxPerRung ?? 75;
    const byRung: Record<number, Player[]> = {};
    players.forEach((p) => {
      const rungs = Math.min(TOTAL_RUNGS, Math.floor((seat.progress[p.id] || 0) / perRung));
      if (rungs <= 0) return;
      (byRung[rungs] ||= []).push(p);
    });
    Object.values(byRung).forEach((tied) => {
      if (tied.length < 2) return;
      tied.forEach((p) => {
        (clashesByPlayer[p.id] ||= []).push({
          acNo: seat.acNo,
          seatName: seat.name,
          rivals: tied.filter((r) => r.id !== p.id)
        });
      });
    });
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.heading}>End of Turn {lastLog.turn}</div>

        <div className={styles.cards}>
          {players.map((p) => {
            const evs = lastLog.events.filter((e) => e.playerId === p.id);
            const won = evs.filter((e) => e.type === 'lock' || e.type === 'forced_lock').map((e) => (e as any).seatName);
            const bonus = evs
              .filter((e) => e.type === 'vote_bank_bonus')
              .reduce((sum, e) => sum + ((e as any).amount || 0), 0);
            const spent = lastLog.perPlayerSpend[p.id] || 0;
            const leads = (Object.keys(room.voteBankLeaders) as VoteBankId[]).filter(
              (id) => room.voteBankLeaders[id] === p.id
            );
            const clashes = clashesByPlayer[p.id] || [];

            return (
              <div className={styles.playerCard} key={p.id} style={{ borderColor: p.color }}>
                <div className={styles.cardHead} style={{ background: p.color }}>
                  <SymbolToken player={p} size="lg" />
                  <div className={styles.cardHeadText}>
                    <div className={styles.partyName}>
                      {p.partyName}
                      {p.id === state.myPlayerId ? ' (you)' : ''}
                    </div>
                    <div className={styles.seatsWon}>
                      <b>{p.seatsWon}</b> {p.seatsWon === 1 ? 'seat' : 'seats'} won
                    </div>
                  </div>
                </div>

                <div className={styles.statBox}>
                  <div className={styles.statLabel}>TOTAL SPEND</div>
                  <div className={styles.statValue}>₹{spent.toLocaleString('en-IN')}K</div>
                </div>

                {(won.length > 0 || bonus > 0) && (
                  <div className={styles.gains}>
                    {won.length > 0 && <div>Won {won.join(', ')}</div>}
                    {bonus > 0 && <div>Vote Bank bonus +₹{bonus.toLocaleString('en-IN')}K</div>}
                  </div>
                )}

                <div className={styles.section}>
                  <div className={styles.sectionLabel}>VOTE BANK LEADS</div>
                  {leads.length > 0 ? (
                    <div className={styles.leadList}>
                      {leads.map((id) => {
                        const art = voteBankArt(id);
                        return (
                          <span className={styles.lead} key={id}>
                            <span
                              className={styles.leadIcon}
                              style={{ background: art.icon ? 'transparent' : art.accent }}
                            >
                              {art.icon ? <img src={art.icon} alt="" /> : VOTE_BANK_BY_ID[id]?.short}
                            </span>
                            {VOTE_BANK_BY_ID[id]?.name}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.empty}>Leads no Vote Bank yet</div>
                  )}
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionLabel}>KAATEIN KI TAKKAR</div>
                  {clashes.length > 0 ? (
                    <div className={styles.clashList}>
                      {clashes.map((c) => (
                        <div className={styles.clash} key={c.acNo}>
                          <div className={styles.clashSeat}>{c.seatName}</div>
                          <div className={styles.clashRivals}>
                            {c.rivals.map((r) => (
                              <SymbolToken player={r} size="sm" key={r.id} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Level with no one</div>
                  )}
                </div>
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
