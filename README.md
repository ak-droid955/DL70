# Vidhan Sabha Showdown

A real-time multiplayer party game where 2–5 players each run a fictional political party campaigning for
Delhi's 70 real Vidhan Sabha (assembly) seats over 10 blind-bidding turns. Each turn, players secretly
allocate a budget to specific constituencies and/or interest groups; allocations are revealed and resolved
simultaneously, seats lock once a leader clears a win threshold with a big enough margin, and the game ends
with a seat-count results screen.

This is a real networked multiplayer implementation — any number of players can join a room from separate
devices/browsers. It was built from a single-machine/localStorage HTML+JS design prototype (in
`design_handoff_delhi_election_game/`, not part of the running app) that specified every screen and the
turn-resolution algorithm; the UI was rebuilt in React with the project's own component/state patterns, and
turn resolution was moved server-side so the server — not any one client — is authoritative over game state.

## Architecture

- **`server/`** — Node.js + TypeScript + Express + Socket.IO. Holds all room state in memory, is the sole
  place `resolveTurn()` runs, and broadcasts the updated room to every player in it after each turn. Also
  serves `GET /api/seats`, the static per-constituency reference data (name, electors, geometry) computed
  once at startup from the Delhi assembly GeoJSON.
- **`client/`** — React + TypeScript (Vite). Talks to the server over Socket.IO (room create/join/rejoin,
  start game, submit turn) and renders the game's screens: Landing, Setup, Lobby, the main game screen
  (interest-group sidebar, Leaflet constituency map, scoreboard), the seat detail modal, waiting overlay,
  end-of-turn summary, and final results.

`server/src/gameData.ts` is a line-for-line TypeScript port of the design prototype's
`delhi-game-data.js` — same constants, same `resolveTurn()` algorithm — so the blind-bidding rules (conflict
fees, interest-group claims, seat locking, forced locks on the final turn) are unchanged from the original
spec, just running server-side against the authoritative room instead of a client's local copy.

## Running locally

```bash
npm install          # installs both workspaces
npm run dev:server   # starts the Socket.IO/API server on :8787
npm run dev:client   # in another terminal, starts the Vite dev server on :5173
```

Open `http://localhost:5173` in multiple browser tabs/windows (or devices, once `VITE_SERVER_URL` points at
a reachable server) — each is a separate player. Copy `client/.env.example` to `client/.env.local` and
`server/.env.example` to `server/.env` to point the client at a non-default server URL or restrict CORS.

## Building

```bash
npm run build   # builds server (tsc) and client (vite build) into server/dist and client/dist
```
