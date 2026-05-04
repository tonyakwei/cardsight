# Jones Junket — Act 1 Playtest

## Theory of the temple — pre-game (just from story brief)

The temple is ancient and deliberately flooded — the water channels look engineered, not accidental. The QRians built something here that they sealed intentionally. The lower level feels like a sub-basement or foundation chamber — a place of ritual or storage. The script on the walls suggests a literate, organized civilization. Whatever they buried, the architecture was designed to resist casual entry.

---

## Mission-by-mission

### Mission 1: Retrieve Your Ceremonial Whips

**Puzzle work:**

The three Coded Clay Tablet cards together give 12 letter mappings: T=T, I=I, S=S, O=O, M=M, N=N, A=A, L=L, E=E, C=C, V=V, H=H. The mapping is identity — each glyph renders to its own Latin letter. Jones holds all three clay tablet cards, so no trading needed.

The corridor labels decode directly: STONE, SILENCE, ANCIENT, OCEAN, TIME.

The riddle: "IT EATS ALL STONE NONE CAN SEE IT" — this is a classical riddle. What erodes stone invisibly? TIME. TIME also matches a corridor label exactly.

**Final answer:** TIME
**Confidence:** High
**Difficulty:** 2
**Time-to-solve guess:** 5–8 minutes (glyph decoding adds friction but the riddle is well-known)
**Solving mode:** Understood-mechanic
**Sticking points:**
- The glyph system is identity-mapped for all letters needed in this puzzle. That's a design choice — the cards "teach" the system with zero deception. But players who expect a real substitution cipher will spend time looking for non-identity mappings and feel cheated when they discover it maps to itself. Clarify up front that the mapping is partial (only ~12 of 35 characters are on these cards) so players know the card set is a reference, not a full codex.
- The riddle itself ("IT EATS ALL STONE NONE CAN SEE IT") is solid but the phrasing is unusual — "none can see it" is the standard form for time (you can't see time passing). A minority of players may initially try SILENCE (you can't see silence either). Adding one more clause to disambiguate — "it passes but leaves no wake, yet grinds mountains to dust" — would close this off cleanly.
- All three tablet cards are held by Jones — no trading dependency. This means Mission 1 is fully self-contained. Good for early momentum.

**Felt earned?:** Yes — once the riddle resolves to TIME, the corridor label match is satisfying.

**Designer flags:**
- Identity mapping feels anticlimactic if players expect a cipher puzzle. Consider whether the glyph system is doing any work here beyond flavor. If the riddle answer were in glyphs rather than English, the decoding would feel more purposeful.
- No ambiguity in corridor labels — all five are distinct, well-chosen. SILENCE is a plausible trap answer for the riddle; consider whether that's intentional misdirection or an undesired false positive.

---

[STORY LOG ENTRY 1: Theory after Mission 1]

The corridors are labeled. The QRians inscribed directional guidance into the architecture — but in riddle form, not plain instruction. They expected visitors to *earn* passage by solving, not just reading. This is a civilization that tested intelligence as a gating mechanism. The flooding feels more controlled now — TIME eating stone is exactly what water does. The passage back to the surface was already time-sealed.

---

### Mission 2: Activate the Ancient Drainage

**Puzzle work:**

Jones holds all three Pipe Bundle cards. Inventory:
- V1: Straight (L↔R)
- V2: Elbow (L, B)
- V3: T-junction (L, R, T) — top is dead-end in path context
- V4: Elbow (T, L)
- V5: Elbow (R, B) — SABOTAGED
- V6: Elbow (T, R)
- Unlabeled straight (L↔R) — "just channel," no valve number

SOURCE at (1,1) opens Right. DRAIN at (3,3) opens Left. Need Hamiltonian path through all 9 cells.

The only viable Hamiltonian path that uses all seven available pieces (given the specific elbow directions):

(1,1)SOURCE → (1,2)V1[L↔R] → (1,3)V2[L,B] → (2,3)V4[T,L] → (2,2)V3[L,R,T — T dead-end] → (2,1)V5[R,B — SABOTAGED] → (3,1)V6[T,R] → (3,2)unlabeled-straight[L↔R] → (3,3)DRAIN

Flow verification:
- SOURCE exits Right → (1,2) enters Left, exits Right ✓
- (1,2)→(1,3): enters Left, exits Bottom ✓ (V2)
- (1,3)→(2,3): enters Top, exits Left ✓ (V4)
- (2,3)→(2,2): enters Right, exits Left (V3 uses L and R; T is dead-end) ✓
- (2,2)→(2,1): enters Right, exits Bottom ✓ (V5 sabotaged)
- (2,1)→(3,1): enters Top, exits Right ✓ (V6)
- (3,1)→(3,2): enters Left, exits Right ✓ (unlabeled)
- (3,2)→DRAIN: enters Left ✓

Valve numbers in flow order: V1, V2, V4, V3, V5(skip-sabotaged), V6, unlabeled(no number)
Five digits (valves only, skip sabotaged): **1, 2, 4, 3, 6** = "12436"

**Final answer:** 12436
**Confidence:** Medium
**Difficulty:** 4
**Time-to-solve guess:** 20–35 minutes for a live team
**Solving mode:** Understood-mechanic (once pipe pieces are laid out physically)
**Sticking points:**

1. **The unlabeled straight is a serious problem.** The card reads "Straight (L↔R), no valve: Just channel." The mission asks for "valve numbers in flow order." Players must determine whether the unlabeled piece counts in the sequence or not. The mission answer format says "five digits" — if the unlabeled straight is skipped (like the sabotaged valve) because it has no valve number, you get 5 digits (1,2,4,3,6). But this is not explained anywhere. Players will debate this. The sabotaged valve is skipped per explicit instruction; the unlabeled piece is skipped... why? Because it has no valve? The mission text never says this.

2. **Grid orientation is not established.** "SOURCE (top-left, opens Right)" and "DRAIN (bottom-right, opens Left)" — but there's no physical grid to lay pieces into. Players must construct the grid mentally or on paper. This is feasible but slow and error-prone.

3. **V3 (T-junction) in a path context is confusing.** A T-junction has three openings. In a pipe-network puzzle, it branches. In a path puzzle, one opening must be a dead-end. The card text says "top is a dead-end" — this is correctly flagged. But a team member might still question: can water flow through a dead-end junction in a real pipe? The diegetic framing breaks slightly.

4. **The path is over-constrained.** There is exactly one valid Hamiltonian path given these pieces. That's good for puzzle design (unique answer) but means one wrong placement cascades to "no solution" — teams may think they mis-read a piece rather than that they're on a wrong path branch. Add some "try this if you're stuck" guidance.

5. **Cards-held distribution.** Jones holds all three Pipe Bundle cards — no trading. This is again self-contained, which front-loads Mission 2 as solvable early. But if the design intent was to require trading for Missions 2–5, this isn't delivering on that.

**Felt earned?:** Partial — the piping solution is elegant but the unlabeled-piece ambiguity will poison the answer-entry moment.

**Designer flags:**
- Either give the unlabeled straight a valve number (e.g., V7), or explicitly state in the mission that pieces without valve numbers are not counted in the answer. Currently this is a silent rule that players must infer.
- Consider whether "five digits" in the answer format was intended to include or exclude the unlabeled piece. If it excludes it, the format is self-checking (players count 5 numbered valves after skipping the sabotaged one). But this must be made explicit.
- The ASCII pipe diagrams on the cards are hard to parse quickly at a crowded table. A labeled diagram with arrow showing flow direction would significantly reduce friction.

---

[STORY LOG ENTRY 2: Theory after Mission 2]

The flooding was engineered. There's a drainage system built into the walls — not just channels, but valves, junctions, sabotage. Someone disabled one valve deliberately. The QRians didn't just design the flood in; they designed the drainage out — then broke it. This is starting to feel less like a tomb and more like a controlled environment. Someone wanted the lower level flooded and wanted it to stay that way.

---

### Mission 3: Sort the Scattered Offerings

**Puzzle work:**

Jones holds all three Sealed Stone Vessel cards. All 6 vessels are in hand.

Vessel-to-alcove matching by residue color:
- BLUE alcove: lapis lazuli (Vessel 1, deep blue powder) + cobalt ore (Vessel 6, deep vivid blue sheen)
- AMBER-GOLD alcove: hardened tree sap/amber resin (Vessel 2, amber-colored) + crystallized honey (Vessel 5, translucent sweet — honey is golden-amber)
- DARK GREEN alcove: crushed malachite (Vessel 3, bright metallic sheen — malachite is green) + verdigris/copper corrosion (Vessel 4, green-blue patina)

Letters in alcove order (left to right, lower-numbered vessel first within each pair):
- Left/BLUE: V1(S), V6(C) → S, C
- Center/AMBER-GOLD: V2(H), V5(O) → H, O
- Right/DARK GREEN: V3(O), V4(L) → O, L

Word: S-C-H-O-O-L = **SCHOOL**

**Final answer:** SCHOOL
**Confidence:** High
**Difficulty:** 2
**Time-to-solve guess:** 8–12 minutes
**Solving mode:** Understood-mechanic
**Sticking points:**

1. **Verdigris / cobalt ambiguity.** Verdigris (Vessel 4) is described as "green-blue patina." Cobalt ore (Vessel 6) is "deep vivid blue sheen." Both have blue in their description. A hasty team might put Vessel 6 in BLUE and Vessel 4 also in BLUE, leaving the green alcove short. The differentiator is that verdigris is primarily green (copper corrosion is green) and cobalt ore is primarily blue — but this requires mineralogical knowledge. The carvings on V4 ("spiral descending into earth") are not color-coded. Consider adding "the dominant hue is [X]" to any vessel whose residue spans two color families.

2. **Malachite vs. emerald green.** Malachite (Vessel 3) is described as "bright metallic sheen" — this reads as silver/reflective to some players. The green identification comes from domain knowledge. DARK GREEN alcove matching malachite requires knowing malachite is a vivid green stone. A line like "distinctly green in color" would close this gap.

3. **"Lower-numbered vessel first"** — this ordering rule produces S, C, H, O, O, L = SCHOOL. The word is immediately satisfying and legible. But the ordering rule is mechanical and a bit arbitrary. If a team misorders within a pair (puts V6 before V1 in the blue alcove), they get C, S, H, O, O, L = CSHOOD or something unrecognizable — they'll self-correct because the word breaks. Good self-checking behavior.

4. **All 6 vessels are with Jones.** No trading needed. Mission 3 is fully self-contained. Three of five missions require no trading at all for Jones — this reduces the inter-house interaction the design seems to intend.

**Felt earned?:** Yes — SCHOOL is a clean reveal. The matching mechanic is intuitive. This is the smoothest puzzle in the set.

**Designer flags:**
- Lore question: what is a SCHOOL doing in a pre-modern temple? "SCHOOL" as a word implies an institution of learning. If this is what the lower level "truly was" — an educational space — that's a significant narrative reveal. Is this intentional? It reframes the chamber as a teaching space rather than a ritual or storage space. Make sure this word does intended narrative work.
- The mineralogy demands are the main fairness risk. A museum-literate player will breeze through it; someone without that background will guess. Consider whether one or two of the residues need simpler color identification.

---

[STORY LOG ENTRY 3: Theory after Mission 3]

The alcoves held offerings categorized by color — blue, amber, green — with a specific sorting logic baked in. The answer spells SCHOOL. This wasn't a temple in the religious sense — it was an institution of learning. The lower chamber was a schoolroom, or a preparation space for initiates. The vessels held teaching materials sorted by discipline or curriculum. The flooding sealed the school. Someone decided what was being taught here should not continue.

---

### Mission 4: Examine the Sliding Panels

**Puzzle work:**

Jones holds all three Flat Inscribed Slate cards. All 9 panels and translations are provided directly on the cards. No trading required.

Words: 1=SEALED, 2=TOO, 3=FOREVER, 4=THOSE, 5=AWAY, 6=LONG, 7=WERE, 8=WHO, 9=STAYED

Grammatical sentence construction from these 9 words:

"THOSE WHO STAYED TOO LONG WERE SEALED AWAY FOREVER"
= Slate 4, 8, 9, 2, 6, 7, 1, 5, 3

Check: THOSE(4) WHO(8) STAYED(9) TOO(2) LONG(6) WERE(7) SEALED(1) AWAY(5) FOREVER(3) — reads correctly as an English sentence.

Answer: **489267153**

Alternative ordering: "THOSE WHO STAYED TOO LONG WERE FOREVER SEALED AWAY"
= 4, 8, 9, 2, 6, 7, 3, 1, 5 = 489267315

Both sentences are grammatical English. "Sealed away forever" is the more idiomatic phrase. Committing to 489267153.

**Final answer:** 489267153
**Confidence:** Medium (sentence ordering has two valid readings)
**Difficulty:** 2
**Time-to-solve guess:** 5–10 minutes once all slates are assembled
**Solving mode:** Understood-mechanic
**Sticking points:**

1. **Two grammatical sentences.** "THOSE WHO STAYED TOO LONG WERE SEALED AWAY FOREVER" and "THOSE WHO STAYED TOO LONG WERE FOREVER SEALED AWAY" are both correct English. The puzzle cannot distinguish between them through grammar alone. If the answer is hard-coded to one, teams who produce the other grammatically correct sentence will get a wrong answer with no useful feedback. This is the single biggest design problem in Act 1.

2. **The puzzle is trivially mechanical once cards are in hand.** All 9 translations are printed directly on the slate cards — there's no decoding, no glyph work, no inference. Players literally rearrange 9 word-cards and read the sentence. The puzzle is assembly, not solving. For a 5-person team this will take under 5 minutes. It's the easiest mission in the act.

3. **Mission 4 might be too easy relative to its position (4th mission).** If players are fatigued from Mission 2, Mission 4 provides relief — which is fine. But if this is meant to be a mid-act challenge, it's not delivering.

4. **No trading.** Jones holds all three slate cards. Fifth consecutive self-contained mission.

**Felt earned?:** Partial — the sentence reveals are narratively strong but the mechanical execution is too thin. There's no decoding, no insight required — just rearranging.

**Designer flags:**
- Critical: add a canonical answer note in the designer file specifying whether the answer is 489267153 or 489267315. Both sentences are valid. Consider rewriting the inscription to produce only one grammatical reading. One fix: include a word that can only occupy one position in the sentence (e.g., swap FOREVER for MUST, making "THOSE WHO STAYED TOO LONG WERE SEALED AWAY MUST" invalid and forcing a unique reading — though this alters the tone). Better fix: ensure the sentence has a word that is ambiguous in placement but only works in one specific slot.
- The glyph-to-English translations are provided verbatim on the cards. No decoding work is required. This effectively makes Mission 4 a sentence-assembly puzzle with no cryptographic layer. If that's intentional, the mission should be framed as "reassemble the inscription" not "translate the glyph." If decoding was intended, the cards should give glyphs, not pre-translated words.

---

[STORY LOG ENTRY 4: Theory after Mission 4]

"Those who stayed too long were sealed away forever." This is a warning — or a record. The QRians inscribed the consequence of staying inside. This was written after the sealing happened, which means the inscription is either a post-hoc memorial or a warning placed by whoever did the sealing. The lower chamber was sealed deliberately, by someone who knew what they were sealing and why. The flooding, the drainage system, the inscription — all intentional. The school was closed by force.

---

### Mission 5: Map the False Exit

**Puzzle work:**

Jones holds all three Worn Stone Marker cards. All seven markers are available. No trading required.

Narrative reconstruction — walking from the archway inward:

- **Marker 3:** Entry. "Archway opens into passage that slopes gently upward. Left wall: carved sun — first hopeful symbol." Starting point. *(3)*
- **Marker 7:** "Passage turns sharply left. Carved sun gone, replaced by repeating angular glyphs. Upward slope continues." First turn, still ascending. *(7)*
- **Marker 1:** "Slope levels off. Draft from above. Crack in ceiling admits shaft of light. Passage continues straight." Leveling out at the top of the slope. *(1)*
- **Marker 5:** "Right turn. Shaft of light falls behind. Passage begins to slope downward. Walls are bare stone." Turn away from the light crack, now descending. *(5)*
- **Marker 6:** "Passage turns sharply right. Angular glyphs reappear — same as before, on the backs. You are seeing the backs of the same carvings." Recognition moment — looping back. *(6)*
- **Marker 2:** "Past the carvings, downward slope steepens. Carved sun on right wall — identical to one seen before, but on the wrong side." Sun was on left going up; now on right going down. Same location, different direction of travel. *(2)*
- **Marker 4:** "Slope levels off. Passage opens into chamber. Your own equipment, your own markings. You have not climbed. You have descended." Terminal discovery — it's a loop. *(4)*

Order: 3, 7, 1, 5, 6, 2, 4 = **3715624**

**Final answer:** 3715624
**Confidence:** High
**Difficulty:** 3
**Time-to-solve guess:** 12–18 minutes
**Solving mode:** Understood-mechanic
**Sticking points:**

1. **Markers 1 and 7 are in ambiguous order.** Both involve "upward slope continues." Marker 7 has a left turn; Marker 1 has the slope leveling off. A team might place 1 before 7 (slope levels first, then turn) rather than 7 before 1 (turn while still ascending, then levels). The differentiator: Marker 7 says "upward slope continues" implying it hasn't leveled yet, and Marker 1 says "slope levels off" — so 7 must come before 1. This is logically derivable but requires careful reading. A hasty team will swap these.

2. **Marker 3 as the definitive starting point is clear** — "archway opens" is the entry signal. Good.

3. **Marker 4 as the definitive end is clear** — "you have descended" is the resolution. Good.

4. **The loop structure is narratively elegant.** This is the best-designed puzzle in the act. The false-exit reveal is satisfying, the physical logic of the loop is consistent, and the wrong-side-of-the-sun moment (Marker 2) is the kind of insight that makes players feel clever. The escalating recognition (glyphs → sun wrong side → own equipment) is well-paced.

5. **All markers are with Jones.** Fifth mission in a row with no trading requirement for Jones. The entire act is solvable without a single trade.

**Felt earned?:** Yes — the loop reveal is earned. Reading the markers in sequence produces a genuine sense of discovery.

**Designer flags:**
- This is the strongest puzzle in the act. It requires genuine reasoning about spatial narrative.
- The 7-before-1 ordering decision could cause off-by-one errors in the answer string. Consider whether the answer-checking system accepts transpositions or only exact matches. If exact match only, the 7/1 swap will produce wrong answers for teams that got the concept right. A partial-credit system or hint ("did you find the light source?") would be fairer.
- All five missions require zero trading for Jones. This is almost certainly not the design intent. If other houses hold Jones's cards, this needs to be rechecked in the seed data.

---

[STORY LOG ENTRY 5: Theory after Mission 5]

The false exit is a trap — but a pedagogical one. The corridor loops back to the starting chamber. The QRians built it knowing visitors would find it, follow it, and return. The carved sun appearing on the wrong side is a deliberate tell: "you have been tested and you did not escape." The temple is a series of tests. The school in the lower chamber, the riddle over the corridors, the inscription about staying too long — all of it is designed to teach, challenge, and ultimately contain. We are inside something that was built to have people inside it.

---

## Cards I need from trading

Jones holds all required clue sets for all five missions (all three Coded Clay Tablet cards, all three Pipe Bundle cards, all three Sealed Stone Vessel cards, all three Flat Inscribed Slate cards, all three Worn Stone Marker cards). **Zero trades required.**

This is a significant design problem. Jones Junket can solve the entire act in isolation. See Designer Summary.

---

## End-of-act theory of the temple

The lower chamber is a school — an institution of learning built and operated by the QRians. The flooding was intentional: a drainage system was installed but then deliberately sabotaged (one valve broken). Someone closed the school by flooding it and sealing it. The inscription records the consequence: "those who stayed too long were sealed away forever." The false exit corridor was a test built into the architecture — visitors who followed the apparent way out looped back to the starting chamber. Every element of the lower level is either a test of intelligence (the riddle), a test of knowledge (the mineral vessels), or a test of patience (the pipe network). The QRians built a teaching environment that could not be escaped without completing the curriculum. Then they flooded it. The question is whether the people sealed inside were students who failed, people being punished, or the teachers themselves. The "those who stayed" phrasing suggests voluntary lingering — the sealing was not an execution but a consequence of overstaying. The civilization that built this took the act of learning so seriously that they engineered permanent consequences for it.

---

## Designer Summary

### Hardest puzzles (ranked)
1. **Mission 2 (Pipe Grid):** Spatial reasoning with 7 pieces, unlabeled straight ambiguity, and no physical grid scaffold. Highest friction. The answer format ambiguity (is the unlabeled piece counted?) is a critical bug.
2. **Mission 5 (False Exit):** Narrative reconstruction with 7 markers. The 7/1 ordering ambiguity will cause teams that understood the puzzle to submit wrong answers.
3. **Mission 1 (Corridor Riddle):** Easy if you know the riddle form; SILENCE is a plausible wrong answer.
4. **Mission 3 (Vessels):** Mineralogy knowledge dependency is the main risk. SCHOOL is satisfying.
5. **Mission 4 (Sliding Panels):** Trivially easy. Sentence assembly with pre-translated words.

### Puzzles with answer/clue/mechanic problems
- **Mission 2:** Unlabeled straight has no valve number but occupies a position in the flow path. The mission asks for "five digits" but never explains why the unlabeled piece is excluded from the count. CRITICAL: designer must add explicit rules or give the piece a number.
- **Mission 4:** Two valid grammatical sentences ("sealed away forever" vs. "forever sealed away"). One will be marked wrong. Designer must pick a canonical sentence, ensure it's the only grammatically natural reading, or document which is canonical in the answer system.
- **Mission 4:** Glyph translations are provided verbatim on the cards. No decoding work occurs. If the glyph system is a core mechanic, Mission 4 should require players to apply it, not just receive pre-translated output.

### Puzzles that worked well
- **Mission 3 (SCHOOL):** Matching mechanic is intuitive, residues are distinct enough, the word payoff is strong and narratively meaningful. Self-checking (wrong order produces non-words).
- **Mission 5 (False Exit):** Spatially elegant loop with clear start/end signals, escalating recognition moments, and a satisfying final reveal. Best puzzle in the act.
- **Mission 1 (Corridor Riddle):** Glyph-decode-then-riddle structure is the right shape. Execution is solid; disambiguation would sharpen it.

### Story coherence
The act hangs together well. SCHOOL is the central narrative reveal and it earns its position. The false exit reinforces that the temple was designed to test and contain. The sabotaged valve suggests intentional flooding. The sealing inscription confirms the act was deliberate. The one gap: who did the sealing, and why? That question is correctly left open — but Jones players will leave Act 1 with a strong working theory. The host narration ("someone's entrance caused this, or the temple did") is appropriately ambiguous and consistent with what the cards reveal.

### Pacing
- Missions 1 and 3 are fast (under 10 minutes each). Good openers.
- Mission 4 is too easy for its position (4th). Teams will solve it in 5 minutes and feel like they missed something.
- Mission 2 is the longest and will dominate table time. It should probably be Mission 4 or 5 in sequence (save the grind for when energy is high, not mid-act).
- Mission 5 is the most satisfying finale; its position last is correct.

### Trading dynamics (critical design gap)
Jones Junket holds all required cards for all five missions. Zero inter-house trading is required. This eliminates the card-trading mechanic entirely for Jones and likely means the clue distribution in the seed data does not match the design intent (each house should be missing cards that others hold). This must be verified and fixed before live play. If every house is similarly self-sufficient, the trading mechanic — which appears to be a core social mechanic of the game — never activates.
