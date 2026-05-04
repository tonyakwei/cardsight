# Drake Delegation — Act 1 Playtest

## Theory of the temple — pre-game (just from story brief)

The temple flooded when Drake blasted in — or the flood was already coming and the blast just opened the door to it. The QRian script is unread by anyone. The three houses weren't supposed to meet; the temple probably wasn't meant to be entered at all. The presence of water channels "designed" for flooding suggests the temple has defensive mechanisms, not just passive architecture.

---

## Mission-by-mission

### Mission 1: Secure Your Fuse Charges

**Cards in hand:** All 3 Detonator Component cards (parts #1–#7). No trading needed.

**Solving process:**

The fitter's notes are assembly dependency clues, not labeled steps. Mapping the dependencies:

- #1 Anchor Pins: "seat into the base before anything else" → position 1
- #3 Booster Cores: "nest right on top of the pins" → after #1 → position 2
- #4 Primer Powder: "packed between the cores and the plates" → after #3, before #5 → position 3
- #5 Striker Plates: "press flat against the dust layer, takes the initial impact" → after #4 → position 4
- #6 Retainer Clips: "snaps onto the strikers before you seal" → after #5 → position 5
- #7 Det Cord: "winds through the clips and connects to the shell trigger" → after #6 → position 6
- #2 Outer Casings: "nothing goes on after these" → seals everything → position 7

**Final answer:** 1 3 4 5 6 7 2
**Confidence:** high
**Difficulty:** 2
**Time-to-solve guess:** 5–8 minutes
**Solving mode:** understood-mechanic
**Sticking points:**
- "Dust layer" on #5 is slightly odd phrasing for a detonator; initially unclear whether it meant something in the temple environment or a component layer. A real team might over-read it.
- "Before you seal" on #6 creates a minor ambiguity — seal with what? The Outer Casings answer it, but the note is self-referential.
**Felt earned?:** Yes. Each note points to a neighbor in the chain; the full sequence assembles cleanly.
**Designer flags:**
- The #2 Outer Casings note says "nothing goes on after these" — that phrasing inverts the natural reading ("nothing goes after me" = I'm last). Worth a plain read-aloud test; one misreader calling #2 first would derail the team.
- The label "fitter's tags #1–#7 are inventory labels only" in the mission brief is good — but I'd repeat it as a note ON the card, because players will pick up the card and see #2 written on it and immediately think "that's step 2."

---

[STORY LOG ENTRY 1: The detonator puzzle tells us nothing about the temple. It's pure Drake internal logistics. What it does establish: Drake's tools are the reason they're here, and the tools are unreliable. Something about the fuse components being "scattered in the silt" is alarming — the flood wasn't just inconvenient, it disrupted operational readiness. The team is already compromised before any puzzle is solved.]

---

### Mission 2: Operate the Stone Wheel

**Cards in hand:** All 3 Inscribed Chunk of Stone cards. No trading needed.

**Solving process:**

The glyph system is a simple Caesar-style substitution. Cards give:
- Card 1: P=P, U=U, T=T, E=E
- Card 2: R=R, G=G, L=L, O=O
- Card 3: H=H, F=F

The wheel face: {{{PUR}}} | {{{GET}}} | {{{HE}}} | {{{F}}} | {{{LO}}} | {{{OR}}}

Decoding: PUR | GET | HE | F | LO | OR → concatenate → PURGETHEFLOOR

Read as continuous string (mission brief explicitly says "groups may not align with word boundaries"): PURGE THE FLOOR.

Command verb: **PURGE**

**Final answer:** PURGE
**Confidence:** high
**Difficulty:** 2
**Time-to-solve guess:** 6–10 minutes
**Solving mode:** understood-mechanic
**Sticking points:**
- The glyph system in this act is 1:1 letter substitution with the same letter, which means the "translation" step is trivial once you have the stone chunks. This feels slightly anticlimactic — the mechanic exists, but there's no cipher difficulty. The puzzle's real work is concatenation across group boundaries.
- A team that reads each group as a separate word ("PUR GET HE F LO OR") will get confused. The instruction to "read all the letters as one continuous string" is in the mission text, but it's easy to miss mid-puzzle.
**Felt earned?:** Partial. The boundary-crossing insight is satisfying. The glyph step is a rubber stamp.
**Designer flags:**
- FLAG: The glyph substitution (letter = same letter) makes the stone chunk cards feel like busywork. If these cards will persist across acts and the glyph system evolves, that's fine. But if Act 1's glyph puzzles only exist to introduce the mechanic, consider making at least one glyph slightly remapped (e.g., P=Q) so teams feel they're actually decoding something.
- The command "PURGE" is tonally strong — the wheel purges the floodwater. That's good. Does purging the water help Drake's "it wasn't our fault" case? Thematically, operating the wheel could imply the flood mechanism pre-existed them, which IS exculpatory. Worth surfacing that payoff in the mission's completion text.

---

[STORY LOG ENTRY 2: The stone wheel confirms the flood channels are intentional temple infrastructure. Whoever built this place designed the water flow — it's not an accident of Drake's blast. The command carved into the wheel controls the flood, which means the QRians could start and stop it. That changes the theory: the flood isn't a malfunction or Drake's fault. The temple floods itself. Why?]

---

### Mission 3: Reach the Shadow Astrolabe

**Cards in hand:** All 5 Strange Painted Discs. No trading needed (per mission note: all five discs are with Drake — other houses trade TO us).

**Solving process:**

Each disc's sequence represents something real-world that changes color. The clue word is the key.

**Disc I:** Black → Indigo → Orange → **?** → Orange → Indigo → Black. Clue: *Up*
Perfectly symmetric sequence, ? is the center/apex. Clue "Up" = looking upward through something. Atmospheric layers viewed from ground up at sunset/dusk: black (night zenith) → indigo → orange (horizon glow) → **yellow** (sun) → orange → indigo → black. OR flame color going upward: base (blue/black) → indigo → orange → **yellow** (hottest tip). Either reading gives yellow at center.
Missing color: **Yellow**

**Disc II:** **?** → Yellow → Brown → Black. Clue: *Curved*
Ripening progression ending in decay. Banana: Green → Yellow → Brown → Black. Clue "Curved" = banana shape. Missing first color: **Green**

**Disc III:** Red → **?** → Brown. Clue: *Rare*
Steak cooking doneness. Rare = red, medium = pink, well-done = brown. Clue "Rare" is the cooking stage, not a modifier — it anchors the left side of the sequence.
Missing color: **Pink**

**Disc IV:** Green → Yellow → Orange → Red → **?**. Clue: *Harvest*
Autumn foliage progression: Green → Yellow → Orange → Red → Brown (dead leaves). Harvest season = fall. Alternatively a tomato ripening ends at red, but "harvest" with the full sequence points to leaves, which do go brown after red.
Missing color: **Brown**

**Disc V:** **?** → Red → Orange → Yellow. Clue: *Forge*
Metal heating color sequence (blacksmithing): Black/cold → Red (first glow) → Orange → Yellow → White (not shown). The sequence goes cool-to-hot left-to-right; ? precedes red.
Missing color: **Black**

**Final answer:** Yellow Green Pink Brown Black
**Confidence:** medium-high (Disc I center is confident; Disc III's "pink" is confident; Disc II banana is confident; IV and V have minor alternatives)
**Difficulty:** 3
**Time-to-solve guess:** 15–25 minutes
**Solving mode:** understood-mechanic (with some guessing on Disc I and IV)
**Sticking points:**
- **Disc I (Up):** The "Up" clue is under-constrained. Flame, atmosphere, aurora, rainbow from above — multiple things are symmetric and have yellow at center. Confident in Yellow but the path there is murky.
- **Disc IV (Harvest):** After Red in autumn leaves is Brown, but harvest also evokes gold/wheat. A team could reasonably answer Gold or even Purple (harvest moon). Brown is most defensible but the clue doesn't uniquely point there.
- **Disc V (Forge):** "Forge" nails the blacksmithing reading. But the sequence goes ? → Red → Orange → Yellow (ascending heat), and before red in metal-working there are dark/black states. A team might also say "dark gray" or "dark red." Black is cleanest but the word "black" already appears in Disc I — teams might avoid repeating.
- No mechanism exists to verify a partial answer — if you get Disc III wrong, you don't know which of the five positions failed.
**Felt earned?:** Partial. Disc III (steak/rare) and Disc II (banana/curved) feel cleanly earned. Disc I and IV have ambiguity that makes the answer feel partially lucky rather than solved.
**Designer flags:**
- **MAJOR FLAG — answer verification is all-or-nothing:** Five independent sub-puzzles submit as one string. A team that gets 4/5 right cannot tell which disc failed. Either add per-disc checking or add an intermediate step where each disc result is confirmed before submission.
- **Disc I ("Up"):** The clue needs to be more specific. "Sky at dusk" or "looking up through a flame" would close the interpretation gap without giving away the answer.
- **Disc IV ("Harvest"):** "Harvest" + autumn leaves is fine, but the color "brown" feels anticlimactic after the beautiful orange-red gradient. Consider whether "Purple" (harvest moon, harvest wine grapes) is intentionally excluded, and if so, add a second clue word on the disc.
- **Cross-house logistics note:** The mission brief says all 5 discs are with Drake and other houses trade to us. This is a significant mechanical asymmetry — Drake is a supplier, not a requester, for Mission 3. That has trading-phase implications the mission brief doesn't fully explain. Does Drake receive anything in return for the discs? Clarify in the story brief or the trading rules.

---

[STORY LOG ENTRY 3: The Shadow Astrolabe maps the temple — the mission says so explicitly. What it actually does once unlocked isn't described in our packet. But the disc sequences (flame, autumn, forge, sky) encode natural transformation cycles: things that change through predictable color states. The QRians are cataloguing change. The temple isn't a tomb or a treasury — it's a laboratory. They were measuring things that transform.]

---

### Mission 4: Activate the Construction Hoist

**Cards in hand:** All 3 Inscribed Metal Fragment cards. No trading needed.

**Solving process:**

The cards directly give the decoded words for each position (the glyph-to-word mapping is printed on the cards). The puzzle is pure sentence assembly.

Words available: LEAVE(1), WHO(2), THIS(3), NEVER(4), WE(5), THEM(6), BUILT(7), LET(8), WILL(9)

Forming a sentence: WE WHO BUILT THIS WILL NEVER LET THEM LEAVE
- WE=5, WHO=2, BUILT=7, THIS=3, WILL=9, NEVER=4, LET=8, THEM=6, LEAVE=1
- Position order: **5 2 7 3 9 4 8 6 1**

The sentence is grammatically natural and thematically loaded ("we who built this will never let them leave" — the builders speaking to future entrants).

**Final answer:** 5 2 7 3 9 4 8 6 1
**Confidence:** high
**Difficulty:** 2
**Time-to-solve guess:** 5–10 minutes
**Solving mode:** understood-mechanic
**Sticking points:**
- "WE WHO BUILT THIS" vs "WE BUILT THIS" — "WHO" is an embedded relative clause. A team that tries simpler grammatical structures first will try "WE BUILT THIS..." before adding WHO back in. Minor slowdown.
- Grammatically, "WILL NEVER LET THEM LEAVE" vs "NEVER WILL LET THEM LEAVE" vs "LET THEM NEVER LEAVE" are all English-valid. The first is most natural but teams will debate.
**Felt earned?:** Yes. The sentence resolves cleanly, and it's narratively significant — the builders speaking directly to intruders.
**Designer flags:**
- The inscription is the most lore-rich piece of Act 1. It reveals intent: the QRians designed this place to trap people inside. That's a major revelation and it's buried in a logistics puzzle (activating a hoist). Consider whether the sentence should get more attention in the mission's completion text — it shouldn't just say "hoist activated," it should make clear that the team has just read a threat from the builders.
- Minor format issue: the position table in the mission brief shows both the position number AND the decoded English word (e.g., "Position 1: {{{LEAVE}}} = LEAVE"). If the glyph system is meant to be a decoding exercise, giving the answer directly on the mission brief is redundant. The cards already give the translation. The table in the brief is double-confirming what the cards show. Either the table shouldn't be in the player brief, or the glyph font should actually render on the player's screen and the cards are truly needed.

---

[STORY LOG ENTRY 4: "We who built this will never let them leave." The hoist inscription is not decorative — it's a warning written in the mechanism itself. The QRians built this temple with the explicit intent of keeping entrants inside. The flood channels, the locked dome, the sealed compartments — none of this is environmental. It's deliberate. We are inside a trap. The builders knew we'd come. They planned for it.]

---

### Mission 5: Investigate the Scraped Gap

**Cards in hand:** All 3 Mysterious Damp Page cards. No trading needed. **CRITICAL: 60-second self-destruct — must write all content immediately on examine.**

**Content transcription (done before timer expires):**
- Entry 1 (Day 1): "We found the entrance today. Discovery of a lifetime."
- Entry 2 (Day 3): "Architecture beyond anything in the textbooks."
- Entry 3 (Day 5): "Found a camp from decades ago. No skeletons."
- Entry 4 (Day 7): "Their log echoes ours. Panic sets in."
- Entry 5 (Day 9): "Every route slopes down. None lead up."
- Entry 6 (Day 11): "Compass spins. Water from walls we never passed."
- Entry 7 (Undated): "Every staircase descends. We cannot find a path up."

**Lock code extraction:** Positions 1:12, 2:19, 3:25, 4:12, 5:28, 6:19, 7:8

Entry 1: "We found the entrance today. Discovery of a lifetime."
Count: W(1)e(2) (3)f(4)o(5)u(6)n(7)d(8) (9)t(10)h(11)e(12) → position 12 = **e**

Entry 2: "Architecture beyond anything in the textbooks."
A(1)r(2)c(3)h(4)i(5)t(6)e(7)c(8)t(9)u(10)r(11)e(12) (13)b(14)e(15)y(16)o(17)n(18)d(19) → position 19 = **d**

Entry 3: "Found a camp from decades ago. No skeletons."
F(1)o(2)u(3)n(4)d(5) (6)a(7) (8)c(9)a(10)m(11)p(12) (13)f(14)r(15)o(16)m(17) (18)d(19)e(20)c(21)a(22)d(23)e(24)s(25) → position 25 = **s**

Entry 4: "Their log echoes ours. Panic sets in."
T(1)h(2)e(3)i(4)r(5) (6)l(7)o(8)g(9) (10)e(11)c(12) → position 12 = **c**

Entry 5: "Every route slopes down. None lead up."
E(1)v(2)e(3)r(4)y(5) (6)r(7)o(8)u(9)t(10)e(11) (12)s(13)l(14)o(15)p(16)e(17)s(18) (19)d(20)o(21)w(22)n(23).(24) (25)N(26)o(27)n(28) → position 28 = **n**

Entry 6: "Compass spins. Water from walls we never passed."
C(1)o(2)m(3)p(4)a(5)s(6)s(7) (8)s(9)p(10)i(11)n(12)s(13).(14) (15)W(16)a(17)t(18)e(19) → position 19 = **e**

Entry 7: "Every staircase descends. We cannot find a path up."
E(1)v(2)e(3)r(4)y(5) (6)s(7)t(8) → position 8 = **t**

Extracted: e, d, s, c, n, e, t → letters: c, d, e, e, n, s, t
Anagram: **DESCENT**

**Final answer:** DESCENT
**Confidence:** high (the anagram resolves cleanly and is thematically appropriate)
**Difficulty:** 4
**Time-to-solve guess:** 20–35 minutes
**Solving mode:** understood-mechanic
**Sticking points:**
- The 60-second timer creates extreme urgency. A team that fumbles examining three cards simultaneously risks losing content. In practice, three players would need to coordinate who scans which card and writes simultaneously. This is the tightest logistics crunch of Act 1.
- Counting characters including spaces and punctuation at positions 12, 19, 25, 28 requires precise character-by-character counting. Position 5's "Every route slopes down. None lead up." — counting through the period and space to position 28 — is where most teams will mis-count.
- Entry 4's position 12 lands on "c" inside "echoes." That's a non-obvious extraction point that requires exact character counting, no skimming allowed.
- The anagram "descent" is satisfying but getting there requires error-free extraction of all 7 characters first.
**Felt earned?:** Yes, but earned through execution skill (careful counting, fast note-taking) more than puzzle insight. The "aha" is at the end (DESCENT) but the path is mechanical.
**Designer flags:**
- **MAJOR FLAG — the 60-second timer may break the puzzle for some groups.** Three self-destruct cards examined simultaneously means three separate 60-second countdowns. Players scanning on phones will see one card expire while trying to read another. In a group of 5–7, you'd need three readers simultaneously copying text. If even one player misses content (reads card after it self-destructs), the mission becomes unsolvable. Consider: (a) extending timer to 90 seconds, (b) allowing re-examine after correct partial answer, or (c) giving the entry texts on a single card that self-destructs once (all eggs in one basket, cleaner logistics).
- **Counting accuracy at long positions (28):** Position 28 in a 40-character sentence is near the end — less likely to be mis-counted than a middle position. But position 12 occurs twice (entries 1 and 4). Teams may assume it extracts the same character both times and re-count only one. Emphasize in a note that each entry is counted independently.
- **Entry 7 is "Undated"** — so the puzzle's "entries 1 through 7" framing clashes with the label. If players try to find "Entry 7" by label, they'll find the undated entry by process of elimination, but it's a minor friction point. Give it a label ("Undated — Entry 7") on the card.
- The word DESCENT is the right answer and is thematically perfect — every staircase descends, they could not ascend. Beautiful. Don't change the answer.

---

[STORY LOG ENTRY 5: There was a previous expedition. They found the same entrance, saw the same architecture, discovered the same "camp from decades ago" — meaning there was an even earlier expedition before them. And they couldn't get out. "Every staircase descends." The temple is architecturally inverted — you can only go down. The hoist was the only way up, and we just activated it. The previous expedition never found it. The journal doesn't say they died; Entry 3 says "no skeletons" from the decades-old camp. They may have escaped another way, or the temple took them. Either way: the temple is specifically designed to funnel people deeper, not let them out. Drake just confirmed its own theory. This was always a trap.]

---

## Cards I need from trading

None. Drake holds all required clue sets for all five missions:
- Detonator Component × 3 — Mission 1 — in hand
- Inscribed Chunk of Stone × 3 — Mission 2 — in hand
- Strange Painted Disc × 5 — Mission 3 — in hand (Drake is the SOURCE for other houses)
- Inscribed Metal Fragment × 3 — Mission 4 — in hand
- Mysterious Damp Page × 3 — Mission 5 — in hand

**Drake is a net exporter this act.** Other houses will need Strange Painted Discs for their missions and must trade TO Drake. Check what Croft and Jones need from Drake and what they can offer in return for maintaining goodwill.

---

## End-of-act theory of the temple

The Temple of the QRians is a deliberate trap with functional architecture. It floods by design — the channels in the floor are engineered, and the stone wheel controls the water with a command ("PURGE") carved in. The QRians built this place knowing people would enter, and they built it so those people could not leave: every staircase descends, the construction hoist was the only vertical mechanism, and the inscription on the hoist itself reads "We who built this will never let them leave." The builders were not passive archivists — they were active, hostile architects.

There have been at least two prior expeditions. The most recent left a journal that ends at Day 11 with a compass spinning and water coming from walls they'd never passed. An earlier camp (decades-old) had no bodies — someone got out, or disappeared otherwise. The Shadow Astrolabe maps the temple, and its disc sequences (flame, forge, autumn, sky) encode natural transformation cycles — things that change predictably through color states. The QRians were measuring transformation. This floor was a laboratory or an observatory, not a burial chamber.

Drake's dynamite blast may or may not have caused the flood. The stone wheel's existence suggests the flood is a feature. But the blast opened three expeditions into simultaneous contact in a space designed to isolate and trap — which may have been the worst possible way to enter.

---

## Designer summary

### Hardest puzzles (ranked)
1. **Mission 5 (Damp Pages / DESCENT)** — hardest due to the 60-second self-destruct mechanic multiplied across three cards, combined with precise character counting at positions up to 28. Execution difficulty is high, solvability is real, but logistics could break a real team.
2. **Mission 3 (Shadow Astrolabe discs)** — five independent sub-puzzles with no per-disc feedback, two clues with genuine interpretation ambiguity (Disc I "Up," Disc IV "Harvest"). Teams will get there but may submit wrong on first attempt with no diagnostic info.
3. **Mission 2 (Stone Wheel / PURGE)** — moderate; the continuous-string read is the only real trick. Glyph translation is trivial.
4. **Mission 4 (Hoist / sentence order)** — easy. Sentence assembles quickly; debate is brief.
5. **Mission 1 (Detonator / assembly order)** — easiest. Dependency chain is unambiguous once read carefully.

### Puzzles with answer/clue/mechanic problems
- **Mission 3, Disc I ("Up"):** Clue is under-constrained for the symmetric color sequence. Multiple natural phenomena fit. Needs a tighter anchor word or a second clue.
- **Mission 3, Disc IV ("Harvest"):** "Brown" after red in autumn leaves is correct but "gold" and "purple" are plausible alternates from the clue word. Add a disambiguating clue or accept alternate answers.
- **Mission 3 — all-or-nothing submission:** Five independent answers submitted as one string with no partial feedback. A single wrong color fails the whole mission invisibly. Either validate per-disc or add a mechanic for partial credit / partial retry.
- **Mission 5 — 60-second self-destruct across three cards:** Three simultaneous countdowns creates coordination chaos. The mission is solvable only if all three cards are read fully before expiry. High chance of real-table failure through pure logistics. Either extend timer or consolidate to one card.
- **Mission 4 — position table in the mission brief:** Shows decoded English words alongside glyphs. If the glyph font isn't rendering on-screen, the table is the answer, making the Metal Fragment cards redundant. Verify whether players see glyphs or text in the live interface.
- **Mission 2 — glyph substitution is identity (P=P):** The "translation" step adds no cognitive work. If this is intentional (teaching the mechanic before it gets harder), fine — but label it as an introduction, not a full puzzle.

### Puzzles that worked well
- **Mission 1 (Detonator):** Fitter's notes are smartly written — each creates a clear dependency without being a numbered list in disguise. The "nothing goes on after these" phrasing for #2 is the best single clue in the act.
- **Mission 4 (Hoist inscription):** "We who built this will never let them leave" is the strongest narrative beat of the act. The sentence assembly is fast, fair, and the payoff is thematically significant. Good puzzle.
- **Mission 5 (DESCENT):** The anagram answer is elegant and the journal entries build a coherent story of a prior expedition's doom. The character-extraction mechanic is fair. The self-destruct tension is narratively perfect even if mechanically dangerous. Worth keeping with timer fix.

### Story coherence
The act hangs together well. Four of five missions are Drake-internal (tools, mechanism, previous expedition), which fits the mercenary character. The Astrolabe is the outlier — its "transformation cycles" theme belongs to the QRian lore track but the mission brief doesn't explicitly connect the discs to QRian practice. The act's most important revelation — "we who built this will never let them leave" — comes from a logistics puzzle, which undersells it. Story coherence is good but the payoffs land quietly. Consider surfacing the hoist inscription text in the act break or transition narration so the full room hears it.

### Pacing
- Missions 1 and 4 are fast (5–10 min each). Start there to build momentum.
- Mission 2 is medium (6–10 min). Good second.
- Mission 3 is the longest cognitive load (15–25 min). Do it third or fourth; don't start here.
- Mission 5 needs to be attempted while cards are still fresh. The self-destruct forces coordination before teams have warmed up. If teams tackle it early (when they're still settling), the 60-second window is more likely to fail. Recommend tackling it mid-act once the team has synchronized their scanning habits.
- Drake has no trading dependency this act, which removes the trading dynamic entirely for Drake. This is atypical and may make Drake feel isolated from the inter-house economy. Verify that Croft and Jones actually need Drake's Painted Discs, and make sure Drake has a reason to cooperate rather than hoard.
