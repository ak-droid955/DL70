import { useEffect, useState } from 'react';
import { call } from './supabaseClient';
import type { OpenRoomSummary } from './types';

const POLL_MS = 3000;

/** Polls the server for joinable rooms. `null` means "not loaded yet". */
export function useOpenRooms(): OpenRoomSummary[] | null {
  const [openRooms, setOpenRooms] = useState<OpenRoomSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      call<{ rooms: OpenRoomSummary[] }>('room:list', {})
        .then(({ rooms }) => {
          if (!cancelled) setOpenRooms(rooms);
        })
        .catch(() => {
          /* transient — keep showing the last known list */
        });
    };
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return openRooms;
}
