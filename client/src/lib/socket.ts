import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from './config';

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
