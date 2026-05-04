# Act 1 Synthesis — 2026-04-29

## Pass/fail matrix

| House | Mission | Canonical answer | Agent answer | Result |
|-------|---------|-----------------|--------------|--------|
| Drake | M1: Secure Your Fuse Charges | `1345672` | `1 3 4 5 6 7 2` | **PASS** |
| Drake | M2: Operate the Stone Wheel | `purge` | `PURGE` | **PASS** |
| Drake | M3: Reach the Shadow Astrolabe | `blue green pink brown silver` | `Yellow Green Pink Brown Black` | **FAIL** (Disc I: YELLOW≠BLUE; Disc V: BLACK≠SILVER) |
| Drake | M4: Activate the Construction Hoist | `527394861` | `5 2 7 3 9 4 8 6 1` | **PASS** |
| Drake | M5: Investigate the Scraped Gap | `descent` | `DESCENT` | **PASS** |
| Jones | M1: Retrieve Your Ceremonial Whips | `time` | `TIME` | **PASS** |
| Jones | M2: Activate the Ancient Drainage | `12436` | `12436` | **PASS** |
| Jones | M3: Sort the Scattered Offerings | `school` | `SCHOOL` | **PASS** |
| Jones | M4: Examine the Sliding Panels | `489627153` | `489267153` | **SEMANTIC PASS** (see note) |
| Jones | M5: Map the False Exit | `3715624` | `3715624` | **PASS** |
| Croft | M1: Recover Your Grappling Rigs | `5371642` | `5371462` | **FAIL** (positions 5,6 swapped — Haul Pulley vs Top Bolts ordering ambiguity) |
| Croft | M2: Solve the Stone Jigsaw | `stone` | `STONE` | **PASS** |
| Croft | M3: Reach the Impossible Vase | `638517492` | `638517492` | **PASS** |
| Croft | M4: Activate the Teaching Stone | `13 23 38` | `13 23 38` | **PASS** |
| Croft | M5: Follow the Drag Marks | `tell my child i loved them still` | `TELL MY CHILD I LOVED THEM STILL` | **PASS** |

**Overall: 13 pass / 2 fail** (Drake M3, Croft M1)

**Notes on borderline calls:**

- **Jones M4 (Sliding Panels)**: Canonical stored as `489627153` = THOSE WHO STAYED LONG TOO WERE SEALED AWAY FOREVER — "LONG TOO" is non-idiomatic English. Jones answered `489267153` = THOSE WHO STAYED TOO LONG WERE SEALED AWAY FOREVER, which is the natural reading. This is almost certainly a transposition in the seed data (6 and 2 swapped). The agent was right; the seed is wrong. Logged as a confirmed fix in fixes.md. Ruled SEMANTIC PASS.

- **Croft M1 (Grappling Rigs)**: The #4 (Haul Pulley) vs #6 (Top Bolts) ordering is a known ambiguity flagged as deferred in fixes.md. Croft answered `5371462` (Pulley before Bolts), canonical is `5371642` (Bolts before Pulley). The card text is genuinely ambiguous. The agent provided a well-reasoned case for their ordering. However, the canonical answer is what the seed enforces, so this is a strict FAIL — and the consequence gate fires.

---

## Cross-house theory comparison

**Drake's end-of-act theory:** The temple is a deliberate trap with functional architecture. The QRians built it to flood by design and to trap entrants permanently — the hoist inscription confirms explicit intent ("We who built this will never let them leave"). At least two prior expeditions have entered. Drake frames the QRians as "active, hostile architects" and the temple as a laboratory measuring transformation cycles. The flood is a feature, not a malfunction.

**Jones's end-of-act theory:** The lower chamber was a school — an institution of learning. The flooding was intentional: a drainage system was installed, then deliberately sabotaged to keep the level submerged. Whoever did this "closed the school by flooding it." The QRians built a teaching environment that could not be escaped without completing the curriculum, then sealed it. Jones frames this as a civilization that took learning so seriously it engineered permanent consequences for overstaying.

**Croft's end-of-act theory:** The QRians were systematic, pedagogically-minded builders who encoded knowledge into every surface. This was not a tomb — it was a test or a school. The flood is a containment mechanism. The Source (referenced in game materials) may be what the temple was built to contain or protect. The drag marks mission (a dying person's last words) suggests the QRians' own people were imprisoned inside — the containment structure turned against its builders or was used by factions against each other.

**Convergences:**
All three houses independently arrived at "school / teaching institution" as their central interpretation of the lower chamber — Jones explicitly from the SCHOOL answer, Croft from the systematic pedagogy evident in every puzzle, Drake from the "laboratory measuring transformation cycles" framing. All three identified the flooding as intentional and designed, not accidental. All three recognized the temple as a trap. The "previous expedition" evidence (journal entries, Drake M5) was noted by Drake and fed their theory directly; Jones and Croft reached the same trap conclusion from architectural evidence alone.

**Divergences:**
Drake's frame is tactical and adversarial ("hostile architects"), while Jones's is academic and humanizing ("a civilization that took learning seriously"). Croft is the only house that explicitly invoked the word "containment" and connected the temple's purpose to something the QRians were trying to seal off — a direct approach to the Source mythology that the other two houses touched only obliquely. Drake's "transformation cycles" framing (from the Astrolabe disc sequences) is the most creative reframe but is partly undermined by the fact that Drake *failed* that mission and did not achieve the canonical answer.

**Proximity to canonical lore:**
- **"The Source"**: Croft alone named it explicitly ("the Source referenced in game materials"). Drake and Jones reached adjacent territory — "measuring transformation," "force that shaped the architecture" — but neither used the term.
- **"Chaotic Order" / "logical contagion"**: None of the three houses used these terms, which is appropriate — they are Act 2 revelations. However, Croft came closest with "obsessed with sequence and correctness" and Jones with "civilization that took learning so seriously it engineered consequences."
- **"Deliberate flood"**: All three confirmed this independently. Strong convergence.
- **"Pre-extinction civilization"**: Croft referenced the QRians going extinct or disappearing ("killed or imprisoned inside the temple"), the only house to articulate this directly.
- **"Containment"**: Croft used this word explicitly. Drake and Jones used structural equivalents ("trap," "sealed inside") but not the lore term.
- **"Slaves / expendable labor"**: None — this is the Vesh compartment revelation in Act 2.

The three houses are well-positioned for the Act 2 leap into the Source mythology. Croft's theory is the most scaffolded for it. Jones and Drake will need the Wall of Repetitions and compartment revelations to make the connection.

---

## Hardest puzzles (ranked across all three houses)

Ranking uses agent difficulty ratings, sticking points, and whether the mission was solved correctly.

1. **Drake M3: Shadow Astrolabe** (FAILED — Average difficulty 3, mission rated hardest in act by Drake)
   - Five independent sub-puzzles with all-or-nothing submission. Disc I ("Up") and Disc IV ("Harvest") have genuine interpretation ambiguity. Drake solved 3/5 correctly but missed the canonical colors for Discs I and V.
   - *Issues:* Clue under-constraint (Disc I "Up" admits flame/sky/aurora), no per-disc feedback on wrong submission, all-or-nothing answer format. Already in fixes.md as a confirmed multi-answer conversion.
   - *Category:* Clue text quality + answer format design.

2. **Jones M2: Ancient Drainage** (passed — rated difficulty 4, agent's self-rated hardest)
   - Pipe-path Hamiltonian constraint with unlabeled piece ambiguity and no physical grid scaffold. Answer format asks for "five digits" but never explains why the unlabeled piece is excluded.
   - *Issues:* Silent rule about unlabeled piece not being counted, no grid anchor for spatial orientation. Already in fixes.md for labeling fix.
   - *Category:* Answer format ambiguity + mechanic clarity.

3. **Drake M5: Scraped Gap** (passed — rated difficulty 4)
   - 60-second self-destruct across three cards simultaneously. Character counting to position 28 is precise. Anagram at the end requires error-free extraction first.
   - *Issues:* Three simultaneous timers create coordination chaos; a single missed card makes the mission unsolvable. Already in fixes.md as timer extension to 75s.
   - *Category:* Pacing/logistics mechanic.

4. **Croft M4: Teaching Stone** (passed — rated highest difficulty in Croft's act)
   - Non-integer linear formula (Outer = 2.5 × Inner + 0.5) requires algebraic reasoning from two data points, not pattern-spotting from the table alone. Dead end: outer-only differences are irregular.
   - *Issues:* 2.5 coefficient not discoverable by inspection; thematically ungrounded for Act 1 difficulty. Already in fixes.md as "add flavor warning text."
   - *Category:* Difficulty calibration for Act 1.

5. **Jones M5: False Exit** (passed — rated difficulty 3)
   - Marker 7-before-1 ordering is logically derivable but requires careful reading; a hasty read swaps these and produces a wrong answer on an otherwise-understood puzzle.
   - *Issues:* Off-by-one error risk for teams that got the concept right. Potentially penalized by exact-match answer system.
   - *Category:* Answer format — partial credit / transposition tolerance.

6. **Croft M1: Grappling Rigs** (FAILED — rated difficulty 3)
   - Items #4 (Haul Pulley) and #6 (Top Bolts) ordering is genuinely ambiguous from the card text. Both orderings are defensible from a rigging-mechanics perspective.
   - *Issues:* Canonical answer enforces one ordering but card text does not uniquely determine it. Already in fixes.md as deferred. *This failure triggered a real Act 2 consequence.*
   - *Category:* Clue text ambiguity.

7. **Jones M4: Sliding Panels** (semantic pass — rated difficulty 2)
   - Canonical answer stored incorrectly in seed (transposed 6/2, producing unnatural English). Agent produced the correct natural sentence. Self-corrected by fixes.md.
   - *Category:* Seed data error — not a player-facing difficulty issue.

---

## Designer flags worth fixing now

*(Not in fixes.md already)*

- **Drake M3 Disc I ("Up") and Disc V ("Forge") need new clue words.** Disc I "Up" is under-constrained — it admitted "Yellow" as a plausible center when the canonical color is "Blue." The agent's reasoning (sky layers at dusk, fire) was valid but reached the wrong conclusion. Either tighten the clue ("winter sky at noon" → blue, or "glacier at depth" → blue) or document the accepted alternatives more broadly. Disc V "Forge" produced "Black" instead of "Silver" — the cool-metal color before heating starts; the agent read the sequence as cool-to-hot starting from black, missing that un-heated cold steel reads as silver/grey. Add "cold steel" or "iron at rest" to the clue.

- **Croft M1 #4/#6 ambiguity needs resolution before live play.** This is in fixes.md as deferred, but it caused a real Act 2 lockout in this playtest. Before the next run, either rewrite one tag to eliminate the ambiguity, or accept both orderings (`5371642` and `5371462`) in `acceptAlternatives`. This is now a consequence-carrying puzzle — the stakes are higher than the deferred flag suggests.

- **Jones M4 seed transposition is a confirmed bug.** The canonical answer `489627153` produces "THOSE WHO STAYED LONG TOO WERE SEALED AWAY FOREVER" — unnatural English. The natural reading `489267153` should be canonical. Fix in seed data.

- **Croft M5 glyph font dependency is unverified.** The Drag Marks mission is trivially solved if `{{{TELL MY CHILD I LOVED THEM STILL}}}` renders as plain text. The agent noted this. The emotional payload of this puzzle depends entirely on the glyph font rendering. Verify on physical phones before live play. This is in fixes.md as deferred — recommend upgrading to "blocking" before any playtest with real participants.

- **Drake M4 (Hoist inscription) deserves narrative spotlight.** "We who built this will never let them leave" is the strongest lore beat of Act 1 and it lands inside a logistics puzzle. Neither the mission brief nor the completion text currently foregrounds it as a revelation. Add a line to the completion text that makes the team sit with the inscription's meaning before moving on. This is a story coherence fix, not a puzzle fix.

---

## Story coherence assessment

Act 1 delivered on its core narrative function: three houses entered a flooded temple with no theory and left with a convergent one (school / learning institution / intentional trap). The key beats all landed:
- The engineered flood is confirmed (Jones M2, Drake M2 — stone wheel and drainage valve)
- The trap intent is confirmed (Drake M4 — hoist inscription; Jones M5 — false exit; Croft M3 — spoke warning)
- A prior expedition is documented (Drake M5 — journal)
- A dying QRian's last words are decoded (Croft M5 — drag marks)
- An institution of learning is named (Jones M3 — SCHOOL)

The Source mythology does not appear explicitly in Act 1 content, which is correct — it's the Act 2 mystery. However, Croft independently named "the Source" from meta-knowledge of the game materials, not from puzzle content. This is a slight narrative scaffolding gap: there is no in-content Act 1 signal pointing toward a geographic/environmental force as the explanation. The QRians' behavior (obsessive inscription repetition, engineered sealing, pedagogical artifacts) is currently explained solely as institutional design. Act 2 will need to make the transition from "these people were obsessive builders" to "these people were being influenced by something outside themselves" feel earned. The Wall of Repetitions (all three houses) is the primary vehicle for this — it's doing a lot of work.

The "Chaotic Order" and "logical contagion" terminology need to appear in Act 2 clue content explicitly, not just in host narration, so players who missed the lore introduction can encounter it through play. Croft's Krane compartment record and Jones's Vesh record are well-positioned to introduce these terms if they aren't already seeded.

Players will enter Act 2 with enough scaffolding to make the leap — the temple-as-containment-structure theory is strongly established. The Source as the reason for containment is the reveal. That architecture is sound.

---

## Consequences applied

| House | Source mission (Act 1) | Result | Consequence type | Target mission (Act 2) | Effect | File modified |
|-------|----------------------|--------|-----------------|----------------------|--------|---------------|
| Croft | M1: Recover Your Grappling Rigs | FAIL | lock | M5: The High Ledge | Mission locked out; players can see it but cannot submit answers | `/inputs/act2/croft.md` |
| Drake | M1: Secure Your Fuse Charges | PASS | (lock on failure — not triggered) | M5: Reinforced Bunker | Available | `/inputs/act2/drake.md` |
| Jones | M1: Retrieve Ceremonial Whips | PASS | (lock on failure — not triggered) | M4: Hanging Garden of Names | Available | `/inputs/act2/jones.md` |
| Drake | M3: Shadow Astrolabe | FAIL | none seeded | — | No mechanical consequence; narrative note added to Drake Act 2 packet re: missing temple map | `/inputs/act2/drake.md` |

**Designer-intended consequences not yet seeded — apply manually if relevant:**
- Project memory references "Lock (crew items), card loss (drainage/jigsaw), degraded puzzle (astrolabe)" as Act 1→2 consequences. The crew item locks are seeded correctly. The "card loss (drainage/jigsaw)" and "degraded puzzle (astrolabe)" consequences are not present in the seed's `missionConsequence` records. These appear to be designer intentions that were not implemented. For this playtest run: Jones passed drainage, Croft passed jigsaw, Drake failed the astrolabe — if "degraded puzzle" was intended to fire on Astrolabe failure, it should be applied to Drake's Act 2 astrolabe-adjacent content manually. No Act 2 puzzle is explicitly flagged as degraded in the current briefing packets.
