import { io, type Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8787';

export const socket: Socket = io(SERVER_URL, { autoConnect: true });

type Ack<T> = ({ ok: true } & T) | { ok: false; error: string };

export function call<T = Record<string, never>>(event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res: Ack<T>) => {
      if (res.ok) resolve(res as T & { ok: true });
      else reject(new Error(res.error));
    });
  });
}
