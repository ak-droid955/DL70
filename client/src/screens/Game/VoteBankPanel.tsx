import { VOTE_BANKS, VOTE_BANK_STRONG_MIN, type VoteBankId } from '../../lib/types';
import { voteBankArt } from '../../lib/voteBankArt';
import { useGame } from '../../state/GameProvider';
import styles from './VoteBankPanel.module.css';

function Silhouette() {
  return (
    <svg className={styles.silhouette} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 13c6 0 10.5 3.2 10.5 7.2V29h-21v-3.8C5.5 21.2 10 18 16 18Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Round icon button in the left rail. The selected bank pops out of the rail
 *  as a white tab, the way the reference game marks the open group. */
function RailButton({ id, selected, onSelect }: { id: VoteBankId; selected: boolean; onSelect: () => void }) {
  const bank = VOTE_BANKS.find((b) => b.id === id)!;
  const art = voteBankArt(id);
  const { state } = useGame();
  const leaderId = state.room!.voteBankLeaders[id];
  const leader = leaderId ? state.room!.players[leaderId] : null;

  return (
    <button
      className={`${styles.railBtn} ${selected ? styles.railBtnActive : ''}`}
      onClick={onSelect}
      title={bank.name}
      aria-pressed={selected}
    >
      <span className={styles.railIcon} style={{ background: art.icon ? 'transparent' : art.accent }}>
        {art.icon ? <img src={art.icon} alt="" /> : <span className={styles.railShort}>{bank.short}</span>}
      </span>
      {leader && <span className={styles.railLeaderDot} style={{ background: leader.color }} />}
    </button>
  );
}

/** Banner for the open Vote Bank: icon tile, name over its artwork, the count
 *  of seats it is strong in, and the influence meter underneath. */
function VoteBankBanner({ id }: { id: VoteBankId }) {
  const { state, selectVoteBank } = useGame();
  const room = state.room!;
  const bank = VOTE_BANKS.find((b) => b.id === id)!;
  const art = voteBankArt(id);

  const influence = room.voteBankInfluence[id] || {};
  const total = Object.values(influence).reduce((a, b) => a + b, 0);
  const leaderId = room.voteBankLeaders[id];
  const leader = leaderId ? room.players[leaderId] : null;
  const myInfluence = state.myPlayerId ? influence[state.myPlayerId] || 0 : 0;

  // Segments are each campaign's share of all influence in this bank, biggest
  // first, so the meter reads as a tug of war between the parties.
  const segments = Object.entries(influence)
    .map(([playerId, value]) => ({ player: room.players[playerId], value }))
    .filter((s) => s.player && s.value > 0)
    .sort((a, b) => b.value - a.value);

  const strongSeats = state.staticSeats
    ? Object.values(state.staticSeats).filter((s) => (s.voteBankStrength[id] ?? 0) >= VOTE_BANK_STRONG_MIN).length
    : 0;

  return (
    <div className={styles.banner}>
      <div className={styles.bannerTop}>
        <div className={styles.bannerIcon} style={{ background: art.icon ? 'white' : art.accent }}>
          {art.icon ? <img src={art.icon} alt="" /> : <span className={styles.bannerShort}>{bank.short}</span>}
        </div>

        <div
          className={styles.bannerName}
          style={
            art.banner
              ? { backgroundImage: `url(${art.banner})` }
              : { backgroundImage: `linear-gradient(100deg, ${art.accent}, oklch(30% 0.05 260))` }
          }
        >
          <span className={styles.bannerNameText}>{bank.name}</span>
        </div>

        <div className={styles.seatChip}>
          <span className={styles.seatChipValue}>{strongSeats}</span>
          <span className={styles.seatChipLabel}>seats</span>
        </div>

        <button className={styles.closeBtn} onClick={() => selectVoteBank(null)} aria-label="Close Vote Bank">
          ✕
        </button>
      </div>

      <div className={styles.meterRow}>
        <div className={styles.meter}>
          <div className={styles.meterTicks} />
          {segments.map((s) => (
            <div
              key={s.player.id}
              className={styles.meterSeg}
              style={{ width: `${(s.value / total) * 100}%`, background: s.player.color }}
              title={`${s.player.partyName}: ${Math.round(s.value)}`}
            />
          ))}
          <div className={styles.meterMid} />
        </div>

        <div className={styles.leaderCell} style={{ borderColor: leader ? leader.color : 'var(--border)' }}>
          {leader && leader.symbol ? (
            <div className={styles.leaderSymbol} style={{ backgroundImage: `url(${leader.symbol})` }} />
          ) : (
            <Silhouette />
          )}
        </div>
      </div>

      <div className={styles.status}>
        <span className={styles.statusLeader} style={{ color: leader ? leader.color : 'var(--text-muted)' }}>
          {leader
            ? `${leader.partyName}${leaderId === state.myPlayerId ? ' (you)' : ''} leads`
            : 'Uncontested'}
        </span>
        <span className={styles.statusMine}>Your influence: {Math.round(myInfluence)}</span>
      </div>
    </div>
  );
}

/** Vote Bank rail + banner, overlaid on the map. Selecting a bank also tells
 *  the map which seats to highlight (see MapView) — the panel is a lens on the
 *  existing influence numbers, it never spends anything on a bank directly. */
export default function VoteBankPanel() {
  const { state, selectVoteBank } = useGame();
  const selected = state.selectedVoteBankId;

  return (
    <>
      <div className={styles.rail}>
        {VOTE_BANKS.map((bank) => (
          <RailButton
            key={bank.id}
            id={bank.id}
            selected={selected === bank.id}
            onSelect={() => selectVoteBank(bank.id)}
          />
        ))}
      </div>

      {selected && <VoteBankBanner id={selected} />}
    </>
  );
}
