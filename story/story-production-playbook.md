# Story Production Playbook

How to turn CardSight from a one-off story project into a reusable story-production pipeline.

This document is not a replacement for [mission-design-principles.md](/Users/aaddo/src/cardsight/story/mission-design-principles.md), [mission-checklist.md](/Users/aaddo/src/cardsight/story/mission-checklist.md), or [act-structure.md](/Users/aaddo/src/cardsight/story/act-structure.md). It exists to capture the lessons the QRians development and playtest history taught the hard way.

## Goal

The realistic target is not "write a whole new story in 3-4 days from scratch." The realistic target is:

1. Reuse the engine and a known set of puzzle types.
2. Reuse a stable authoring structure.
3. Use agents to catch predictable failures before human playtest.
4. Reserve human judgment for taste, theme, pacing, and final calls.

If those four things hold, a new story in a few days is plausible.

## What The History Actually Says

The QRians project did not take weeks because the prose itself was slow. It took weeks because development kept uncovering hidden constraints:

- Puzzle text leaked clue-card content into the mission UI, which trivialized whole missions.
- Some missions claimed to require trading, but the seed put all needed cards on the home table.
- Several puzzles had multiple defensible answers, but the validation model was all-or-nothing.
- Some of the strongest lore beats were mechanically present but emotionally buried.
- Physical artifacts were load-bearing but not yet production-ready.
- Timed missions created table-chaos unless the story or host protocol explicitly coordinated them.
- Finale argument balance depended on evidence distribution, not just elegant lore.
- Design intentions existed in memory but were not fully seeded into consequences or admin behavior.

That is good news. It means the bottleneck is structure, not imagination.

## Hard Lessons To Keep

### 1. Maintain one source of truth

Drifting parallel docs caused friction. Future stories should have one canonical data surface for mission parameters and one clearly secondary surface for human-readable planning.

Rules:
- Do not maintain duplicate mission specs in multiple freeform docs.
- If a mission changes, update the seed/config and the player-facing story brief in the same pass.
- If a planning doc cannot be kept synced cheaply, delete it.

### 2. Protect the clue economy

A recurring failure mode was leaking clue-card content into `puzzleDescription`, hints, or slot labels. Once the phone UI repeats the card content, trading and scanning stop mattering.

Rules:
- Mission UI should state the task, not restate the evidence.
- Slot labels should expose only what the player can see in the chamber itself.
- Every clue card should carry information that matters and is not duplicated elsewhere.

### 3. Design trading as a real system, not a story decoration

The biggest structural gap was assuming that "trade topology is feasible" meant "players will actually complete the trades in time." Those are different questions.

Rules:
- Every trade-dependent mission must need the trade in implementation, not just in narrative.
- Trading load should be balanced enough that one house is not the default bottleneck.
- Narrative-spine missions cannot be easy to deprioritize.
- Before playtest, run a negotiation simulation, not just a card-graph check.

### 4. Treat answer ambiguity as expected, not exceptional

Many fixes were not "players were wrong." They were "players were reasonably right in a way the system did not accept."

Rules:
- For every answer, ask what else a careful player could submit.
- If multiple answers are defensible, either tighten the clue, accept alternatives, or change the mechanic.
- Use `MultipleAnswer` when sub-parts can be independently right.
- If a puzzle carries consequences, ambiguity becomes a blocking issue.

### 5. Match puzzle mechanic to story payload

When the mechanic and the revelation felt unrelated, the mission landed as trivia instead of drama. The Vesh fix is the clearest example.

Rules:
- The solve path should feel like the right way to reach that story beat.
- If the mechanic is abstract, bridge it explicitly in the reveal text.
- The strongest moral or thematic revelations should not depend on flavor text alone.

### 6. Surface the lore beat, not just the answer

Several commits were really about moving the emotional emphasis to the right place. A correct answer is not automatically a successful reveal.

Rules:
- Every mission needs a clear "why this matters" line in the correct-answer reveal.
- If a puzzle contains one of the act's strongest revelations, foreground it in the reveal and consequence text.
- Do not bury the best line in logistics prose.

### 7. Physical artifacts are first-class content

Some missions were analytically sound but untestable or unplayable without their printed artifact.

Rules:
- If the puzzle depends on a print asset, that asset is part of the mission design, not a later implementation detail.
- Artifact missions need legibility checks, durability checks, and phone-scan checks.
- A mission that cannot be meaningfully simulated without the prop needs a dedicated prop-readiness gate.

### 8. Time pressure needs choreography

Simultaneous self-destructs and short timers created room-level coordination problems that were invisible in static review.

Rules:
- Any multi-house timer needs explicit coordination support.
- Coordination can live in the story, host brief, admin tools, or all three, but it must exist somewhere deliberate.
- Real-table chaos is part of the mechanic budget. If the room cannot physically execute the task, the timer is wrong.

### 9. Finale balance is evidence balance

Act 3 does not become fair because each house has a clean ideological position. It becomes fair when each position has enough evidence to argue from.

Rules:
- Each endgame stance needs at least one strong fragment that genuinely helps its case.
- If one stance has only philosophy and no evidence, the deliberation will collapse toward another option.
- Timeline reconstruction should reveal the arc, not eat all the attention as bookkeeping.

### 10. Register matters

Small wording changes mattered because they changed whether the experience felt like an artifact or an app form.

Rules:
- Prefer diegetic verbs like "write" when that is what players imagine themselves doing.
- House voice is not garnish. It is part of how briefs stay alive.
- UI copy should preserve the frame wherever possible.

### 11. Consequences must be intentionally propagated

Several intended consequences existed in design memory but not in the seed.

Rules:
- If a failure is supposed to matter later, verify the downstream effect exists in data and admin flow.
- A narrative consequence with no propagation is fine only if that is deliberate.
- Missing-context warnings are valid when a full mechanic would be too expensive.

## Fast Story Workflow

Use this when building a new story on top of the existing engine.

### Phase 1: Story Skeleton

Define:
- The three-act arc.
- The knowledge baseline for each act.
- The final decision and the arguments each house should be able to make.
- The reusable puzzle types you are actually using.

Constraint:
- Do not draft full prose yet. First define the revelations, evidence paths, and which house gets which angle on them.

### Phase 2: Mission Mapping

For each mission, lock:
- Its act and house.
- Its puzzle type.
- Its story function.
- Its required clue cards.
- Its answer model.
- Its downstream consequence, if any.

Constraint:
- Every act-level revelation should have redundancy across houses.
- Every finale stance should have evidentiary support by Act 3.

### Phase 3: Player-Facing Authoring

Write:
- Story-sheet blurbs.
- Puzzle descriptions.
- Correct-answer reveals.
- Success/failure consequences.

Constraint:
- Keep the mission UI from leaking the clue cards.
- Make sure the reveal text lands the actual narrative beat.

### Phase 4: Agent Review

Do not wait for a full live playtest. Run structured agent passes first.

### Phase 5: Implementation And Seed Audit

Verify:
- Story brief and seed agree.
- Clue distribution matches intended trading.
- Accept alternatives are deliberate.
- Consequences are actually wired.
- Artifact tools and print outputs exist.

### Phase 6: Human Playtest

Only after the above passes. Human playtest should discover higher-order problems, not obvious data leaks and ambiguous canonicals.

## Agent Review Workflow

Run these as separate passes, then do one synthesis pass. The point is not "more text from agents." The point is forcing specialized critique.

### Pass A: Narrative Continuity

Ask:
- Does each act reveal the right things at the right time?
- Is any lore beat under-seeded, over-seeded, or buried?
- Does each house build a distinct but converging theory of the story?
- Does the finale have genuinely arguable positions?

Flag:
- Reveal timing violations.
- Missing terminology.
- House arcs that do not converge enough for collaboration or diverge enough to feel distinct.

### Pass B: Puzzle Integrity

Ask:
- Can a careful player derive the canonical answer from the provided materials alone?
- What alternative answers are reasonable?
- Does the puzzle rely on outside knowledge without scaffolding?
- Should this be `MultipleAnswer`?

Flag:
- Ambiguous canonicals.
- Knowledge-gated steps with no backup clueing.
- Answer formats that punish partial correctness.

### Pass C: Trade And Time Pressure

Ask:
- Does implementation actually force cross-house trade?
- Can the negotiation plausibly finish under time pressure?
- Is any mission over-dependent on one other house?
- Are narrative-spine missions likely to be skipped in favor of faster wins?

Flag:
- Fake trading.
- Bottleneck houses.
- Timer logistics that fail at room scale.
- Missions whose importance is invisible to players.

### Pass D: Physical And Host Logistics

Ask:
- Which missions depend on printed artifacts?
- Are those props legible, durable, and available?
- Does the host need a protocol, cue, or admin support to run this cleanly?
- Does the experience still work if one prop or phone flow is shaky?

Flag:
- Single points of failure.
- Missions that exist only on paper but not in production assets.
- Host burden that is too high or too implicit.

### Pass E: Finale Balance

Ask:
- Can each house defend its likely stance with evidence rather than vibes?
- Does timeline work reveal the history or merely consume time?
- Are any clauses logically incoherent once players share knowledge?

Flag:
- Stances with no evidence.
- Clause logic problems.
- Deliberation structures that pull toward one answer unintentionally.

### Pass F: Synthesis

Combine the above into three lists:
- Block before playtest.
- Fix soon.
- Accept as intentional.

Also record:
- What agents could not test because a physical artifact or live-room dynamic was missing.

## Pre-Playtest Gates

Do not run a live session until these are true:

- No mission UI duplicates clue-card content.
- Every trade-dependent mission is trade-dependent in data, not just in prose.
- Every consequence-carrying puzzle has been ambiguity-checked.
- Every required physical artifact exists and has been read on real phones.
- Each Act 3 stance has at least one evidence-rich support path.
- At least one negotiation simulation has been run for the most trade-heavy act.

## Definition Of "Fast Enough"

A new story is "fast enough" if:

- The first draft is built from a known scaffold.
- Most puzzle types are reused or lightly reskinned.
- Agents catch the predictable structural problems before human playtest.
- Human playtest produces refinements, not weeks of rediscovering system rules.

That is the real path to a 3-4 day story cycle.
