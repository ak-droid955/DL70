import { useEffect, useState } from 'react';
import { useGame } from '../../state/GameProvider';
import BottomBar from './BottomBar';
import MapView from './MapView';
import ResultsScreen from './ResultsScreen';
import SeatModal from './SeatModal';
import styles from './GameScreen.module.css';
import Sidebar from './Sidebar';
import SummaryModal from './SummaryModal';
import WaitingOverlay from './WaitingOverlay';

// Live per-turn countdown driven by the server-set deadline. Re-renders once a
// second; the server is the source of truth and auto-resolves the turn when the
// clock actually hits zero, so this is display-only.
function TurnCountdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.round((deadline - now) / 1000));
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const text = mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : `${ss}s`;
  return <div className={`${styles.turnPill} ${remaining <= 10 ? styles.turnPillUrgent : ''}`}>⏱ {text}</div>;
}

export default function GameScreen() {
  const { state, getMe, endMatch } = useGame();
  const room = state.room!;
  const me = getMe();

  const turnLabel = room.phase === 'gameover' ? 'FINAL RESULTS' : `TURN ${room.turn} / ${room.maxTurns}`;
  const isHost = room.hostId === state.myPlayerId;

  const lastLog = room.turnLog[room.turnLog.length - 1];
  const isSummaryVisible = !!lastLog && lastLog.turn > state.summarySeenForTurn;
  const isResultsVisible = room.phase === 'gameover' && !isSummaryVisible;
  const isWaitingOverlay = !!(me && me.ready) && room.phase === 'playing' && !isSummaryVisible;

  const handleEndMatch = () => {
    if (
      window.confirm(
        'End the match now? Any spends not yet submitted this turn will be lost. Every still-unclaimed seat will go to whoever is currently leading it as of the last completed turn. This cannot be undone.'
      )
    ) {
      endMatch();
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <div className={styles.title}>Vidhan Sabha Showdown</div>
        <div className={styles.turnPill}>{turnLabel}</div>
        {room.phase === 'playing' && room.turnDeadline && <TurnCountdown deadline={room.turnDeadline} />}
        <div className={styles.rightGroup}>
          {isHost && room.phase === 'playing' && (
            <button className={styles.endMatchBtn} onClick={handleEndMatch}>
              End Match
            </button>
          )}
          <div className={styles.roomCode}>ROOM {room.code}</div>
        </div>
      </div>

      <div className={styles.body}>
        <Sidebar />
        <MapView />
      </div>

      <BottomBar />

      {state.selectedSeatAcNo && <SeatModal />}
      {!state.selectedSeatAcNo && isWaitingOverlay && <WaitingOverlay />}
      {isSummaryVisible && <SummaryModal lastLog={lastLog!} />}
      {isResultsVisible && <ResultsScreen />}
    </div>
  );
}
