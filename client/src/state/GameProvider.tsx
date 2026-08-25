import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { SERVER_URL } from '../lib/config';
import { call, socket } from '../lib/socket';
import type { Player, Room, StaticSeat } from '../lib/types';

const LS_PLAYER_ID = 'dvs_player_id';
const LS_ROOM_CODE = 'dvs_room_code';
const LS_TOKEN = 'dvs_token';
const LS_SUMMARY_SEEN = 'dvs_summary_seen';

export type Step = 'landing' | 'setup' | 'in-room';
export type PendingMode = 'create' | 'join' | null;

interface State {
  seatsLoaded: boolean;
  staticSeats: Record<string, StaticSeat> | null;
  step: Step;
  joinCodeInput: string;
  nameInput: string;
  partyNameInput: string;
  colorChoice: number;
  symbolDataUrl: string | null;
  pendingMode: PendingMode;
  pendingCode: string | null;
  error: string | null;
  room: Room | null;
  myPlayerId: string | null;
  selectedSeatAcNo: string | null;
  draftSeatSpends: Record<string, number>;
  draftGroupSpends: Record<string, number>;
  summarySeenForTurn: number;
}

const initialState: State = {
  seatsLoaded: false,
  staticSeats: null,
  step: 'landing',
  joinCodeInput: '',
  nameInput: '',
  partyNameInput: '',
  colorChoice: 0,
  symbolDataUrl: null,
  pendingMode: null,
  pendingCode: null,
  error: null,
  room: null,
  myPlayerId: null,
  selectedSeatAcNo: null,
  draftSeatSpends: {},
  draftGroupSpends: {},
  summarySeenForTurn: 0
};

function safeGet(kind: 'session' | 'local', key: string): string | null {
  try {
    return (kind === 'session' ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}
function safeSet(kind: 'session' | 'local', key: string, val: string) {
  try {
    (kind === 'session' ? sessionStorage : localStorage).setItem(key, val);
  } catch {
    /* storage unavailable */
  }
}
function safeRemove(kind: 'session' | 'local', key: string) {
  try {
    (kind === 'session' ? sessionStorage : localStorage).removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

interface Ctx {
  state: State;
  patch: (p: Partial<State>) => void;
  getMe: () => Player | null;
  getRemaining: () => number;
  goCreate: () => void;
  goJoin: () => Promise<void>;
  joinRoomByCode: (code: string) => Promise<void>;
  onJoinCodeChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onPartyNameChange: (v: string) => void;
  pickColor: (i: number) => void;
  onSymbolFile: (file: File) => void;
  submitSetup: () => Promise<void>;
  startGame: () => Promise<void>;
  endMatch: () => Promise<void>;
  selectSeat: (acNo: string | null) => void;
  closeSeat: () => void;
  addSeatSpend: (acNo: string, amt: number) => void;
  clearSeatDraft: (acNo: string) => void;
  addGroupSpend: (gid: string, amt: number) => void;
  clearGroupDraft: (gid: string) => void;
  submitTurn: () => Promise<void>;
  dismissSummary: () => void;
  playAgain: () => void;
}

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const patch = useCallback((p: Partial<State>) => setState((s) => ({ ...s, ...p })), []);

  // Load static seat/geo reference data once, and attempt to rejoin a session
  // this browser already belongs to (stored player id / room code / token).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/seats`);
        const seatsArr: StaticSeat[] = await res.json();
        const staticSeats: Record<string, StaticSeat> = {};
        seatsArr.forEach((s) => (staticSeats[s.acNo] = s));
        if (cancelled) return;

        const playerId = safeGet('local', LS_PLAYER_ID);
        const roomCode = safeGet('local', LS_ROOM_CODE);
        const token = safeGet('local', LS_TOKEN);
        if (playerId && roomCode && token) {
          try {
            const { room } = await call<{ room: Room }>('room:rejoin', { code: roomCode, playerId, token });
            if (cancelled) return;
            const summarySeenForTurn = Number(safeGet('local', LS_SUMMARY_SEEN)) || 0;
            patch({ seatsLoaded: true, staticSeats, step: 'in-room', room, myPlayerId: playerId, summarySeenForTurn });
            return;
          } catch {
            safeRemove('local', LS_PLAYER_ID);
            safeRemove('local', LS_ROOM_CODE);
            safeRemove('local', LS_TOKEN);
          }
        }
        if (!cancelled) patch({ seatsLoaded: true, staticSeats, step: 'landing' });
      } catch (err) {
        console.error('Failed to load game data', err);
        if (!cancelled) patch({ seatsLoaded: true, error: 'Could not load constituency data. Please refresh.' });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates from the server-authoritative room (broadcast to everyone in the room channel).
  useEffect(() => {
    const onUpdate = (room: Room) => {
      if (stateRef.current.room && room.code !== stateRef.current.room.code) return;
      patch({ room });
    };
    socket.on('room:update', onUpdate);
    return () => {
      socket.off('room:update', onUpdate);
    };
  }, [patch]);

  const persistSession = (code: string, playerId: string, token: string) => {
    safeSet('local', LS_ROOM_CODE, code);
    safeSet('local', LS_PLAYER_ID, playerId);
    safeSet('local', LS_TOKEN, token);
    safeSet('local', LS_SUMMARY_SEEN, '0');
  };

  const getMe = useCallback(() => {
    const { room, myPlayerId } = stateRef.current;
    return room && myPlayerId ? room.players[myPlayerId] : null;
  }, []);

  const getRemaining = useCallback(() => {
    const me = getMe();
    if (!me) return 0;
    const sSum = Object.values(stateRef.current.draftSeatSpends).reduce((a, b) => a + b, 0);
    const gSum = Object.values(stateRef.current.draftGroupSpends).reduce((a, b) => a + b, 0);
    return me.budgetThisTurn - sSum - gSum;
  }, [getMe]);

  const goCreate = () => patch({ step: 'setup', pendingMode: 'create', error: null });

  const onJoinCodeChange = (v: string) => patch({ joinCodeInput: v.toUpperCase() });

  const joinRoomByCode = async (rawCode: string) => {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) return patch({ error: 'Enter a room code' });
    try {
      await call('room:peek', { code });
      patch({ step: 'setup', pendingMode: 'join', pendingCode: code, error: null });
    } catch (err) {
      patch({ error: (err as Error).message });
    }
  };

  const goJoin = () => joinRoomByCode(stateRef.current.joinCodeInput);

  const onNameChange = (v: string) => patch({ nameInput: v });
  const onPartyNameChange = (v: string) => patch({ partyNameInput: v });
  const pickColor = (i: number) => patch({ colorChoice: i });
  const onSymbolFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96);
        patch({ symbolDataUrl: canvas.toDataURL('image/png') });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const submitSetup = async () => {
    const { pendingMode, pendingCode, nameInput, partyNameInput, colorChoice, symbolDataUrl } = stateRef.current;
    if (!nameInput.trim() || !partyNameInput.trim()) return patch({ error: 'Enter your name and party name' });
    try {
      const payload = { name: nameInput.trim(), partyName: partyNameInput.trim(), colorIndex: colorChoice, symbol: symbolDataUrl || null };
      const { room, playerId, token } =
        pendingMode === 'create'
          ? await call<{ room: Room; playerId: string; token: string }>('room:create', payload)
          : await call<{ room: Room; playerId: string; token: string }>('room:join', { ...payload, code: pendingCode });
      persistSession(room.code, playerId, token);
      patch({ step: 'in-room', room, myPlayerId: playerId, error: null });
    } catch (err) {
      patch({ error: (err as Error).message });
    }
  };

  const startGame = async () => {
    const { room, myPlayerId } = stateRef.current;
    if (!room || !myPlayerId) return;
    try {
      await call('game:start', { code: room.code, playerId: myPlayerId });
    } catch (err) {
      patch({ error: (err as Error).message });
    }
  };

  const endMatch = async () => {
    const { room, myPlayerId } = stateRef.current;
    if (!room || !myPlayerId) return;
    try {
      await call('game:endMatch', { code: room.code, playerId: myPlayerId });
    } catch (err) {
      patch({ error: (err as Error).message });
    }
  };

  const selectSeat = (acNo: string | null) => patch({ selectedSeatAcNo: acNo });
  const closeSeat = () => patch({ selectedSeatAcNo: null });

  const addSeatSpend = (acNo: string, amt: number) => {
    const { room } = stateRef.current;
    const seat = room?.seats[acNo];
    if (!seat || seat.locked || getRemaining() < amt) return;
    setState((s) => ({ ...s, draftSeatSpends: { ...s.draftSeatSpends, [acNo]: (s.draftSeatSpends[acNo] || 0) + amt } }));
  };
  const clearSeatDraft = (acNo: string) =>
    setState((s) => {
      const d = { ...s.draftSeatSpends };
      delete d[acNo];
      return { ...s, draftSeatSpends: d };
    });

  const addGroupSpend = (gid: string, amt: number) => {
    const { room } = stateRef.current;
    const group = room?.groups.find((g) => g.id === gid);
    if (!group || group.claimedBy || getRemaining() < amt) return;
    setState((s) => ({ ...s, draftGroupSpends: { ...s.draftGroupSpends, [gid]: (s.draftGroupSpends[gid] || 0) + amt } }));
  };
  const clearGroupDraft = (gid: string) =>
    setState((s) => {
      const d = { ...s.draftGroupSpends };
      delete d[gid];
      return { ...s, draftGroupSpends: d };
    });

  const submitTurn = async () => {
    const { room, myPlayerId, draftSeatSpends, draftGroupSpends } = stateRef.current;
    if (!room || !myPlayerId) return;
    try {
      await call('game:submitTurn', { code: room.code, playerId: myPlayerId, seatSpends: draftSeatSpends, groupSpends: draftGroupSpends });
      patch({ draftSeatSpends: {}, draftGroupSpends: {}, selectedSeatAcNo: null });
    } catch (err) {
      patch({ error: (err as Error).message });
    }
  };

  const dismissSummary = () => {
    const { room } = stateRef.current;
    const last = room?.turnLog[room.turnLog.length - 1];
    const summarySeenForTurn = last ? last.turn : stateRef.current.summarySeenForTurn;
    safeSet('local', LS_SUMMARY_SEEN, String(summarySeenForTurn));
    patch({ summarySeenForTurn });
  };

  const playAgain = () => {
    safeRemove('local', LS_PLAYER_ID);
    safeRemove('local', LS_ROOM_CODE);
    safeRemove('local', LS_TOKEN);
    safeRemove('local', LS_SUMMARY_SEEN);
    setState((s) => ({
      ...initialState,
      seatsLoaded: true,
      staticSeats: s.staticSeats,
      step: 'landing'
    }));
  };

  const value = useMemo<Ctx>(
    () => ({
      state,
      patch,
      getMe,
      getRemaining,
      goCreate,
      goJoin,
      joinRoomByCode,
      onJoinCodeChange,
      onNameChange,
      onPartyNameChange,
      pickColor,
      onSymbolFile,
      submitSetup,
      startGame,
      endMatch,
      selectSeat,
      closeSeat,
      addSeatSpend,
      clearSeatDraft,
      addGroupSpend,
      clearGroupDraft,
      submitTurn,
      dismissSummary,
      playAgain
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): Ctx {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
