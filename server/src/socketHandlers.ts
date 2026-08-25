import type { Server, Socket } from 'socket.io';
import { RoomError, roomStore, type NewPlayerInput, type OpenRoomSummary } from './rooms.js';
import type { Room } from './types.js';

type Ack<T> = (res: { ok: true } & T) => void;
type AckErr = (res: { ok: false; error: string }) => void;
type Callback<T> = (res: ({ ok: true } & T) | { ok: false; error: string }) => void;

function guard<T>(cb: Callback<T> | undefined, fn: () => T) {
  try {
    const result = fn();
    cb?.({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof RoomError ? err.message : 'Something went wrong. Please try again.';
    if (!(err instanceof RoomError)) console.error(err);
    cb?.({ ok: false, error: message });
  }
}

export function registerSocketHandlers(io: Server, socket: Socket) {
  socket.on(
    'room:create',
    (input: NewPlayerInput, cb: Callback<{ room: Room; playerId: string; token: string }>) => {
      guard(cb, () => {
        const { room, playerId, token } = roomStore.createRoom(input);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.playerId = playerId;
        return { room, playerId, token };
      });
    }
  );

  socket.on('room:peek', (input: { code: string }, cb: Callback<{ code: string; phase: Room['phase']; playerCount: number }>) => {
    guard(cb, () => roomStore.peekRoom(input.code));
  });

  socket.on('room:list', (_input: unknown, cb: Callback<{ rooms: OpenRoomSummary[] }>) => {
    guard(cb, () => ({ rooms: roomStore.listOpenRooms() }));
  });

  socket.on(
    'room:join',
    (input: NewPlayerInput & { code: string }, cb: Callback<{ room: Room; playerId: string; token: string }>) => {
      guard(cb, () => {
        const { room, playerId, token } = roomStore.joinRoom(input.code, input);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.playerId = playerId;
        io.to(room.code).emit('room:update', room);
        return { room, playerId, token };
      });
    }
  );

  socket.on(
    'room:rejoin',
    (input: { code: string; playerId: string; token: string }, cb: Callback<{ room: Room }>) => {
      guard(cb, () => {
        const room = roomStore.rejoin(input.code, input.playerId, input.token);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.playerId = input.playerId;
        return { room };
      });
    }
  );

  socket.on('game:start', (input: { code: string; playerId: string }, cb: Callback<{ room: Room }>) => {
    guard(cb, () => {
      const room = roomStore.startGame(input.code, input.playerId);
      io.to(room.code).emit('room:update', room);
      return { room };
    });
  });

  socket.on('game:endMatch', (input: { code: string; playerId: string }, cb: Callback<{ room: Room }>) => {
    guard(cb, () => {
      const room = roomStore.endMatch(input.code, input.playerId);
      io.to(room.code).emit('room:update', room);
      return { room };
    });
  });

  socket.on(
    'game:submitTurn',
    (
      input: { code: string; playerId: string; seatSpends: Record<string, number>; groupSpends: Record<string, number> },
      cb: Callback<{ room: Room }>
    ) => {
      guard(cb, () => {
        const { room } = roomStore.submitTurn(input.code, input.playerId, input.seatSpends, input.groupSpends);
        io.to(room.code).emit('room:update', room);
        return { room };
      });
    }
  );
}
