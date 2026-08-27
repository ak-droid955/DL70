// Single dispatcher replacing the Node/Socket.IO version's socketHandlers.ts.
// The client calls this via supabase.functions.invoke('game', { body:
// {action, ...payload} }); action names match the old socket event names
// 1:1 (plus the new 'game:checkExpiry' — see rooms.ts) so the client's call
// sites barely change. Response shape ({ok:true,...} / {ok:false,error})
// matches the client's existing Ack<T> handling exactly.
import { warmStaticSeatsCache } from '../_shared/gameData.ts';
import { RoomError, roomStore, type NewPlayerInput } from '../_shared/rooms.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid request body' }, 400);
  }

  const { action, ...payload } = body || {};

  try {
    // Must resolve before any handler below takes a Postgres row lock — see
    // the comment on warmStaticSeatsCache() in _shared/gameData.ts.
    await warmStaticSeatsCache();
    switch (action) {
      case 'room:create': {
        const { room, playerId, token } = await roomStore.createRoom(payload as NewPlayerInput);
        return json({ ok: true, room, playerId, token });
      }
      case 'room:peek': {
        const result = await roomStore.peekRoom(payload.code);
        return json({ ok: true, ...result });
      }
      case 'room:list': {
        const rooms = await roomStore.listOpenRooms();
        return json({ ok: true, rooms });
      }
      case 'room:join': {
        const { room, playerId, token } = await roomStore.joinRoom(payload.code, payload as NewPlayerInput);
        return json({ ok: true, room, playerId, token });
      }
      case 'room:rejoin': {
        const room = await roomStore.rejoin(payload.code, payload.playerId, payload.token);
        return json({ ok: true, room });
      }
      case 'game:start': {
        const room = await roomStore.startGame(payload.code, payload.playerId);
        return json({ ok: true, room });
      }
      case 'game:endMatch': {
        const room = await roomStore.endMatch(payload.code, payload.playerId);
        return json({ ok: true, room });
      }
      case 'game:submitTurn': {
        const { room } = await roomStore.submitTurn(payload.code, payload.playerId, payload.seatSpends);
        return json({ ok: true, room });
      }
      case 'game:checkExpiry': {
        const room = await roomStore.checkExpiry(payload.code);
        return json({ ok: true, room });
      }
      default:
        return json({ ok: false, error: `Unknown action "${action}"` }, 400);
    }
  } catch (err) {
    if (err instanceof RoomError) return json({ ok: false, error: err.message });
    console.error(err);
    return json({ ok: false, error: 'Something went wrong. Please try again.' });
  }
});
