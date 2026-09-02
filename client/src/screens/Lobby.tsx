import { useEffect, useState } from 'react';
import { TURN_TIMER_OPTIONS } from '../lib/types';
import { useGame } from '../state/GameProvider';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './Lobby.module.css';

const MAX_PLAYERS = 5;
const COPIED_MS = 1600;

function timerLabel(seconds: number | null): string {
  const opt = TURN_TIMER_OPTIONS.find((o) => o.seconds === seconds);
  return opt ? opt.label : `${seconds ?? 60}s`;
}

export default function Lobby() {
  const { state, startGame, leaveRoom } = useGame();
  const [copied, setCopied] = useState(false);
  const room = state.room!;
  const players = Object.values(room.players);
  const isHost = room.hostId === state.myPlayerId;
  const canStart = players.length >= 2;
  const emptySlots = Math.max(0, MAX_PLAYERS - players.length);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(id);
  }, [copied]);

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code).catch(() => {
      /* clipboard blocked — the code is on screen anyway */
    });
    setCopied(true);
  };

  const handleExit = () => {
    const message = isHost
      ? 'Exit the match? Your slot is freed and, if nobody else is in the room, the room closes.'
      : 'Exit the match? Your slot is freed and you will need the room code to join again.';
    if (window.confirm(message)) leaveRoom();
  };

  return (
    <RoomShell variant="stage" showBack={false} onExit={handleExit}>
      <div className={`${shellStyles.card} ${styles.card}`}>
        <div className={styles.codeLabel}>Room Code</div>
        <div className={styles.code}>{room.code}</div>
        <div className={styles.timerBadge}>⏱ {timerLabel(room.turnTimerSeconds)} per turn</div>
        <button type="button" className={styles.copyBtn} onClick={copyCode}>
          {copied ? 'Copied ✓' : 'Copy Code'}
        </button>

        <div className={styles.roster}>
          {players.map((p) => (
            <div className={styles.playerRow} key={p.id}>
              <span
                className={styles.avatar}
                style={{
                  // backgroundColor, not the `background` shorthand: the
                  // shorthand would reset the class's background-size and
                  // -position, dropping the symbol in at its natural 96px size
                  // anchored to the top-left of a 34px circle.
                  backgroundColor: p.color,
                  backgroundImage: p.symbol ? `url(${p.symbol})` : undefined
                }}
              />
              <span className={styles.playerIdentity}>
                <span className={styles.partyLine}>
                  <span className={styles.partyName}>{p.partyName}</span>
                  {p.partyCode && <span className={styles.partyCode}>{p.partyCode}</span>}
                  {p.id === room.hostId && <span className={styles.hostTag}>Host</span>}
                </span>
                <span className={styles.playerName}>
                  {p.name}
                  {p.id === state.myPlayerId ? ' (you)' : ''}
                </span>
              </span>
            </div>
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <div className={`${styles.playerRow} ${styles.emptyRow}`} key={`empty-${i}`}>
              <span className={styles.emptyAvatar} />
              <span className={styles.emptyLabel}>Open slot</span>
            </div>
          ))}
        </div>

        <p className={styles.countLabel}>
          {players.length} / {MAX_PLAYERS} players joined
          {!canStart ? ' — at least 2 needed to start' : ''}
        </p>

        {state.error && <p className={styles.error}>{state.error}</p>}

        {isHost ? (
          <button className={styles.startBtn} disabled={!canStart || state.busy} onClick={startGame}>
            {state.busy ? 'Starting…' : `Start Campaign (${room.maxTurns} turns)`}
          </button>
        ) : (
          <p className={styles.waitingLabel}>Waiting for the host to start…</p>
        )}
      </div>
    </RoomShell>
  );
}
