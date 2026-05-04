# New-story checklist

Lint rules and default patterns for any new CardSight story. Distilled from the recurring-problems lens of `story-development-retrospective.md`.

Three tiers:

- **Hard rules** — agent failures are bugs. Every rule has a way to check from a draft + seed.
- **Default patterns** — deviations need a reason. Agents should flag, not block.
- **Open questions** — taste calls. Agents surface these for human judgment.

For agent-driven review, fan out one agent per section (or one per `## Hard rule` cluster) on a draft and have them report violations with a one-line citation each.

---

## Hard rules

### H-1. Every puzzle answer must accept all defensible readings

**Why:** the #1 puzzle failure mode in the 2026-04-29 playtest was players reasoning correctly and being told they were wrong. Nine of twelve hardest puzzles had this shape.

**How to check:** for each `SingleAnswer` / `MultipleAnswer` in the seed, ask: "what other answers would a reasonable player produce from these clues?" Any answer the agent can defend must be in `correctAnswer` or `acceptAlternatives`. Specifically watch for:

- Word puzzles with multiple natural completions (BREAK / CRASH / FLOOD; SEED / ROOT / VEIN; STILL / STATUE / STONE).
- Phenomenon-pair puzzles where plain English vs. technical register both work (DAWN vs. ZENITH; MIDNIGHT vs. NADIR).
- Ordering puzzles where two items have ambiguous priority from card text.
- Phonetic constructions only resolvable when read aloud (FLOWER as flow-er).

If an answer has *meaningful consequence* (lockout, redistribute), the rule tightens: defensible alternatives must be accepted, or the prompt must be rewritten until only one reading remains.

### H-2. Multi-input puzzles must be `multiple_text`, not concatenated

**Why:** a wrong answer anywhere in a 5-disc / 5-shelf / 5-cluster puzzle fails the whole mission with no diagnostic. Players retry blind.

**How to check:** any `puzzleDescription` that asks for more than one value (per disc, per shelf, per cluster, per procedure step) must use `MultipleAnswer` with one field per slot. Single-string `comma-separated` or `space-separated` answers are a regression.

### H-3. `puzzleDescription` must NOT contain clue-card contents

**Why:** if the puzzle description carries the data the clue cards should hand over, players solve without scanning. The trading economy collapses. This recurred in Act 1 (`38ba6e4`) and Act 2 (`08d462d`); each time the same fix.

**How to check:** for each mission, diff `puzzleDescription` against its required clue cards' descriptions. If the description contains:

- Riddle text already on a Riddle-Tablet card
- Sequence-ordering tables already on clue cards
- Anagram letter mappings already on clue cards
- Glyph translations already on clue cards
- Pattern-completion values already on clue cards

…strip them. The prompt points at the clue cards; the data lives only on the cards.

### H-4. Slot prompts may show structure, never clue-card contents

**Why:** related to H-3 but specific to MultipleAnswer slot labels. Slot prompts that read `Cluster 1 (NIGHT+SURRENDER)` leak the trade currency directly into the puzzle UI.

**How to check:** every `MultipleAnswerField.prompt` should reference only what is visible on the chamber itself: `Cluster 1`, `Shelf 3`, `Disc V — Up`, `Position 4 (Outer value)`, `Procedure I — Step 4`. It must not contain the clue-card text the player is supposed to trade for.

### H-5. Every clue card in a category must be order-agnostic

**Why:** players don't scan card 1 first. If only card 1 has a narrative opener and cards 2/3 jump straight into bullet lists, anyone who scans 2 first sees Markdown rows with no context.

**How to check:** for each card in a multi-card category, the first sentence of `description` must establish the diegetic frame on its own. Avoid "more spokes…" or "additional shards…" — the second card shouldn't depend on the first having been read.

### H-6. Self-destruct cards must include a fragility cue in description

**Why:** the timer is dramatic only if the *fiction* explains the decay. Otherwise it reads as arbitrary game pressure.

**How to check:** any card with `selfDestructTimer` set must have a sentence in `description` like "The ink is bleeding fast — read it before it's gone." or "These pages were already half-burnt when you found them." A timer without a cue is a bug.

### H-7. Multi-house simultaneous self-destruct needs a diegetic coordination beat

**Why:** without pre-coordination, one house scans during a different conversation and crumbles information before others are ready. Three missions in Temple of the QRians had this shape; only the diegetic beats prevented mission-killing logistics failures.

**How to check:** if more than one house holds a self-destruct card for the same mission, the `storySheetBlurb` (or equivalent) for those houses must include an in-character beat showing a teammate clocking the cross-house parallelism. No out-of-frame "designate a writer" instructions — the beat must be diegetic.

### H-8. Trading-required missions must distribute clue cards across houses

**Why:** if the story brief says "scattered across the chamber, others have picked some up," the seed must reflect it. Eight Act 2 missions said this and put all cards on home tables; the trading mechanic was theatrical until corrected.

**How to check:** for each mission whose brief uses scattering / distribution language, count `CardHouse` assignments. Default distributions:

- 3-card missions: home keeps card 1; cards 2 and 3 rotate to the other two houses (1/1/1 split).
- 2-card riddle missions: home keeps Tablet I; Tablet II rotates to a different house.

If the seed assigns all cards to the home house, either redistribute or rewrite the brief.

### H-9. Strong lore beats must surface in `correctAnswerReveal`, not be buried in mechanics

**Why:** strongest writing inside puzzle solution text gets skimmed past. The Hoist's "WE WHO BUILT THIS WILL NEVER LET THEM LEAVE" was the strongest Act 1 lore beat and was nearly lost.

**How to check:** for each mission, identify the single most important lore beat. Confirm it appears in `correctAnswerReveal` (or `consequenceCompleted`), not only inside the puzzle solution / glyph string / completion-text aside. If the beat is the puzzle answer itself, the reveal should restate and frame it.

### H-10. Open mythology must be reframed as character theory, not narrator-asserted fact

**Why:** central mythological mechanisms (e.g. the Source) are meant to remain partially open across acts. When reveal text states a mechanism as fact, it forecloses the room's interpretation.

**How to check:** scan `correctAnswerReveal` and `consequenceCompleted` text for assertions about contested mythology. Anything that asserts mechanism (how it works, what it is) should be attributed to a named character's belief: "Vesh believed…", "Krane reasoned…". Distinguish from observable phenomenology, which can be stated.

### H-11. Vocabulary must match across story brief, card sets, card descriptions, puzzleDescription, and mission text

**Why:** drift creates two-card disagreements (story brief: "ceramic tiles"; card prose: "pipe sections"; puzzle table: "Tile" column) that pull players out of frame.

**How to check:** for each mission, build a lexicon of every artifact noun used. Check that all six surfaces (story sheet, story brief, card-set name, card `clueVisibleCategory`, card `description`, mission `puzzleDescription`) use the same word.

### H-12. Puzzle prompts say "Write," not "Enter"

**Why:** "Enter" reads as UI instruction. Players actually write on paper before transcribing. Diegetic frame matters for the physical-first principle.

**How to check:** grep `puzzleDescription` and hint strings for `"enter the"`, `"input below"`, `"in your input"`. Replace with `"write"`, `"in its slot"`, etc.

### H-13. Glyph cipher text must use `{{{TEXT}}}` and be unselectable

**Why:** the Calligraphr font maps glyphs to standard letter codepoints. A copy-paste yields the answer. The `.qrian-glyph` span has `user-select: none` + iOS long-press disabled.

**How to check:** any inscription rendered as glyphs in the player view must use the `{{{TEXT}}}` macro, which routes through `processQrianText()`. Never inline raw glyph characters in markdown.

### H-14. Numeric suffixes only for in-fiction sequences

**Why:** "Set I/II/III", "Bundle I/II/III", "Pair A/B/C" implied a sequence that doesn't exist for scan-order-independent cards. Players inferred a scan order that wasn't there.

**How to check:** for any multi-card category, ask: "is this a real diegetic sequence the player needs to follow?" If yes (Compartment Tile Slots, Wall Tiles 1/2/3 per color, Procedure I/II), keep. If no, use descriptive variants (Large / Crooked / Painted Pottery Shard).

### H-15. `MissionConsequence` records must match design memory

**Why:** Act 1→2 consequences were listed in memory ("lock crew items, card loss for drainage/jigsaw, degraded puzzle for astrolabe") but only the locks were seeded for months. Drift between intent and implementation.

**How to check:** cross-reference the project's act-consequence design notes against `MissionConsequence` rows in the seed. Every documented consequence must have a corresponding row, or the design memory must be updated to remove it.

### H-16. Cleanup paths cover every entity type

**Why:** when adding a new answer-template type or entity, the `cleanExistingGame` function must delete it. Forgetting leaks orphans on reseed (`951e0f6` fixed this for `multipleAnswer`).

**How to check:** for any new model added to the schema, confirm a corresponding `*.deleteMany` or cascade in the seed cleanup.

---

## Default patterns

These have worked. Deviating is fine if the story calls for it; agents should flag the deviation, not block.

### D-1. Triptych shared-skeleton across houses

Three missions sharing a structural template, themed differently per house. Reduces design surface area and creates implicit cross-house comparison.

### D-2. Lock-scaffold-defer for hard puzzles

Lock the puzzle archetype early, scaffold the mechanic, defer specifics until the theme is locked. Reverses the temptation to design the answer before the question.

### D-3. Three-text completion principle

Each mission needs three texts: `correctAnswerReveal` (the lore payoff), `consequenceCompleted` (success consequence — ends with momentum), `consequenceNotCompleted` (failure consequence — ends with dread). Name losses concretely; flavor without a named loss reads as fluff.

### D-4. Story brief in three sentences

3-sentence punchy version, hook + trailing collection CTA. Long-form briefs got skipped. Camera-first openings, visual-over-jargon, open mystery, no mechanism spoilers, trail-off CTA.

### D-5. House voice locked early

Each house has a register fixed in the first story card and reinforced in completion text and consequences. Drake mercenary humor, Jones academic earnestness, Croft Lara physicality — same shape every time.

### D-6. Trading distribution: 1/1/1 for 3-card, home-keeps-I for 2-card riddles

Default distribution patterns from `bd742f3`. Holds unless a specific narrative reason argues otherwise.

### D-7. Within-era timeline acceptance, not strict positional

For collective-arc puzzles, group cards into eras and accept any within-era order. Strict positional ordering forces "group bookkeeping" over emotional reconstruction.

### D-8. Difficulty hint on unusually hard missions

If a puzzle is much harder than its neighbors, add a one-line difficulty cue to the brief ("you have a feeling this will be hard..."). Lets teams prioritize without burning time.

### D-9. Auto-fit prints, don't hardcode font sizes

For variable-length content (consequence cards, story sheets), use the fitText tier system, not fixed sizing. Long bodies will silently clip otherwise.

### D-10. One Design per material family, auto-assigned by card set

Players read material families (stone, metal, bone, paper) faster when each has its own palette/font/animation. Don't author per-card unless intentional.

### D-11. Fisher-Yates physical-card shuffle at seed start

So printed colors don't leak set-membership before the QR scan, short-circuiting the trading mechanic and the gift-of-the-portal feel.

### D-12. Threads raised must close

If a named character or location is set up across acts, give them at least one Act 3 fragment or explicit resolution. Yenus's ledge / Togom's scroll / Vesh's record were all narratively rich but mechanically invisible if unsolved.

### D-13. Each house must have at least one early-phase fragment

If the major decision in Act 3 has alternatives (Recontain / Open / Destroy), each house needs evidence supporting their position. Imbalanced fragment-arcs gravitate the deliberation toward whoever holds the fullest arc.

### D-14. The central term must land somewhere reachable

If the mythology has a central term ("the Source"), at least one *commonly-solved* mission must surface it — not only failure-prone or trading-dependent missions. Otherwise the phenomenology lands but the vocabulary doesn't.

---

## Open questions (taste — agents surface, don't block)

- **Mechanic ↔ payload connection.** Does the puzzle mechanic resonate with what the reveal says? Anatomy-puzzle revealing slave construction landed as trivia until a thematic bridge was added (`872c1d0`). Agent prompt: *"Does this puzzle's mechanic foreshadow or echo its narrative payload? If not, is a bridging sentence warranted?"*

- **Difficulty curve across the act.** Are missions in roughly ascending difficulty? Outliers should either be flagged with D-8 or moved.

- **Trading priority signaling.** If a mission is the act's narrative spine, does anything in the brief or host materials signal it as a priority? Wall of Repetitions failed because faster missions were available.

- **Self-destruct cumulative load.** How many self-destruct missions does any one house hold simultaneously? At 3+, table coordination becomes the puzzle.

- **Physical-artifact production readiness.** For each printed-artifact mission, is the artifact (a) actually built, (b) legible at table distance, (c) reroll-stable across reseed runs?

---

## Agent prompt template

Copy-paste for fanning out review agents on a new story draft:

```
You are reviewing a CardSight story draft for {{STORY_NAME}} against a known
rule set in story/new-story-checklist.md.

Inputs:
- Story design doc: {{STORY_DESIGN_PATH}}
- Seed script: {{SEED_PATH}}

Your scope: {{SECTION_NAME}} (e.g. "Hard rules H-1 through H-5", or
"Default patterns", or "Open questions").

For each rule in scope, do the following:
1. Identify whether the rule applies to anything in the draft.
2. If it does, check whether the draft satisfies it.
3. Report violations as: `{rule_id}: {one-line citation with file:line}`
4. Report passing checks as: `{rule_id}: ok`
5. For open questions in scope, surface a one-line summary of what taste call
   the human should make.

Do not edit any files. Do not propose fixes unless asked. Report only.
Keep total output under 400 lines.
```

---

## Maintenance

When the next playtest surfaces a new pattern, decide:

- Is it a one-off (don't add) or a structural shape that will recur (add)?
- Is it lint-checkable (hard rule) or judgment (default pattern / open question)?

Append to this file with the same `H-N` / `D-N` numbering and update the recurring-problems section of `story-development-retrospective.md`.
