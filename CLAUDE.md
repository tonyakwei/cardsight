# CardSight

## What this is

CardSight is the QR code infrastructure for **Twisting Tales** (formerly Twin Tale Crossroads / TTC), a live social game by **All Together Now**. Twisting Tales seats 15-24 players across 3-4 teams ("houses") for an evening of collaborative puzzle-solving and consequential storytelling across three acts.

Physical cards with QR codes are distributed across all houses' tables. Players scan cards to catalog their clue categories (inventory phase), trade cards between houses to acquire what they need, then examine cards to reveal clue content and solve missions. The content lives in a database, not on the card, so the same physical cards can serve different games and different acts.

## Design philosophy

- **The phone is a momentary portal.** Players scan, see content briefly, write things down, and put the phone away. The app is not a sustained digital experience — it's fast, beautiful for 30-90 seconds, then gets out of the way.
- **The story is the container.** CardSight delivers narrative and puzzle content, but the real experience happens in conversation, on paper, and between people.
- **Permission, not obligation.** Scanning should feel like opening a gift, not doing homework.
- **The host is the live intelligence.** The admin interface gives real-time visibility and control.
- **Physical-first solving.** Clue materials (maps, star charts, images) are printed for hands-on solving away from screens. The phone is for scanning QR codes and entering answers, not sustained engagement.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Mantine UI 7, React Router 7 |
| Backend | Express 5 |
| Database | PostgreSQL 16 (Docker for local dev) |
| ORM | Prisma |
| Package manager | pnpm (workspaces) |
| Node | Managed via Volta |

## Monorepo structure

```
cardsight/
├── client/                    # React app (Vite)
│   ├── src/
│   │   ├── api/
│   │   │   ├── admin.ts             # Barrel re-export for all admin API functions
│   │   │   ├── admin/               # Split admin API by domain
│   │   │   │   ├── common.ts        # BASE constant, card sets, houses, designs
│   │   │   │   ├── games.ts         # Game CRUD, duplicate
│   │   │   │   ├── cards.ts         # Card CRUD, bulk, reorder, delete, QR
│   │   │   │   ├── missions.ts      # Mission CRUD, act-break
│   │   │   │   ├── showtimes.ts     # Showtime CRUD, trigger, reset
│   │   │   │   ├── dashboard.ts     # Live dashboard, act transitions
│   │   │   │   ├── answers.ts       # Answer template CRUD
│   │   │   │   └── simulator.ts     # Table simulator
│   │   │   ├── cards.ts             # Player-facing card API
│   │   │   ├── missions.ts          # Player-facing mission API
│   │   │   └── showtime.ts          # Player-facing showtime API
│   │   ├── hooks/
│   │   │   ├── useAdminList.ts      # Shared CRUD list hook (game + items + extras + polling)
│   │   │   └── useSectionCollapse.ts # SessionStorage-backed collapsible section state
│   │   ├── components/
│   │   │   ├── card-viewer/         # Player-facing scan experience
│   │   │   │   ├── animations/      # FadeIn, SlideUp, GlitchIn, DecryptIn
│   │   │   │   ├── overlays/        # Scanlines, StaticNoise, Glow, Particles
│   │   │   │   ├── answers/         # SingleAnswerInput
│   │   │   │   ├── states/          # Loading, NotFound, LockedOut, SelfDestructed, AlreadyAnswered
│   │   │   │   ├── CardViewer.tsx, CardShell.tsx, CardContent.tsx
│   │   │   │   ├── PhysicalCardFlash.tsx  # Physical card identity flash on scan
│   │   │   │   ├── SplashGate.tsx, SelfDestructTimer.tsx, VisibilityGuard.tsx
│   │   │   ├── mission-viewer/      # Player-facing mission scan experience
│   │   │   │   ├── MissionViewer.tsx     # Main orchestrator (house picker, answer, completion)
│   │   │   │   ├── MissionAnswerInput.tsx # Answer input for missions
│   │   │   │   └── RequiredClues.tsx     # Required clue category badges
│   │   │   ├── showtime/           # Player-facing Showtime experience
│   │   │   │   ├── ShowtimeViewer.tsx    # Main orchestrator (polling, phase state machine)
│   │   │   │   ├── ShowtimeConsole.tsx   # Slot grid + sync button
│   │   │   │   ├── ShowtimeSlot.tsx      # Individual slot (editable/read-only)
│   │   │   │   ├── SyncButton.tsx        # Synchronized press button
│   │   │   │   └── ShowtimeReveal.tsx    # Reveal content display
│   │   │   └── admin/              # Admin panel
│   │   │       ├── AdminLayout.tsx       # AppShell with gold/dark theme, sidebar nav within games
│   │   │       ├── CollapsibleSection.tsx # Reusable collapsible section with sessionStorage persistence
│   │   │       ├── HostConsole.tsx        # Mobile host console (5-tab: pulse, activity, cards, missions, showtime)
│   │   │       ├── PrintCenter.tsx       # Unified print hub (story sheets, consequence cards)
│   │   │       ├── GameList.tsx          # Game cards
│   │   │       ├── CardManager.tsx       # Card list with set tabs, act grouping, mission summary
│   │   │       ├── CardRow.tsx           # Expandable card with inline editing + answer template editor
│   │   │       ├── AnswerTemplateEditor.tsx # Reusable answer editor (cards + showtime slots)
│   │   │       ├── PhonePreview.tsx, SetReviewBanner.tsx, BulkActionBar.tsx
│   │   │       ├── MissionManager.tsx    # Mission CRUD by house tabs + act groups
│   │   │       ├── ActBreakView.tsx      # Per-house mission results for host
│   │   │       ├── ConsequencePrint.tsx  # Printable consequence cards, themed (Space/Explorer)
│   │   │       ├── StorySheetManager.tsx  # Story sheet CRUD by house tabs + act groups
│   │   │       ├── StorySheetPrint.tsx   # Printable story sheets with mission list
│   │   │       ├── ShowtimeManager.tsx   # Showtime CRUD, live monitoring, force trigger/reset
│   │   │       ├── LiveDashboard.tsx     # Real-time game dashboard (auto-polls 5s)
│   │   │       └── simulator/           # Table assignment simulator
│   │   │           ├── TableSimulator.tsx, TableColumn.tsx
│   │   │           ├── SimCardChip.tsx, PreviewSidebar.tsx
│   │   ├── utils/session.ts
│   │   └── styles/global.css
│   ├── public/
│   │   ├── landing.html             # ATN static landing page (served at /)
│   │   └── images/forgotten-files/  # Gallery photos for landing page
│   └── vite.config.ts         # Proxy /api → server
├── server/                    # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── cards.ts              # Player-facing card routes
│   │   │   ├── missions.ts           # Player-facing mission routes
│   │   │   ├── showtime.ts           # Player-facing showtime routes
│   │   │   ├── admin.ts              # Barrel composing sub-routers
│   │   │   └── admin/                # Split admin routes by domain
│   │   │       ├── card-routes.ts    # Cards, card sets, houses, simulator, QR
│   │   │       ├── mission-routes.ts # Missions, act-break
│   │   │       ├── showtime-routes.ts# Showtimes, trigger, reset
│   │   │       └── game-routes.ts    # Games, duplicate, dashboard, designs, answers
│   │   ├── services/
│   │   │   ├── card.service.ts       # Player scan flow (lockout, self-destruct, answers, mission auto-complete)
│   │   │   ├── mission.service.ts    # Player mission flow (viewer, scan, answer, completion)
│   │   │   ├── showtime.service.ts   # Player showtime flow (slots, sync press, reveal)
│   │   │   ├── answer-validation.ts  # Shared answer validation (used by card + showtime)
│   │   │   ├── admin.service.ts      # Barrel re-export for all admin services
│   │   │   ├── admin/                # Split admin services by domain
│   │   │   │   ├── card-admin.service.ts     # Card CRUD, bulk, reorder, reset
│   │   │   │   ├── cardset-admin.service.ts  # Card set CRUD, reviews
│   │   │   │   ├── house-admin.service.ts    # House CRUD, simulator
│   │   │   │   ├── mission-admin.service.ts  # Mission CRUD, act-break summary
│   │   │   │   ├── showtime-admin.service.ts # Showtime CRUD, trigger, reset
│   │   │   ├── storysheet-admin.service.ts # Story sheet CRUD, print data
│   │   │   │   ├── game-admin.service.ts     # Game CRUD, duplicate, act transitions, answers, designs
│   │   │   │   └── dashboard.service.ts      # Live dashboard aggregation
│   │   │   └── qr.service.ts        # QR code PNG generation
│   │   ├── middleware/error-handler.ts
│   │   ├── validation/
│   │   │   ├── cards.ts              # Card Zod schemas
│   │   │   ├── missions.ts           # Mission Zod schemas
│   │   │   └── showtime.ts           # Showtime Zod schemas
│   │   └── lib/prisma.ts
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.ts
│       └── seed-test-game.ts    # "The Blackwood Files" test game (idempotent)
├── shared/                    # Shared TypeScript types
│   ├── types.ts               # Player-facing types + barrel for admin-types
│   ├── admin-types.ts         # All Admin* interfaces (single source of truth)
│   └── physical-cards.json    # 54 physical card definitions (UUIDs, colors, names, Short.io links)
├── tools/                     # Design and print tooling
│   └── card-preview.html      # Physical card design preview (standalone, open in browser)
├── docker-compose.yml         # Postgres 16
├── railway.json               # Railway deployment config
└── package.json               # Volta pins, workspace scripts
```

## Data model overview

- **Game** — one complete configuration for an evening. Has status (draft/active/completed/archived), `currentAct` (tracks which act is live, updated by `transitionAct`). Only one active at a time.
- **Card** — a QR-scannable unit of content. Belongs to a game. Has a required `physicalCardId` (UUID linking to an entry in `physical-cards.json` — unique per game per act) and a required `act` field (Int, default 1). The same physical card can map to different game cards in different acts, enabling physical card reuse across acts (54 cards serve all 3 acts; collected and redistributed at act breaks). Three naming layers: `cardSet.name` for dev tracking/mission grouping (e.g., "Stone"), `clueVisibleCategory` for the player-facing clue category shown on scan (e.g., "Broken Stone Lettering"), and `header` (optional) for per-card narrative flavor headings shown on the card content (e.g., "The Fragment of Orion"). The physical card's permanent printed name (e.g., "Nervous Bumblebee") lives in `physical-cards.json` and is looked up by `physicalCardId`. Has a design, optional answer template, optional self-destruct timer. Can be assigned to a CardSet and multiple Houses. Every card shows a splash gate before content (showing clue category + EXAMINE button); once examined, subsequent scans skip the splash. Cards have a `complexity` field: `simple` (default) shows the clue directly, `complex` shows a puzzle with an answer input and reveals `clueContent` on solve.
- **CardSet** — first-class grouping (e.g., "Signals", "Navigation"). Has name, color, admin notes (editable inline). Cards are filtered by set in the admin. Set reviews track which sets have been reviewed since last edit. Each set tab shows which missions reference it.
- **House** — a team/agency (e.g., "Alpha", "Bravo"). Has name, color. Cards have a many-to-many relationship with houses via CardHouse join table.
- **Mission** — a task for specific house(s) in a specific act. ~6 per house per act, teams complete 3-4. Has title, description, `puzzleDescription` (shown to players), required clue sets (references CardSet IDs with counts), optional mission card link, optional Design for theming, and polymorphic answer template. Player-scannable via QR codes at `/m/:missionId`. Many-to-many with houses via MissionHouse (supports collaborative cross-house missions). Contains consequence texts (completed/not completed) with optional images. Can be locked with `lockedOut`/`lockedOutReason` (used by future act consequences system).
- **MissionHouse** — join table linking missions to houses. A mission can belong to one or multiple houses.
- **StorySheet** — narrative document per house per act. Contains the situation description and lists available missions. Has title, markdown content, admin notes. Unique constraint on game+house+act. Editable in admin with house tabs and act grouping. Print view shows content with linked missions listed. Duplicated with games.
- **Showtime** — a synchronized reveal event (1-2 per game, at act transitions). Players discover it through mission cards — each house sees a "shared analysis console" with input slots. Phase state machine: `filling` → `syncing` → `revealed`. Has reveal content (title, markdown description) with a Design for theming. Configurable sync window (default 3s).
- **ShowtimeSlot** — one slot per house per Showtime. Has label, description, optional answer validation (polymorphic), input value, fill/sync press timestamps. The sync press logic checks if all houses pressed within the sync window — if yes, reveal; if not, reset presses.
- **Design** — reusable visual configuration (colors, fonts, animations, overlays). Multiple cards share designs.
- **SingleAnswer** — answer template for text-input puzzles (correct answer, alternatives, hints). Polymorphic pattern: `answerTemplateType` + `answerId` on Card/Mission, resolved manually in card.service.ts. Future types (multiple choice, photo select, etc.) are additive — new table + new UI component.
- **ScanEvent** / **AnswerAttempt** — analytics logs.
- **SetReview** — tracks when admin last reviewed a card set. Used to show "N cards modified since review" badges.

## Key architectural decisions

- **Physical card reuse across acts** — 54 physical cards serve all 3 acts (54 / 3 houses = 18 per house per act). At act breaks, the host collects all cards and redistributes. The same physical card can map to different game cards in different acts via the `@@unique([gameId, physicalCardId, act])` constraint. This design also supports future "no reuse" mode (one game card per physical card across the whole game) without code changes — it's purely a content authoring decision.
- **QR scan resolution** — QR codes embed physical card UUIDs (`/c/<physicalCardUUID>`). The `resolveCard()` helper in `card.service.ts` first tries the ID as a game card UUID (for admin QR preview), then resolves it as a physical card UUID by finding the active game and looking up the card for `game.currentAct`. If the card exists in a different act, returns 410 ("wrong act"). All 4 player-facing card functions use this resolver.
- **Polymorphic answers** — `answerId` on Card/Mission is NOT a Prisma relation. The service layer resolves it by `answerTemplateType`. Adding new answer types is purely additive.
- **Self-destruct is server-authoritative** — timer starts when player presses the EXAMINE button (POST `/api/cards/:id/examine`), not on page load. Client counts down from server timestamp.
- **Splash gate** — every card shows a splash screen on first scan displaying the clue category and an EXAMINE button with a warning. Once examined (`examinedAt` is set on Card), subsequent scans skip the splash and go straight to content. Timer starts on examine, not on scan.
- **Simple vs complex cards** — `complexity` field on Card. Simple cards (`"simple"`, default) show `description` as the clue directly, no answer input. Complex cards (`"complex"`) show `description` as a puzzle with answer input; `clueContent` is revealed after solving. The server enforces this: `isAnswerable` is only true for complex cards in the viewer response.
- **"Solved" is card-level** — once any player answers correctly, the card is solved for everyone. Each house gets distinct cards, so no per-house answer tracking needed.
- **Mission auto-completion** — when a card linked as a mission's `missionCardId` is answered correctly, the mission is automatically marked complete in card.service.ts.
- **Missions are player-scannable** — each mission has a QR code linking to `/m/:missionId`. The MissionViewer shows the narrative/puzzle, required clue categories, and an answer input. For multi-house missions, a house picker (stored in sessionStorage as `cardsight_house`) appears first. Mission QR codes are separate from the physical card deck — they're printed on story sheets. Analytics tracked via `MissionScanEvent` and `MissionAnswerAttempt` tables.
- **Missions reference CardSet IDs, not specific cards** — `requiredClueSets` is an array of `{ cardSetId, count }`. This means the mission structure survives across game runs even if specific clue cards change.
- **Act consequences are configurable per-mission** — `MissionConsequence` records define what happens when a mission succeeds or fails at act end. Types: `warning` (text shown on a target mission), `lock` (locks a target mission with explanation), `redistribute` (reminder to host about physical card redistribution). When admin hits "End Act", `transitionAct` evaluates each mission's completion per house and creates `TriggeredConsequence` records. Lock consequences immediately set `lockedOut` on the target mission. Warning consequences are fetched by the player-facing mission viewer and displayed as yellow callouts. Redistribute consequences appear in the act break view for the host. All consequences are configurable per-mission in the admin with type, target mission, trigger condition (on failure/success), and message.
- **Consequence cards are physical** — printed on card stock (2-3 per US letter page), not shown on phone screens. The admin has a themed print preview with switchable themes (Space, Explorer), markdown rendering, Google Fonts (loaded dynamically), and `print-color-adjust: exact` for dark backgrounds. Theme system is defined in `ConsequencePrint.tsx` via a `CardTheme` interface driving fonts, colors, backgrounds, and border styles. Print link lives in MissionManager toolbar.
- **Act transitions are explicit** — "End Act N" button locks current act's cards, unlocks next act's cards, updates `game.currentAct`, evaluates mission consequences, and navigates to the act break view. The `currentAct` field is the authoritative source for which act a game is in — used by the QR scan resolver and dashboard.
- **Showtime uses polling, not WebSockets** — FILLING phase polls every 3s, SYNCING phase polls every 500ms, REVEALED phase stops. In a room of people shouting a countdown, sub-second stagger is imperceptible.
- **Sync press is server-authoritative** — each house POSTs their press timestamp. Server checks within a Prisma transaction if all presses fall within the sync window. If not, resets all presses atomically.
- **Answer validation is shared** — `validateAnswer()` is extracted to `server/src/services/answer-validation.ts` and used by both card.service.ts and showtime.service.ts.
- **Card designs use CSS custom properties** — `CardShell` maps design fields to `--card-*` variables. No CSS-in-JS runtime. Animations use CSS `@keyframes`.
- **Physical card flash is client-side only** — `PhysicalCardFlash` imports `physical-cards.json` directly (bundled by Vite) and looks up the card by UUID. No server call needed for the flash. The `act` field from the API response (which loads concurrently) determines the exit transition; defaults to act 1 if the fetch hasn't completed yet. Themes, icons, and all 6 transition keyframes are self-contained in the one component.
- **Visibility guard** — blurs content when player switches away from the browser tab (anti-screenshot).
- **Admin sidebar navigation** — when inside a game (`/admin/games/:gameId/*`), `AdminLayout` shows a persistent sidebar with links to all game sections (Cards, Missions, Story Sheets, Showtimes, Dashboard, Act Break, Simulator, Print Center). Individual page headers no longer have cross-page navigation buttons.
- **Collapsible sections** — CardRow and MissionRow use `CollapsibleSection` to group fields into expandable sections (Content, Behavior, Answer for cards; Content, Houses & Clues, Consequences for missions). Collapse state is persisted in sessionStorage via `useSectionCollapse` hook — sections default to expanded but stay collapsed once collapsed until the session ends.
- **Admin auth** — HTTP Basic Auth on all `/api/admin/*` routes via `adminAuth` middleware. Controlled by `ENV_LEVEL` env var: skipped when not `production`. Client stores base64 credentials in `sessionStorage`, sends via `Authorization: Basic` header through the `adminFetch()` wrapper in `client/src/api/admin/common.ts`. QR image URLs pass token as `?token=` query param (since `<img src>` can't set headers). Login gate lives in `AdminLayout.tsx`, verifies via `GET /api/admin/verify`.

## Running locally

```bash
docker compose up -d              # Start Postgres
pnpm install                      # Install deps
pnpm db:migrate                   # Apply migrations (may need interactive terminal)
pnpm db:seed                      # Seed sample data
pnpm dev                          # Start server (port 3001) + client (port 5173)
```

If `pnpm dev` doesn't start both, run them separately:
```bash
pnpm dev:server                   # Express on port 3001
pnpm dev:client                   # Vite on port 5173 (proxies /api → 3001)
```

Admin panel: http://localhost:5173/admin

### Seeding a test game

```bash
pnpm db:seed-test                 # Seed "The Blackwood Files" test game (idempotent)
```

**"The Blackwood Files"** is a complete 3-act test game: three rival newspapers (The Herald, The Beacon, The Chronicle) investigate a $40M government fraud. It creates 54 cards (18 physical cards reused across 3 acts, 6 per house per act), 19 missions (2 per house per act + 1 cross-house in Act 1), 5 card sets (Sources, Documents, Photos, Money Trail, Connections), 7 complex cards with answers, 4 missions with answers, 3 consequences (warning, lock, redistribute), 9 story sheets (1 per house per act), 1 showtime (Act 3 "Press Publish" synchronized reveal), and 5 designs. The script is idempotent — it deletes any existing "The Blackwood Files" game before recreating it. Can also be run against a remote DB by setting `DATABASE_URL`:

```bash
DATABASE_URL="postgres://..." pnpm db:seed-test
```

### Environment variables (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | (local Postgres) | Prisma connection string |
| `PORT` | `3001` | Express server port |
| `ENV_LEVEL` | `development` | `development` skips admin auth; `production` requires it |
| `ADMIN_USER` | `anthony` | Admin login username (used when `ENV_LEVEL=production`) |
| `ADMIN_PASS` | `niceday100` | Admin login password (used when `ENV_LEVEL=production`) |

## Admin pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | GameList | Game cards, create/duplicate games |
| `/admin/games/:id` | CardManager | Card list with set tabs, inline editing, set notes, mission summary per set |
| `/admin/games/:id/missions` | MissionManager | Mission CRUD by house tabs + act groups, consequence editing, print link |
| `/admin/games/:id/story-sheets` | StorySheetManager | Story sheet CRUD by house tabs + act groups |
| `/admin/games/:id/story-sheets/print` | StorySheetPrint | Printable story sheets with mission lists |
| `/admin/games/:id/act-break` | ActBreakView | Per-house mission results, consequence texts for host to read |
| `/admin/games/:id/act-break/print` | ConsequencePrint | Printable consequence cards (2-3 per US letter), switchable themes (Space/Explorer), markdown support |
| `/admin/games/:id/dashboard` | LiveDashboard | Real-time stats: scans, discovery, answers, mission progress (auto-polls every 5s) |
| `/admin/games/:id/showtimes` | ShowtimeManager | Showtime CRUD, slot config, live monitoring, force trigger/reset |
| `/admin/games/:id/simulator` | TableSimulator | Card-to-table distribution simulator with physical card name toggle |
| `/admin/games/:id/console` | HostConsole | Mobile host console — pulse, activity feed, card/mission lock, showtime control |
| `/admin/games/:id/print` | PrintCenter | Unified print hub (story sheets, consequence cards) |
| `/m/:missionId` | MissionViewer | Player-facing mission scan (narrative, puzzle, required clues, answer) |
| `/showtime/:id?house=:houseId` | ShowtimeViewer | Player-facing synchronized analysis console + reveal |

## API structure

### Player-facing (no auth)
```
# Cards
GET   /api/cards/:cardId          # Card content (respects lockout, self-destruct, includes clueVisibleCategory)
POST  /api/cards/:cardId/scan     # Log scan event
POST  /api/cards/:cardId/examine  # Examine card (starts self-destruct timer)
POST  /api/cards/:cardId/answer   # Submit answer (auto-completes linked missions)

# Missions
GET   /api/missions/:missionId           # Mission content for viewer
POST  /api/missions/:missionId/scan      # Log scan event
POST  /api/missions/:missionId/answer    # Submit answer (marks mission complete)

# Showtime
GET   /api/showtime/:id?house=:houseId           # Full console view
GET   /api/showtime/:id/poll?house=:houseId       # Lightweight poll (phase, slot status)
POST  /api/showtime/:id/submit?house=:houseId     # Submit slot value
POST  /api/showtime/:id/sync-press?house=:houseId # Record synchronized button press
```

### Admin (HTTP Basic Auth in production, open in development)
```
# Games
GET   /api/admin/games
GET   /api/admin/games/:gameId
POST  /api/admin/games
POST  /api/admin/games/:gameId/duplicate

# Cards
GET   /api/admin/games/:gameId/cards
GET   /api/admin/games/:gameId/cards/:cardId
PUT   /api/admin/games/:gameId/cards/:cardId
POST  /api/admin/games/:gameId/cards
DELETE /api/admin/games/:gameId/cards/:cardId
POST  /api/admin/games/:gameId/cards/:cardId/restore
POST  /api/admin/games/:gameId/cards/:cardId/reset
POST  /api/admin/games/:gameId/reset
PUT   /api/admin/games/:gameId/cards/reorder
POST  /api/admin/games/:gameId/cards/bulk
GET   /api/admin/games/:gameId/cards/:cardId/qr

# Card Sets
GET   /api/admin/games/:gameId/card-sets
POST  /api/admin/games/:gameId/card-sets
PUT   /api/admin/games/:gameId/card-sets/:id
POST  /api/admin/games/:gameId/card-sets/:id/review

# Houses
GET   /api/admin/games/:gameId/houses
POST  /api/admin/games/:gameId/houses
PUT   /api/admin/games/:gameId/houses/:id

# Missions
GET   /api/admin/games/:gameId/missions
GET   /api/admin/games/:gameId/missions/:missionId
POST  /api/admin/games/:gameId/missions
PUT   /api/admin/games/:gameId/missions/:missionId
DELETE /api/admin/games/:gameId/missions/:missionId
GET   /api/admin/games/:gameId/missions/:missionId/qr
GET   /api/admin/games/:gameId/missions/:missionId/consequences
POST  /api/admin/games/:gameId/missions/:missionId/consequences
PUT   /api/admin/games/:gameId/consequences/:consequenceId
DELETE /api/admin/games/:gameId/consequences/:consequenceId

# Act Break & Transitions
GET   /api/admin/games/:gameId/act-break/:act
POST  /api/admin/games/:gameId/transition-act

# Live Dashboard
GET   /api/admin/games/:gameId/dashboard

# Showtimes
GET    /api/admin/games/:gameId/showtimes
POST   /api/admin/games/:gameId/showtimes
GET    /api/admin/games/:gameId/showtimes/:id
PUT    /api/admin/games/:gameId/showtimes/:id
DELETE /api/admin/games/:gameId/showtimes/:id
POST   /api/admin/games/:gameId/showtimes/:id/trigger
POST   /api/admin/games/:gameId/showtimes/:id/reset

# Story Sheets
GET    /api/admin/games/:gameId/story-sheets
GET    /api/admin/games/:gameId/story-sheets/:id
POST   /api/admin/games/:gameId/story-sheets
PUT    /api/admin/games/:gameId/story-sheets/:id
DELETE /api/admin/games/:gameId/story-sheets/:id
GET    /api/admin/games/:gameId/story-sheets/print/:act

# Other
GET   /api/admin/games/:gameId/designs
GET   /api/admin/games/:gameId/answers/:type
GET   /api/admin/games/:gameId/simulator
PUT   /api/admin/games/:gameId/simulator
POST  /api/admin/games/:gameId/simulator/auto-distribute
```

## What's built vs. what's planned

**Built:**
- Full scan flow (QR → physical card flash → splash gate (clue category + EXAMINE) → content → self-destruct → answer → feedback). Simple cards show clue directly; complex cards show puzzle with answer input, then reveal clue on solve.
- Physical card flash on scan — when a card's UUID matches a physical card in `physical-cards.json`, a CSS replica of the physical card (color, borders, name, icon) displays for 700ms before an exit transition reveals the game content. Transition escalates by act: Act 1 (fade, iris), Act 2 (slice, flip), Act 3 (glitch, burn — 1.8s with escalating shake/corruption). Card number determines which of the two transitions per act: 1-5 gets one, 6-9 gets the other. Runs concurrently with the API fetch, so no added latency.
- `clueVisibleCategory` shown to players on card content (so they know what type of clue they're collecting)
- Visual polish (4 entry animations, 4 overlay effects, self-destruct countdown)
- Admin panel (game list, card management with inline editing, set tabs with review tracking, phone preview, QR generation)
- CardSet and House as first-class entities with colors and many-to-many
- Card set notes editable inline in admin
- Mission system (CRUD, house assignment, required clue sets, consequence texts, QR codes, player-facing viewer at `/m/:missionId` with house picker, required clues display, answer input)
- Mission auto-completion when linked mission card is answered correctly
- Act break view (per-house mission results with consequence texts for host)
- Consequence card print preview (2-3 per US letter page, switchable themes: Space with Audiowide/Exo 2 fonts + nebula bg, Explorer with Cinzel/Crimson Text fonts + aged parchment bg, markdown rendering)
- Live game dashboard (real-time scans, card discovery, answer attempts, mission progress, auto-polls every 5s)
- Act transition workflow (lock current act cards, unlock next act cards, evaluate and trigger mission consequences)
- Act consequences system (configurable per-mission: warning/lock/redistribute, triggered on act end, shown in act break view and player mission viewer)
- Game duplication (deep-copies cards, designs, answers, card sets, houses, missions)
- Table assignment simulator with auto-distribute and physical card name toggle (looks up `physical-cards.json` by UUID)
- Bulk card operations (assign design/set/act, lock/unlock, mark finished, delete, reset)
- Soft delete / restore for cards
- Card reordering
- Showtime synchronized reveal mechanic (multi-house analysis console, slot filling, sync press, dramatic reveal)
- Showtime admin (CRUD, slot configuration, live monitoring with auto-refresh, force trigger, reset)
- Showtime integrated into game reset and duplication
- Admin authentication (HTTP Basic Auth, env-controlled via `ENV_LEVEL`)

- Story sheets (per house per act narrative documents, markdown editor, print view with mission lists and inline QR codes with transparent backgrounds, duplicated with games)
- Mobile host console (`/admin/games/:id/console`) — phone-optimized 5-tab interface for live game hosting: pulse (stats, discovery, mission progress, end act), activity feed (live scan/answer stream), cards (search by physical name/color/set, lock/unlock/reset), missions (per-act list, lock/unlock), showtimes (slot status, force trigger, reset). Polls every 5s, big tap targets, confirmation dialogs on destructive actions
- Act-based physical card reuse — same 54 physical cards serve all 3 acts; `@@unique([gameId, physicalCardId, act])` constraint; QR scan resolution via `resolveCard()` (physical UUID → active game → current act); wrong-act handling (410 + client message); `game.currentAct` tracking; per-act physical card shuffling; artifact catalog sheets per house per act; act-scoped dashboard stats
- Railway deployment (single service: Express serves API + built Vite client + ATN landing page)

## Deployment (Railway)

Single service deployment on Railway Hobby tier. Express serves everything: the ATN landing page at `/`, the Vite-built React app for all card/admin/showtime routes, and the API.

- **Custom domain:** `alltogethernow.land` → CNAME to Railway (`rf1jww64.up.railway.app`). DNS also has a `_railway-verify` TXT record for SSL cert provisioning. `www` CNAME also points to Railway.
- **QR code links:** Physical cards use Short.io short links (`alltogethernow.land/xyz`) which redirect to card routes on the same domain.
- **Build:** `pnpm install` → `pnpm build` (generates Prisma client, builds client + server in parallel)
- **Start:** `pnpm --filter server prisma migrate deploy && node server/dist/server/src/index.js`
- **Postgres:** Add Railway's Postgres plugin — it auto-sets `DATABASE_URL`
- **Health check:** `GET /api/health`
- **Config:** `railway.json` at project root

The server's compiled output lands at `server/dist/server/src/` (because `rootDir` is `..` to include shared types). The static file path accounts for this.

### Static site integration

The All Together Now landing page (previously hosted on GitHub Pages at `tonyakwei/all-together-now-web`) is now served from CardSight. The static HTML lives at `client/public/landing.html` with gallery images in `client/public/images/`. Vite copies these to `client/dist/` during build. Express route order:

1. API routes (`/api/*`)
2. Static file middleware (`express.static` with `index: false`)
3. Landing page route (`GET /` → `landing.html`)
4. SPA fallback (all other non-API routes → React `index.html`)

## Physical cards

54 large-format playing cards (89mm x 146mm / 3.5" x 5.75", 300 DPI minimum) printed by a card printing service. These are permanent physical objects reused across all games — the same UUIDs are used when creating cards in the database for each new game.

### Card deck structure
- 6 colors: red, yellow, green, blue, purple, white — 9 cards each = 54 total
- Each card has: a **color**, a **number** (1-9), a **unique name** (adjective + noun, e.g. "Thermonuclear Chili"), a **QR code**, and a **center icon**
- Names are game-agnostic, humorous/evocative, and designed to feel like each card is its own little world
- The number is NOT displayed — instead, each number maps to a unique icon:

| # | Icon |
|---|------|
| 1 | Star |
| 2 | Diamond |
| 3 | Crescent Moon |
| 4 | Compass Rose |
| 5 | Shield |
| 6 | Six-pointed Star (Crown) |
| 7 | Flame |
| 8 | Hourglass |
| 9 | All-seeing Eye |

### Card visual design (WIP in `tools/card-preview.html`)
- **Borders**: Three layers from outside in — thin dark edge border, outer color border, gap showing background, inner color border
- **Corner spades**: ♠ shapes at all 4 corners of the inner border, pointing inward, colored to match the border
- **Background**: Card's main color with ATN-style diagonal light shafts (thick bands, rotated 30deg, going top-right to bottom-left) and scattered sparkle dots
- **Layout top to bottom**: Name (large, Cinzel Decorative font, auto-sized to fit, always 2 lines), Icon (center, SVG), QR code (bottom, semi-transparent)
- **QR codes**: Link to `alltogethernow.short.gy/<8-char-slug>` which redirects to `alltogethernow.land/c/<uuid>`. Short.io provides an indirection layer so QR codes survive domain/URL changes
- **Font**: Currently Cinzel Decorative (Google Fonts). User prefers something like "Seagram TFB" — slightly gothic but readable, not full blackletter. Font choice is still being iterated.

### Card data
- `shared/physical-cards.json` — canonical list of all 54 cards with id, slug, color, number, name, shortUrl, destination
- Short.io links already created for all 54 cards under `alltogethernow.short.gy`

**Not yet built:**
- Design editor and answer template editor in admin
- Additional answer types (multiple choice, photo select, etc.)
- Bulk QR code print sheet
- Mission briefing card print layout (matching consequence card style)
