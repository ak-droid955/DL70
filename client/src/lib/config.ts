// Supabase project this client talks to. Defaults point at the project this
// game was set up against so it works out of the box; override via env vars
// to point a build at a different project.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rgmpqnaxqjrtlguhwwgq.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_KFfG0LQBHS5GvzvCBrUuNw_kdoFWR0X';
