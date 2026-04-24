# Act 1 Puzzle Evaluation Report

## Summary Scores (all 15 missions)

| Mission | House | Type | Frag.Dep | Ambig.Risk | Solve Min | Phys.Cmplx | Narr.Coher | Unbuilt? |
|---------|-------|------|:---:|:---:|:---:|:---:|:---:|---|
| Fuse Charges | Drake | G | 4 | 4 | 5-7 | 3 | 5 | No |
| Stone Wheel | Drake | B | 5 | 3 | 8-12 | 4 | 4 | GLYPH FONT |
| Shadow Astrolabe | Drake | N | 3 | 2 | 12-18 | 3 | 4 | No |
| Construction Hoist | Drake | A | 5 | 5 | 4-6 | 2 | 5 | No |
| Scraped Gap | Drake | O | 5 | 3 | 10-15 | 5 | 4 | No |
| Ceremonial Whips | Jones | B | 5 | 3 | 8-12 | 4 | 5 | GLYPH FONT |
| Ancient Drainage | Jones | O | 5 | 4 | 10-15 | 5 | 5 | PIPE GRID VISUAL |
| Scattered Offerings | Jones | F | 4 | 4 | 5-7 | 2 | 5 | No |
| Sliding Panels | Jones | A | 5 | 4 | 4-6 | 2 | 5 | No |
| False Exit | Jones | G | 4 | 4 | 6-9 | 3 | 5 | No |
| Grappling Rigs | Croft | G | 4 | 4 | 5-7 | 3 | 5 | No |
| Stone Jigsaw | Croft | O | 5 | 5 | 4-6 | 4 | 5 | No |
| Impossible Vase | Croft | A | 5 | 4 | 4-6 | 2 | 5 | No |
| Teaching Stone | Croft | N | 4 | 4 | 12-18 | 5 | 4 | DISC VISUAL |
| Drag Marks | Croft | B | 5 | 5 | 6-10 | 3 | 5 | GLYPH FONT |

> **Change log:** Elevated Archive (Jones, Type N, 12-20 min) moved to Act 2. Replaced by Sort the Scattered Offerings (Type F — QRian Connections, 5-7 min). Type F pulled from Act 2 pool; Act 2 gains Type N, keeping 6 types for 6 missions. The Elevated Archive puzzle ("Verify the Archive Records" — contradiction/forgery detection) is also drafted for Act 2.

## Top 5 Concerns

### 1. Shadow Astrolabe has ambiguity + weak fragment dependency
- Disc 1 (Sky): "blue" vs "white" vs "light blue" are all defensible
- Disc 5 (Iron): "silver" vs "grey/gray" are both valid
- Fragment dependency is weakest of all 15 missions (3/5) — strong general knowledge can bypass trading
- Modern-world references (banana, meat doneness) feel out-of-place in a QRian temple
- **Action:** Add grey/gray and light blue as accepted alternatives. Consider redesigning disc concepts.

### 2. Three missions blocked by unbuilt glyph font
- Jones Crew (Ceremonial Whips), Drake Flood (Stone Wheel), Croft T3 (Drag Marks)
- One per house — 20% of Act 1 content
- **Action:** Prioritize glyph font design (Anthony doing this via Calligraphr)

### 3. Scraped Gap character counting is error-prone
- Counting to position 28 in a sentence (including spaces and punctuation) is tedious
- One miscount = wrong letter = unsolvable anagram
- **Action:** Consider switching to word-position extraction, or add verification hint ("all letters should be lowercase English")

### 4. Teaching Stone may be too hard for time budget
- Teaching Stone: 12-18 min estimated. Position-dependent rule discovery.
- In a 25-minute act where teams complete 3-4 of 5 missions, this is the expected sacrifice for Croft.
- Shadow Astrolabe (12-18 min) is the expected sacrifice for Drake.
- **Action:** Ensure hints arrive quickly. Acceptable that these are the "skip" missions for their respective houses.

### 5. Answer format inconsistency
- Most answers are clean digit strings or single words
- Three are risky: "blue green pink brown silver" (5 space-separated colors), "13 23 38" (space-separated numbers), "tell my child i loved them still" (7-word phrase)
- **Action:** Ensure robust validation — case-insensitive, whitespace-flexible, common variant acceptance

## House Balance

| Metric | Drake | Jones | Croft |
|--------|:---:|:---:|:---:|
| Total solve time | 39-58 min | 33-49 min | 31-47 min |
| Missions | 5 | 5 | 5 |
| Avg fragment dependency | 4.4 | 4.6 | 4.6 |
| Avg ambiguity risk | 3.4 | 3.8 | 4.4 |

**Balance significantly improved.** Jones dropped from 40-62 min to 33-49 min with the Elevated Archive → Scattered Offerings swap. At 25 minutes, expected completions: Croft 3-4, Drake 3, Jones 3. Drake is now the hardest house (Scraped Gap 10-15 + Astrolabe 12-18 as the two long missions). Jones and Croft are comparable.

## Glyph System Audit

**19 of 26 letters covered across 3 Type B missions:**
- Jones Crew: A, C, E, I, L, M, N, O, S, T (10 letters)
- Drake Flood adds: F, G, H, P, R, U (6 new)
- Croft T3 adds: D, V, Y (3 new)
- **Missing:** B, J, K, Q, W, X, Z (7 uncommon letters — fine for Act 1)
- **No conflicts found.** Each letter has one consistent glyph mapping.

## Difficulty Ranking (easiest to hardest)

1. Sliding Panels (Jones, A) — 4-6 min
2. Construction Hoist (Drake, A) — 4-6 min
3. Impossible Vase (Croft, A) — 4-6 min
4. Stone Jigsaw (Croft, O) — 4-6 min
5. Fuse Charges (Drake, G) — 5-7 min
6. Grappling Rigs (Croft, G) — 5-7 min
7. **Scattered Offerings (Jones, F) — 5-7 min** *(new — replaced Elevated Archive)*
8. False Exit (Jones, G) — 6-9 min
9. Drag Marks (Croft, B) — 6-10 min
10. Ceremonial Whips (Jones, B) — 8-12 min
11. Stone Wheel (Drake, B) — 8-12 min
12. Ancient Drainage (Jones, O) — 10-15 min
13. Scraped Gap (Drake, O) — 10-15 min
14. Teaching Stone (Croft, N) — 12-18 min
15. Shadow Astrolabe (Drake, N) — 12-18 min

**Pattern:** Type A (Anagram) = easiest. Type F/G (Connections/Sequence) = moderate. Type B (Glyph) = medium. Type O (Fragment) = medium-hard. Type N (Pattern) = hardest. Drake and Croft each have one Type N as their hardest puzzle. Jones's hardest is now Ancient Drainage (10-15 min) — a significant improvement.

## Visual Content Needs

| Mission | What's needed | Severity |
|---------|--------------|----------|
| Jones Crew: Ceremonial Whips | Corridor glyph labels + wall inscription | BLOCKER (needs glyph font) |
| Drake Flood: Stone Wheel | 6 glyph groups on wheel face | BLOCKER (needs glyph font) |
| Croft T3: Drag Marks | Wall glyph inscription | BLOCKER (needs glyph font) |
| Jones Flood: Ancient Drainage | 3x3 pipe grid diagram | HIGH (needs ASCII art or image) |
| Croft T2: Teaching Stone | Concentric ring disc layout | MEDIUM (works as table but loses spatial quality) |
| Drake T1: Shadow Astrolabe | Color sequence display | LOW (text works, colors would help) |
| Jones T1: Scattered Offerings | None — text-only puzzle | None |
