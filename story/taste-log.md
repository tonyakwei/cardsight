# Taste Log

Running journal of edits Anthony has made (or asked to be made), with the rationale. Different from `taste-guide.md`, which is the synthesized rule set; this file is the raw evidence the rules are built on. New entries at top.

For each entry: what changed, where, why. If a pattern shows up twice, lift it into `taste-guide.md`.

---

## 2026-05-03 — Drake voice (observed, not prescribed)

**What:** Patterns noticed in Anthony's hand-edited Drake Act 1 text. These are *Drake's* voice — Croft and Jones almost certainly have their own. Don't generalize these into rules for all houses.

**Patterns:**

1. **The "Drake without X is just..." punchline, repeated.** When a mission fails, the consequence collapses Drake's crew identity into costume.
   - "Drake without firepower is just... people in balaclavas. Morale takes a serious hit..."
   - "Drake without answers is just people in balaclavas staring at chains."

   The repeat across two missions is intentional — it's a Drake catchphrase shape. Failure = costume without function. The ellipsis is doing work; it's the sigh before the burn.

2. **Setup / snap, separated by a paragraph break.** Two-beat jokes where the second line lands harder because of the white space.
   - "And owe you an apology!\n\nThey won't give you one."
   - "Drake uses intelligence. And bombs."

   The break is a comic pause. Don't collapse it into one paragraph.

3. **Self-burn comedy in failure consequences.** Drake's narration mocks Drake.
   - "you just looked like masked men staring endlessly at a stone wheel while you scratched your heads. The other teams probably think you have smooth brains."

   When Drake fails, the failure is observed by the other houses and Drake knows it. Embarrassment is the texture, not despair.

4. **Procedural sound effects → florid metaphor on the same beat.** Reveal text builds rhythm with monosyllables, then breaks open.
   - "Click. Click. Click. Click. Click. The dome splits along hidden seams and opens like a flower."
   - "Click. Click. Click. Seven components, locked in sequence, just like training."

   The sound effects are deliberate, repeated, and *exactly the right number* (five clicks, five discs; three clicks, three card sets). Then one image carries the meaning.

5. **House voice as catechism.** Drake refers to itself in third person, with maxims that sound like internal recitation.
   - "Drake doesn't panic about being trapped. Drake plans around it."
   - "Drake always said, 'If you feel like a failure, it's because you are one.'"
   - "Drake sees a prison built at industrial speed — and prisons are made to be broken out of."

   Drake doesn't have a culture; Drake has a style of being. The third-person self-talk is the texture. "Drake said" is closer to a creed than a quote.

6. **Swagger as character, not bravado.** Success consequences let the team strut, but the language stays grounded.
   - "The team moves with a little more swagger — you're the only crew in this temple with a real ace up your sleeve."
   - "Drake plans around it."

   Drake is competent, not invincible. Even on success, the win is tactical, not heroic.

**How to apply (Drake only):** When writing or revising Drake-house text, lean on these shapes. Failure = self-mocking observation by other houses. Success = clipped, tactical, with a sound-effect rhythm. House voice = third-person catechism. Don't transplant these to Croft or Jones — they need their own recurring shapes, which haven't been mapped yet.

**Open question:** What is Croft's voice? What is Jones's? Worth a separate observation pass when their text is more settled.

---

## 2026-05-03 — Forbidden phrases (immersion-breakers)

**What:** Three phrases the user flagged as "absolutely unacceptable":

1. **"clue cards"** in puzzle text — e.g., "Gather all three *Detonator Component* clue cards from the chamber". Sweep replaced these with the bare item plural: "Gather all three *Detonator Component*s from the chamber".
2. **"index card"** in puzzle text — e.g., "write each translated word on an index card and rearrange". Replaced with "figure out what sentence the words form when arranged in order".
3. **"some sit on your table"** / **"on your table"** in story-sheet blurbs — referencing the player's literal play table breaks the diegetic frame. Replaced with "some are with you".

**Why (user, verbatim):** "we cannot reference 'clue cards', and 'index card'… completely breaks narrative immersion."

**How to apply:** When writing puzzle prompts, story-brief blurbs, or reveals, never name the medium of play. The player's gathering verb stays diegetic ("Gather all three *X*s from the chamber"), the medium ("card", "index card", "table") never appears. The player exists *inside* the temple; their table doesn't.

**Scope of the sweep:** 19 missions across all houses and acts. Verified zero remaining matches via grep.

---

## 2026-05-03 — Hoist sentence rewrite

**What:** Changed the Construction Hoist puzzle's hidden inscription from
> "WE WHO BUILT THIS WILL NEVER LET THEM LEAVE"

to
> "WE WHO BUILT THIS WILL NEVER GET TO LEAVE"

Five places updated: Hoist mission `puzzleDescription` (chain-table glyphs 6 and 8: THEM→TO, LET→GET), `correctAnswerReveal`, `consequenceCompleted`; cards "Inscribed Metal Fragment Hoist Marking Set II" (THEM→TO) and "Set III" (LET→GET); Croft's "Follow the Drag Marks" `consequenceCompleted` cross-reference. Chain pull-order answer `527394861` is unchanged — the sentence reads the same way through the same chain order.

**Why (inferred):** The original framing makes the builders sound like wardens against outsiders ("never let *them* leave"). The new framing makes them captives of their own temple ("never get to leave") — first-person resignation, not third-person threat. It's about the builders themselves, which is what the crypt reveals on solve.

**How to apply:** When you uncover a sentence-reveal puzzle, prefer the one where the inscription is the builders speaking *about themselves*. Their entombment is the horror, not their malice.

---

## 2026-05-03 — Hints default off

**What:** Added `hintEnabled` boolean to `SingleAnswer` / `MultipleAnswer`, default `false`. Admin editor now shows a "Show hint to players" switch; when off, the hint textarea and threshold input are hidden. Player flow only emits `hintAvailable` and `hint` if the toggle is on.

**Why (user, verbatim):** "I don't like how they will show. Will ruin immersion."

**How to apply:** Treat hints as opt-in, not opt-out. A hint is a deliberate authorial choice for a specific puzzle, not a safety net the system provides by default. The "Hint available after N attempts" teaser is itself an immersion break — the system telling the player it's a system. Skip it unless the puzzle genuinely benefits.

---

## 2026-05-03 — Drake A1 typo pass

Simple typo / agreement fixes (no rephrasing):

- Operate the Stone Wheel — "a stone wheels" → "a stone wheel"
- Activate the Construction Hoist — "irons chains" → "iron chains"
- Investigate the Scraped Gap — "As one of you squeeze inside" → "squeezes"; "a old paperbound journal" → "an old"
- Reach the Shadow Astrolabe answer template — "Disc  I" double-space and "Tumbler II" → consistent "Disc I … Disc V"

**Why:** Just typos.
