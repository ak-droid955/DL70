# Vidhan Sabha Showdown

A real-time multiplayer party game where 2–5 players each run a fictional political party campaigning for
Delhi's 70 real Vidhan Sabha (assembly) seats over 10 blind-bidding turns. Each turn, players secretly
allocate a budget to specific constituencies; allocations are revealed and resolved simultaneously, seats
lock once a player reaches the final Campaign Rung, and the game ends with a seat-count results screen.

This is a real networked multiplayer implementation — any number of players can join a room from separate
devices/browsers. It was built from a single-machine/localStorage HTML+JS design prototype (in
`design_handoff_delhi_election_game/`, not part of the running app) that specified every screen and the
turn-resolution algorithm; the UI was rebuilt in React with the project's own component/state patterns, and
turn resolution was moved server-side so the server — not any one client — is authoritative over game state.

## Architecture

- **Postgres** (Supabase) is the source of truth: one row per room in the `rooms` table, holding the entire
  live game state (players, seats, Vote Bank influence, turn log) as JSONB. Rejoin tokens live in a separate
  `player_tokens` table, locked down from anonymous access.
- **Edge Functions** (`supabase/functions/`) replace a persistent Node server. `game/` dispatches every game
  action (create/join/rejoin/start/submitTurn/endMatch/checkExpiry) against the `rooms` table, taking a row
  lock per action so concurrent players can't race each other. `seats/` serves the static per-constituency
  reference data (electors, geometry, Vote Bank assignments). `supabase/functions/_shared/gameData.ts` is a
  line-for-line port of the design prototype's `delhi-game-data.js` — same constants, same `resolveTurn()`
  algorithm (blind bidding, Campaign Rungs, Vote Bank influence/leadership) — so the rules are unchanged from
  the original spec, just running in Postgres-backed Edge Functions instead of an in-memory Node process.
- **Realtime**: the client subscribes to Postgres Changes on `rooms` (filtered to its own room code) instead
  of a WebSocket broadcast, so every player sees the resolved state the moment an action commits.
- **`client/`** — React + TypeScript (Vite). Talks to Supabase (Edge Functions for actions, `@supabase/supabase-js`
  Realtime for live updates) and renders the game's screens: Landing, Setup, Lobby, the main game screen
  (Vote Bank sidebar, Leaflet constituency map, scoreboard), the seat detail modal, waiting overlay,
  end-of-turn summary, and final results.

Because there's no persistent Node process to host, `client/` is a plain static site — it can be deployed
anywhere (Vercel, Netlify, etc.) as long as it can reach the Supabase project.

## Running locally

```bash
npm install                 # installs the client workspace
npm run dev:client          # starts the Vite dev server on :5173
```

The client talks directly to the deployed Supabase project by default (see `client/src/lib/config.ts`); set
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `client/.env.local` to point it at a different project.

To work on the Edge Functions themselves, use the Supabase CLI from the project root:

```bash
supabase functions serve     # runs game/ and seats/ locally
```

## Building

```bash
npm run build   # builds the client (vite build) into client/dist
```

Deploy Edge Function changes with `supabase functions deploy game` / `supabase functions deploy seats` (or
via the Supabase MCP tools).
