// Replaces GET /api/seats from the Node/Socket.IO version. Static constituency
// reference data (electors, geometry, Vote Bank assignments) — never changes
// during a game, computed once and cached per warm instance by loadStaticSeats().
import { loadStaticSeats, warmStaticSeatsCache } from '../_shared/gameData.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    await warmStaticSeatsCache();
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Could not load constituency data.' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  const seats = Object.values(loadStaticSeats());
  return new Response(JSON.stringify(seats), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
