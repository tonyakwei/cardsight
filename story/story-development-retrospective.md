# CardSight story-development retrospective

Distilled from 147 commits, the 2026-04-29 Temple of the QRians playtest synthesis, and standing feedback memories. Organized by five lenses:

1. What changed in story content
2. What changed in puzzle behavior
3. What changed in admin capabilities
4. Why those changes were necessary
5. Which problems recurred

The goal of this document is **historical**: future-you can answer "have we hit this before, and what did we learn?" The companion document `new-story-checklist.md` distills the recurring-problems lens into rules an agent can enforce on a new story draft.

---

## 1. What changed in story content

### Vocabulary discipline

Story content drifts when it's authored piecemeal, and the drift is invisible until a player reads two cards in a row that disagree.

- **"Clue" → "item" / "inventory"** across the entire surface (`16c5668`, `c6c8a1b`). The phone is a portal to physical inventory; "clue" leaks the meta-frame. Required component, schema, and copy renames.
- **"Enter X" → "Write X"** in 22 puzzle prompts (`fa90d3b`). Players actually write on paper before transcribing. "Enter" reads as UI instruction.
- **Pipe vocabulary unification** (`3f4a7d7`, `e9c6a27`): the cardSet name was technically accurate but didn't read as drainage at a glance. Renamed `Grooved Ceramic Tile` → `Pipe Bundle`, then unified `tiles` / `sections` / `bundle` across story brief, card prose, and puzzle table column header.
- **Numeric suffixes dropped** for non-diegetic series (`179caa2`): "Set I/II/III", "Bundle I/II/III" implied an order that didn't exist in fiction. Pottery shards became *Large / Crooked / Painted* — distinct objects, scan-order independent.

### Bare cards getting openers

- Cards 2 and 3 of multi-card categories were jumping straight to bullet lists without a narrative opener (`5e43598`). Only card 1 set the diegetic frame, and players don't scan in order. 20 cards got order-agnostic single-sentence openers ("Three iron spokes, dust-caked from the fall.").

### Story-brief register

- 9 long-form story briefs trimmed to 3-sentence punchy versions, originals archived (`426b75d`).
- All 30 mission story-sheet blurbs authored with hooks + trailing collection CTAs (`426b75d`).
- House voice locked early (`3e52fc3`, `38af01c`): Drake mercenary humor, Jones academic earnestness, Croft Lara loyalty/physicality. Voice is reinforced in completion text and consequences, not just the intro card.

### Lore beats foregrounded

Some of the strongest writing was buried in logistics text and never landed.

- **Hoist mission "WE WHO BUILT THIS WILL NEVER LET THEM LEAVE"** — the strongest single Act 1 lore beat — was inside the puzzle solution and got skimmed past. Foregrounded in `correctAnswerReveal` (`362dc22`).
- **Vesh's compartment** — the most morally significant Act 2 reveal (slave construction) — landed as botany trivia until a one-sentence thematic bridge connected the mechanic ("vocabulary of carrying and expelling") to the payload (`872c1d0`).

### Narrator vs. character voice

- **Vesh body-as-vector reframe** (`f253464`): the previous reveal stated "The Source moves through bodies the way pollen moves through tissue" as narrator-asserted fact. The Source's mechanism is meant to remain open. Reframed as Vesh's *theory* — what he believed, what he reasoned with — without conceding it as canon.

### Trading justification in fiction

When the trading mechanic depends on cards being on other tables, the *story* has to justify it.

- **Stone Wheel + Sliding Panels + Astrolabe** got "scattered across the chamber, others have picked some up" beats so the trading mechanic was narratively logical (`fce9e62`).
- **Cards on home tables corrected** (`bd742f3`): 8 Act 2 missions said "the others have them" but the seed put all clue cards on the home table. Net rebalance: 7 Act 2 cards per house's table.

### Cross-house coordination beats

- **Hanging Garden + Sighting Wall** self-destruct cards distributed across all 3 houses. Without coordination, one house scans during a different conversation and crumbles information before others are ready. Solved diegetically via storySheetBlurb beats showing a teammate clocking the cross-house parallelism (`aab527d`) — no out-of-frame "designate a writer" instructions.

### Timeline as narrative, not bookkeeping

- **Anchor dates on 6 of 12 history cards** with explicit "Seasons After The Source" (`827a53b`). The arc (Gift → Obsession → Contagion → Seal) is what should land emotionally; reconstruction risked becoming "group bookkeeping" without anchor dates.
- **Within-era acceptance** instead of strict positional ordering (`df6be21`).

### Consequence text rewrites for landed losses

- **Drainage / Jigsaw "you'll have to route around, losing time"** read as flavor with no signal that material was lost. Rewritten to clearly narrate persistent material loss into Act 2, so the redistribute consequence reads as earned (`d83b283`).

### Finale clauses for negotiability

- **Suppress the Location** rewritten because the original clause was logically incoherent once all houses knew the location — it derailed negotiation without generating tension (`a02d9eb`). Rewritten to address what the room can actually control: onward disclosure to academic/journalistic channels.
- Renames + drop of `incompatibleWith`/`allowedOutcomes` (`426b75d`) because hard compatibility rules were preventing genuine negotiation.

---

## 2. What changed in puzzle behavior

### Per-field feedback (the biggest single lever)

The **all-or-nothing concatenated answer** was the most systemic puzzle failure mode. Wrong answer anywhere in a 5-disc / 5-shelf / 5-cluster puzzle failed the whole mission with no diagnostic.

- **`MultipleAnswer` polymorphic answer template** added (`02db76d`).
- **8 puzzles converted to multiple_text** in one sweep (`951e0f6`): Reagent Alcove, Sighting Wall, Teaching Stone, Drevu/Krane/Vesh-shape Compartments, Reinforced Bunker, Ceiling Inscription, High Ledge.
- **Per-field green glow on confirmed slots** so players know which subproblems they've cleared.
- **Earlier conversions** of Shadow Astrolabe (`15235c2`), Sealed Pantry (`f36d77e`), Vesh's Compartment (`f5e4762`).

### Widening accept-alternatives where reasoning is defensible

- **Astrolabe Disc V**: canonical Silver also accepts Black ("cool steel before heating") (`15235c2`).
- **Vesh's Procedure I**: VEIN canonical, also accept ROOT and `vien` (`f5e4762`).
- **Sliding Panels**: canonical was unnatural English; swapped + accepted alt-orderings (`362dc22`).
- **Grappling Rigs #4/#6 ordering**: alt sequence accepted *because the ambiguity carried a consequence* — a defensible answer triggering a real Act 2 lockout was the wrong outcome (`362dc22`).

### Strip leaked content from puzzle UI

- **Act 1 puzzle integrity pass** (`38ba6e4`): 13 missions where puzzleDescription duplicated data the clue cards should hand over (sequence tables, anagram letter mappings, glyph translations, pattern-completion values). Players could solve without scanning the cards.
- **Act 2 elder-compartment riddle leaks** (`08d462d`): full riddle text was in puzzleDescription, duplicating the Riddle-Tablet clue cards. Players could solve without trading.
- **Slot prompts** for MultipleAnswer puzzles intentionally show only chamber-visible structure (Cluster N, Shelf N, Disc N) — never clue-card contents (`951e0f6`). Leaking those short-circuits the trading economy.

### Force the intended dependency graph

- **Wall of Repetitions redesign** (`f620cfe`): old design let any 2 of 3 tiles fill every blank, making the third redundant; English's predictability often let 1 tile alone suffice. New design: each tile is a 21- or 23-character rewrite of the same phrase with no spaces; majority-vote position-by-position forces all three tiles mathematically.
- **Trading distribution corrected** for 8 Act 2 missions (`bd742f3`): home-keeps-card-1; cards 2 & 3 rotate. Riddle missions: home-keeps-Tablet-I, Tablet-II rotates. Without this, the trading mechanic was theatrical.

### Self-destruct discipline

- **Timer extended 60 → 75s** for Drake M5 (3 simultaneous timers in one house) (`362dc22`).
- **Fragility cue in description** ("the ink is bleeding fast — read it before it's gone") so the timer makes narrative sense (`fb51269`).
- **Cross-house coordination beat** added diegetically for missions that distribute self-destruct cards (`aab527d`).
- **Helper signature** updated so future cards can opt in to selfDestructTimer/Text without boilerplate (`fb51269`).

### Difficulty hints when a puzzle is unusually hard

- **Teaching Stone algebra** (`362dc22`): "you have a feeling this will be hard..." flavor on the brief so teams prioritize and don't burn time before realizing the difficulty.

### Glyph cipher copy-protection

- **Disable text selection on `.qrian-glyph` spans** (`6e482f0`). The Calligraphr font maps glyphs to standard letter codepoints, so a copy-paste yields the answer directly. Killed user-select + iOS long-press menu.

### Wrong hints removed (don't fake-help)

- **Reinforced Bunker GRENADE hint** removed because it claimed an "anagram with one letter added" — but ENRAGED→GRENADE is a clean anagram (`5209f10`). A wrong hint is worse than no hint.

### Physical artifact integration

- **Three printed artifacts** drove three of the hardest Act 2 missions: flower grid (`9e7e559`), canopy map (`1b8d33f`), pebble floor (`6d598b8`). The Reckoning Floor was rewritten from sequence-trace to set-recognition (`6d598b8`) because the J/T/M shapes inherently have disconnected strokes that the continuous-trace mechanic couldn't respect.
- **ASCII pipe diagrams** added to drainage cards (`f85c78e`) so players route the path visually instead of mentally translating L/R/T/B opening labels.

---

## 3. What changed in admin capabilities

What admin needed to grow into is a direct map of what authoring friction looked like. The admin is stable now, but each capability was a real pain point.

### Print system

- **Print Center** (`bb34949`) consolidated all print routes behind one page.
- **Themed consequence cards** with markdown rendering and switchable themes (`07e8c27`).
- **Auto-fit consequence text** (`bb08cb7`, `722dadc`): long bodies were silently clipped because fontSize was hardcoded at 21px and the card has overflow:hidden. Three-tier fitText heuristic, scaled separately for 2-up and 3-up layouts.
- **Story sheet print** with mission bands + inline QR codes parsed from `(A)`/`(B)` markers (`6257ea3`).
- **Story sheet drag-and-drop reorder + per-sheet overflow chips** (`426b75d`).
- **Three artifact-grid prints** (flower grid, canopy map, pebble floor) ported into React with deterministic-PRNG decoy fill and reroll buttons (`bb08cb7`).

### Host live-control surfaces

- **Mobile Host Console** (6-tab) for live game hosting (`d27a6f0` and predecessors).
- **Resettable house attribution epoch** (`11f72a0`): cookies bake a `<uuid>:<epoch>`; host can invalidate every existing /h/<slug> cookie with one tap — no need to touch any phone.
- **Per-game blur nudge toggle** with PATCH `/settings` (`fffa180`).
- **History-timeline arm/reset** in Pulse tab.
- **Finale adjudication entry** for end-of-night package selection.

### Authoring perf and ergonomics

- **CardRow iframes only mount when expanded** (`841f3b5`): opening an act group with 50 cards used to trigger 50 simultaneous PhonePreview loads. Required because the Act 2 seed had grown to 33+ card sets.
- **Set tabs split by act** (`841f3b5`): the flat row of 33+ tabs was unworkable; outer Act tabs + inner pill row scoped to chosen act, with per-act selection memory.
- **Inline QR display in editor** (`1f4fc2b`) — saves a roundtrip when verifying URLs.
- **Mission preview in admin** matching CardRow pattern (`6c19751`).
- **Collapsible CardRow/MissionRow sections** with sessionStorage-backed state (`bb34949`).

### Polymorphic + reusable systems

- **Designs** auto-assigned by card set so each material family reads with its own palette/font/animation (`2820ac4`).
- **Fisher-Yates physical-card shuffle** at seed start so colors don't leak set-membership (`2820ac4`).
- **Polymorphic answer types**: SingleAnswer + MultipleAnswer via `answerTemplateType` + `answerId` (additive — new types don't break old).
- **House cookie middleware**: analytics-only attribution, never affects routing or content (`1453886`, `3c2d3cb`, `11f72a0`).

### Ops safety

- **Confirmation-gated production reseed** (`362cd6f`) — type RESEED to confirm. Avoids wiping live game state by accident.
- **ENV_LEVEL + ADMIN_AUTH_DISABLED** for env-controlled admin auth (`9d3830e`).

### Removed in flight

- **`mechanicalEffectCompleted`/`mechanicalEffectNotCompleted` JSONB fields** removed (`7f6fe9d`) — superseded by structured `MissionConsequence` warning/lock/redistribute.
- **`humanCardId`** removed (`4752d7e`) — replaced by `physicalCardId` lookup against `physical-cards.json`.

---

## 4. Why those changes were necessary

Pulled from playtest synthesis, commit messages, and the 2026-04-29 fixes log.

### From playtest evidence

- **Answer-validation is the #1 failure mode.** 9 of 12 hardest puzzles were cases where players reasoned correctly and submitted defensible answers the system rejected. Wide acceptAlternatives + per-field MultipleAnswer + constraint-narrowing rewrites were the levers.
- **Trading topology was theatrical until cards were redistributed.** 8 missions said "scattered across the chamber" but the seed put everything on home tables. The mechanic only fires if content matches it.
- **Wall of Repetitions, the act's narrative spine, was never assembled** — teams prioritized faster missions. Trading-priority guidance and the majority-vote redesign address this together.
- **Self-destruct coordination needed explicit pre-coordination.** Three missions had multi-house simultaneous timers. Without diegetic coordination beats, a single missed scan made the mission unsolvable.
- **Source vocabulary never landed from puzzle content** in any of the three failed terminal missions. The phenomenology landed; the term didn't. (Unresolved design call.)
- **Jones's "Open for Research" lacked empirical support** in Act 3 — Jones held only crisis-and-terminal fragments, while Croft held the full arc. The deliberation had a gravitational pull toward Recontain regardless of how the room played.

### From authoring friction

- **Vocabulary drifts when content evolves piecemeal.** Each rename pass (item/clue, pipe-tile/pipe-section/pipe-bundle) reflected a story that had moved on while older copy hadn't.
- **Authoring shortcuts compound.** Single-string concatenated answers, JSONB mechanical effects, hardcoded font sizes — each was a "ship it" decision that became a refactor.
- **Cross-doc consistency was a chore.** Mission design docs, story cards, and seed scripts drifted on every change. Eventually `missions.md` and the act-missions printouts were deleted because they duplicated seed content.
- **Print artifacts can't be stress-tested without props.** Three missions are insoluble without printed grids; the only way to verify them is a live room.

### From admin scale

- The Act 2 seed (33+ card sets, 30 missions, 90 clue cards) broke the admin's flat tab row and triggered the iframe-storm perf issue. Both fixes were forced by content scale, not abstraction.
- The host needs live control of pacing variables (blur nudge, timeline arm, force trigger, attribution reset) because the room state changes faster than redeploys.

---

## 5. Which problems recurred

These are the patterns most likely to bite the next story. They become the hard-rule core of `new-story-checklist.md`.

### Recurring across content + puzzles

- **Answer-space wider than acceptance list.** Multi-input, ambiguous-by-design, lateral-construction, plain-vs-technical-vocab, ordering-ambiguous. Surfaces every act.
- **Content leakage from `puzzleDescription` into the puzzle UI.** Riddle text, sequence tables, anagram mappings, glyph translations — duplicated from clue cards. Two integrity passes (`38ba6e4`, `08d462d`) and the slot-prompt rule (`951e0f6`) all addressed the same underlying problem.
- **Vocabulary drift across files.** Same artifact named differently in story brief vs card set vs card prose vs puzzle table. Surfaced repeatedly under different category names (item/clue, pipe-tile/section/bundle, Set I/II/III).
- **Bare cards lacking openers.** Card 1 sets the frame; cards 2 and 3 don't. Players scan in any order.
- **Lore beats buried in logistics text.** Strong writing inside puzzle solution text gets skimmed past. Foreground in `correctAnswerReveal`.
- **Mechanic disconnected from payload.** Puzzle solves to trivia ("vein", "milk") with no thematic bridge to the moral charge of the reveal.
- **Trading topology contradicted by card distribution.** Story says "scattered"; seed puts cards on home tables.
- **Logistics under timer not pre-coordinated.** Multi-card and multi-house self-destruct cards lose data without explicit coordination.
- **Narrator asserting things that should remain ambiguous.** Open mythological mechanisms slip into reveal text as fact.
- **Authoring shortcuts that become problems later.** Single-string concatenated answers, numeric suffixes implying nonexistent sequences, JSONB freeform fields, hardcoded sizes for variable content.

### Recurring across cross-act / mission-design

- **Designed consequences that were never seeded.** "Lock (crew items), card loss (drainage/jigsaw), degraded puzzle (astrolabe)" was in design memory; only the locks were in the seed until late (`d83b283`).
- **Difficulty unannounced.** Puzzles much harder than their neighbors burn team time before teams realize it; flavor warning is the cheap fix.
- **Threads raised but not closed.** Yenus's ledge, Togom's scroll, Vesh's record — narratively rich but mechanically invisible in Act 3 if unsolved.
- **Imbalanced fragment-arc evidence.** Whichever house holds the most complete arc wins the deliberation by default; if the design intends a genuinely open negotiation, every house needs at least one early-phase fragment.

### Recurring across admin

- **Variable-length content overflowing fixed-size print containers** (consequence card text, story sheets). Solution: auto-fit heuristic + per-sheet overflow detection.
- **Performance traps from collapsed-but-mounted UI** (CardRow iframes). Solution: only mount when expanded.
- **Flat lists that became unworkable at scale** (33+ card-set tabs). Solution: hierarchical tabs.

---

## How to use this document

When designing a new story, search this doc for analogues to anything you're about to do. The companion `new-story-checklist.md` is the agent-facing distillation — the rules that should be enforced or flagged on every new draft.

When writing a postmortem after the next playtest, append a new section to this file with what changed and why, and update the recurring-problems list in `new-story-checklist.md` if a pattern repeated.
