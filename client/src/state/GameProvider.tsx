import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { call, supabase, subscribeToRoom } from '../lib/supabaseClient';
import { TURN_TIMER_OPTIONS } from '../lib/types';
import type { Player, Room, StaticSeat, VoteBankId } from '../lib/types';

// How often any client with an active turn timer pings the server to check
// whether the deadline has passed — see the checkExpiry effect below.
// Replaces the Node/Socket.IO version's server-side setTimeout, which an
// Edge Function can't hold across invocations.
const CHECK_EXPIRY_INTERVAL_MS = 2000;

const LS_PLAYER_ID = 'dvs_player_id';
const LS_ROOM_CODE = 'dvs_room_code';
const LS_TOKEN = 'dvs_token';
const LS_SUMMARY_SEEN = 'dvs_summary_seen';

export type Step = 'landing' | 'join' | 'setup' | 'in-room';
export type PendingMode = 'create' | 'join' | null;

interface State {
  seatsLoaded: boolean;
  staticSeats: Record<string, StaticSeat> | null;
  step: Step;
  joinCodeInput: string;
  nameInput: string;
  partyNameInput: string;
  partyCodeInput: string;
  colorChoice: number;
  turnTimerChoice: number; // index into TURN_TIMER_OPTIONS; only used when creating a room
  symbolDataUrl: string | null;
  symbolChoice: string | null; // emoji of the selected preset symbol, if any
  pendingMode: PendingMode;
  pendingCode: string | null;
  error: string | null;
  room: Room | null;
  myPlayerId: string | null;
  selectedSeatAcNo: string | null;
  // Vote Bank currently open in the Vote Bank panel; also drives which seats
  // the map highlights. Purely a view concern — Vote Bank influence itself is
  // earned by campaign spend in seats, never spent on directly.
  selectedVoteBankId: VoteBankId | null;
  draftSeatSpends: Record<string, number>;
  summarySeenForTurn: number;
  // True while a room-mutating request is in flight. Every action that
  // creates or changes server state is gated on this, and the buttons that
  // trigger them are disabled while it's set — without that, a double-click
  // on "Create Room & Join" creates two *separate rooms* (the host keeps the
  // last one and their friends join the abandoned one), and a double-click on
  // "Join Room" adds the same person to the lobby twice.
  busy: boolean;
}

const initialState: State = {
  seatsLoaded: false,
  staticSeats: null,
  step: 'landing',
  joinCodeInput: '',
  nameInput: '',
  partyNameInput: '',
  partyCodeInput: '',
  colorChoice: 0,
  turnTimerChoice: 2, // default 1m (index into TURN_TIMER_OPTIONS)
  symbolDataUrl: null,
  symbolChoice: null,
  pendingMode: null,
  pendingCode: null,
  error: null,
  room: null,
  myPlayerId: null,
  selectedSeatAcNo: null,
  selectedVoteBankId: null,
  draftSeatSpends: {},
  summarySeenForTurn: 0,
  busy: false
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
  goToJoin: () => void;
  goHome: () => void;
  goJoin: () => Promise<void>;
  joinRoomByCode: (code: string) => Promise<void>;
  onJoinCodeChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onPartyNameChange: (v: string) => void;
  onPartyCodeChange: (v: string) => void;
  pickColor: (i: number) => void;
  pickTurnTimer: (i: number) => void;
  pickSymbol: (emoji: string) => void;
  onSymbolFile: (file: File) => void;
  submitSetup: () => Promise<void>;
  startGame: () => Promise<void>;
  endMatch: () => Promise<void>;
  selectSeat: (acNo: string | null) => void;
  closeSeat: () => void;
  selectVoteBank: (id: VoteBankId | null) => void;
  addSeatSpend: (acNo: string, amt: number) => void;
  clearSeatDraft: (acNo: string) => void;
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

  // A ref, not state: two clicks fired in the same tick would both read the
  // same (stale) `state.busy === false` and both go through. The ref is set
  // synchronously, so the second click sees it immediately. `state.busy`
  // exists only to re-render the buttons as disabled.
  const busyRef = useRef(false);

  // Wraps a server-mutating action so it can never run concurrently with
  // itself or another one. Returns a no-op if something is already in flight.
  const runExclusive = useCallback(
    async (fn: () => Promise<void>) => {
      if (busyRef.current) return;
      busyRef.current = true;
      patch({ busy: true });
      try {
        await fn();
      } finally {
        busyRef.current = false;
        patch({ busy: false });
      }
    },
    [patch]
  );

  // Load static seat/geo reference data once, and attempt to rejoin a session
  // this browser already belongs to (stored player id / room code / token).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<StaticSeat[]>('seats', { method: 'GET' });
        if (error) throw error;
        const seatsArr = data || [];
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

  // Live updates from the server-authoritative room, via Postgres Changes on
  // the `rooms` table (replaces the old socket.on('room:update') broadcast).
  // Resubscribes only when the room code itself changes (create/join/rejoin),
  // not on every room update.
  const roomCode = state.room?.code ?? null;
  useEffect(() => {
    if (!roomCode) return;
    const unsubscribe = subscribeToRoom(roomCode, (room) => {
      if (stateRef.current.room && room.code !== stateRef.current.room.code) return;
      patch({ room });
    });
    return unsubscribe;
  }, [roomCode, patch]);

  // Pings the server to force-resolve a timed turn once its deadline has
  // passed. Every client in the room does this on an interval while a
  // deadline is active; the check is idempotent (a resolved turn's phase/turn
  // guard means a redundant ping is a no-op), so concurrent pings from
  // multiple players are harmless. Replaces the old server-side setTimeout.
  const roomPhase = state.room?.phase ?? null;
  const hasTurnTimer = state.room?.turnTimerSeconds != null;
  useEffect(() => {
    if (!roomCode || roomPhase !== 'playing' || !hasTurnTimer) return;
    const id = setInterval(() => {
      const current = stateRef.current.room;
      if (!current || current.phase !== 'playing' || current.turnDeadline == null) return;
      call('game:checkExpiry', { code: current.code }).catch(() => {
        /* transient — another client's ping (or the next tick) will catch it */
      });
    }, CHECK_EXPIRY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [roomCode, roomPhase, hasTurnTimer]);

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
    return me.budgetThisTurn - sSum;
  }, [getMe]);

  const goCreate = () => patch({ step: 'setup', pendingMode: 'create', error: null });

  // The join flow is its own page (room-code entry + open-room list) before
  // the setup form, mirroring the design's lobby -> setup progression.
  const goToJoin = () => patch({ step: 'join', error: null, pendingMode: null, pendingCode: null });

  // "Back" out of the join/setup pages to the landing page. From the setup
  // form of a join we step back to the room list rather than all the way home.
  const goHome = () => {
    const backToRoomList = stateRef.current.step === 'setup' && stateRef.current.pendingMode === 'join';
    patch({
      step: backToRoomList ? 'join' : 'landing',
      error: null,
      pendingMode: null,
      pendingCode: backToRoomList ? null : stateRef.current.pendingCode
    });
  };

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
  const onPartyCodeChange = (v: string) =>
    patch({ partyCodeInput: v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) });
  const pickColor = (i: number) => patch({ colorChoice: i });
  const pickTurnTimer = (i: number) => patch({ turnTimerChoice: i });

  // Render a preset election-symbol emoji to a 96x96 PNG data URL so it flows
  // through the same `symbol` field (and server validation) as an upload.
  const pickSymbol = (emoji: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font = '72px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 48, 54);
    patch({ symbolDataUrl: canvas.toDataURL('image/png'), symbolChoice: emoji });
  };

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
        patch({ symbolDataUrl: canvas.toDataURL('image/png'), symbolChoice: null });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const submitSetup = () =>
    runExclusive(async () => {
      const { pendingMode, pendingCode, nameInput, partyNameInput, partyCodeInput, colorChoice, turnTimerChoice, symbolDataUrl } =
        stateRef.current;
      if (!nameInput.trim() || !partyNameInput.trim()) {
        patch({ error: 'Enter your name and party name' });
        return;
      }
      try {
        const payload = {
          name: nameInput.trim(),
          partyName: partyNameInput.trim(),
          partyCode: partyCodeInput.trim(),
          colorIndex: colorChoice,
          symbol: symbolDataUrl || null
        };
        const { room, playerId, token } =
          pendingMode === 'create'
            ? await call<{ room: Room; playerId: string; token: string }>('room:create', {
                ...payload,
                turnTimerSeconds: TURN_TIMER_OPTIONS[turnTimerChoice]?.seconds ?? null
              })
            : await call<{ room: Room; playerId: string; token: string }>('room:join', { ...payload, code: pendingCode });
        persistSession(room.code, playerId, token);
        patch({ step: 'in-room', room, myPlayerId: playerId, error: null });
      } catch (err) {
        patch({ error: (err as Error).message });
      }
    });

  const startGame = () =>
    runExclusive(async () => {
      const { room, myPlayerId } = stateRef.current;
      if (!room || !myPlayerId) return;
      try {
        await call('game:start', { code: room.code, playerId: myPlayerId });
      } catch (err) {
        patch({ error: (err as Error).message });
      }
    });

  const endMatch = () =>
    runExclusive(async () => {
      const { room, myPlayerId } = stateRef.current;
      if (!room || !myPlayerId) return;
      try {
        await call('game:endMatch', { code: room.code, playerId: myPlayerId });
      } catch (err) {
        patch({ error: (err as Error).message });
      }
    });

  const selectSeat = (acNo: string | null) => patch({ selectedSeatAcNo: acNo });
  const closeSeat = () => patch({ selectedSeatAcNo: null });
  // Clicking the open bank again closes the panel, matching the rail's toggle.
  const selectVoteBank = (id: VoteBankId | null) =>
    patch({ selectedVoteBankId: id && stateRef.current.selectedVoteBankId === id ? null : id });

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

  const submitTurn = () =>
    runExclusive(async () => {
      const { room, myPlayerId, draftSeatSpends } = stateRef.current;
      if (!room || !myPlayerId) return;
      try {
        await call('game:submitTurn', { code: room.code, playerId: myPlayerId, seatSpends: draftSeatSpends });
        patch({ draftSeatSpends: {}, selectedSeatAcNo: null });
      } catch (err) {
        patch({ error: (err as Error).message });
      }
    });

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
      goToJoin,
      goHome,
      goJoin,
      joinRoomByCode,
      onJoinCodeChange,
      onNameChange,
      onPartyNameChange,
      onPartyCodeChange,
      pickColor,
      pickTurnTimer,
      pickSymbol,
      onSymbolFile,
      submitSetup,
      startGame,
      endMatch,
      selectSeat,
      closeSeat,
      selectVoteBank,
      addSeatSpend,
      clearSeatDraft,
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
