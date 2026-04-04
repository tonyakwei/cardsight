import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.cardHouse.deleteMany();
  await prisma.setReview.deleteMany();
  await prisma.answerAttempt.deleteMany();
  await prisma.scanEvent.deleteMany();
  await prisma.card.deleteMany();
  await prisma.singleAnswer.deleteMany();
  await prisma.design.deleteMany();
  await prisma.cardSet.deleteMany();
  await prisma.house.deleteMany();
  await prisma.game.deleteMany();

  // === Game ===
  const game = await prisma.game.create({
    data: {
      name: "Operation Starlight",
      description:
        "A prototype game for testing CardSight. Three agencies race to decode a constellation map before the signal fades.",
      status: "active",
    },
  });

  // === Card Sets ===
  const signalsSet = await prisma.cardSet.create({
    data: {
      gameId: game.id,
      name: "Signals",
      color: "#06b6d4",
      notes: "Signal cards contain transmission fragments. Each team needs 3 to decode their constellation segment.",
    },
  });

  const navSet = await prisma.cardSet.create({
    data: {
      gameId: game.id,
      name: "Navigation",
      color: "#3b82f6",
      notes: "Navigation clues point to physical locations. Cross-reference with the room map.",
    },
  });

  const geoSet = await prisma.cardSet.create({
    data: {
      gameId: game.id,
      name: "Geometry",
      color: "#8b5cf6",
      notes: "Geometry puzzles involve shapes and spatial reasoning.",
    },
  });

  // === Houses ===
  const alpha = await prisma.house.create({
    data: { gameId: game.id, name: "Alpha", color: "#4fc3f7" },
  });

  const bravo = await prisma.house.create({
    data: { gameId: game.id, name: "Bravo", color: "#ff5252" },
  });

  const charlie = await prisma.house.create({
    data: { gameId: game.id, name: "Charlie", color: "#69f0ae" },
  });

  // === Designs ===
  const classified = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Agency Alpha — Classified",
      bgColor: "#0a0f1a",
      bgGradient: "linear-gradient(180deg, #0a0f1a 0%, #0d1b2a 50%, #1b263b 100%)",
      textColor: "#c8e6f5",
      accentColor: "#4fc3f7",
      secondaryColor: "#0288d1",
      fontFamily: "'Courier New', monospace",
      cardStyle: "classified",
      animationIn: "decrypt",
      borderStyle: "1px solid rgba(79, 195, 247, 0.3)",
      overlayEffect: "scanlines",
    },
  });

  const emergency = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Emergency Broadcast",
      bgColor: "#1a0000",
      bgGradient: "linear-gradient(180deg, #1a0000 0%, #2d0000 50%, #400000 100%)",
      textColor: "#ffcdd2",
      accentColor: "#ff5252",
      secondaryColor: "#d32f2f",
      fontFamily: "'Courier New', monospace",
      cardStyle: "urgent",
      animationIn: "glitch",
      borderStyle: "2px solid rgba(255, 82, 82, 0.5)",
      overlayEffect: "static",
    },
  });

  const alien = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Alien Transmission",
      bgColor: "#001a0a",
      bgGradient: "linear-gradient(180deg, #001a0a 0%, #002d11 50%, #00401a 100%)",
      textColor: "#c8e6c9",
      accentColor: "#69f0ae",
      secondaryColor: "#00c853",
      fontFamily: "'Courier New', monospace",
      cardStyle: "alien",
      animationIn: "fade",
      borderStyle: "1px solid rgba(105, 240, 174, 0.3)",
      overlayEffect: "particles",
    },
  });

  const standard = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Standard Briefing",
      bgColor: "#0d1117",
      bgGradient: "linear-gradient(180deg, #0d1117 0%, #161b22 50%, #21262d 100%)",
      textColor: "#e6edf3",
      accentColor: "#58a6ff",
      secondaryColor: "#388bfd",
      fontFamily: "system-ui",
      cardStyle: "standard",
      animationIn: "slide-up",
      borderStyle: "1px solid rgba(88, 166, 255, 0.2)",
      overlayEffect: "glow",
    },
  });

  const redacted = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Redacted File",
      bgColor: "#f5f0e8",
      textColor: "#1a1a1a",
      accentColor: "#8b0000",
      secondaryColor: "#cc0000",
      fontFamily: "'Courier New', monospace",
      cardStyle: "redacted",
      animationIn: "fade",
      borderStyle: "none",
      overlayEffect: null,
    },
  });

  // === Single Answers ===
  const answer1 = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "Orion",
      caseSensitive: false,
      acceptAlternatives: ["orion's belt", "the hunter", "orion constellation"],
      hint: "Look up. The hunter watches over the winter sky.",
      hintAfterAttempts: 3,
    },
  });

  const answer2 = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "347 MHz",
      caseSensitive: false,
      acceptAlternatives: ["347", "347mhz", "347 mhz"],
      hint: "The frequency is hidden in the emergency broadcast pattern.",
      hintAfterAttempts: 2,
    },
  });

  const answer3 = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "LIGHTHOUSE",
      caseSensitive: false,
      acceptAlternatives: ["the lighthouse", "a lighthouse"],
      hint: null,
      hintAfterAttempts: 3,
    },
  });

  const answer4 = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "7",
      caseSensitive: false,
      acceptAlternatives: ["seven"],
      hint: "Count the vertices, not the edges.",
      hintAfterAttempts: 4,
    },
  });

  // === Cards ===

  // Helper to assign houses to a card
  async function assignHouses(cardId: string, houseIds: string[]) {
    for (const houseId of houseIds) {
      await prisma.cardHouse.create({ data: { cardId, houseId } });
    }
  }

  // Card 1: Info-only, no set, Alpha house, NO entry gate
  const card1 = await prisma.card.create({
    data: {
      gameId: game.id,
      humanCardId: "A-01",
      act: 1,
      title: "CLASSIFIED: Mission Briefing",
      description: `**AGENCY ALPHA — EYES ONLY**

You have been recruited for Operation Starlight. Your mission: decode the constellation map before the signal fades.

Three fragments of the map are scattered across the room. Each fragment is held by a different agency. No single agency can solve it alone.

**Your first task:** Find the three signal cards marked with the Alpha insignia. They contain the frequencies you'll need.

*This message will not repeat.*`,
      designId: classified.id,
      hasEntryGate: false,
      isFinished: true,
      sortOrder: 1,
    },
  });
  await assignHouses(card1.id, [alpha.id]);

  // Card 2: Signals set, Alpha house, answerable + self-destruct
  const card2 = await prisma.card.create({
    data: {
      gameId: game.id,
      humanCardId: "A-02",
      act: 1,
      cardSetId: signalsSet.id,
      clueVisibleCategory: "Fragment",
      title: "Signal Fragment #1",
      description: `Intercepted transmission fragment:

\`\`\`
... the constellation that guides ...
... three stars in a line ...
... the hunter's belt ...
\`\`\`

**Identify the constellation referenced in this fragment.**`,
      designId: classified.id,
      answerTemplateType: "single_answer",
      answerId: answer1.id,
      isAnswerable: true,
      selfDestructTimer: 120,
      selfDestructText: "⚠ TRANSMISSION EXPIRED — This signal fragment has degraded beyond recovery.",
      hasEntryGate: true,
      entryGateText: "Decrypt Signal",
      answerVisibleAfterDestruct: true,
      isFinished: true,
      sortOrder: 2,
    },
  });
  await assignHouses(card2.id, [alpha.id]);

  // Card 3: Signals set, Bravo house, answerable
  const card3 = await prisma.card.create({
    data: {
      gameId: game.id,
      humanCardId: "B-01",
      act: 1,
      cardSetId: signalsSet.id,
      clueVisibleCategory: "Frequency",
      title: "⚠ EMERGENCY FREQUENCY DETECTED",
      description: `**AUTOMATED ALERT — DO NOT IGNORE**

A repeating signal has been detected on an unknown frequency. The pattern is:

\`3 - 4 - 7\`

Separated by silence. Then it repeats.

**What frequency is the signal broadcasting on?**

*Note: Include the unit in your answer.*`,
      designId: emergency.id,
      answerTemplateType: "single_answer",
      answerId: answer2.id,
      isAnswerable: true,
      hasEntryGate: true,
      entryGateText: "Receive Broadcast",
      isFinished: true,
      sortOrder: 3,
    },
  });
  await assignHouses(card3.id, [bravo.id]);

  // Card 4: Signals set, Charlie house, info-only + self-destruct
  const card4 = await prisma.card.create({
    data: {
      gameId: game.id,
      humanCardId: "C-01",
      act: 1,
      cardSetId: signalsSet.id,
      clueVisibleCategory: "Transmission",
      title: "Anomalous Signal Decoded",
      description: `*Translation matrix applied. Confidence: 73%.*

> We have watched your star for many rotations. The light you call "north" is our beacon home. When the seven points align, the path opens.

> Do not seek us. We will find you when the map is complete.

*End of decoded transmission. Original signal decaying.*`,
      designId: alien.id,
      selfDestructTimer: 90,
      selfDestructText: "The alien signal has fully degraded. Only silence remains.",
      hasEntryGate: true,
      entryGateText: "Receive Transmission",
      isFinished: false,
      notes: "TODO: Need to verify the alien text doesn't give away too much about Act 2",
      sortOrder: 4,
    },
  });
  await assignHouses(card4.id, [charlie.id]);

  // Card 5: Navigation set, no house (shared), answerable
  const card5 = await prisma.card.create({
    data: {
      gameId: game.id,
      humanCardId: "S-01",
      act: 1,
      cardSetId: navSet.id,
      clueVisibleCategory: "Grid-7",
      title: "Navigation Clue: The Beacon",
      description: `The old keeper said it before he vanished:

> *"When all other lights go out, there is one that remains. It stands where the land meets the sea, and it has guided every lost soul home."*

**What is the keeper describing?**`,
      designId: standard.id,
      answerTemplateType: "single_answer",
      answerId: answer3.id,
      isAnswerable: true,
      hasEntryGate: true,
      entryGateText: "Open Briefing",
      isFinished: true,
      sortOrder: 5,
    },
  });

  // Card 6: No set, no house, locked out
  await prisma.card.create({
    data: {
      gameId: game.id,
      humanCardId: "X-01",
      act: 2,
      title: "Act 2 — Restricted Access",
      description: "This content is not yet available.",
      designId: standard.id,
      lockedOut: true,
      lockedOutReason: "This card will be unlocked at the start of Act 2.",
      sortOrder: 6,
    },
  });

  // Card 7: Geometry set, Alpha + Bravo houses (multi-house demo), answerable
  const card7 = await prisma.card.create({
    data: {
      gameId: game.id,
      humanCardId: "R-01",
      act: 1,
      cardSetId: geoSet.id,
      clueVisibleCategory: "Shape",
      title: "REDACTED DOCUMENT — PARTIAL RECOVERY",
      description: `The following was recovered from a damaged file:

> Project ████████ involved a shape with ████ vertices. The shape was described as having "more ██████ than a hexagon but fewer than an ████████."

> The number of vertices is ███.

**How many vertices does the shape have?**`,
      designId: redacted.id,
      answerTemplateType: "single_answer",
      answerId: answer4.id,
      isAnswerable: true,
      hasEntryGate: true,
      entryGateText: "Open File",
      isFinished: false,
      notes: "The redacted text might be too easy to guess - consider adding more redaction",
      sortOrder: 7,
    },
  });
  await assignHouses(card7.id, [alpha.id, bravo.id]);

  // Card 8: Signals set, Alpha house, already solved
  const card8 = await prisma.card.create({
    data: {
      gameId: game.id,
      humanCardId: "A-03",
      act: 1,
      cardSetId: signalsSet.id,
      title: "Decoded Coordinates",
      description: `The coordinates have been decoded:

**LAT:** 41.9028° N
**LON:** 12.4964° E

The signal originates from an ancient city.`,
      designId: classified.id,
      answerTemplateType: "single_answer",
      answerId: answer1.id,
      isAnswerable: true,
      isSolved: true,
      hasEntryGate: true,
      entryGateText: "Open Classified File",
      sortOrder: 8,
    },
  });
  await assignHouses(card8.id, [alpha.id]);

  // Seed scan + answer for solved card
  await prisma.scanEvent.create({
    data: { cardId: card8.id, gameId: game.id, sessionHash: "seed-session" },
  });
  await prisma.answerAttempt.create({
    data: {
      cardId: card8.id,
      gameId: game.id,
      attemptNumber: 1,
      answerGiven: "Orion",
      isCorrect: true,
      sessionHash: "seed-session",
    },
  });

  // Create a set review for "Signals" that's 1 hour old (to demo modified count)
  await prisma.setReview.create({
    data: {
      gameId: game.id,
      cardSetId: signalsSet.id,
      reviewedAt: new Date(Date.now() - 3600000),
    },
  });

  console.log("Seed data created successfully!");
  console.log(`Game: ${game.name} (${game.id})`);
  console.log("\nAdmin: http://localhost:5173/admin");
  console.log("\nCard Sets:", [signalsSet, navSet, geoSet].map((s) => s.name).join(", "));
  console.log("Houses:", [alpha, bravo, charlie].map((h) => h.name).join(", "));
  console.log("\nCard IDs for testing:");

  const cards = await prisma.card.findMany({
    where: { gameId: game.id },
    orderBy: { sortOrder: "asc" },
    include: {
      cardSet: { select: { name: true } },
      cardHouses: { include: { house: { select: { name: true } } } },
    },
  });

  for (const card of cards) {
    const houses = card.cardHouses.map((ch) => ch.house.name).join("+") || "—";
    const set = card.cardSet?.name ?? "—";
    console.log(`  ${card.humanCardId}: ${card.id}  [${set} | ${houses}]`);
    console.log(`    → http://localhost:5173/c/${card.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
