import { useEffect, useState } from 'react';
import { call } from '../lib/supabaseClient';
import type { OpenRoomSummary } from '../lib/types';
import { useGame } from '../state/GameProvider';
import styles from './Landing.module.css';

const POLL_MS = 3000;

export default function Landing() {
  const { state, goCreate, goJoin, onJoinCodeChange, joinRoomByCode } = useGame();
  const [openRooms, setOpenRooms] = useState<OpenRoomSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      call<{ rooms: OpenRoomSummary[] }>('room:list', {})
        .then(({ rooms }) => { if (!cancelled) setOpenRooms(rooms); })
        .catch(() => { /* transient — keep showing the last known list */ });
    };
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

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
          <button className={styles.joinBtn} onClick={goJoin} disabled={!state.joinCodeInput.trim()}>
            Join Room
          </button>
        </div>
      </div>
      {state.error && <div className={styles.error}>{state.error}</div>}

      <div className={styles.openRooms}>
        <div className={styles.openRoomsLabel}>Open Rooms</div>
        {openRooms === null && <div className={styles.openRoomsEmpty}>Looking for open rooms…</div>}
        {openRooms !== null && openRooms.length === 0 && (
          <div className={styles.openRoomsEmpty}>No open rooms right now — create one to get started.</div>
        )}
        {openRooms !== null && openRooms.length > 0 && (
          <div className={styles.openRoomsList}>
            {openRooms.map((r) => (
              <button key={r.code} className={styles.openRoomRow} onClick={() => joinRoomByCode(r.code)}>
                <span className={styles.openRoomCode}>{r.code}</span>
                <span className={styles.openRoomHost}>{r.hostPartyName}'s campaign</span>
                <span className={styles.openRoomCount}>{r.playerCount} / 5 players</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
