# CardSight — Technical Specification

**Version:** 0.1 (Living Document)
**Date:** April 2026
**Status:** Work-in-progress. This spec will evolve continuously. Design for extensibility at every layer.

---

## Table of Contents

1. [Context: What This Is For](#1-context-what-this-is-for)
2. [Product Overview](#2-product-overview)
3. [Technical Stack](#3-technical-stack)
4. [Data Model](#4-data-model)
5. [The Three Interfaces](#5-the-three-interfaces)
6. [The Card Scan Experience (Player-Facing)](#6-the-card-scan-experience-player-facing)
7. [The Admin Interface](#7-the-admin-interface)
8. [The Analytics Dashboard](#8-the-analytics-dashboard)
9. [API Structure](#9-api-structure)
10. [Development Philosophy](#10-development-philosophy)
11. [Deployment](#11-deployment)

---

## 1. Context: What This Is For

CardSight is the QR code infrastructure for **Twin Tale Crossroads (TTC)**, a live social experience designed by **All Together Now** (alltogethernow.land). TTC seats 15–24 players across 3–4 teams ("houses") for an evening of collaborative puzzle-solving, cross-team negotiation, and consequential storytelling across three acts. Think of it as a hybrid of an escape room, a tabletop RPG, and a social game — but the real product is the experience of working together with strangers inside an authored narrative world.

### How CardSight Fits

In TTC, physical cards with QR codes are distributed around the room. Each card is a gateway to a clue, a puzzle, a mission briefing, or some other piece of game content. When a player scans a QR code on their phone, they see the card's content — and in many cases, they need to enter an answer to complete a puzzle. The content behind each QR code is **not printed on the card**. It lives in a database. This means:

- The same physical cards can be reused across many events with totally different content.
- Content can be reconfigured between (or even during) events by editing the database.
- Clue content can self-destruct after a timer, forcing players to write things down by hand (this is a deliberate design choice — phones are a momentary portal, not a sustained interface).
- Puzzle answers can be verified instantly without the host checking manually.
- The host can see in real time which teams have scanned what, who's solved what, and where things stand.

### The Broader Design Context

The TTC experience has a specific philosophy that should inform CardSight's design:

- **The phone is a momentary portal.** Players scan, see content briefly, write things down, and put the phone away. The app should not try to be a sustained digital experience. It should be fast, beautiful for the 30–90 seconds it's on screen, and then get out of the way.
- **The story is the container, not the product.** CardSight delivers narrative and puzzle content, but the real experience happens in conversation, on paper, and between people. The app serves the physical experience.
- **Permission, not obligation.** Nothing about the scan experience should feel like homework or a chore. It should feel like opening a gift — revealing something interesting.
- **The host is the live intelligence.** The admin interface should give the host real-time visibility and control, because the host adapts the evening to what's actually happening in the room.
- **Knowledge is fluency, not spoilage.** The system should support reuse and reconfiguration so that returning players encounter fresh content even with the same physical cards.

### The TTC Structure at a Glance

- **Games:** A "game" is one complete configuration of cards, puzzles, and narrative for one evening. Games can be duplicated and modified. After an event, the host duplicates the game, wipes runtime data (scan logs, answer attempts, self-destruct timestamps), and tweaks content for the next run.
- **Houses/Teams:** Each game has 3–4 teams (called "houses" or "agencies" in the fiction). Each house has its own missions, story cards, and clue cards — but clue cards are distributed across ALL houses, creating a cross-team trading economy.
- **Acts:** Each game runs across 3 acts. Between acts, the host narrates story developments and distributes new materials. Cards may belong to specific acts.
- **Missions:** Each house has ~6 available missions per act (they can only complete 3–4). Each mission requires ~3 clue cards to solve. The 72 clue cards per act are distributed ~18 per table, with ~9 belonging to that team's puzzles and ~9 belonging to other teams' puzzles.
- **Consequences:** Which missions a house completes (and which they leave undone) determines what their next act looks like — different story cards, different available missions, different number of options. This is the core of the game's branching system.

---

## 2. Product Overview

CardSight has three interfaces:

| Interface | Users | Purpose |
|-----------|-------|---------|
| **Card Viewer** | Players (via phone) | Scan QR → see card content → enter answers. Mobile-first. |
| **Admin Panel** | Host / Designer | Create and manage games, cards, designs, answer templates. Real-time control during events. |
| **Analytics Dashboard** | Host / Designer | See scan activity, answer attempts, timing data, per-house progress. Live during events, review after. |

---

## 3. Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 + Mantine UI 7 + React Router 7 + Recharts |
| Backend | Express 5 |
| Database | PostgreSQL (recommended for Railway hosting) |
| ORM | Prisma (strong migration support for an evolving schema) |
| Hosting | Railway |
| QR Generation | Admin can generate QR codes that encode URLs like `https://{domain}/c/{card_uuid}` |

### Why These Choices

- **Mantine UI 7** provides a rich component library that can be themed and customized. The admin panel benefits from Mantine's form controls, tables, modals, and layout components. The card viewer can use Mantine's foundation but will need significant custom styling to feel special.
- **Prisma** is chosen specifically because the schema will evolve frequently. Prisma's migration system makes adding fields, tables, and relationships straightforward. This is a living product.
- **Recharts** for the analytics dashboard's charts and visualizations.

---

## 4. Data Model

### Core Principle: Design for Extension

This schema **will change frequently**. New fields will be added to cards. New answer template types will be created. New analytics dimensions will emerge. The architecture should:

- Use Prisma migrations to evolve the schema safely.
- Use JSON columns sparingly but pragmatically for semi-structured data that changes faster than the schema (e.g., design properties, answer option lists).
- Use UUIDs as primary keys everywhere.
- Never delete data — use soft deletes and status fields.

### Entity Relationship Overview

```
Game
 ├── Card (many)
 │    ├── → Design (fk, shared across cards)
 │    ├── → Answer Template (polymorphic: type enum + id)
 │    ├── ScanEvent (many)
 │    └── AnswerAttempt (many)
 ├── Design (many, belong to game)
 └── Answer Templates (many, per type table, belong to game)
      ├── SingleAnswer
      ├── MultipleChoiceAnswer
      ├── MultipleTextAnswer
      └── PhotoSelectAnswer (and more as needed)
```

### Games

```
games
──────────────────────────────────────────────
id                  UUID        PK
name                TEXT        NOT NULL
description         TEXT        NULLABLE
status              ENUM        'draft' | 'active' | 'completed' | 'archived'
duplicated_from_id  UUID        NULLABLE (FK → games.id, for tracking lineage)
created_at          TIMESTAMP   DEFAULT now()
updated_at          TIMESTAMP   DEFAULT now()
```

**Duplication behavior:** When a game is duplicated, a deep copy is created — all cards, designs, and answer templates are cloned into the new game. All runtime data (scan events, answer attempts, self_destructed_time values on cards) is **not** copied. The new game starts clean. The `duplicated_from_id` field tracks lineage.

### Cards

```
cards
──────────────────────────────────────────────
id                      UUID        PK (QR codes encode a URL containing this)
game_id                 UUID        FK → games.id, NOT NULL
human_card_id           TEXT        NOT NULL (e.g. "52", "A-07" — printed on the physical card)
act                     INTEGER     NULLABLE (which act this card belongs to, 1/2/3, or null if act-agnostic)
house                   TEXT        NULLABLE (which house/agency this card is assigned to, or null if shared)
clue_set                TEXT        NULLABLE (grouping label, e.g. "Location", "Gemstone", "Signal")
clue_visible_category   TEXT        NULLABLE (what players see, e.g. "Ruby", "Sapphire", "Grid-7")
title                   TEXT        NOT NULL
description             TEXT        NULLABLE (rich text / markdown — the main card content)
answer_template_type    ENUM        NULLABLE ('single_answer' | 'multiple_choice' | 'multiple_text' | 'photo_select' | ... extensible)
answer_id               UUID        NULLABLE (FK to the relevant answer template table, based on type)
is_answerable           BOOLEAN     DEFAULT false (derived convenience: true if answer_template_type and answer_id are both set)
locked_out              BOOLEAN     DEFAULT false
locked_out_reason       TEXT        NULLABLE (e.g. "Not yet configured", "Locked by host", "Card retired")
self_destruct_timer     INTEGER     NULLABLE (seconds — how long the card is viewable after first scan)
self_destructed_at      TIMESTAMP   NULLABLE (set on first scan: now() + self_destruct_timer seconds)
self_destruct_text      TEXT        NULLABLE (shown after self-destruct; default: "This card's information is no longer available.")
design_id               UUID        NULLABLE (FK → designs.id)
sort_order              INTEGER     DEFAULT 0 (for admin list ordering)
notes                   TEXT        NULLABLE (admin-only notes, never shown to players)
created_at              TIMESTAMP   DEFAULT now()
updated_at              TIMESTAMP   DEFAULT now()
```

**Self-destruct behavior:**
1. Player scans card for the first time.
2. If `self_destruct_timer` is set and `self_destructed_at` is null, the server sets `self_destructed_at = now() + self_destruct_timer seconds` and returns the card content along with the deadline.
3. The client shows a visible countdown timer.
4. On any subsequent load, if `self_destructed_at` is set and `now() > self_destructed_at`, the server returns only the `self_destruct_text` (or default). The actual content is never sent.
5. Refreshing during the timer window is fine — the deadline is absolute, not reset.
6. The host can reset `self_destructed_at` to null from the admin panel if needed.

### Designs

Designs are reusable visual configurations. Multiple cards can share a design. Each game can have many designs.

```
designs
──────────────────────────────────────────────
id                  UUID        PK
game_id             UUID        FK → games.id, NOT NULL
name                TEXT        NOT NULL (e.g. "Agency Alpha — Classified", "Emergency Broadcast")
bg_color            TEXT        DEFAULT '#0a0a0a' (hex)
bg_gradient         TEXT        NULLABLE (CSS gradient string, takes precedence over bg_color)
bg_image_url        TEXT        NULLABLE
text_color          TEXT        DEFAULT '#e0e0e0'
accent_color        TEXT        DEFAULT '#4fc3f7'
secondary_color     TEXT        NULLABLE
font_family         TEXT        DEFAULT 'system-ui'
card_style          TEXT        DEFAULT 'standard' (extensible: 'standard', 'classified', 'urgent', 'alien', 'redacted', etc.)
animation_in        TEXT        NULLABLE (entry animation: 'fade', 'slide-up', 'glitch', 'decrypt', etc.)
border_style        TEXT        NULLABLE
overlay_effect      TEXT        NULLABLE (e.g. 'scanlines', 'static', 'glow', 'particles')
custom_css          TEXT        NULLABLE (escape hatch for one-off visual effects)
created_at          TIMESTAMP   DEFAULT now()
updated_at          TIMESTAMP   DEFAULT now()
```

**Philosophy:** Designs should make each card feel like a deliberate aesthetic choice, not a generic data display. The goal is that when a player scans a QR code, the screen that appears feels *authored* — like someone designed this specific moment. The design system should support everything from sleek classified-document aesthetics to urgent red-alert broadcasts to eerie alien transmissions.

### Answer Templates (Polymorphic)

The `answer_template_type` enum on a card tells the system which table to query. The `answer_id` tells it which row. Each answer type has its own table with fields appropriate to that answer experience.

**This is explicitly designed to be extended.** Adding a new answer type means: add a new enum value, create a new table, and build the corresponding UI component. Existing types are unaffected.

#### SingleAnswer

The simplest type: player types a text answer, system checks it.

```
single_answers
──────────────────────────────────────────────
id                  UUID        PK
game_id             UUID        FK → games.id
correct_answer      TEXT        NOT NULL
case_sensitive      BOOLEAN     DEFAULT false
trim_whitespace     BOOLEAN     DEFAULT true
accept_alternatives TEXT[]      NULLABLE (array of also-acceptable answers)
hint                TEXT        NULLABLE (shown after N failed attempts, configurable)
hint_after_attempts INTEGER     DEFAULT 3
created_at          TIMESTAMP   DEFAULT now()
updated_at          TIMESTAMP   DEFAULT now()
```

#### MultipleChoiceAnswer

Player selects from presented options. Can support lockout after wrong answers.

```
multiple_choice_answers
──────────────────────────────────────────────
id                  UUID        PK
game_id             UUID        FK → games.id
options             JSONB       NOT NULL
                    -- Array of { label: string, value: string, is_correct: boolean }
                    -- Example: [{"label": "Alpha Centauri", "value": "alpha_centauri", "is_correct": false}, ...]
shuffle_options     BOOLEAN     DEFAULT true
max_attempts        INTEGER     NULLABLE (null = unlimited)
lockout_on_exhaust  BOOLEAN     DEFAULT false (lock the card if max_attempts reached without correct answer)
created_at          TIMESTAMP   DEFAULT now()
updated_at          TIMESTAMP   DEFAULT now()
```

#### MultipleTextAnswer

Player must provide multiple answers (e.g., "Name the three frequencies").

```
multiple_text_answers
──────────────────────────────────────────────
id                  UUID        PK
game_id             UUID        FK → games.id
answers             JSONB       NOT NULL
                    -- Array of { answer: string, alternatives: string[], label: string }
                    -- Example: [{"answer": "347 MHz", "alternatives": ["347", "347mhz"], "label": "Frequency 1"}, ...]
order_matters       BOOLEAN     DEFAULT false
partial_credit      BOOLEAN     DEFAULT false (show which ones are correct so far)
case_sensitive      BOOLEAN     DEFAULT false
created_at          TIMESTAMP   DEFAULT now()
updated_at          TIMESTAMP   DEFAULT now()
```

#### PhotoSelectAnswer

Player selects the correct image(s) from a grid.

```
photo_select_answers
──────────────────────────────────────────────
id                  UUID        PK
game_id             UUID        FK → games.id
photos              JSONB       NOT NULL
                    -- Array of { url: string, is_correct: boolean, alt_text: string }
select_count        INTEGER     DEFAULT 1 (how many photos must be selected)
shuffle_photos      BOOLEAN     DEFAULT true
created_at          TIMESTAMP   DEFAULT now()
updated_at          TIMESTAMP   DEFAULT now()
```

#### Future Answer Types (Not Yet Built)

The system should be structured so these can be added without refactoring:

- **OrderingAnswer** — arrange items in the correct sequence (drag-and-drop)
- **CoordinateAnswer** — tap the correct location on an image/map
- **DrawingAnswer** — freehand drawing compared against a pattern (advanced, future)
- **CodeEntryAnswer** — enter a multi-part code (like a combination lock)
- **TimedSequenceAnswer** — enter answers in a specific timed sequence

### Scan Events

Every QR scan is logged. This is the foundation for analytics.

```
scan_events
──────────────────────────────────────────────
id                  UUID        PK
card_id             UUID        FK → cards.id, NOT NULL
game_id             UUID        FK → games.id, NOT NULL (denormalized for query speed)
scanned_at          TIMESTAMP   DEFAULT now()
session_hash        TEXT        NULLABLE (hashed fingerprint for rough session grouping — not PII)
user_agent          TEXT        NULLABLE
created_at          TIMESTAMP   DEFAULT now()
```

### Answer Attempts

Every answer submission is logged, correct or not.

```
answer_attempts
──────────────────────────────────────────────
id                  UUID        PK
card_id             UUID        FK → cards.id, NOT NULL
game_id             UUID        FK → games.id, NOT NULL (denormalized)
attempt_number      INTEGER     NOT NULL (1, 2, 3...)
answer_given        JSONB       NOT NULL (flexible — text for single, selected values for MC, etc.)
is_correct          BOOLEAN     NOT NULL
attempted_at        TIMESTAMP   DEFAULT now()
time_since_scan_ms  INTEGER     NULLABLE (milliseconds since the most recent scan event for this card)
session_hash        TEXT        NULLABLE
created_at          TIMESTAMP   DEFAULT now()
```

---

## 5. The Three Interfaces

### Routing Structure

```
/c/:cardId                  → Card Viewer (player-facing, mobile)
/admin                      → Admin Panel (protected)
/admin/games                → Game list
/admin/games/:gameId        → Game detail: cards, designs, answer templates
/admin/games/:gameId/cards  → Card management
/admin/games/:gameId/live   → Live event view (analytics + quick controls)
/analytics                  → Full analytics dashboard
/analytics/:gameId          → Game-specific analytics
```

---

## 6. The Card Scan Experience (Player-Facing)

**This is the most important interface.** It is the moment where the digital system touches the physical experience. It should feel special.

### Mobile-First Design

The card viewer will be accessed almost exclusively on phones via QR scan. Design for:
- Viewport: 375px–430px width as primary target
- Touch targets: minimum 44px
- No horizontal scrolling ever
- Fast load: the content should appear in under 1 second
- No navigation chrome — this is a single-purpose view, not a website

### The Scan Flow

```
Player scans QR code
        ↓
GET /c/:cardId
        ↓
    ┌─── Card locked out? ──→ Show lockout screen with reason
    │
    ├─── Self-destructed? ──→ Show self-destruct text (styled, not an error)
    │
    └─── Available ──→ Show card content
              │
              ├── If self_destruct_timer is set → start countdown, show timer
              │
              ├── If answerable → show answer input (type-specific UI)
              │
              └── If not answerable → content only (informational card)
```

### Visual Experience

When a player scans a card, the experience should feel like **opening something** — a classified document, a transmission, a revelation. Not like loading a webpage. Consider:

- The card's `design` determines the entire visual treatment — background, colors, typography, animation.
- Entry animation (`animation_in`) plays once on load. Could be a fade, a slide-up, a "decryption" effect where characters scramble before resolving, a glitch effect, etc.
- Overlay effects (`overlay_effect`) add ambient texture — subtle scanlines, a soft glow, floating particles, etc. These should be subtle enough not to interfere with reading.
- The self-destruct countdown, when present, should be a prominent but not panic-inducing visual element. It's part of the game's tension, not a UX failure.
- Sound is OFF by default. No auto-playing audio. (Future consideration: opt-in ambient sound per design.)

### Answer Submission

Each `answer_template_type` has its own UI component:

- **single_answer**: A text input with a submit button. On wrong answer, a subtle shake or flash. On correct answer, a satisfying confirmation animation. If hints are configured, show after N failed attempts.
- **multiple_choice**: Tappable option cards/buttons. Visual feedback on selection. On wrong answer with lockout logic, show remaining attempts.
- **multiple_text**: Multiple labeled text inputs. If partial_credit is on, correctly answered fields get a check mark in real time.
- **photo_select**: Image grid. Tappable with visual selection state. Confirm button.

After a correct answer, the card should show a **completion state** — something that feels like an achievement. Not a generic "Correct!" but a styled confirmation that fits the card's design. This completion state stays visible (it doesn't disappear on refresh).

### State Handling

- Cards have no login or accounts. Anyone with the URL can view a card.
- Self-destruct is tracked server-side (by card, not by user). Once a card self-destructs, it's gone for everyone. This is by design — the self-destruct mechanic is about the physical cards in the room, not about individual phone sessions.
- Answer correctness is also tracked server-side at the card level. Once a card is answered correctly, it's answered. (Ambiguity: should other players who scan the same card see the answer? **Decision needed.** For now, default to showing a "This puzzle has been solved" state.)

---

## 7. The Admin Interface

### Game Management

- **Game list**: All games, with status badges. Create new, duplicate existing, archive old.
- **Game duplication**: Deep copy all cards, designs, and answer templates. Reset all runtime state. New game gets `duplicated_from_id` set. Admin can rename and tweak.
- **Game status management**: Draft → Active → Completed → Archived. Only one game should be "Active" at a time (during an event).

### Card Management

- **Card list view**: Table/grid of all cards in a game. Sortable by human_card_id, act, house, clue_set, status. Filter by act, house, clue_set, locked/unlocked, answered/unanswered.
- **Card editor**: Full edit form for all card fields. Live preview of the card viewer experience (how it will look to a player).
- **Bulk operations**: Assign design to multiple cards. Lock/unlock multiple cards. Set act or house for multiple cards.
- **QR code generation**: Generate and download QR codes for selected cards. Each QR encodes `https://{domain}/c/{card_uuid}`. Generate as a printable sheet (multiple QR codes per page, with human_card_id labels).

### Design Management

- **Design list**: All designs for a game. Visual thumbnails showing the design applied to a sample card.
- **Design editor**: Color pickers, font selection, animation preview, overlay preview. Live preview on a sample card.

### Answer Template Management

- **Per-type editors**: Each answer template type has its own form. The admin picks the type, fills in the type-specific fields, and saves. The template gets a UUID that can be assigned to cards.
- **Template assignment**: From the card editor, pick an answer template type and then select from existing templates of that type (or create a new one inline).

### Live Event Controls

During an active game, the admin needs quick access to:
- Lock/unlock individual cards instantly
- Reset a card's self-destruct timer
- See which cards have been scanned and answered
- Push a notification or update (future feature)

---

## 8. The Analytics Dashboard

### Live Event View (`/admin/games/:gameId/live`)

During an active game, the host wants to see:

- **Scan feed**: Real-time stream of scan events (which card was scanned, when). Filterable by house.
- **Answer feed**: Real-time stream of answer attempts (which card, what was attempted, correct/incorrect).
- **Per-house progress**: How many missions/cards each house has solved. Visual indicator (progress bar or similar).
- **Card heatmap**: Which cards are being scanned most. Which haven't been touched.
- **Timing**: Average time from first scan to correct answer, per card and per house.

### Post-Event Analytics (`/analytics/:gameId`)

After an event, the host wants to review:

- **Timeline**: When things happened across the evening. Scan and answer activity over time.
- **Per-card breakdown**: For each card — scan count, answer attempts, time to correct answer, most common wrong answers.
- **Per-house breakdown**: Cards scanned, missions completed, average solve time, answer accuracy.
- **Cross-house interaction signals**: If the same card is scanned by multiple session hashes (rough proxy for different people/teams), that suggests cross-team card trading happened.
- **Difficulty analysis**: Which cards took the most attempts? Which had the longest time-to-solve? This feeds back into the CSV-editing iteration loop.

### Charts (Recharts)

- Line chart: scan/answer activity over time
- Bar chart: per-house mission completion
- Heat grid: card scan frequency
- Histogram: time-to-solve distribution

---

## 9. API Structure

RESTful API. All responses JSON. All timestamps ISO 8601 UTC.

### Player-Facing

```
GET     /api/cards/:cardId              → Card content (respects lockout, self-destruct)
POST    /api/cards/:cardId/scan         → Log a scan event, trigger self-destruct if applicable
POST    /api/cards/:cardId/answer       → Submit an answer, returns correct/incorrect + feedback
```

**These endpoints have no authentication.** They are public, accessed by any phone that scans a QR code. They should be rate-limited to prevent abuse, but they should not require login.

### Admin-Facing (Protected — session or token auth)

```
# Games
GET     /api/admin/games                → List games
POST    /api/admin/games                → Create game
GET     /api/admin/games/:gameId        → Game detail
PUT     /api/admin/games/:gameId        → Update game
POST    /api/admin/games/:gameId/duplicate → Duplicate game
PUT     /api/admin/games/:gameId/status → Change game status

# Cards
GET     /api/admin/games/:gameId/cards          → List cards (with filters)
POST    /api/admin/games/:gameId/cards          → Create card
GET     /api/admin/games/:gameId/cards/:cardId  → Card detail (admin view, includes all fields)
PUT     /api/admin/games/:gameId/cards/:cardId  → Update card
DELETE  /api/admin/games/:gameId/cards/:cardId  → Soft delete card
POST    /api/admin/games/:gameId/cards/bulk     → Bulk operations (lock, assign design, etc.)
POST    /api/admin/games/:gameId/cards/:cardId/reset-destruct → Reset self-destruct timer

# Designs
GET     /api/admin/games/:gameId/designs        → List designs
POST    /api/admin/games/:gameId/designs        → Create design
PUT     /api/admin/games/:gameId/designs/:id    → Update design
DELETE  /api/admin/games/:gameId/designs/:id    → Delete design

# Answer Templates (per type)
GET     /api/admin/games/:gameId/answers/:type          → List templates of type
POST    /api/admin/games/:gameId/answers/:type          → Create template
PUT     /api/admin/games/:gameId/answers/:type/:id      → Update template
DELETE  /api/admin/games/:gameId/answers/:type/:id      → Delete template

# QR Generation
POST    /api/admin/games/:gameId/qr-codes       → Generate QR codes for selected card IDs

# Analytics
GET     /api/admin/games/:gameId/analytics/scans        → Scan data (filterable by time, house, card)
GET     /api/admin/games/:gameId/analytics/answers       → Answer data
GET     /api/admin/games/:gameId/analytics/summary       → Aggregated stats
GET     /api/admin/games/:gameId/analytics/live          → Real-time feed (SSE or polling)
```

---

## 10. Development Philosophy

### This Is a Living Product

CardSight will change constantly. New card fields, new answer types, new analytics dimensions, new admin controls — the designer is actively developing the game and will discover needs through playtesting that cannot be anticipated now. The architecture must support this:

- **Database**: Use Prisma migrations. Never fear a schema change. Add columns, add tables, add enums. The migration chain is the history of the product.
- **Answer templates**: The polymorphic pattern (type enum → type-specific table → type-specific UI component) is explicitly designed so that adding a new answer type is an additive operation — new enum value, new table, new React component. Nothing existing is touched.
- **Designs**: The design system will grow. New `card_style` values, new `animation_in` types, new `overlay_effect` types. These should be easy to add without restructuring.
- **API**: Version the API from the start (`/api/v1/...`) so breaking changes can coexist.
- **Frontend**: Component-based architecture. Each answer type is its own component. Each design style is its own visual treatment. Adding new types and styles should feel like adding plugins.

### Code Quality Expectations

- TypeScript throughout (frontend and backend)
- Prisma for type-safe database access
- Zod or similar for API input validation
- Meaningful error messages (not just 500s)
- Consistent API response shapes
- Mobile-responsive from day one (not retrofitted)

### What "Done" Looks Like for v0.1

The minimum viable CardSight supports:

1. Create a game with cards, designs, and single_answer templates
2. Generate QR codes for cards
3. Scan a card on a phone → see content → enter an answer → get confirmation
4. Self-destruct timer works
5. Admin can view scan and answer activity
6. Admin can duplicate a game

This is enough to run a prototype playtest. Everything else is iteration.

---

## 11. Deployment

### Railway Configuration

- **Single repo, monorepo structure**: `/client` (React) and `/server` (Express) in the same repo
- **Two Railway services**: One for the frontend (static build served via CDN or simple server), one for the backend API
- **PostgreSQL**: Railway-managed PostgreSQL instance
- **Environment variables**: `DATABASE_URL`, `ADMIN_SECRET` (for auth), `DOMAIN` (for QR code URL generation), `NODE_ENV`

### Monorepo Structure

```
cardsight/
├── client/                 # React app (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── card-viewer/     # Player-facing scan experience
│   │   │   ├── admin/           # Admin panel
│   │   │   ├── analytics/       # Analytics dashboard
│   │   │   └── shared/          # Shared components
│   │   ├── hooks/
│   │   ├── api/                 # API client functions
│   │   ├── types/               # Shared TypeScript types
│   │   └── styles/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                 # Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── shared/                 # Shared types/constants used by both
│   └── types.ts
└── README.md
```

---

*CardSight is a tool in service of a live human experience. Every technical decision should be filtered through this question: does this make the evening in the room better?*

*All Together Now — alltogethernow.land*
