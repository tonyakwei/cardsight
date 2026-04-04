# CardSight

## What this is

CardSight is the QR code infrastructure for **Twin Tale Crossroads (TTC)**, a live social game by **All Together Now**. TTC seats 15-24 players across 3-4 teams ("houses") for an evening of collaborative puzzle-solving and consequential storytelling across three acts.

Physical cards with QR codes are distributed around the room. When a player scans one on their phone, they see styled content — a clue, a puzzle, a mission briefing. The content lives in a database, not on the card, so the same physical cards can serve different games.

## Design philosophy

- **The phone is a momentary portal.** Players scan, see content briefly, write things down, and put the phone away. The app is not a sustained digital experience — it's fast, beautiful for 30-90 seconds, then gets out of the way.
- **The story is the container.** CardSight delivers narrative and puzzle content, but the real experience happens in conversation, on paper, and between people.
- **Permission, not obligation.** Scanning should feel like opening a gift, not doing homework.
- **The host is the live intelligence.** The admin interface gives real-time visibility and control.

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
│   │   │   │   ├── CardContent.tsx      # Title + markdown description
│   │   │   │   ├── EntryGate.tsx        # "Press to enter" gate before content
│   │   │   │   ├── SelfDestructTimer.tsx
│   │   │   │   └── VisibilityGuard.tsx  # Blur on tab switch (anti-screenshot)
│   │   │   └── admin/         # Admin panel
│   │   │       ├── AdminLayout.tsx      # AppShell with gold/dark theme
│   │   │       ├── GameList.tsx         # Game cards
│   │   │       ├── CardManager.tsx      # Card list with set tabs, act grouping
│   │   │       ├── CardRow.tsx          # Expandable card with inline editing + phone preview
│   │   │       ├── PhonePreview.tsx     # iframe-based card preview
│   │   │       └── SetReviewBanner.tsx  # "N cards modified" banner
│   │   ├── utils/session.ts
│   │   └── styles/global.css
│   └── vite.config.ts         # Proxy /api → server
├── server/                    # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── cards.ts       # Player-facing: GET card, POST scan, POST enter, POST answer
│   │   │   └── admin.ts       # Admin: games, cards CRUD, card sets, houses, QR, designs
│   │   ├── services/
│   │   │   ├── card.service.ts   # Core scan flow logic (lockout, self-destruct, answer checking)
│   │   │   ├── admin.service.ts  # Admin business logic
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
- **Card** — a QR-scannable unit of content. Belongs to a game. Has a design, optional answer template, optional self-destruct timer, optional entry gate. Can be assigned to a CardSet and multiple Houses.
- **CardSet** — first-class grouping (e.g., "Signals", "Navigation"). Has name, color, admin notes. Cards are filtered by set in the admin. Set reviews track which sets have been reviewed since last edit.
- **House** — a team/agency (e.g., "Alpha", "Bravo"). Has name, color. Cards have a many-to-many relationship with houses via CardHouse join table.
- **Design** — reusable visual configuration (colors, fonts, animations, overlays). Multiple cards share designs.
- **SingleAnswer** — answer template for text-input puzzles (correct answer, alternatives, hints). Polymorphic pattern: `answerTemplateType` + `answerId` on Card, resolved manually in card.service.ts. Future types (multiple choice, photo select, etc.) are additive — new table + new UI component.
- **ScanEvent** / **AnswerAttempt** — analytics logs.
- **SetReview** — tracks when admin last reviewed a card set. Used to show "N cards modified since review" badges.

## Key architectural decisions

- **Polymorphic answers** — `answerId` on Card is NOT a Prisma relation. The service layer resolves it by `answerTemplateType`. Adding new answer types is purely additive.
- **Self-destruct is server-authoritative** — timer starts when player presses the Entry Gate button (POST `/api/cards/:id/enter`), not on page load. Client counts down from server timestamp.
- **Entry gate** — most cards show a themed button before revealing content (controlled by `hasEntryGate`). Timer starts on enter, not on scan.
- **"Solved" is card-level** — once any player answers correctly, the card is solved for everyone. Matches the physical shared-card game context.
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

## API structure

### Player-facing (no auth)
```
GET   /api/cards/:cardId          # Card content (respects lockout, self-destruct)
POST  /api/cards/:cardId/scan     # Log scan event
POST  /api/cards/:cardId/enter    # Start self-destruct timer
POST  /api/cards/:cardId/answer   # Submit answer
```

### Admin (no auth currently — dev mode)
```
GET   /api/admin/games
GET   /api/admin/games/:gameId
GET   /api/admin/games/:gameId/cards
PUT   /api/admin/games/:gameId/cards/:cardId
POST  /api/admin/games/:gameId/cards
GET   /api/admin/games/:gameId/card-sets
POST  /api/admin/games/:gameId/card-sets
PUT   /api/admin/games/:gameId/card-sets/:id
POST  /api/admin/games/:gameId/card-sets/:id/review
GET   /api/admin/games/:gameId/houses
POST  /api/admin/games/:gameId/houses
PUT   /api/admin/games/:gameId/houses/:id
GET   /api/admin/games/:gameId/cards/:cardId/qr
GET   /api/admin/games/:gameId/designs
```

## What's built vs. what's planned

**Built:**
- Full scan flow (QR → entry gate → content → self-destruct → answer → feedback)
- Visual polish (4 entry animations, 4 overlay effects, self-destruct countdown)
- Admin panel (game list, card management with inline editing, set tabs with review tracking, phone preview, QR generation)
- CardSet and House as first-class entities with colors and many-to-many

**Not yet built:**
- Admin auth (planned: simple shared secret)
- Game create/duplicate/archive
- Design editor and answer template editor in admin
- Additional answer types (multiple choice, photo select, etc.)
- Analytics dashboard
- Live event controls
- Railway deployment config
