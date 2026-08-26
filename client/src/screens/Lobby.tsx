import { TURN_TIMER_OPTIONS } from '../lib/types';
import { useGame } from '../state/GameProvider';
import styles from './Lobby.module.css';

function timerLabel(seconds: number | null): string {
  const opt = TURN_TIMER_OPTIONS.find((o) => o.seconds === seconds);
  return `${opt ? opt.label : `${seconds ?? 60}s`} per turn`;
}

export default function Lobby() {
  const { state, startGame } = useGame();
  const room = state.room!;
  const players = Object.values(room.players);
  const isHost = room.hostId === state.myPlayerId;
  const canStart = players.length >= 2;

  return (
    <div className={styles.screen}>
      <div className={styles.roomCodeLabel}>ROOM CODE</div>
      <div className={styles.roomCode}>{room.code}</div>
      <div className={styles.timerBadge}>⏱ {timerLabel(room.turnTimerSeconds)}</div>

      <div className={styles.playerList}>
        {players.map((p) => (
          <div className={styles.playerRow} key={p.id}>
            <div className={styles.dot} style={{ background: p.color }} />
            {p.symbol && <div className={styles.symbol} style={{ backgroundImage: `url(${p.symbol})` }} />}
            <div style={{ flex: 1 }}>
              <div className={styles.partyName}>
                {p.partyName}
                {p.partyCode ? <span className={styles.partyCode}>{p.partyCode}</span> : null}
                {p.id === room.hostId ? ' · Host' : ''}
              </div>
              <div className={styles.playerName}>
                {p.name}
                {p.id === state.myPlayerId ? ' (you)' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.countLabel}>{players.length} / 5 players joined</div>

      {isHost ? (
        <button
          className={styles.startBtn}
          disabled={!canStart}
          onClick={startGame}
          style={{ background: canStart ? 'var(--navy)' : 'var(--disabled)' }}
        >
          Start Campaign ({room.maxTurns} turns)
        </button>
      ) : (
        <div className={styles.waitingLabel}>Waiting for the host to start…</div>
      )}
    </div>
  );
}
