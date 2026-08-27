// Direct Postgres connection (not the supabase-js/PostgREST client) so room
// mutations can use real transactions with row locks (`SELECT ... FOR
// UPDATE`), replacing the natural serialization the old in-memory Map gave
// for free in the Node/Socket.IO version. SUPABASE_DB_URL is auto-injected
// into every Edge Function's environment.
import postgres from 'npm:postgres@^3.4.0';

const connectionString = Deno.env.get('SUPABASE_DB_URL')!;

// Prefetch is unsupported in Supavisor's "Transaction" pool mode.
export const sql = postgres(connectionString, { prepare: false });
