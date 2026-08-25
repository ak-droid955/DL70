import { useGame } from '../../state/GameProvider';
import BottomBar from './BottomBar';
import MapView from './MapView';
import ResultsScreen from './ResultsScreen';
import SeatModal from './SeatModal';
import styles from './GameScreen.module.css';
import Sidebar from './Sidebar';
import SummaryModal from './SummaryModal';
import WaitingOverlay from './WaitingOverlay';

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
