# CardSight

## What this is

CardSight is the QR code infrastructure for **Twin Tale Crossroads (TTC)**, a live social game by **All Together Now**. TTC seats 15-24 players across 3-4 teams ("houses") for an evening of collaborative puzzle-solving and consequential storytelling across three acts.

Physical cards with QR codes are distributed around the room. When a player scans one on their phone, they see styled content — a clue, a puzzle, a mission briefing. The content lives in a database, not on the card, so the same physical cards can serve different games.

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
│   │   ├── api/               # API client functions (cards.ts, admin.ts)
│   │   ├── components/
│   │   │   ├── card-viewer/   # Player-facing scan experience
│   │   │   │   ├── animations/  # FadeIn, SlideUp, GlitchIn, DecryptIn
│   │   │   │   ├── overlays/    # Scanlines, StaticNoise, Glow, Particles
│   │   │   │   ├── answers/     # SingleAnswerInput (more types planned)
│   │   │   │   ├── states/      # Loading, NotFound, LockedOut, SelfDestructed, AlreadyAnswered
│   │   │   │   ├── CardViewer.tsx       # Main orchestrator
│   │   │   │   ├── CardShell.tsx        # Full-viewport design container
│   │   │   │   ├── CardContent.tsx      # Title + clueVisibleCategory label + markdown description
│   │   │   │   ├── EntryGate.tsx        # "Press to enter" gate before content
│   │   │   │   ├── SelfDestructTimer.tsx
│   │   │   │   └── VisibilityGuard.tsx  # Blur on tab switch (anti-screenshot)
│   │   │   └── admin/         # Admin panel
│   │   │       ├── AdminLayout.tsx      # AppShell with gold/dark theme
│   │   │       ├── GameList.tsx         # Game cards
│   │   │       ├── CardManager.tsx      # Card list with set tabs, act grouping, set notes editing, mission summary per set
│   │   │       ├── CardRow.tsx          # Expandable card with inline editing + phone preview
│   │   │       ├── PhonePreview.tsx     # iframe-based card preview
│   │   │       ├── SetReviewBanner.tsx  # "N cards modified" banner
│   │   │       ├── BulkActionBar.tsx    # Bulk operations on selected cards
│   │   │       ├── MissionManager.tsx   # Mission CRUD organized by house tabs + act groups
│   │   │       ├── ActBreakView.tsx     # Per-house mission results + consequence texts for host
│   │   │       ├── ConsequencePrint.tsx # Printable consequence cards (2-3 per US letter page)
│   │   │       ├── LiveDashboard.tsx    # Real-time game dashboard with auto-polling
│   │   │       └── simulator/           # Table assignment simulator
│   │   ├── utils/session.ts
│   │   └── styles/global.css
│   └── vite.config.ts         # Proxy /api → server
├── server/                    # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── cards.ts       # Player-facing: GET card, POST scan, POST enter, POST answer
│   │   │   └── admin.ts       # Admin: games, cards, missions, card sets, houses, QR, designs, dashboard, act transitions
│   │   ├── services/
│   │   │   ├── card.service.ts   # Core scan flow logic (lockout, self-destruct, answer checking, mission auto-completion)
│   │   │   ├── admin.service.ts  # Admin business logic (CRUD, missions, dashboard, act transitions, game duplication)
│   │   │   └── qr.service.ts    # QR code PNG generation
│   │   ├── middleware/error-handler.ts
│   │   ├── validation/cards.ts   # Zod schemas
│   │   └── lib/prisma.ts
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── shared/                    # Shared TypeScript types
│   └── types.ts
├── docker-compose.yml         # Postgres 16
└── package.json               # Volta pins, workspace scripts
```

## Data model overview

- **Game** — one complete configuration for an evening. Has status (draft/active/completed/archived). Only one active at a time.
- **Card** — a QR-scannable unit of content. Belongs to a game. Has a design, optional answer template, optional self-destruct timer, optional entry gate. Can be assigned to a CardSet and multiple Houses. Shows `clueVisibleCategory` to players so they know what type of clue they're collecting.
- **CardSet** — first-class grouping (e.g., "Signals", "Navigation"). Has name, color, admin notes (editable inline). Cards are filtered by set in the admin. Set reviews track which sets have been reviewed since last edit. Each set tab shows which missions reference it.
- **House** — a team/agency (e.g., "Alpha", "Bravo"). Has name, color. Cards have a many-to-many relationship with houses via CardHouse join table.
- **Mission** — a task for specific house(s) in a specific act. ~6 per house per act, teams complete 3-4. Has title, description, required clue sets (references CardSet IDs with counts), optional mission card link, and polymorphic answer template. Many-to-many with houses via MissionHouse (supports collaborative cross-house missions). Contains consequence texts (completed/not completed) with optional images, and mechanical effects as JSONB (store-and-display only, not auto-processed).
- **MissionHouse** — join table linking missions to houses. A mission can belong to one or multiple houses.
- **Design** — reusable visual configuration (colors, fonts, animations, overlays). Multiple cards share designs.
- **SingleAnswer** — answer template for text-input puzzles (correct answer, alternatives, hints). Polymorphic pattern: `answerTemplateType` + `answerId` on Card/Mission, resolved manually in card.service.ts. Future types (multiple choice, photo select, etc.) are additive — new table + new UI component.
- **ScanEvent** / **AnswerAttempt** — analytics logs.
- **SetReview** — tracks when admin last reviewed a card set. Used to show "N cards modified since review" badges.

## Key architectural decisions

- **Polymorphic answers** — `answerId` on Card/Mission is NOT a Prisma relation. The service layer resolves it by `answerTemplateType`. Adding new answer types is purely additive.
- **Self-destruct is server-authoritative** — timer starts when player presses the Entry Gate button (POST `/api/cards/:id/enter`), not on page load. Client counts down from server timestamp.
- **Entry gate** — most cards show a themed button before revealing content (controlled by `hasEntryGate`). Timer starts on enter, not on scan.
- **"Solved" is card-level** — once any player answers correctly, the card is solved for everyone. Each house gets distinct cards, so no per-house answer tracking needed.
- **Mission auto-completion** — when a card linked as a mission's `missionCardId` is answered correctly, the mission is automatically marked complete in card.service.ts.
- **Missions reference CardSet IDs, not specific cards** — `requiredClueSets` is an array of `{ cardSetId, count }`. This means the mission structure survives across game runs even if specific clue cards change.
- **Mechanical effects are store-and-display** — JSONB fields on missions hold structured effect data, but the system does not auto-process them. The host reads the effects and manually adjusts the next act. This is deliberate — effect types are still being discovered through playtesting.
- **Consequence cards are physical** — printed on card stock (2-3 per US letter page), not shown on phone screens. The admin has a print preview with house-colored borders, images, and themed backgrounds.
- **Act transitions are explicit** — "End Act N" button locks current act's cards, unlocks next act's cards, and navigates to the act break view.
- **Card designs use CSS custom properties** — `CardShell` maps design fields to `--card-*` variables. No CSS-in-JS runtime. Animations use CSS `@keyframes`.
- **Visibility guard** — blurs content when player switches away from the browser tab (anti-screenshot).

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

## Admin pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | GameList | Game cards, create/duplicate games |
| `/admin/games/:id` | CardManager | Card list with set tabs, inline editing, set notes, mission summary per set |
| `/admin/games/:id/missions` | MissionManager | Mission CRUD by house tabs + act groups, consequence editing |
| `/admin/games/:id/act-break` | ActBreakView | Per-house mission results, consequence texts for host to read |
| `/admin/games/:id/act-break/print` | ConsequencePrint | Printable consequence cards (2-3 per US letter), house-themed |
| `/admin/games/:id/dashboard` | LiveDashboard | Real-time stats: scans, discovery, answers, mission progress (auto-polls every 5s) |
| `/admin/games/:id/simulator` | TableSimulator | Card-to-table distribution simulator |

## API structure

### Player-facing (no auth)
```
GET   /api/cards/:cardId          # Card content (respects lockout, self-destruct, includes clueVisibleCategory)
POST  /api/cards/:cardId/scan     # Log scan event
POST  /api/cards/:cardId/enter    # Start self-destruct timer
POST  /api/cards/:cardId/answer   # Submit answer (auto-completes linked missions)
```

### Admin (no auth currently — dev mode)
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

# Act Break & Transitions
GET   /api/admin/games/:gameId/act-break/:act
POST  /api/admin/games/:gameId/transition-act

# Live Dashboard
GET   /api/admin/games/:gameId/dashboard

# Other
GET   /api/admin/games/:gameId/designs
GET   /api/admin/games/:gameId/answers/:type
GET   /api/admin/games/:gameId/simulator
PUT   /api/admin/games/:gameId/simulator
POST  /api/admin/games/:gameId/simulator/auto-distribute
```

## What's built vs. what's planned

**Built:**
- Full scan flow (QR → entry gate → content → self-destruct → answer → feedback)
- `clueVisibleCategory` shown to players on card content (so they know what type of clue they're collecting)
- Visual polish (4 entry animations, 4 overlay effects, self-destruct countdown)
- Admin panel (game list, card management with inline editing, set tabs with review tracking, phone preview, QR generation)
- CardSet and House as first-class entities with colors and many-to-many
- Card set notes editable inline in admin
- Mission system (CRUD, house assignment, required clue sets, consequence texts, mechanical effects JSONB)
- Mission auto-completion when linked mission card is answered correctly
- Act break view (per-house mission results with consequence texts for host)
- Consequence card print preview (2-3 per US letter page, house-themed with images)
- Live game dashboard (real-time scans, card discovery, answer attempts, mission progress, auto-polls every 5s)
- Act transition workflow (lock current act cards, unlock next act cards)
- Game duplication (deep-copies cards, designs, answers, card sets, houses, missions)
- Table assignment simulator with auto-distribute
- Bulk card operations (assign design/set/act, lock/unlock, mark finished, delete, reset)
- Soft delete / restore for cards
- Card reordering

- Railway deployment (single service: Express serves API + built Vite client)

## Deployment (Railway)

Single service deployment. Express serves the Vite-built client as static files in production.

- **Build:** `pnpm install` → `pnpm build` (generates Prisma client, builds client + server in parallel)
- **Start:** `pnpm --filter server prisma migrate deploy && node server/dist/server/src/index.js`
- **Postgres:** Add Railway's Postgres plugin — it auto-sets `DATABASE_URL`
- **Health check:** `GET /api/health`
- **Config:** `railway.json` at project root

The server's compiled output lands at `server/dist/server/src/` (because `rootDir` is `..` to include shared types). The static file path accounts for this.

**Not yet built:**
- Admin auth (planned: simple shared secret)
- Design editor and answer template editor in admin
- Additional answer types (multiple choice, photo select, etc.)
- Bulk QR code print sheet
- Mission briefing card print layout (matching consequence card style)
