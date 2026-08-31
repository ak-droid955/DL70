import { useOpenRooms } from '../lib/useOpenRooms';
import { useGame } from '../state/GameProvider';
import RoomShell, { shellStyles } from './RoomShell';
import styles from './JoinRoom.module.css';

const MAX_PLAYERS = 5;

export default function JoinRoom() {
  const { state, goJoin, onJoinCodeChange, joinRoomByCode } = useGame();
  const openRooms = useOpenRooms();

  return (
    <RoomShell variant="join">
      <div className={`${shellStyles.card} ${styles.card}`}>
        <h1 className={styles.title}>Vidhan Sabha Showdown</h1>
        <p className={styles.blurb}>
          Bhai scene yeh hai ki seat hai 70, mukabla hain bada kattar.
          <br />
          2–5 log aur apna-apna phone,
          <br />
          har banda apni party ka CM bhi, minister bhi khud.
        </p>

        <div className={styles.joinRow}>
          <input
            className={styles.codeInput}
            value={state.joinCodeInput}
            onChange={(e) => onJoinCodeChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && state.joinCodeInput.trim()) goJoin();
            }}
            placeholder="ROOM CODE"
            maxLength={4}
            aria-label="Room code"
          />
          <button type="button" className={styles.joinBtn} onClick={goJoin} disabled={!state.joinCodeInput.trim()}>
            Join Room
          </button>
        </div>
        {state.error && <p className={styles.error}>{state.error}</p>}

        <div className={styles.openRoomsLabel}>Open Rooms</div>

        {openRooms === null && <p className={styles.emptyNote}>Looking for open rooms…</p>}
        {openRooms !== null && openRooms.length === 0 && (
          <p className={styles.emptyNote}>No open rooms right now — create one to get started.</p>
        )}
        {openRooms !== null && openRooms.length > 0 && (
          <div className={styles.roomList}>
            {openRooms.map((room) => {
              const full = room.playerCount >= MAX_PLAYERS;
              return (
                <button
                  type="button"
                  key={room.code}
                  className={`${styles.roomRow} ${full ? styles.roomRowFull : ''}`}
                  disabled={full}
                  onClick={() => joinRoomByCode(room.code)}
                >
                  <span className={styles.roomIdentity}>
                    <span className={styles.roomCode}>{room.code}</span>
                    <span className={styles.roomName}>{room.hostPartyName}</span>
                  </span>
                  <span className={`${styles.roomCount} ${full ? styles.roomCountFull : ''}`}>
                    {full ? 'Full' : `${room.playerCount} / ${MAX_PLAYERS} players`}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </RoomShell>
  );
}
