import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const physicalCards: { id: string; name: string; color: string; number: number }[] = require("../../shared/physical-cards.json");

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.storySheet.deleteMany();
  await prisma.triggeredConsequence.deleteMany();
  await prisma.missionConsequence.deleteMany();
  await prisma.missionAnswerAttempt.deleteMany();
  await prisma.missionScanEvent.deleteMany();
  await prisma.showtimeSlot.deleteMany();
  await prisma.showtime.deleteMany();
  await prisma.missionHouse.deleteMany();
  await prisma.mission.deleteMany();
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
    data: { gameId: game.id, name: "Alpha", slug: "alpha", color: "#4fc3f7" },
  });

  const bravo = await prisma.house.create({
    data: { gameId: game.id, name: "Bravo", slug: "bravo", color: "#ff5252" },
  });

  const charlie = await prisma.house.create({
    data: { gameId: game.id, name: "Charlie", slug: "charlie", color: "#69f0ae" },
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

      physicalCardId: physicalCards[0].id,
      act: 1,
      header: "CLASSIFIED: Mission Briefing",
      description: `**AGENCY ALPHA — EYES ONLY**

You have been recruited for Operation Starlight. Your mission: decode the constellation map before the signal fades.

Three fragments of the map are scattered across the room. Each fragment is held by a different agency. No single agency can solve it alone.

**Your first task:** Find the three signal cards marked with the Alpha insignia. They contain the frequencies you'll need.

*This message will not repeat.*`,
      designId: classified.id,

      isFinished: true,
      sortOrder: 1,
    },
  });
  await assignHouses(card1.id, [alpha.id]);

  // Card 2: Signals set, Alpha house, answerable + self-destruct
  const card2 = await prisma.card.create({
    data: {
      gameId: game.id,

      physicalCardId: physicalCards[1].id,
      act: 1,
      cardSetId: signalsSet.id,
      clueVisibleCategory: "Fragment",
      complexity: "complex",
      header: "Signal Fragment #1",
      description: `Intercepted transmission fragment:

\`\`\`
... the constellation that guides ...
... three stars in a line ...
... the hunter's belt ...
\`\`\`

**Identify the constellation referenced in this fragment.**`,
      clueContent: `**FRAGMENT DECODED — Signal Origin: Orion**

The transmission originates from the Orion constellation. Cross-reference this with Navigation clues to triangulate the source star system.

*Clue: The hunter's belt points the way.*`,
      designId: classified.id,
      answerTemplateType: "single_answer",
      answerId: answer1.id,
      isAnswerable: true,
      selfDestructTimer: 120,
      selfDestructText: "⚠ TRANSMISSION EXPIRED — This signal fragment has degraded beyond recovery.",
      examineText: "Decrypt Signal",


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

      physicalCardId: physicalCards[2].id,
      act: 1,
      cardSetId: signalsSet.id,
      clueVisibleCategory: "Frequency",
      header: "⚠ EMERGENCY FREQUENCY DETECTED",
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
      examineText: "Receive Broadcast",
      isFinished: true,
      sortOrder: 3,
    },
  });
  await assignHouses(card3.id, [bravo.id]);

  // Card 4: Signals set, Charlie house, info-only + self-destruct
  const card4 = await prisma.card.create({
    data: {
      gameId: game.id,

      physicalCardId: physicalCards[3].id,
      act: 1,
      cardSetId: signalsSet.id,
      clueVisibleCategory: "Transmission",
      header: "Anomalous Signal Decoded",
      description: `*Translation matrix applied. Confidence: 73%.*

> We have watched your star for many rotations. The light you call "north" is our beacon home. When the seven points align, the path opens.

> Do not seek us. We will find you when the map is complete.

*End of decoded transmission. Original signal decaying.*`,
      designId: alien.id,
      selfDestructTimer: 90,
      selfDestructText: "The alien signal has fully degraded. Only silence remains.",
      examineText: "Receive Transmission",


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

      physicalCardId: physicalCards[4].id,
      act: 1,
      cardSetId: navSet.id,
      clueVisibleCategory: "Grid-7",
      header: "Navigation Clue: The Beacon",
      description: `The old keeper said it before he vanished:

> *"When all other lights go out, there is one that remains. It stands where the land meets the sea, and it has guided every lost soul home."*

**What is the keeper describing?**`,
      designId: standard.id,
      answerTemplateType: "single_answer",
      answerId: answer3.id,
      isAnswerable: true,
      examineText: "Open Briefing",
      isFinished: true,
      sortOrder: 5,
    },
  });

  // Card 6: No set, no house, locked out
  await prisma.card.create({
    data: {
      gameId: game.id,

      physicalCardId: physicalCards[5].id,
      act: 2,
      header: "Act 2 — Restricted Access",
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

      physicalCardId: physicalCards[6].id,
      act: 1,
      cardSetId: geoSet.id,
      clueVisibleCategory: "Shape",
      complexity: "complex",
      header: "REDACTED DOCUMENT — PARTIAL RECOVERY",
      description: `The following was recovered from a damaged file:

> Project ████████ involved a shape with ████ vertices. The shape was described as having "more ██████ than a hexagon but fewer than an ████████."

> The number of vertices is ███.

**How many vertices does the shape have?**`,
      clueContent: `**DOCUMENT RECOVERED — Project HEPTAGON**

The shape is a heptagon (7 vertices). The project codename references the seven-point constellation pattern from the alien transmission.

*Clue: Seven points. Seven stars. The shape IS the map.*`,
      designId: redacted.id,
      answerTemplateType: "single_answer",
      answerId: answer4.id,
      isAnswerable: true,
      examineText: "Open File",
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

      physicalCardId: physicalCards[7].id,
      act: 1,
      cardSetId: signalsSet.id,
      header: "Decoded Coordinates",
      description: `The coordinates have been decoded:

**LAT:** 41.9028° N
**LON:** 12.4964° E

The signal originates from an ancient city.`,
      designId: classified.id,
      answerTemplateType: "single_answer",
      answerId: answer1.id,
      isAnswerable: true,
      isSolved: true,
      examineText: "Open Classified File",
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

  // === Missions ===

  // Helper to assign houses to a mission
  async function assignMissionHouses(missionId: string, houseIds: string[]) {
    for (const houseId of houseIds) {
      await prisma.missionHouse.create({ data: { missionId, houseId } });
    }
  }

  // Act 1 — Alpha missions
  const m1 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Identify the Source Star System",
      sheetLetter: "A",
      description: "Triangulate the origin of the intercepted signal using stellar cartography data. Collect Signal and Navigation clue cards to determine which star system the transmission originates from.",
      puzzleDescription: "Using the signal fragments your team has collected, cross-reference the stellar coordinates with the navigation data. You need **2 Signal clues** and **1 Navigation clue** to triangulate the origin.\n\nOnce you've identified the star system, enter its designation below.",
      requiredClueSets: [
        { cardSetId: signalsSet.id, count: 2 },
        { cardSetId: navSet.id, count: 1 },
      ],
      consequenceCompleted: "Your agency successfully identified the Kepler-442 system as the signal origin. The Science Ministry has granted your team priority access to the deep-space array for Act 2. **You will receive one bonus clue card at the start of Act 2.**",
      consequenceNotCompleted: "Without a confirmed origin point, your agency's credibility has taken a hit. The joint committee has reassigned one of your analysts to Agency Bravo. **You will have 5 available missions in Act 2 instead of 6.**",
      sortOrder: 1,
      notes: "This is the 'easy' mission for Alpha — most teams should complete this.",
    },
  });
  await assignMissionHouses(m1.id, [alpha.id]);

  const m2 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Decode the Emergency Frequency",
      sheetLetter: "B",
      description: "An automated distress signal is repeating on an unknown frequency. Find and analyze the signal pattern cards to determine the exact broadcast frequency.",
      requiredClueSets: [
        { cardSetId: signalsSet.id, count: 3 },
      ],
      consequenceCompleted: "The decoded frequency reveals a second, hidden carrier wave beneath the main signal. Your team now has access to classified intercepts that others do not. **You gain the 'Signal Intelligence' capability for Act 2.**",
      consequenceNotCompleted: "The emergency frequency continues to broadcast, unidentified. Other agencies are beginning to notice it. You've lost your head start. **No additional effect — but Bravo may have decoded it instead.**",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m2.id, [alpha.id]);

  const m2b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Recover the QRian Tools",
      sheetLetter: "C",
      description: "A stone shelf on the eastern wall holds cylindrical instruments with geometric etchings — possibly QRian measuring or carving tools. The water will reach the shelf within the hour.",
      requiredClueSets: [
        { cardSetId: geoSet.id, count: 2 },
      ],
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m2b.id, [alpha.id]);

  const m2c = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Reconstruct the Floor Mosaic",
      sheetLetter: "D",
      description: "The floor mosaic near the entrance has been deliberately damaged — someone took a chisel to it long after it was laid. The pattern beneath is partially visible.",
      requiredClueSets: [
        { cardSetId: navSet.id, count: 2 },
        { cardSetId: geoSet.id, count: 1 },
      ],
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m2c.id, [alpha.id]);

  // Act 1 — Bravo missions
  const m3 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Map the Constellation Pattern",
      sheetLetter: "E",
      description: "The alien transmission references a constellation and a specific pattern of stars. Use Geometry and Signal clue cards to reconstruct the pattern.",
      requiredClueSets: [
        { cardSetId: geoSet.id, count: 2 },
        { cardSetId: signalsSet.id, count: 1 },
      ],
      consequenceCompleted: "Your agency has mapped the seven-point constellation pattern described in the alien transmission. This gives you a critical advantage in understanding what 'the path opens' means in Act 2.",
      consequenceNotCompleted: "The constellation remains unmapped. When Act 2 introduces the star gate coordinates, your team will be working from scratch while others have a head start.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m3.id, [bravo.id]);

  // Act 1 — Charlie missions
  const m4 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Translate the Alien Message",
      description: "A decoded alien transmission has been partially translated. Collect Signal and Navigation cards to fill in the gaps and understand the full message.",
      requiredClueSets: [
        { cardSetId: signalsSet.id, count: 2 },
        { cardSetId: navSet.id, count: 1 },
      ],
      consequenceCompleted: "The full alien message reads: 'We have watched your star for many rotations. The light you call north is our beacon home. When the seven points align, the path opens. Do not seek us. We will find you when the map is complete.' Your team now knows the aliens are coming TO you — this changes everything in Act 2.",
      consequenceNotCompleted: "The partial translation leaves critical ambiguity. 'Do not seek us' could be a warning or an invitation. Your agency will enter Act 2 without knowing the aliens' intent. **Decision-making in Act 2 will be harder without this context.**",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m4.id, [charlie.id]);

  // Act 1 — Cross-house mission (Alpha + Bravo collaboration)
  const m5 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Reconstruct the Redacted File",
      description: "A classified document has been heavily redacted. Both Alpha and Bravo have pieces of the original. Combine Geometry clue cards from both agencies to reconstruct the document.",
      requiredClueSets: [
        { cardSetId: geoSet.id, count: 3 },
      ],
      consequenceCompleted: "The reconstructed document reveals Project LIGHTHOUSE — a decades-old government program that detected the alien signal years ago and suppressed it. Both agencies now have leverage over the Science Ministry. **Both houses gain 'Leverage' capability for Act 2.**",
      consequenceNotCompleted: "The redacted file remains incomplete. The government's secrets stay buried — for now. **No additional effect.**",
      sortOrder: 5,
      notes: "This is the collaborative mission — requires Alpha and Bravo to share cards.",
    },
  });
  await assignMissionHouses(m5.id, [alpha.id, bravo.id]);

  console.log("Missions:", [m1, m2, m3, m4, m5].map((m) => m.title).join(", "));

  // === Showtimes ===

  const showtime1 = await prisma.showtime.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Act 1 Convergence — Signal Triangulation",
      revealTitle: "Signal Origin Confirmed",
      revealDescription: `**Combined analysis complete.**\n\nBy triangulating the signal fragments from all three agencies, the origin point has been identified:\n\n> **Star System: Kepler-442b**\n> **Distance: 1,206 light-years**\n> **Signal Age: Approximately 12,000 years**\n\nThe signal is not a distress call. It is a *beacon*.\n\nThe coordinates embedded in the signal point to a location on Earth — coordinates that correspond to a site that has been classified since 1947.\n\n*All agencies now share this information. Act 2 begins.*`,
      designId: classified.id,
      syncWindowMs: 3000,
      sortOrder: 1,
      notes: "This is the Act 1 finale — all three houses contribute their signal data.",
    },
  });

  // Create slots for each house
  await prisma.showtimeSlot.create({
    data: {
      showtimeId: showtime1.id,
      houseId: alpha.id,
      label: "Alpha — Signal Frequency Analysis",
      description: "Enter the decoded frequency from your intercepted transmission.",
      sortOrder: 0,
    },
  });

  await prisma.showtimeSlot.create({
    data: {
      showtimeId: showtime1.id,
      houseId: bravo.id,
      label: "Bravo — Constellation Pattern Data",
      description: "Enter the constellation pattern identified from your geometric analysis.",
      sortOrder: 1,
    },
  });

  await prisma.showtimeSlot.create({
    data: {
      showtimeId: showtime1.id,
      houseId: charlie.id,
      label: "Charlie — Alien Transmission Fragment",
      description: "Enter the key phrase from the decoded alien transmission.",
      sortOrder: 2,
    },
  });

  console.log("Showtime:", showtime1.title);

  // Create a set review for "Signals" that's 1 hour old (to demo modified count)
  await prisma.setReview.create({
    data: {
      gameId: game.id,
      cardSetId: signalsSet.id,
      reviewedAt: new Date(Date.now() - 3600000),
    },
  });

  // === Story Sheets ===

  const storySheet1 = await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: alpha.id,
      act: 1,
      title: "The Lower Chamber",
      content: `The water was ankle-deep when you entered. It is now at your knees, and it is not slowing.

Your team has reached the lower chamber of the temple — the oldest section, the part the QRians sealed first. The walls here are covered floor to ceiling in carved inscriptions, dense and deliberate. Your translators are picking up signal from every direction. There is more here than you can possibly record before the water takes it.

The chamber is vast. Inscriptions cover the northern wall in an unbroken line. An alcove to the east holds a sealed compartment. The floor mosaic near the entrance has been partially destroyed. A narrow corridor descends further south, and two unfamiliar symbols sit above the main archway.

The northern wall bears the longest unbroken inscription you've seen so far — nearly eight meters of continuous carved text. It appears to be a single message, urgent in tone. But the waterline is rising fastest here. (A) If your team commits to translating it, you will need to work quickly and may not have time for much else.

Against the eastern wall, a stone shelf holds what appear to be QRian tools — cylindrical instruments with geometric etchings, possibly used for carving or measuring. The water will reach the shelf within the hour. (B) If you recover and examine them now, they may prove useful deeper in the temple — or they may be nothing.

The floor mosaic near the entrance has been deliberately damaged — someone took a chisel to it long after it was laid. The pattern beneath is partially visible, and your translator flickers when pointed at it, as though trying and failing to read something. (C) Reconstructing what was destroyed here could reveal what someone wanted erased — but it will take time and focus.

Your team can hear the Drake Delegation working in a chamber to the south — close enough to communicate, but their entrance is on the other side. There is a partially submerged passageway between your chambers, still navigable if someone goes now. (D) Sending a member through could allow you to glimpse what Drake has found — or to propose an exchange — but you will be down one person for the duration of the act, and the passage may not stay open as the water rises.

A narrow corridor descends further south, deeper than your team expected the temple to go. The water is flowing from this direction. The inscriptions along its walls are shorter, more frantic, and carved by different hands than the rest of the chamber. (E) Following it means walking toward the source of the flooding — but whatever was written down there was written in a hurry, by people who may have been the last to leave.

Your team has time to attempt some of these before the water forces you upward. Choose carefully — what you leave behind will be sealed.`,
    },
  });

  console.log("Story Sheet:", storySheet1.title);

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
    const houses = card.cardHouses.map((ch: any) => ch.house.name).join("+") || "—";
    const set = card.cardSet?.name ?? "—";
    const pc = physicalCards.find((p) => p.id === card.physicalCardId);
    const pcLabel = pc ? `${pc.color[0].toUpperCase()}${pc.number} ${pc.name}` : card.physicalCardId.slice(0, 8);
    console.log(`  ${pcLabel}: ${card.id}  [${set} | ${houses}]`);
    console.log(`    → http://localhost:5173/c/${card.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
