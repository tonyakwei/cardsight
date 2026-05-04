# Pending seed edits

Notes on changes made via the admin console (localhost) that still need to be patched into `server/prisma/seed-qrians.ts`. Clear entries once they've been applied to the seed.

## Format

One bullet per edit. Include enough to locate the field — entity type, identifying name, and what changed. Exact wording isn't needed; I'll pull the new content from the DB when patching.

- **Card** — `<physical card name or clueVisibleCategory>` — what changed (e.g. "rewrote description", "swapped answer", "moved to set X")
- **Mission** — `<house> Act <N> <title or slot>` — what changed
- **Story sheet** — `<house> Act <N>` — what changed
- **Answer** — `<linked card or mission>` — what changed
- **Card set** — `<set name>` — what changed (notes, color, etc.)

## Pending

_(none — all 2026-05-03 edits have been applied to `server/prisma/seed-qrians.ts` and the live local DB. Mission `description` field has been wiped to empty string on all 30 missions in both seed and DB.)_
