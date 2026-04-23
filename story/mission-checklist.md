# Mission Design Checklist

Run through this for every mission created or modified. Every item is something we've actually caught or corrected during development.

## Narrative Alignment

- [ ] **Revelations stay within act baseline.** Check `act-structure.md` — does this mission reveal anything that should be saved for a later act? (e.g., Source/corruption details belong in Act 2, not Act 1)
- [ ] **Trading mechanic makes narrative sense.** Why would other teams have the items you need? The story card brief must explain this (items scattered across chamber, other teams picked them up, etc.)
- [ ] **Items saved in Act 1 only help in Act 2.** No benefits carrying into Act 3.
- [ ] **Self-influence by Source is Act 2+ only.** Players can see evidence the QRians were changed, but should not feel it themselves in Act 1.
- [ ] **Patrons are NOT present.** Lara Croft, Indiana Jones are not in the temple. Only their representatives.
- [ ] **All houses blame Drake for the flood.** Each house's story card should reference this.

## Story Card Brief

- [ ] **Prepositional anchor.** Sight opens with a spatial phrase ("Far off to the left...", "Directly overhead...")
- [ ] **Standing vantage point.** Described as if the team is standing still, not walking past.
- [ ] **Visual-first.** Something you could point at across a torchlit room. Color, light, shape.
- [ ] **Suggestive action language.** "You could...", "With enough effort..." — never imperatives.
- [ ] **Brevity.** 3-5 sentences max per mission brief.
- [ ] **Second person plural.** "Your tactical eyes", not "your tactical eye."
- [ ] **House voice and humor.** Does it sound like this house? Drake = mercenary pragmatism, Jones = academic earnestness, Croft = bold physicality + Lara loyalty.
- [ ] **Clue card justification mentioned.** The brief explains what items are needed and why other teams might have them.

## Puzzle Design

- [ ] **No bespoke printed materials in Act 1.** Players write on index cards only.
- [ ] **Clue cards serve dual purpose.** They are both the narrative "tool" AND the puzzle information source.
- [ ] **Puzzle type matches act distribution.** Check `puzzle-act-distribution.md`.
- [ ] **Answer defined.** Correct answer, accepted alternatives, hint text, hint threshold.

## Three Texts

- [ ] **Correct answer reveal** written. Shown on phone immediately after solving — the "what you found" moment.
- [ ] **Success consequence** written. Read at act break — personal, about team morale/dynamics/confidence. Ends with forward momentum.
- [ ] **Failure consequence** written. Read at act break — personal, names the loss concretely, ends with dread about what's ahead.
- [ ] **Consequences are personal, not informational.** About morale, relationships, what the patron would think — not "you learned X."

## Cross-File Consistency

- [ ] **Design doc updated** (`missions.md`) — full mission parameters, puzzle type, required cards, answer, all three texts.
- [ ] **Story card updated** (`story-cards/<house>-act<N>.md`) — player-facing brief matches the design doc.
- [ ] **Seed script updated** (`seed-qrians.ts`) — description, puzzleDescription, answerId, consequences all match the design doc and story card.
- [ ] **Coverage tables updated** if revelations or evidence types changed.
