import Landing from './screens/Landing';
import Loading from './screens/Loading';
import Lobby from './screens/Lobby';
import JoinRoom from './screens/JoinRoom';
import Setup from './screens/Setup';
import SinglePlayer from './screens/SinglePlayer';
import GameScreen from './screens/Game/GameScreen';
import LandscapeGuard from './components/LandscapeGuard';
import { useGame } from './state/GameProvider';

type ScreenId = 'loading' | 'landing' | 'join' | 'setup' | 'single' | 'lobby' | 'game';

/** Which screen the current state shows. */
function screenFor(state: ReturnType<typeof useGame>['state']): ScreenId {
  if (!state.seatsLoaded) return 'loading';
  // Mirrors the reference spec's fixed render guard: land on Landing unless
  // we're mid-join/mid-setup or already have a room (lobby/in-game).
  const inFlow = state.step === 'setup' || state.step === 'join' || state.step === 'single';
  const isLanding = state.step === 'landing' || (!inFlow && !state.room);
  if (isLanding) return 'landing';
  if (state.step === 'join') return 'join';
  if (state.step === 'setup') return 'setup';
  if (state.step === 'single') return 'single';
  if (state.room?.phase === 'lobby') return 'lobby';
  if (state.room) return 'game';
  return 'loading';
}

export default function App() {
  const { state } = useGame();
  const screen = screenFor(state);
  return (
    <>
      {screen === 'loading' && <Loading />}
      {screen === 'landing' && <Landing />}
      {screen === 'join' && <JoinRoom />}
      {screen === 'setup' && <Setup />}
      {screen === 'single' && <SinglePlayer />}
      {screen === 'lobby' && <Lobby />}
      {screen === 'game' && <GameScreen />}
      {/* Phones and tablets play in landscape: held upright, the
          single-player pages and a game in progress are covered by a prompt
          to rotate the device. */}
      <LandscapeGuard active={screen === 'single' || screen === 'game'} />
    </>
  );
}
