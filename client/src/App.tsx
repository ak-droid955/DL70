import Landing from './screens/Landing';
import Loading from './screens/Loading';
import Lobby from './screens/Lobby';
import JoinRoom from './screens/JoinRoom';
import Setup from './screens/Setup';
import GameScreen from './screens/Game/GameScreen';
import { useGame } from './state/GameProvider';

export default function App() {
  const { state } = useGame();

  if (!state.seatsLoaded) return <Loading />;

  // Mirrors the reference spec's fixed render guard: land on Landing unless
  // we're mid-join/mid-setup or already have a room (lobby/in-game).
  const inFlow = state.step === 'setup' || state.step === 'join';
  const isLanding = state.step === 'landing' || (!inFlow && !state.room);
  if (isLanding) return <Landing />;
  if (state.step === 'join') return <JoinRoom />;
  if (state.step === 'setup') return <Setup />;
  if (state.room?.phase === 'lobby') return <Lobby />;
  if (state.room) return <GameScreen />;
  return <Loading />;
}
