# Handoff: Vidhan Sabha Showdown (Delhi Election Game) + Constituency Map

## Overview
Two related deliverables:

1. **Vidhan Sabha Showdown** — a local multiplayer party game where 2–5 players each run a fictional political party campaigning for Delhi's 70 real Vidhan Sabha (assembly) seats over a fixed number of blind-bidding turns. Players secretly allocate a per-turn budget to specific seats and/or "interest groups" each turn; allocations are revealed and resolved simultaneously, seats lock once a leader clears a threshold with a big enough margin, and the game ends with a seat-count result screen.
2. **Constituency Map** (`delhi-assembly-map.html`) — a standalone reference map of all 70 Delhi assembly constituencies with real boundary geometry, hover tooltips, and click-to-zoom. It is not part of the game; it was an earlier exploration of the geodata and is included as a secondary reference for anyone building a constituency browser/map screen.

## About the Design Files
The files in this bundle are **design references built in HTML/JS**, not production code to copy verbatim. `Delhi Election Game (reference).html` is written against a lightweight prototyping template syntax:
- `{{ someValue }}` — data bindings (text, attributes, event handlers)
- `<sc-if value="{{ cond }}">…</sc-if>` — conditional rendering
- `<sc-for list="{{ items }}" as="item">…</sc-for>` — list rendering
- A single `class Component extends DCLogic { state = {...}; renderVals() {...} }` block holds all app state and computes the values/handlers the template binds to — functionally equivalent to a React class component's `state` + `render()`.

Treat this file as an **executable spec**: it defines every screen, every state transition, every computed label, and every piece of game logic precisely. The task is to **recreate this UI and behavior in the target codebase's real stack** (React/Vue/Svelte/native — whatever the project already uses, or React if starting fresh) using that stack's own component and state patterns — not to import `sc-for`/`sc-if`/`DCLogic` anywhere.

`delhi-game-data.js` has **no dependency on the template runtime** — it's plain ES module JS (constants + pure functions) and can very likely be reused as-is or ported with minimal changes.

`delhi-assembly-map.html` is plain HTML/CSS/JS + Leaflet with no proprietary syntax — read it directly.

## Fidelity
**High-fidelity.** Colors, spacing, type, copy, and interaction states in the reference file are final — recreate pixel-for-pixel using the codebase's own component/styling system, don't restyle.

## Architecture note: this is a prototype, not a networked multiplayer game
There is no server. All players are expected to open the same page in separate browser tabs **on one computer**. Game state lives in a single JSON blob in `localStorage` under key `dvs_room_<CODE>`; each tab identifies "which player am I" via `sessionStorage` (`dvs_player_id`, `dvs_room_code`) so tabs don't collide. Tabs stay in sync via the `storage` event plus a 1-second poll fallback (`setInterval`).

**For a real product this should become a real backend**: a server-authoritative room/turn model (WebSocket or polling API) so players can join from separate devices, with the same state shape (see below) but server-validated turn resolution instead of client-side `resolveTurn()`. The turn-resolution algorithm itself (in `delhi-game-data.js`) is pure and stateless, so it can move server-side largely unchanged.

## Screenshots
Reference captures of every screen live in `screenshots/`, in flow order:
`01-landing.png`, `02-setup.png`, `03-lobby-1player.png`, `04-lobby-2players.png`, `05-game-main.png`, `06-seat-modal.png`, `07-waiting-overlay.png`, `08-end-of-turn-summary.png`, `09-final-results.png`.

## Note on the reference file
While producing these screenshots we found and fixed one real bug in `Delhi Election Game (reference).html`'s render logic: `renderVals()`'s early-return guard was `this.state.step === 'landing' || !room`, which also matched the `'setup'` step (since `room` is still null then) — silently short-circuiting the setup/lobby/game screens and rendering a blank page. It's fixed to `this.state.step === 'landing' || (this.state.step !== 'setup' && !room)` in this bundle. We also raised the z-index of the seat modal / waiting / summary / results overlays from 400–700 to 1500, since Leaflet's zoom control (z-index 1000) was bleeding through them. Worth a quick sanity check against the equivalent logic when porting.

## Screens / Views

### 1. Landing
- Full-viewport centered column, background `oklch(97% 0.01 80)`.
- Title "Vidhan Sabha Showdown", 40px/800 Poppins, color `oklch(26% 0.04 260)` (deep navy — the game's primary brand color throughout).
- Subtitle: max-width 520px, 15px/1.5, `oklch(50% 0.01 80)` (neutral gray), explains the 2–5 player / same-computer / multi-tab setup.
- Two actions side by side: "Create Room" (filled navy button) and a "ROOM CODE" text input (4-char, uppercase, letter-spaced) + "Join Room" (outlined navy button).
- Inline error text below in `oklch(55% 0.18 25)` (red) for bad/missing codes, full rooms, or already-started rooms.

### 2. Setup ("Set up your campaign")
- Centered card, 420px max-width, white-ish panel (`oklch(99% 0.003 80)`), 1px border `oklch(88% 0.01 80)`, 20px radius, 28px padding.
- Fields, each with a 12px/700/uppercase/letterspaced label in gray:
  - Your name (text input)
  - Party name (text input)
  - Party colour — row of 8 circular swatches, 34px, from a fixed 8-color palette (see Design Tokens); selected swatch gets a 3px solid dark ring, others transparent ring.
  - Party symbol (optional) — file picker; on upload, the image is center-cropped to square and downscaled to a 96×96 PNG data URL client-side (canvas), shown as a 48×48 rounded-12px preview swatch.
- Primary button: full-width, navy, label is "Create Room & Join" or "Join Room" depending on entry path.

### 3. Lobby
- Centered column: "ROOM CODE" label, then the 4-letter code at 48px/800 Poppins navy.
- List of joined players (max 420px wide), each a row: colored dot, optional 28px symbol swatch, party name (+ " · Host" tag for the host) on one line, player name (+ " (you)" for self) below in gray.
- "`N / 5` players joined" counter.
- Host only: "Start Campaign (`N` turns)" button — navy when ≥2 players joined, disabled/gray otherwise.
- Non-host: "Waiting for the host to start…" text.

### 4. Main game screen (in-progress turn)
Full-height flex column:
- **Top bar** (56px, dark navy `oklch(26% 0.04 260)`, white text): game title left, current turn pill center ("TURN `n` / `max`" or "FINAL RESULTS" on an orange `oklch(72% 0.15 55)` pill), room code right (letter-spaced, 80% opacity).
- **Body** (flex row, fills remaining height):
  - **Left sidebar**, 250px fixed, white-ish background, right border, scrollable. Header "INTEREST GROUPS" (13px/800 uppercase gray). Below it, one card per interest group (10 groups): name + "₹`ask`K" target on one line, a 6px progress bar (track `oklch(93% 0.005 80)`, fill = leading contributor's color or the claiming party's color once won) showing pooled progress toward the ask, "Won by `Party`" tag once claimed, and while unclaimed/still your turn: "+10K" / "+25K" quick-contribute buttons plus a "✕" clear-draft button once you've drafted a contribution.
  - **Map**, fills remaining width — a live Leaflet map of the 70 constituencies, each polygon click-selectable, colored by current leader/owner (see Interactions).
- **Bottom bar** (88px, white-ish, top border): horizontally scrollable scoreboard chips (one per player: color-bordered card with optional symbol, party name, "`N` seats · ready/deciding" status — your own chip has a light highlight background), then "MY BUDGET THIS TURN / ₹`n`K left" right-aligned, then the submit button ("Submit Turn" navy, or "Submitted" grayed-out+disabled once you've locked in).

### 5. Seat detail modal (opened by clicking a constituency)
- Dark overlay (`oklch(20% 0.01 80 / 0.45)`) + centered white card, 420px wide, 18px radius, pop-in animation (scale 0.9→1, 0.15s).
- Header (navy background, matches top bar): seat name (20px/800 Poppins), "Seat `n` of 70 · `Parent Lok Sabha segment`" subline, "✕" close.
- Stat row: "ELECTORS (EST.)" and "WIN TARGET" (₹`threshold`K), 16px/800 values.
- Per-player progress rows sorted by current total, each: party name (+"(you)" on yours) and "₹`total`K" (+ "(+`n`K pending)" in gray if you have an uncommitted draft this turn), with a 9px progress bar toward the seat's threshold in the party's color.
- If locked: a centered pill ("`Party` has won this seat" or "No campaign contested this seat — stays independent").
- If still open and it's your turn to act: "+₹10K" / "+₹25K" / "+₹50K" quick-spend buttons + a "Clear" button once you've drafted spend on this seat.

### 6. Waiting overlay
- Full-screen near-opaque overlay once you've submitted and others haven't: spinner (36px ring, navy top segment, 0.8s linear spin), "Waiting for other campaigns…" (18px/800 Poppins), and a line naming which parties are still deciding.

### 7. End-of-turn summary modal
- Dark overlay + white card (520px, scrollable to 82vh): "End of Turn `n`" heading (22px/800 navy).
- One row per player: colored dot + party name + "spent ₹`n`K" (right-aligned, gray), then any of: "Won: `seat names`", "Group secured: `group names`" (green, `oklch(55% 0.14 145)`), "Paid contest fees in `n` seat(s)" (red, `oklch(55% 0.18 25)`) when 2+ players spent on the same seat this turn, or "No seats or groups secured this turn" (gray) if nothing happened.
- Full-width navy button: "Continue to Turn `n+1`" or "See Final Results" on the last turn.

### 8. Final results screen
- Full-screen centered column: "Final Result — 70 Seats" (30px/800 navy), a colored pill banner naming the majority winner (≥36 seats) or the seat leader needing a coalition, then a horizontal bar-chart standings list (party name label + colored bar sized to seat share, seat count printed inside the bar), then a "New Game" button that resets everything back to Landing.

## Interactions & Behavior
- **Map coloring** (both the live game map and, separately, the static reference map's hover states):
  - Unclaimed, no bids yet: white fill, low opacity, light gray outline.
  - Unclaimed, has bids: fill = current leading player's color at ~35% opacity, gray outline.
  - Locked to a player: fill = that player's color at 90% opacity, white outline, 1.5px weight.
  - Locked "independent" (forced at final turn with no bidders): flat gray fill.
  - Hover: outline weight increases (1.3→2.6 on the static map; 1→2.5 on the game map), reverts on mouseout.
  - Click: opens the seat detail modal (game) or zooms/fits bounds to that constituency (static map).
- **Blind bidding / turn resolution** (all players submit simultaneously; nothing resolves until every player has hit Submit):
  1. Seat spends: for each seat with ≥2 different players spending in the same turn, each spender's contribution is reduced by a flat conflict fee × (number of extra contestants) before being added to their running total on that seat — a tax for contesting the same seat as an opponent, and it generates a "conflict" event shown in the summary.
  2. Group spends: added directly to that player's running pool on the group (no conflict fee).
  3. Any interest group whose top contributor's pool has reached its ask is claimed by that contributor; the claim grants a one-time budget bonus added to their *next* turn's budget.
  4. Any seat where the leader has reached the win threshold **and** leads the runner-up by at least a fixed fraction of that threshold locks to the leader immediately.
  5. On the final turn only, every still-unlocked seat is force-locked to whoever's leading (or to "independent" if nobody bid on it at all).
  6. Every player's total-spent tally updates, `ready` resets to false, and next turn's budget = base budget + any pending bonus.
- Spend buttons are disabled/no-ops once your remaining budget can't cover the increment, once a seat/group is already locked/claimed, or once you've submitted your turn.
- Rejoin/refresh: a player's browser remembers their room + player id (session-scoped) and rejoins the same game automatically on reload; if the room no longer exists the session is cleared and they return to Landing.

## State Management
Everything hangs off one `room` object (currently persisted as one JSON blob per room code):

```
room = {
  code, phase: 'lobby' | 'playing' | 'gameover',
  turn, maxTurns, budgetPerTurn, hostId,
  players: { [playerId]: {
    id, name, partyName, color, symbol (dataURL|null),
    seatsWon, totalSpent, ready, budgetThisTurn, pendingBonus
  } },
  seats: { [acNo]: {
    acNo, name, pcName, electors, threshold,
    locked: null | playerId | 'INDEPENDENT',
    progress: { [playerId]: amountSpent }
  } },
  groups: [{ id, name, short, ask, claimedBy, progress: { [playerId]: amount } }],
  pendingTurn: { turnNumber, submissions: { [playerId]: { seatSpends: {acNo: amt}, groupSpends: {gid: amt} } } },
  turnLog: [{ turn, events: [...], perPlayerSpend: {playerId: amount} }]
}
```
Local (per-tab, transient) UI state: current screen/step, form inputs, which seat's modal is open, and this player's *draft* (uncommitted) spends for the turn in progress — drafts are cleared on submit.

Event types logged per turn: `conflict` (fee charged), `group_claim`, `lock`, `forced_lock` — the summary and map both derive from these plus the room state.

## Design Tokens
**Colors** (all defined in OKLCH):
- Background: `oklch(97% 0.01 80)` (app canvas) / `oklch(99% 0.003 80)` and `oklch(99.3% 0.002 80)` (panels/cards)
- Border/hairline: `oklch(88% 0.01 80)` / `oklch(89% 0.004 80)`
- Text primary: `oklch(22% 0.01 80)` / `oklch(23% 0.01 80)`
- Text secondary/muted: `oklch(50% 0.01 80)`
- Brand navy (headers, primary buttons, accents): `oklch(26% 0.04 260)`
- Accent orange (turn pill): `oklch(72% 0.15 55)`
- Success green (group secured): `oklch(55% 0.14 145)`
- Error/warning red: `oklch(55% 0.18 25)`
- Progress track: `oklch(93% 0.005 80)`
- Party color palette (8 fixed swatches, assigned by pick order): red `oklch(62% 0.19 25)`, orange `oklch(66% 0.17 55)`, gold `oklch(72% 0.15 95)`, green `oklch(64% 0.15 140)`, teal `oklch(60% 0.13 195)`, blue `oklch(58% 0.16 250)`, purple `oklch(60% 0.18 300)`, magenta `oklch(62% 0.19 340)`
- Static map's constituency group-hue coding cycles through hues `[25, 70, 122, 175, 225, 270, 320]` at `oklch(74% 0.1 H)` fill / `oklch(38% 0.1 H)` stroke (used per parent Lok Sabha segment there; not used in the game itself, which colors seats by owning party instead).

**Typography**: Headings/buttons/labels use **Poppins** (weights 700/800) from Google Fonts; body/paragraph text uses system **Helvetica/Arial** sans-serif. Sizes range from 11px (chip metadata) to 48px (room code); most primary buttons are 15–16px/700.

**Radii**: small chips/buttons 6–10px, cards 12–14px, larger panels/modals 18–20px, pills/circular swatches fully round.

**Shadows**: only the seat modal uses one — `0 20px 60px oklch(20% 0.01 80 / 0.3)`.

**Spacing**: mostly 8/10/12/14/16/20/24px steps; sidebar fixed at 250px, top bar 56px, bottom bar 88px, modals 420–520px wide.

## Assets
- **Leaflet 1.9.4** (map library) — loaded from `unpkg.com` CDN in both files; keep as a dependency or swap for the target stack's map library of choice (Mapbox GL, MapLibre, etc.) as long as it can render GeoJSON polygons with per-feature styling and click/hover handlers.
- **Poppins** — Google Fonts, weights 700/800.
- **`delhi_AC.json`** — GeoJSON boundary data for all 70 Delhi Vidhan Sabha constituencies (AC number, name, SC-reservation flag, parent Lok Sabha segment), sourced from the `HindustanTimesLabs/shapefiles` GitHub repo (`state_ut/delhi/assembly/delhi_AC.json`). Included in this bundle as-is.
- **Elector counts are estimated**, not census data: `delhi-game-data.js`'s `estimateElectors()` derives a per-seat elector figure by distributing Delhi's real 2025 CEO total electorate across seats proportional to each polygon's shape area (anchored to the real min/max seat sizes). Flag this to stakeholders if real per-seat elector counts become available and should replace the estimate.
- **Party symbols** are user-uploaded images (client-side cropped/resized) — no bundled symbol assets.

## Files
- `Delhi Election Game (reference).html` — full game reference (all screens + logic), see "About the Design Files" above for how to read it. Originally authored as `Delhi Election Game.dc.html`.
- `delhi-game-data.js` — plain-JS game constants and pure logic (`resolveTurn`, `loadSeats`, `estimateElectors`, `computeThreshold`, centroid helpers). Reusable largely as-is.
- `delhi-assembly-map.html` — standalone constituency map reference, plain HTML/CSS/JS, no proprietary syntax.
- `delhi_AC.json` — the GeoJSON source data both files load at runtime.
