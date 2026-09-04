// Replaces socket.ts (Socket.IO) — the client now talks to Supabase: the
// `game` Edge Function for actions (create/join/submitTurn/etc.) and
// Postgres Changes on the `rooms` table for live updates, in place of
// socket.emit(...) with an ack and socket.on('room:update').
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';
import type { Room } from './types';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

type Ack<T> = ({ ok: true } & T) | { ok: false; error: string };

// Same call signature every screen already uses (call<T>(name, payload)) —
// only the transport underneath changed, from a socket.io ack callback to an
// Edge Function invocation.
export function call<T = Record<string, never>>(action: string, payload: unknown): Promise<T> {
  return supabase.functions.invoke('game', { body: { action, ...(payload as object) } }).then(({ data, error }) => {
    if (error) throw new Error('Network error. Please try again.');
    const ack = data as Ack<T> | null;
    if (!ack) throw new Error('Empty response from server.');
    if (!ack.ok) throw new Error(ack.error);
    return ack as T & { ok: true };
  });
}

// jsonb columns can arrive as raw JSON text rather than parsed objects
// (observed from postgres.js via the Edge Function; defensive here too since
// Realtime's own encoding isn't guaranteed either).
function asJson<T>(value: T | string): T {
  return typeof value === 'string' ? (JSON.parse(value) as T) : value;
}

// Maps a raw `rooms` table row (snake_case columns, as delivered by Postgres
// Changes) into the client's Room shape (camelCase, matching what the game
// Edge Function already returns from call()).
export function rowToRoom(row: Record<string, any>): Room {
  return {
    code: row.code,
    phase: row.phase,
    turn: row.turn,
    maxTurns: row.max_turns,
    budgetPerTurn: row.budget_per_turn,
    turnTimerSeconds: row.turn_timer_seconds,
    turnDeadline: row.turn_deadline ? new Date(row.turn_deadline).getTime() : null,
    hostId: row.host_id,
    players: asJson(row.players),
    seats: asJson(row.seats),
    voteBankInfluence: asJson(row.vote_bank_influence),
    voteBankConquerors: asJson(row.vote_bank_leaders),
    pendingTurn: asJson(row.pending_turn),
    turnLog: asJson(row.turn_log)
  };
}

// Subscribes to live updates for one room by code; returns an unsubscribe
// function. Callers should resubscribe whenever the active room's code
// changes (create/join/rejoin), mirroring how the old code joined a fresh
// Socket.IO room on each of those.
export function subscribeToRoom(code: string, onUpdate: (room: Room) => void): () => void {
  const channel = supabase
    .channel(`room:${code}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
      (payload) => onUpdate(rowToRoom(payload.new as Record<string, any>))
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
