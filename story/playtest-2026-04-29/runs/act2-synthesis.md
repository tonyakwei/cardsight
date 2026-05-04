# Act 2 Synthesis — 2026-04-29

## Pass/fail matrix

| House | Mission | Canonical answer | Agent answer | Result | Failure category |
|-------|---------|-----------------|--------------|--------|-----------------|
| Drake | M1: Powder of the Quiet Bed | `bye` | UNSOLVABLE (no grid) | **FAIL** | Missing physical artifact |
| Drake | M2: Drevu's Compartment | `shatter divorce` | TRADING-DEPENDENT | **FAIL** | Trading-dependent; mechanic understood |
| Drake | M3: Wall of Repetitions (Red) | `it was making us obsessed` | TRADING-DEPENDENT | **FAIL** | Trading-dependent; mechanic understood |
| Drake | M4: Reagent Alcove | `bronze glass soap dye perfume` | `BRONZE GLASS SOAP DYE PERFUME` | **PASS** | — |
| Drake | M5: Reinforced Bunker | `orbit grenade` | `OR [UNKNOWN]` | **FAIL** | Riddle I: OR ≠ ORBIT; Riddle II: not reached |
| Jones | M1: Sealed Pantry | `pepper porridge oil cake milk` | `JAM PORRIDGE SALVE CAKE BROTH` | **FAIL** | Answer-space too broad; 2/5 correct by accident |
| Jones | M2: Wall of Repetitions (Amber) | `this place once made us wise` | TRADING-DEPENDENT | **FAIL** | Trading-dependent; mechanic understood |
| Jones | M3: Vesh's Compartment | `vein sneeze` | `SEED SNEEZE` | **FAIL** | Procedure I: SEED ≠ VEIN (close miss; SNEEZE correct) |
| Jones | M4: Hanging Garden of Names | `jaw` | CANNOT COMMIT (no map) | **FAIL** | Missing physical artifact + trade-dependent |
| Jones | M5: Sefa's Riddles | `flower butterfly` | `STILL [UNKNOWN]` | **FAIL** | Riddle I misread; Riddle II not reached |
| Croft | M1: Reckoning Floor | `time` | `TIME` | **PASS** | — |
| Croft | M2: Sighting Wall | `dawn midnight mirage eclipse sunset` | `DAWN MIDNIGHT MIRAGE ECLIPSE SUNSET` | **PASS** | — |
| Croft | M3: Krane's Compartment | `storm crash` | `STORM FLOOD` | **FAIL** | Procedure II: FLOOD ≠ CRASH (both in acceptAlternatives — soft PASS) |
| Croft | M4: Wall of Repetitions (Purple) | `until we slowly realized` | TRADING-DEPENDENT | **FAIL** | Trading-dependent; mechanic understood |
| Croft | M5: High Ledge | (locked) | MISSION LOCKED | **LOCKED** | Act 1 consequence applied correctly |

**Overall: 3 pass / 11 fail / 1 locked**

### Notes on borderline calls

- **Croft M3 (Krane's Compartment):** FLOOD appears in the seed's `acceptAlternatives` for `storm crash` (`"storm flood"` is listed). This is a **soft PASS** by the answer system even though the strict canonical is `storm crash`. Ruling: SOFT PASS in a live game; logged as FAIL here because the agent did not reach the intended CRASH and the alternative acceptance was not visible to the agent.

- **Drake M5 Riddle I:** The agent reasoned to OR; the canonical first word is ORBIT. The hint says "the first hides 'or' in the round shape of an old word for the path of a moon." ORBIT contains OR and describes a circular/round path — this is the intended construction. The agent stopped at OR itself rather than finding the containing word. This is a **mechanic comprehension failure**, not a knowledge gap. The riddle is working as intended; the agent under-solved.

- **Jones M1 (Sealed Pantry):** PORRIDGE is correct (in seed alternatives: `pepper porridge oil cake milk`). CAKE is correct. But JAM, SALVE, and BROTH are wrong for their respective shelves — Shelf 1 = PEPPER (not JAM), Shelf 3 = OIL (not SALVE), Shelf 5 = MILK (not BROTH). The agent's SALVE guess flagged the correct underlying mechanic (PLANT+GREASE → topical compound) but named the wrong product. Partial reasoning, full miss.

- **Jones M3 (Vesh's Compartment) Procedure I:** Agent answered SEED; canonical is VEIN. `trunk → branch → leaf → vein` follows plant vascular anatomy (the vein is the smallest internal transport structure within a leaf — smaller than, and contained by, the leaf). This is a **close miss with a defensible wrong reading**. SEED as "reproductive endpoint" is wrong; VEIN as the terminal anatomical unit within the leaf is the intended reading. The sequence needed one more constraint to be unambiguous, as the agent flagged.

---

## Trading feasibility

### Declared needs and offers (reconciled across all three houses)

**Drake needs from:**
- Jones: Apothecary Note Batch B, Drevu Slot 2, Red Wall Tile 2, Bark Labels Stations 3+4, Togom Riddle-Tablet II → **5 cards**
- Croft: Apothecary Note Batch C, Drevu Slot 3, Red Wall Tile 3, Bark Label Station 5 → **4 cards**

**Drake offers to:**
- Jones: Amber Wall Tile 2, Vesh Slot 1 → **2 cards**
- Croft: Krane Slot 1, Five Calculation Tablet, Lens-Label Clusters 3+4, Purple Wall Tile 2, Yenus Riddle-Tablet II → **5 cards**

**Jones needs from:**
- Drake: Shelf 5, Amber Wall Tile 2, Vesh Slot 1, Burial-Rite Half-Erased → **4 cards**
- Croft: Shelves 3+4, Amber Wall Tile 3, Vesh Slot 3, Burial-Rite Charred, Sefa Riddle-Tablet II → **5 cards**

**Jones offers to:**
- Drake: Apothecary Note Batch B, Drevu Slot 2, Red Wall Tile 2, Bark Labels Stations 3+4, Togom Riddle-Tablet II → **5 cards**
- Croft: Seven Calc Tablet, Nine Calc Tablet, Krane Slot 2, Purple Wall Tile 3, Lens-Label Cluster 5 → **5 cards**

**Croft needs from:**
- Drake: Five Calc Tablet, Lens-Label Clusters 3+4, Krane Slot 1, Purple Wall Tile 2 → **4 cards** (counting cluster pairs as one card each = 4 items)
- Jones: Seven Calc Tablet, Nine Calc Tablet, Krane Slot 2, Purple Wall Tile 3, Lens-Label Cluster 5 → **5 cards**

**Croft offers to:**
- Drake: Apothecary Note Batch C, Drevu Slot 3, Red Wall Tile 3, Bark Label Station 5 → **4 cards**
- Jones: Shelves 3+4 (Painted Clay Shelf-Label), Amber Wall Tile 3, Vesh Slot 3, Burial-Rite Charred, Sefa Riddle-Tablet II → **5 cards**

### Reconciliation

**Coverage check — does every house's "needs" appear in another house's "offers"?**

- Drake needs 5 from Jones → Jones declares those 5 as offers to Drake. ✅
- Drake needs 4 from Croft → Croft declares those 4 as offers to Drake. ✅
- Jones needs 4 from Drake → Drake declares those 4 as offers to Jones. ✅ (Drake's 5 declared-to-Jones includes all 4 Jones needs plus the Riddle-Tablet II)
- Jones needs 5 from Croft → Croft declares those 5 as offers to Jones. ✅
- Croft needs ~4 from Drake → Drake declares those 4-5 as offers to Croft. ✅
- Croft needs 5 from Jones → Jones declares those 5 as offers to Croft. ✅

Coverage is complete. No house is asking for a card another house doesn't hold or isn't willing to trade. The card topology is consistent.

**Conflict check — two houses needing the same scarce card?**

No direct competition: each wall tile, compartment slot, and calculation tablet belongs to exactly one house per the declared manifests, and the target recipient differs in each case. The Burial-Rite Fragment cards (Charred/Openers to Jones, Half-Erased/Carriers to Drake) are held by Croft and Jones respectively and needed by different recipients. No collision found.

**Net-taker / net-giver balance:**

| House | Cards in | Cards out | Net |
|-------|----------|-----------|-----|
| Drake | 9 (5 from Jones + 4 from Croft) | 7 (2 to Jones + 5 to Croft) | –2 (net receiver) |
| Jones | 9 (4 from Drake + 5 from Croft) | 10 (5 to Drake + 5 to Croft) | +1 (marginal net giver) |
| Croft | 9 (4 from Drake + 5 from Jones) | 9 (4 to Drake + 5 to Jones) | 0 (balanced) |

Drake is the most lopsided: we ask for 9 cards and offer 7. The structural imbalance is that Drake offers 2 cards to Jones but needs 5 from Jones. The high-value Drake-to-Jones cards (Amber Wall Tile 2, Vesh Slot 1) are load-bearing for Jones's own missions — but "I'll give you two high-priority cards and you give me five" is still a net ask that Jones has reason to resist. In a real room, Drake would need to include a third offer from their Croft-designated holdings (the "I'll sweeten the deal with..." problem) or accept that Jones extracts a concession.

**Croft bottleneck risk:** Drake needs 4 from Croft AND Jones needs 5 from Croft. Croft provides 9 items to other houses — nearly every card they hold has a named recipient. This makes Croft the most-solicited house in Act 2 (they are providing to both other houses at high volume). The Burial-Rite Fragment Charred card is specifically needed by Jones for Mission 4, which has a 60-second self-destruct coordination requirement. If Croft is occupied trading with Drake when Jones needs the Burial-Rite Charred card, Mission 4's coordination window may close before the trade completes. This is the highest single-point failure risk in the act.

**Would a real room negotiate this in time?**

Conditional yes. The wall-tile exchanges (Amber/Red/Purple tiles are all symmetrically needed — each house holds one and needs one from each other house) are self-evident and will close in the first trading wave without negotiation friction. The compartment-slot three-ways (Drevu/Vesh/Krane — each house holds one slot and needs the other two) are also structurally legible and will close in the first wave.

The harder negotiations are the asymmetric Drake-Jones exchange and the Mission 4 Burial-Rite coordination problem. The Drake-Jones count imbalance (5 asks, 2 offers) needs conscious management. The Mission 4 self-destruct requires explicit host coordination — a "pause all other trading" call before any Burial-Rite Fragment is scanned.

**Verdict:** The trading topology is sound. The card graph has no impossible edges. The main real-room risks are (1) Drake's 5-ask-vs-2-offer imbalance with Jones creating friction or stall, and (2) Mission 4's self-destruct requirement creating a coordination bottleneck that intersects with the broader trading timeline. Neither is a design flaw — they are genuine negotiation dynamics. The host should be briefed to monitor the Drake-Jones negotiation and to prompt the Mission 4 simultaneous-scan moment explicitly.

---

## Cross-house theory comparison

### End-of-Act-2 theories by house

**Drake:** The Green Department was a pharmaceutical and materials production facility that switched from normal institutional activity to crisis behavior. Drevu sealed information from colleagues; Togom built a riddle-protected bunker; the east wall was inscribed hundreds of times with a phrase they were terrified of losing. Drake's theory: some QRians were compromised by an external force (the Reagent Alcove's "arming against something" framing is the primary clue), others were preparing countermeasures. The institutional frame broke at Mission 3 (Wall of Repetitions). Drake arrived in Act 3 carrying the hypothesis that the temple is an armory disguised as a laboratory — but without explicitly naming the Source.

**Jones:** The QRians built and ran a functioning institution (pantry, archive, garden), but something environmental was acting on them. The vector is airborne — Vesh's compartment documents a pollen-exposure physiological sequence (pollen → tingle → gasp → sneeze) that functions as an infection model. The Wall of Repetitions is compulsive copying from memory, not voluntary documentation. The garden of names is a monument to amnesia — the dead speak back the names the living are forgetting. By Mission 5, Jones concluded: the temple was sealed from the outside or by the last lucid QRians as an act of quarantine. The Source is environmental but still unnamed.

**Croft:** The Reckoning Floor counts toward a specific deadline (TIME); the Sighting Wall tracks liminal celestial transitions (DAWN through SUNSET); the sealing is tied to an alignment or moment the QRians built for deliberately. Krane's compartment procedures (STORM, CRASH) describe tidal and atmospheric cycles — the QRians modeled or built the flood mechanism. The Wall of Repetitions is where the shift landed: "wisdom turning to obsession slowly enough to write down" means the QRians watched themselves change and kept writing rather than fled. Croft ends Act 2 with the clearest institutional-to-environmental arc of the three houses, though Yenus's personal theory — the most tantalizing individual record in the act — is inaccessible due to the lockout.

### The Source naming question

**None of the three houses explicitly named "the Source" from Act 2 content alone.** The Source mythology is present in lore materials but appears in Act 2 card content only obliquely:
- Drake's closest approach: "they were arming against something" (Reagent Alcove mission text). The Source is implied but not named.
- Jones's closest approach: the physiological exposure sequence from Vesh's compartment completion text (the full Vesh record is in the seed: "captured peoples, criminals… exposed to the Source during construction"). The word "Source" appears in Vesh's full completion text — so if Jones solved M3 (Vesh's Compartment), they would have encountered the word explicitly. Jones did not solve M3.
- Croft's closest approach: the phrasing "something external was influencing them" (Croft's own theory synthesis) — not the lore term.

Importantly, the canonical Wall of Repetitions answers make the Source mythology explicitly implicit:
- Red wall: `it was making us obsessed` — "it" without antecedent, the Source as unnamed actor
- Amber wall: `this place once made us wise` — the Source as geographic force
- Purple wall: `until we slowly realized` — the temporal arc of awareness

Because all three wall missions failed on trading-dependency grounds, the core Source mythology payload — three lines of inscription that together form "this place once made us wise / it was making us obsessed / until we slowly realized" — was never assembled. **This is the single largest story coherence gap in the Act 2 playtest.** The wall inscription is the act's spine; without it, the Source mythology arrives through ambient language and story blurbs rather than through the puzzle payoff it was designed to produce.

### Institutional → environmental shift: did each house make the leap?

- **Drake:** Yes, at Mission 3 (Wall of Repetitions story log entry). The transition trigger was "compulsion or desperation" as the reading of repetitive inscription. Complete by Mission 5.
- **Jones:** Yes, mid-Mission 2. The "confession" language in the Wall of Repetitions story blurb was the inflection point. Complete by Mission 3 (Vesh's infection model confirmed it).
- **Croft:** Yes, at Mission 4 (Wall of Repetitions, Purple). The phrase "wisdom turning to obsession slowly enough to write down" is the explicit inflection. Complete by Mission 4.

All three houses made the leap during Act 2. The speed of the shift was fastest for Jones (Mission 2), middle for Drake (Mission 3), latest for Croft (Mission 4) — mirroring the arc the wall inscription was designed to produce. Structurally, this is working correctly even without the wall missions being solved.

### Canonical lore proximity

| Lore term | Drake | Jones | Croft |
|-----------|-------|-------|-------|
| "The Source" (named) | No | No (M3 unsolved — would've gotten it) | No |
| "Chaotic Order" | No | No | No |
| "Logical contagion" | No | No | No |
| Infection/environmental model | Yes (arming against something) | Yes (pollen pathway model) | Yes (wisdom-to-obsession arc) |
| Phase 1 (Gift) | No | Partially (pantry as institution) | Yes (Fragment 1: "blessing from the earth") |
| Phase 2 (Obsession) | Yes (Wall of Repetitions) | Yes (Wall of Repetitions) | Yes (Wall of Repetitions) |
| Phase 3 (Contagion) | Partially | Yes (Vesh infection model) | Partially |
| Phase 4 (Seal) | Yes (Togom bunker, Drevu compartment) | Yes (garden as amnesia monument) | Yes (Reckoning Floor countdown) |
| QRians used slaves for construction | No (Vesh M3 unsolved) | No (Vesh M3 unsolved) | No |

No house reached "Chaotic Order" or "logical contagion" terminology. All three houses reached the correct general shape of Phase 2-4 through different evidence paths. The biggest canonical gap across all three houses is the Vesh revelation — that the temple was built by expendable slave labor deliberately exposed to the Source — which is the single most morally significant piece of QRian history and is entirely invisible in this playtest because Jones M3 failed.

### Convergences and divergences

**Strong convergences:** All three houses independently concluded the QRians experienced an external influence that changed their cognition. All three identified specific individuals (Drevu, Vesh, Togom, Krane, Yenus, Sefa) as figures who made personal choices within a collective crisis. All three connected the temple's physical structure (flooding, sealing, false passages) to deliberate design rather than accident.

**Notable divergence:** Drake's "armory" theory (Reagent Alcove as weapons stockpile) is unique and not shared by the other houses. It's a creative reframe consistent with the mission text's "arming against something" line but veers from the canonical Source mythology (the alcove is a production facility, not an armory — the "arming" is metaphorical). This divergence could generate productive debate in Act 3 if Drake advocates for treating the Source as a threat to be fought rather than contained or studied.

**Act 3 positioning:** The three houses are well-positioned to collaborate on timeline reconstruction. Their interpretive frames are different enough (tactical/Drake, academic/Jones, architectural/Croft) to generate debate on the Major Decisions, but close enough on the fundamental facts (external force, deliberate sealing, individual QRians acting with awareness) that they share the scaffolding for the history timeline reconstruction. The missing Vesh slave-construction revelation is the most significant gap — if that detail comes through Act 3 history cards instead, teams will need to reckon with it during the deliberation phase.

---

## Hardest puzzles (ranked across all three houses)

1. **Jones M4 (Hanging Garden of Names):** Canopy map physical artifact is a single point of failure. Glyph-class sort + letterform tracing is the most visually demanding puzzle in the act. 60-second self-destruct on all three Burial-Rite Fragments requires pre-coordinated simultaneous scanning. Three independent failure modes stack.

2. **Drake M1 (Powder of the Quiet Bed):** Entirely unsolvable without the printed flower-grid artifact. Even with it, three traded cards + grid + numbered connect-the-dots coordination is the highest table-management overhead of any mission. Answer (`bye`) is non-inferable from semantic reasoning — grid execution is the only path.

3. **Croft M1 (Reckoning Floor):** Physical pebble-floor artifact load-bearing. Four traded tablets before anything starts. The answer (`time`) is contextually inferable (and was), but the mechanic execution requires the physical floor.

4. **Drake M5 (Reinforced Bunker):** Riddle I requires recognizing ORBIT as a "round path that contains OR" — a lateral construction the agent under-solved to OR directly. Riddle II's answer is GRENADE (the hint: "anagram of ENRAGED with one letter added" — ENRAGED + G = GRENADE, or ENRAGED rearranged = GRENADE). Both riddles require specific wordplay frames not naturally accessible under time pressure.

5. **Jones M5 (Sefa's Riddles):** Riddle I answer is FLOWER (pronounced "flow-er" — it sounds like it flows, but a flower doesn't flow; it stands). This is a pronunciation-based riddle: the word that is "said to flow" is FLOWER because of how it sounds, not what it means. The agent took the semantic path (STILL, STATUE, STONE) and missed the phonetic construction entirely. Riddle II answer is BUTTERFLY (hint: "queen" is a clue to a specific insect — a queen bee, but a butterfly queen? More likely: "butter" + "fly" where "queen" points to "queen of the meadow" = butterfly). Without the actual riddle text from Croft's tablet, this is hard to verify, but the hint ("butter" + fly) is the construction.

6. **Jones M3 (Vesh's Compartment) Procedure I:** `trunk → branch → leaf → vein`. The agent proposed SEED and ROOT as alternatives. VEIN is a third reading (the transport network within a leaf, the structural endpoint of the botanical hierarchy from large to small). Close miss but required botanical anatomy knowledge most players won't have without a hint.

7. **All Wall of Repetitions missions:** Systematically unsolvable without all three tiles; the mechanic is well-designed but entirely trading-dependent. Once tiles are pooled, the column-comparison is mechanical and not cognitively hard. These three missions function correctly; they just cannot be independently started.

### Answer-validation issues (special category)

The following missions have defensible-multiple-answer problems that were flagged across houses:

| Mission | Agent's answer | Canonical | Status in seed |
|---------|---------------|-----------|----------------|
| Jones M1: Sealed Pantry (Shelf 1 = PEPPER) | JAM | PEPPER | Not in alternatives — genuine mismatch |
| Jones M1: Sealed Pantry (Shelf 3 = OIL) | SALVE | OIL | Not in alternatives |
| Jones M1: Sealed Pantry (Shelf 5 = MILK) | BROTH | MILK | Not in alternatives |
| Croft M2: Sighting Wall (Cluster 2 = MIDNIGHT) | MIDNIGHT | MIDNIGHT | ✅ Exact match |
| Croft M2: Sighting Wall (Cluster 1 = DAWN) | DAWN | DAWN | ✅ Exact match |
| Croft M3: Krane's Compartment (Proc II = CRASH) | FLOOD | CRASH | FLOOD is in acceptAlternatives |
| Drake M4: Reagent Alcove (Stn 4 = DYE) | DYE | DYE | ✅ Exact match |

**Count:** 3 missions had genuine defensive-multiple-answer problems where the agent's reasoning was correct but the canonical word was different and the alternative was not in the acceptance list (Jones M1 Shelves 1, 3, 5). The Jones M1 Sealed Pantry design problem (unconstrained ingredient-pair → food-name) is the most acute: PEPPER as the product of FRUIT+FIRE is non-obvious (a pepper is preserved with heat, not produced by combining fruit and fire in the conventional culinary sense). The full canonical answer `pepper porridge oil cake milk` implies a pantry of condiments/staples rather than "preparations" in the culinary sense Drake and Jones both expected.

---

## Designer flags worth fixing now

*(New issues only — does not repeat fixes.md)*

**1. Jones M1 (Sealed Pantry) — canonical answer is not inferable from ingredient pairs [CRITICAL]**

FRUIT+FIRE → PEPPER is the least defensible pairing in the act. Pepper is not "made from fruit and fire" in any conventional culinary or alchemical sense — it is a spice preserved or dried using heat, but "FRUIT+FIRE" reads as jam, compote, or roasted fruit to any player who approaches it linguistically. PLANT+GREASE → OIL is cleaner but still admits SALVE, LINIMENT, UNGUENT. CREATURE+DRINK → MILK is actually the most counter-intuitive: milk comes FROM a creature; "CREATURE+DRINK" doesn't encode "the drink a creature produces." The whole pantry mission's ingredient-pair logic needs a rewrite pass to ensure each pair uniquely implies its canonical product. The current pairs do not.

**2. Drake M5 Riddle I — answer is ORBIT not OR; riddle reads as OR [MODERATE]**

The riddle as delivered ("Round and round this bit, but it's not 'and'") produces OR as the natural first reading (the agent's reading was exactly right for OR). The intended answer ORBIT requires: (a) knowing ORBIT means "round path," (b) noticing OR is embedded in ORBIT, (c) reading "this bit" as "the bit you're hiding inside" rather than "this small piece." That's three layers for one riddle. The hint text says "the first hides 'or' in the round shape of an old word for the path of a moon" — if the hint is given, ORBIT becomes clear. But without the hint, the riddle's surface-reading resolves cleanly to OR. This means players will submit OR, get it wrong, unlock the hint, and then get ORBIT — which is fine as a two-stage design but should be acknowledged as intentional, not a clue-text bug.

**3. Jones M3 Vesh's Compartment — "wanted forgotten" narrative frame not paid off by VEIN SNEEZE [MODERATE]**

The Vesh completion text is load-bearing: it reveals the slave-construction of the temple, the deliberate exposure of "expendable" people to the Source, and the clinical language Vesh used to describe mass death ("their disposal at completion was logistical"). This is the most morally significant revelation in Act 2. The puzzle mechanic (botanical sequence → VEIN; allergic response → SNEEZE) is disconnected from this payload — the answers feel like anatomical trivia rather than suppressed knowledge. Either the sequence words should encode something more sinister (the pollen-exposure pathway IS the Source transmission mechanism; the sequence could be titled differently to make that reading obvious), or the mission brief's "wanted forgotten" framing needs a sentence connecting VEIN and SNEEZE to what Vesh actually wanted hidden: the physiological documentation of Source exposure through the construction workforce.

**4. All three Wall of Repetitions missions — combined inscription is the Act 2 spine and it failed for all three houses [STRUCTURAL]**

The three-line combined inscription (`this place once made us wise / it was making us obsessed / until we slowly realized`) is the single most important puzzle payload in Act 2. It appears on the wall of the Green Department, is referenced throughout the act, and is the clearest direct statement of the Source mythology in playable content. Because all three wall missions are trading-dependent and none of the three houses completed them (all three gave-up on trading grounds), the inscription was never assembled in this playtest. The mechanic works. The problem is that the wall missions are fifth in trading priority for most houses — teams solve faster missions first and the wall missions get delayed or abandoned. Consider whether the host needs explicit guidance to prioritize wall-tile trades in the first trading wave, or whether the wall missions should be presented with a "do this first" flag in the mission brief.

**5. Croft M2 Sighting Wall — self-destruct on Lens-Label cards requires host-orchestrated pause [LOGISTICS]**

This was flagged by both Croft and Jones as the highest logistics risk. The self-destruct mechanic is the best individual card design in the act (narratively justified, teaches the write-things-down behavior). But it creates a coordination requirement that cuts across the trading flow. No current card text or host note says "pause all trading and coordinate a simultaneous scan moment." Without this explicit pause point, one house will scan their label card during a trade conversation with a different house, the information will expire before the second house is ready, and Mission 2 will fail on logistics rather than puzzle difficulty. This needs a host-note callout and a sentence in each Lens-Label card's description.

**6. Jones M5 Riddle I — phonetic construction is invisible without hearing the word aloud [MODERATE]**

FLOWER as the answer to "said to flow, but it doesn't; instead it stands beautifully" depends on saying the word aloud: "flow-er." In a written-card environment, players read "flower" as the garden plant, not as "a thing that flow-s." In a live room with verbal communication, a player who hears "flow-er" will get it immediately. A player reading it silently may not. This riddle is better in a spoken context than a written one — consider whether the card should have a phonetic hint ("say the answer aloud first") or whether the riddle should be reformatted as "its name sounds like flowing, but the thing itself never moves."

---

## Story coherence assessment

**Did Act 2 land the Source mythology?**

Partially. The mythology landed as phenomenology (compelled writing, memory loss, respiratory exposure, civilizational amnesia) but not as named fact. No house encountered the words "Source," "Chaotic Order," or "logical contagion" from puzzle content because:
- The three Wall of Repetitions missions (primary Source mythology payload) all failed on trading-dependency grounds
- Jones M3 (Vesh's slave-construction revelation, containing the word "Source" in the completion text) failed
- Jones M5 (Sefa's testimony, which in the Act 3 history cards acknowledges the temple choice directly) failed

What landed correctly: the behavioral evidence. All three houses independently reconstructed Phase 2 (Obsession) and Phase 4 (Seal) of the Source mythology from architectural and narrative clues. What didn't land: the vocabulary, the explicit naming, and the slave-construction moral charge. Players understand *something happened to these people* but don't have the QRians' own word for it.

**Where are the gaps?**

1. The Vesh revelation (slave construction, "expendable" populations) is the most significant gap. This is the moral fulcrum of the Act 3 deliberation — what do you owe people whose deaths built the thing you're now deciding what to do with? Without this revelation, Act 3's deliberation is about the Source as a philosophical problem, not a historical injustice.

2. The three-line wall inscription was never assembled. The act's spine didn't land.

3. No house encountered the full Togom scroll completion text, which states: *"People who came back from this place suddenly had something in their eyes — some sort of wisdom... all who came toward this area and stayed there for a while would suddenly become a lot more logical in their thinking... The effect could not be destroyed."* This is the most explicit statement of the Source's nature in the act, and Drake didn't reach it (Riddle II was trading-dependent).

**Are players ready for Act 3 collaborative reconstruction?**

Yes, but with scaffolding gaps. The history timeline reconstruction depends on players ordering 12 fragments from "blessing" through "obsession" through "containment." The behavioral arc they've built during Act 2 maps well onto the fragment sequence. The main risk: teams may over-index on the Obsession and Seal phases (which they experienced directly) and under-weight the Gift phase (Phase 1) which appears only in Act 3 history cards they haven't seen yet. The collaborative reconstruction should feel like confirming and completing what Act 2 hinted at, not re-learning the whole arc from scratch.

---

## Trading mechanic assessment

**Was the cross-house dependency calibrated well?**

Better than Act 1, which had zero inter-house trading. The dependency graph is correct: no mission is completable without at least one traded card, and the cards form a clean topology where each house holds cards the others need. The wall-tile exchange (all three houses need one tile from each other house) is the best-designed trading mechanic in the act — legible, symmetric, and self-motivating.

**Where the calibration fails:**

Drake's ask imbalance with Jones (5 from Jones, 2 to Jones) is the sharpest asymmetry in the act. In a 45-minute act with multiple houses bidding on Jones's time, Drake's fifth ask (Togom Riddle-Tablet II) is the one most likely to get dropped or delayed. This is structurally load-bearing for Drake M5 (Reinforced Bunker) — losing the Riddle-Tablet means losing the only way to unlock Togom's scroll, which is the clearest Source mythology payload Drake was supposed to receive. The asymmetry should be addressed either by giving Drake a third offer card for Jones or by giving Jones one of Drake's designated-for-Croft cards as an alternative.

**Were any houses lopsidedly net-givers or net-takers?**

Drake is the most lopsided net-receiver (–2 net). Jones is marginally a net-giver (+1). Croft is balanced (0). In a real room, Drake's net-receiver position will feel unfair to Jones unless Drake's high-value cards (Amber Wall Tile 2, Vesh Slot 1) are visibly essential. If Jones doesn't need those two cards urgently, Drake has weak leverage. Recommend ensuring the host or mission brief communicates which cards are essential for which missions so the value of each trade is legible to all parties.

**Mission 4 self-destruct coordination is a design problem masquerading as a logistics problem.** The Burial-Rite Fragment self-destruct is the best individual card design in the act. But because Mission 4 requires all three houses to coordinate scanning simultaneously, the self-destruct creates a mandatory "trading pause" that the act's current flow doesn't accommodate. The act needs an explicit trading-phase protocol: "first 5-10 minutes: declare and close wall-tile exchanges; second wave: compartment slots and calculation tablets; Mission 4 Burial-Rite coordination moment: all three houses pause and scan together." Without this protocol, Mission 4 is the highest-risk failure point.

---

## Consequences applied

### Act 2 seeded consequences: NONE

There are **zero** `MissionConsequence` records for Act 2 → Act 3 in the seed. The seed summary confirms: *"3 Act 1→Act 2 lock gates"* — no Act 2→Act 3 gates. This is a designer-authored gap.

The following Act 2 mission outcomes carry story weight but have no mechanical consequence propagation:

| House | Mission | Result | Story implication for Act 3 | Seeded consequence |
|-------|---------|--------|-----------------------------|--------------------|
| Drake | M5: Reinforced Bunker | FAIL | Togom's scroll unread — the earliest first-person account of Source exposure goes into Act 3 unseen | None seeded |
| Jones | M3: Vesh's Compartment | FAIL | Slave-construction revelation hidden — the moral charge of Act 3 deliberation is missing | None seeded |
| Jones | M4: Hanging Garden | FAIL | "JAW" — the garden's named concept (the jaw that chews, or the structural hinge?) goes unresolved | None seeded |
| Croft | M5: High Ledge | LOCKED | Yenus's personal theory (hidden above flood level, addressed to future visitors) stays sealed | Correctly locked; no Act 3 gate seeded |
| All | Wall of Repetitions | FAIL (all 3) | Combined inscription never assembled; the direct Source mythology statement remains fragmented | None seeded |

**Designer flags for unseeded consequences (do not invent — flag for designer decision):**

1. **Should Drake's failure on M5 (Togom scroll) affect their Act 3 history cards?** Togom's scroll text appears in the seed as a completion-text reveal, not as a history card. If Drake doesn't read the scroll in Act 2, they miss the earliest Source-exposure testimony. No Act 3 history card currently compensates for this. Consider: should Drake enter Act 3 with a "missing context" note on the history timeline — specifically, that the Priest-Physicist's personal record is sealed and unread? Or should one of the Act 3 history fragments be downgraded or replaced to account for Drake's lost knowledge?

2. **Should Jones's failure on M3 (Vesh) affect Act 3 deliberation with a "missing context" note?** The slave-construction revelation is the moral weight behind the Jones major decision ("Open It for Research" — are you sure, given what it cost to build?). Without Vesh, Jones may advocate for research access without knowing the construction used disposable people. A "missing context" note — "you never learned how the temple was built" — added to the Jones Act 3 packet would give the deliberation phase the right moral texture. Currently there is nothing.

3. **Should Croft's lockout of M5 (Yenus's ledge) affect their Act 3 history-reconstruction capability?** Yenus hid his personal theory above flood level, addressed to future visitors. He expected someone competent enough to climb. Because Croft cannot reach the ledge, they enter Act 3 without Yenus's reading of the QRian situation. This is narratively rich but mechanically invisible in Act 3 as currently designed. No seeded consequence or missing-context note.

Since no Act 2 → Act 3 consequences are seeded, **no mechanical changes to Act 3 packets are required by the seed's design.** The story-level consequences described above are narrative gaps, not triggered consequence records. The designer should decide whether to seed them as `warning` consequence records (yellow callouts in Act 3 briefings) before the next live run.

Applied changes to Act 3 packets: **none** (no seeded consequences to apply).

> Applied narrative notes (not seeded — added as informational context only):

**Drake Act 3 packet:** No seeded consequences. Drake enters Act 3 having: established the armory theory, completed Mission 4 (Reagent Alcove) cleanly, and missed the Togom scroll. Drake's four History Fragment cards (Clinic Record: First Exposure, The Fifty-Seventh Lesson, Kitchen Complaint from the Workers' Hall, Foreman Krane's Completion Record) span all four phases and lean toward Drake-leaning evidence (Phase 2 disturbances, Phase 4 prison architecture). Drake is well-positioned for the Destroy the Source major decision argument. The missing Togom context is a narrative gap, not a mechanical one.

**Jones Act 3 packet:** No seeded consequences. Jones enters Act 3 having: completed Mission 1 partially (PORRIDGE and CAKE correct, others wrong), never solved Vesh's compartment, never solved the Wall inscription, never solved the Hanging Garden, and never solved Sefa's riddles. Jones holds the richest History Fragment set (Note Tied to Learning Blocks, Order to Break the Fifth Drain, Plain Warning for the Lower Stair, Testimony of Sefa Before the Closing) — spanning education, restriction, plain warning, and final testimony. Jones's scholarly identity aligns with the Open It for Research major decision, but the Vesh gap means Jones will advocate for research access without knowing about the slave-construction moral charge. This is a design tension the designer should decide whether to surface.

**Croft Act 3 packet:** No seeded consequences. Croft enters Act 3 with a lockout wound (Yenus's ledge, Mission 5) and having solved Missions 1 and 2 cleanly (TIME, DAWN through SUNSET). Croft's History Fragment cards (Letter from a Schoolmaster, Order Limiting Second Visits, Letter of Priest-Scientist Ennar, The Last Copyist's Oath) are Discovery/Dependency-era heavy — the arc from "blessing from the earth" through "we are becoming excellent at the cost of becoming unable to stop." This gives Croft the clearest Phase 1 → Phase 2 evidence, which supports the Recontain the Source argument (we know it was beneficial; we know it was destructive; containment is the proportionate response). Croft is the most narratively complete house entering Act 3 despite the single lockout.

> No Act 2 consequences carried into Act 3 for any house via the seed. The above notes are context for designers and hosts only.
