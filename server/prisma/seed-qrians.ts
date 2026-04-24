/**
 * seed-qrians.ts — "Temple of the QRians"
 *
 * Playtest game: three expedition teams explore a sealed QRian temple.
 * Three acts: The Flood, The Corruption, The Dying Light.
 *
 * Run:   npx tsx server/prisma/seed-qrians.ts
 *
 * Idempotent: deletes any existing "Temple of the QRians" game first.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME_NAME = "Temple of the QRians";

// ─── Helpers ────────────────────────────────────────────────────────

async function cleanExistingGame() {
  const existing = await prisma.game.findFirst({
    where: { name: GAME_NAME },
  });
  if (!existing) return;
  const gid = existing.id;

  await prisma.triggeredConsequence.deleteMany({ where: { gameId: gid } });
  await prisma.missionConsequence.deleteMany({
    where: { sourceMission: { gameId: gid } },
  });
  await prisma.missionAnswerAttempt.deleteMany({ where: { gameId: gid } });
  await prisma.missionScanEvent.deleteMany({ where: { gameId: gid } });
  await prisma.storySheet.deleteMany({ where: { gameId: gid } });
  await prisma.showtimeSlot.deleteMany({
    where: { showtime: { gameId: gid } },
  });
  await prisma.showtime.deleteMany({ where: { gameId: gid } });
  await prisma.missionHouse.deleteMany({
    where: { mission: { gameId: gid } },
  });
  await prisma.mission.deleteMany({ where: { gameId: gid } });
  await prisma.cardHouse.deleteMany({ where: { card: { gameId: gid } } });
  await prisma.setReview.deleteMany({ where: { gameId: gid } });
  await prisma.answerAttempt.deleteMany({ where: { gameId: gid } });
  await prisma.scanEvent.deleteMany({ where: { gameId: gid } });
  await prisma.card.deleteMany({ where: { gameId: gid } });
  await prisma.singleAnswer.deleteMany({ where: { gameId: gid } });
  await prisma.design.deleteMany({ where: { gameId: gid } });
  await prisma.cardSet.deleteMany({ where: { gameId: gid } });
  await prisma.house.deleteMany({ where: { gameId: gid } });
  await prisma.game.delete({ where: { id: gid } });
}

async function assignMissionHouses(missionId: string, houseIds: string[]) {
  for (const houseId of houseIds) {
    await prisma.missionHouse.create({ data: { missionId, houseId } });
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("Cleaning existing game...");
  await cleanExistingGame();

  // ═══════════════════════════════════════════════════════════════════
  // GAME
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating game...");
  const game = await prisma.game.create({
    data: {
      name: GAME_NAME,
      description:
        "Three expedition teams enter a sealed temple built by the QRians — a civilization that fused mathematics and religion. The temple was sealed centuries ago with warnings carved into every surface. Three acts: The Flood, The Corruption, The Dying Light.",
      status: "draft",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // HOUSES
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating houses...");
  const drake = await prisma.house.create({
    data: { gameId: game.id, name: "Drake Delegation", color: "#dc2626" },
  });
  const jones = await prisma.house.create({
    data: { gameId: game.id, name: "Jones Junket", color: "#ca8a04" },
  });
  const croft = await prisma.house.create({
    data: { gameId: game.id, name: "Croft Company", color: "#7c3aed" },
  });

  // ═══════════════════════════════════════════════════════════════════
  // CARD SETS (clue categories)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating card sets...");

  // Drake
  const csMechanicalPart = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Small Mechanical Part", color: "#6b7280" },
  });
  const csInscribedStone = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Inscribed Chunk of Stone", color: "#92400e" },
  });
  const csPaintedDisc = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Strange Painted Disc", color: "#0d9488" },
  });
  const csMetalFragment = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Inscribed Metal Fragment", color: "#4b5563" },
  });
  const csDampPage = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Mysterious Damp Page", color: "#a16207" },
  });

  // Jones
  const csClayTablet = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Coded Clay Tablet", color: "#c2410c" },
  });
  const csCeramicTile = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Grooved Ceramic Tile", color: "#b45309" },
  });
  const csStoneVessel = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Sealed Stone Vessel", color: "#475569" },
  });
  const csSlate = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Flat Inscribed Slate", color: "#64748b" },
  });
  const csStoneMarker = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Worn Stone Marker", color: "#a8a29e" },
  });

  // Croft
  const csSteelHardware = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Unmarked Steel Hardware", color: "#374151" },
  });
  const csEdgeBlock = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Odd Edge-Marked Block", color: "#57534e" },
  });
  const csMetalSpoke = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Inscribed Metal Spoke", color: "#b45309" },
  });
  const csBoneToken = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Numbered Bone Token", color: "#d6d3d1" },
  });
  const csPotteryShard = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Ancient Pottery Shard", color: "#9a3412" },
  });

  // ═══════════════════════════════════════════════════════════════════
  // ANSWERS (Act 1 — all 15 missions)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating answers...");

  // Drake
  const ansFuseCharges = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "1345672",
      acceptAlternatives: ["1 3 4 5 6 7 2", "1-3-4-5-6-7-2"],
      hint: "Each component's description tells you when it goes in. What seats into the base first? What goes on last?",
      hintAfterAttempts: 2,
    },
  });

  const ansStoneWheel = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "purge",
      acceptAlternatives: ["purge the floor", "PURGE", "PURGE THE FLOOR"],
      hint: "Ignore the dividers between glyph groups. Read all the letters as one continuous string, then find where the real words begin and end. The answer is the command verb.",
      hintAfterAttempts: 2,
    },
  });

  const ansAstrolabe = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "blue green pink brown silver",
      acceptAlternatives: [
        "blue,green,pink,brown,silver",
        "blue green pink brown grey",
        "blue green pink brown gray",
        "light blue green pink brown silver",
      ],
      hint: "Each sequence represents something real that changes color over time. The clue word tells you what it is.",
      hintAfterAttempts: 2,
    },
  });

  const ansHoist = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "527394861",
      acceptAlternatives: ["5 2 7 3 9 4 8 6 1", "5-2-7-3-9-4-8-6-1"],
      hint: "The nine words form a single sentence — a message from the builders. Start with who's speaking.",
      hintAfterAttempts: 2,
    },
  });

  const ansScrapedGap = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "descent",
      acceptAlternatives: ["DESCENT"],
      hint: "The seven letters form a single English word. Think about what the journal describes — what the temple forces on everyone who enters.",
      hintAfterAttempts: 2,
    },
  });

  // Jones
  const ansWhips = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "time",
      acceptAlternatives: ["TIME", "age", "AGE"],
      hint: "The inscription is a riddle. What wears stone away over centuries?",
      hintAfterAttempts: 2,
    },
  });

  const ansDrainage = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "12436",
      acceptAlternatives: [
        "1 2 4 3 6",
        "V1 V2 V4 V3 V6",
        "v1 v2 v4 v3 v6",
        "1,2,4,3,6",
      ],
      hint: "The water must pass through every section. There's only one path that does. Trace it from SOURCE to DRAIN, noting each valve — except the broken one.",
      hintAfterAttempts: 2,
    },
  });

  const ansOfferings = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "school",
      acceptAlternatives: ["SCHOOL", "a school", "the school"],
      hint: "Don't focus on the scenes carved on the outside of the vessels. Focus on what's INSIDE them. What color would each of those substances actually be?",
      hintAfterAttempts: 2,
    },
  });

  const ansPanels = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "489627153",
      acceptAlternatives: ["4 8 9 6 2 7 1 5 3", "4-8-9-6-2-7-1-5-3"],
      hint: "The nine words form a single sentence — a warning about what happened to those who lingered here. Start with who's being described.",
      hintAfterAttempts: 2,
    },
  });

  const ansFalseExit = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "3715624",
      acceptAlternatives: ["3 7 1 5 6 2 4", "3-7-1-5-6-2-4"],
      hint: "Follow the journey from hope to dread. The passage starts climbing and ends... where? Pay attention to left vs. right.",
      hintAfterAttempts: 2,
    },
  });

  // Croft
  const ansRigs = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "5371642",
      acceptAlternatives: ["5 3 7 1 6 4 2", "5-3-7-1-6-4-2"],
      hint: "Each component tells you what it depends on. What goes into bare rock first? What's the last thing on the line?",
      hintAfterAttempts: 2,
    },
  });

  const ansJigsaw = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "stone",
      acceptAlternatives: ["STONE"],
      hint: "Match the edge symbols — each tile's right symbol must match the next tile's left symbol. Start with the tile whose left edge has no match.",
      hintAfterAttempts: 2,
    },
  });

  const ansVase = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "638517492",
      acceptAlternatives: ["6 3 8 5 1 7 4 9 2", "6-3-8-5-1-7-4-9-2"],
      hint: "The nine words form a single sentence — the QRians left a warning for anyone who enters. Start with who's being addressed.",
      hintAfterAttempts: 2,
    },
  });

  const ansTeaching = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "13 23 38",
      acceptAlternatives: ["13, 23, 38", "132338", "13,23,38"],
      hint: "Try doubling each inner number. The outer is always a bit more than double — but by how much? Does the extra amount relate to where the pair sits on the disc?",
      hintAfterAttempts: 2,
    },
  });

  const ansDragMarks = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "tell my child i loved them still",
      acceptAlternatives: [
        "TELL MY CHILD I LOVED THEM STILL",
        "tell my child i loved them",
      ],
      hint: "Start with the first two words — they tell you who this message is for.",
      hintAfterAttempts: 2,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACT 1 MISSIONS — DRAKE DELEGATION
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 missions — Drake...");

  const m_drake_crew = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Secure the Fuse Charges",
      sheetLetter: "A",
      description:
        "Your precision explosives are dead weight without the fuse charges, and the components are scattered across the chamber — small metal parts that look like strange precision instruments to anyone who doesn't know what they assemble into. The assembly manual went under with the bag. You'll have to reconstruct the sequence from memory.",
      puzzleDescription:
        "Seven components need to be assembled in the correct order. Each component's description hints at its position in the sequence. Enter the component numbers in assembly order.\n\n| # | Component | Description |\n|---|-----------|-------------|\n| 1 | Whisper Pins | \"Delicate. These seat into the base before anything else.\" |\n| 2 | Ghost Shells | \"The outer housing. Nothing goes on after these.\" |\n| 3 | Dragon Teeth | \"The heavy cores. They nest right on top of the pins.\" |\n| 4 | Ember Dust | \"Volatile. Packed between the cores and the plates. Don't sneeze.\" |\n| 5 | Striker Plates | \"Press flat against the dust layer. Takes the initial impact.\" |\n| 6 | Fang Clips | \"Lock the plates in place. Snaps onto the strikers before you seal.\" |\n| 7 | Coil Segments | \"The ignition thread. Winds through the clips and connects to the shell trigger.\" |",
      requiredClueSets: [{ cardSetId: csMechanicalPart.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansFuseCharges.id,
      consequenceCompleted:
        "The charges are assembled and secured. The team moves with a little more swagger — you're the only crew in this temple with a real ace up your sleeve. Whatever's ahead, you can blow through it. Literally.",
      consequenceNotCompleted:
        "The components are scattered, some lost to the water, some in the hands of teams who think they're holding QRian trinkets. Your precision explosives are gone. Drake without firepower is just... people in balaclavas. Morale takes a serious hit...",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_drake_crew.id, [drake.id]);

  const m_drake_flood = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Operate the Stone Wheel",
      sheetLetter: "B",
      description:
        "Set into the far wall — a heavy stone wheel, seized with age. Channels radiate from it across the floor. Your tactical eyes read it immediately: this controls the water flow. Five QRian glyphs are carved into the wheel's face — the unlock command.",
      puzzleDescription:
        "The wheel's face shows 6 groups of glyphs separated by carved dividers:\n\n{{{PUR}}} | {{{GET}}} | {{{HE}}} | {{{F}}} | {{{LO}}} | {{{OR}}}\n\nUse your Inscribed Chunks of Stone to decode each glyph group into letters. The groups may not align with word boundaries — read all the letters as one continuous string to find the hidden command.\n\nEnter the command verb.",
      requiredClueSets: [{ cardSetId: csInscribedStone.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansStoneWheel.id,
      consequenceCompleted:
        "Drake is exonerated. The flood is by design — and now everyone knows it. The other teams owe you an apology. They won't give you one.",
      consequenceNotCompleted:
        "The water surge compromised your remaining precision explosives. You'll need to find another way to clear sealed passages in the chambers above.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_drake_flood.id, [drake.id]);

  const m_drake_t1 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Reach the Shadow Astrolabe",
      sheetLetter: "C",
      description:
        "At the center of the chamber — a stone table, and on it, a thick glass dome. Through the glass: a strange contraption with golden concentric rings, nested inside each other, etched with markings so fine they shimmer. Sealed under glass you cannot safely break without possibly destroying the object. The base has five empty slots, each with a dial of colors — a combination lock.",
      puzzleDescription:
        "Five ceramic discs with painted color markings are needed to unlock the dome. Each disc shows a color sequence with one color missing, and a single clue word etched beneath. Each sequence represents something real that changes color. Figure out what each sequence represents, determine the missing color, and enter all five in disc order.\n\n| Disc | Sequence | Clue |\n|------|----------|------|\n| 1 | Black → Indigo → Orange → **?** → Orange → Indigo → Black | *Up* |\n| 2 | **?** → Yellow → Brown → Black | *Curved* |\n| 3 | Red → **?** → Brown | *Rare* |\n| 4 | Green → Yellow → Orange → Red → **?** | *Harvest* |\n| 5 | **?** → Red → Orange → Yellow | *Forge* |\n\nEnter the five missing colors separated by spaces.",
      requiredClueSets: [{ cardSetId: csPaintedDisc.id, count: 5 }],
      answerTemplateType: "single_answer",
      answerId: ansAstrolabe.id,
      consequenceCompleted:
        "The team moves differently now. You've got the map — the only map — and you know something the other teams don't: this temple was built to trap anyone who entered. But Drake doesn't panic about being trapped. Drake plans around it. The astrolabe gets stowed carefully. The other teams have no idea you have it.",
      consequenceNotCompleted:
        "The dome sits there, sealed, the golden rings shimmering under glass as the floodwater creeps across the table's base. You had the keys. You just couldn't read them. Drake always said, 'If you feel like a failure, it's because you are one.'",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_drake_t1.id, [drake.id]);

  const m_drake_t2 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Activate the Construction Hoist",
      sheetLetter: "D",
      description:
        "Directly overhead, near the center of the chamber — thick iron chains hang from the dark above, taut and corroded green, dropping to a stone slab pulled tight against the floor. Nine positions on the chains and pulleys are marked with QRian glyphs — clearly an activation sequence.",
      puzzleDescription:
        "Corroded chain links and pulley pieces found around the chamber each have a translated QRian word. Write each word on an index card and rearrange until the sentence forms. Enter the position numbers in sentence order.\n\n| Position | Word |\n|----------|------|\n| 1 | LEAVE |\n| 2 | WHO |\n| 3 | THIS |\n| 4 | NEVER |\n| 5 | WE |\n| 6 | THEM |\n| 7 | BUILT |\n| 8 | LET |\n| 9 | WILL |",
      requiredClueSets: [{ cardSetId: csMetalFragment.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansHoist.id,
      consequenceCompleted:
        "'We who built this will never let them leave.' The builders knew. Thousands of them, working at speed, knowing the purpose. The other teams see a temple. Drake sees a prison built at industrial speed — and prisons have weak points.",
      consequenceNotCompleted:
        "The hoist sits seized, the slab pulled tight. Whatever the QRians hid underneath stays buried. Drake without answers is just people in balaclavas staring at chains.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_drake_t2.id, [drake.id]);

  const m_drake_t3 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Investigate the Scraped Gap",
      sheetLetter: "E",
      description:
        "Along the back wall, half-hidden behind a collapsed pillar — a dark crack in the stone scored with bright metal scratches. A faint breeze from inside that smells like old dust and old fear.",
      puzzleDescription:
        "Inside the gap: a previous expedition's camp. A locked trunk with a note pinned to the lid:\n\n*\"If you find this, the lock code is hidden in my journal. Take the character at each position. You'll need to unscramble the letters. 1:12, 2:19, 3:25, 4:12, 5:28, 6:19, 7:8. Count every character — letters, spaces, punctuation.\"*\n\n| Entry | Text |\n|-------|------|\n| 1 (Day 1) | \"We found the entrance today. Discovery of a lifetime.\" |\n| 2 (Day 3) | \"Architecture beyond anything in the textbooks.\" |\n| 3 (Day 5) | \"Found a camp from decades ago. No skeletons.\" |\n| 4 (Day 7) | \"Their log echoes ours. Panic sets in.\" |\n| 5 (Day 9) | \"Every route slopes down. None lead up.\" |\n| 6 (Day 11) | \"Compass spins. Water from walls we never passed.\" |\n| 7 (undated) | \"Every staircase descends. We cannot find a path up.\" |\n\nExtract the characters, unscramble, and enter the word.",
      requiredClueSets: [{ cardSetId: csDampPage.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansScrapedGap.id,
      consequenceCompleted:
        "Those people mapped every route that doesn't work. That's intelligence. Drake uses intelligence. The fear becomes fuel.",
      consequenceNotCompleted:
        "The crack in the wall stays dark. Whatever happened to whoever left those scratches — you'll never know.",
      sortOrder: 5,
    },
  });
  await assignMissionHouses(m_drake_t3.id, [drake.id]);

  // ═══════════════════════════════════════════════════════════════════
  // ACT 1 MISSIONS — JONES JUNKET
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 missions — Jones...");

  const m_jones_crew = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Retrieve the Ceremonial Whips",
      sheetLetter: "A",
      description:
        "In the rush through the hidden passage, the ceremonial whips were left behind — and the floodwater is swallowing the way back. The passage branches into several half-submerged corridors, each with a QRian word carved above its entrance. A longer inscription on the nearby wall appears to describe the correct route.",
      puzzleDescription:
        "The corridor entrances are labeled with QRian glyphs:\n\n{{{STONE}}}   {{{SILENCE}}}   {{{ANCIENT}}}   {{{OCEAN}}}   {{{TIME}}}\n\nA wall inscription reads:\n\n{{{IT EATS ALL STONE NONE CAN SEE IT}}}\n\nUse your Coded Clay Tablets to decode the glyph-to-letter mappings. The inscription is a riddle — solve it, and the answer matches one of the corridor labels.\n\nEnter the corridor name.",
      requiredClueSets: [{ cardSetId: csClayTablet.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansWhips.id,
      consequenceCompleted:
        "The whips are secured and the team is buzzing — not because of what you retrieved, but because of how you retrieved it. You read the wall. You actually read it. The other houses are navigating this temple with torches and guesswork. You're navigating it with the language of the people who built it. Every inscription from here on isn't decoration — it's a signpost, and you're the only ones who can follow it.",
      consequenceNotCompleted:
        "The glyph riddle is still on the wall and the corridors are still half-submerged, but the water isn't waiting. Somewhere down one of those passages, the ceremonial whips sit on a dry shelf that won't be dry much longer. Dr. Jones trusted you to carry the whips, and the whips are the thing that made this feel like a Jones expedition instead of a university field trip that got out of hand. The deeper chambers will have more words. Harder ones.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_jones_crew.id, [jones.id]);

  const m_jones_flood = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Activate the Ancient Drainage",
      sheetLetter: "B",
      description:
        "Along the lower walls, half-obscured by mineral deposits — a 3×3 grid of carved pipe sections, clearly an engineered drainage network. The source and drain are visible but seven connecting sections are missing — ceramic tiles with grooves carved into them, scattered across the floor.",
      puzzleDescription:
        "A 3×3 pipe grid. SOURCE (top-left, opens Right) and DRAIN (bottom-right, opens Left) are fixed. Place 7 pipe tiles so water flows through ALL 9 sections in one continuous path.\n\nEach tile has specific openings (Left, Right, Top, Bottom). One valve is marked SABOTAGED — it's part of the path but broken.\n\n| Tile | Openings | Valve |\n|------|----------|-------|\n| Straight | L, R | V1 |\n| Elbow | L, B | V2 |\n| T-junction | L, R, T | V3 |\n| Elbow | T, L | V4 |\n| Elbow | R, B | V5 (SABOTAGED) |\n| Elbow | T, R | V6 |\n| Straight | L, R | (no valve) |\n\nEnter the valve numbers in flow order, skipping the sabotaged one.",
      requiredClueSets: [{ cardSetId: csCeramicTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansDrainage.id,
      consequenceCompleted:
        "The drainage holds. The inscriptions in the upper chambers survive the flood. You can't fix what the QRians broke — but you saved what matters.",
      consequenceNotCompleted:
        "The upper chamber inscriptions were partially washed away. Key context is missing. Whatever those walls said, the flood took it.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_jones_flood.id, [jones.id]);

  const m_jones_t1 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Sort the Scattered Offerings",
      sheetLetter: "C",
      description:
        "High on the far wall, where the torchlight barely reaches, three deep alcoves are carved into the stone in a row. Each alcove's inner surface is stained a different color from centuries of use — the left one deep blue, the center one amber-gold, the right one dark green. Below them, six small stone vessels lie scattered across the floor, clearly knocked from the alcoves by the flood. Each vessel has a letter carved into its underside.",
      puzzleDescription:
        "Three alcoves are stained from centuries of use:\n\n- **Left alcove:** stained deep BLUE\n- **Center alcove:** stained AMBER-GOLD\n- **Right alcove:** stained DARK GREEN\n\nSix numbered vessels lie below. Each has an interior residue and a letter carved underneath. Match each vessel to its alcove by determining the connection between its residue and the alcove's stain. Then read the letters in order: left alcove to right, lower-numbered vessel first within each pair.\n\n| # | Interior Residue | Letter |\n|---|-----------------|--------|\n| 1 | Fine powder — unmistakably lapis lazuli, ground to dust | S |\n| 2 | Thick, glassy resin — hardened tree sap, amber-colored where the light catches it | H |\n| 3 | Chalky dust with a bright metallic sheen — crushed malachite | O |\n| 4 | A thin green-blue patina — verdigris, the residue left when copper corrodes | L |\n| 5 | Crystallized residue, translucent and faintly sweet — ancient honey, hardened to glass | O |\n| 6 | Ground mineral powder with a deep, vivid sheen — cobalt ore | C |\n\nThe letters will reveal what this place truly was.",
      requiredClueSets: [{ cardSetId: csStoneVessel.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansOfferings.id,
      consequenceCompleted:
        "The vessels are placed correctly and the word hangs in the air like a held breath. SCHOOL. Dr. Jones spent thirty years calling this a temple. His students just proved it was a university. Nobody says \"career-defining discovery\" out loud, but everyone is thinking it. The other teams are exploring a temple. You're standing in a lecture hall.",
      consequenceNotCompleted:
        "The six vessels sit on the floor, unsorted, their residues slowly flaking away in the damp air. Whatever those alcoves were trying to tell you, the message goes unread. The other teams are moving faster now, and your scholarly advantage — the thing that makes Jones different from people who just break down walls — didn't deliver when it mattered. Dr. Jones's first expedition, and the reading went wrong.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_jones_t1.id, [jones.id]);

  const m_jones_t2 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Examine the Sliding Panels",
      sheetLetter: "D",
      description:
        "Peering straight across the haze of the chamber — small flat rocks, so precisely placed and stacked on one another that they form a grid in the wall. They can clearly be slid around. But several are missing — smooth slates with QRian symbols etched into them, dislodged and scattered across the chamber floor. At the grid's center: a dark, hand-shaped hollow, worn silk-smooth by what must have been hundreds of palms pressed into it over centuries.",
      puzzleDescription:
        "Nine flat inscribed slates form a wall grid. Each has a translated QRian word. Write each word on an index card and rearrange until the sentence forms. Enter the slate numbers in sentence order.\n\n| Slate | Word |\n|-------|------|\n| 1 | SEALED |\n| 2 | TOO |\n| 3 | FOREVER |\n| 4 | THOSE |\n| 5 | AWAY |\n| 6 | LONG |\n| 7 | WERE |\n| 8 | WHO |\n| 9 | STAYED |",
      requiredClueSets: [{ cardSetId: csSlate.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansPanels.id,
      consequenceCompleted:
        "You opened something the QRians wanted kept shut. The team is rattled — but also electrified. Whatever this temple was built to contain, you're getting closer to understanding it. Dr. Jones never mentioned anything like this in his lectures. You all feel like you are going to be historical legends, right when your careers start.",
      consequenceNotCompleted:
        "The panels sit there, immovable, mocking. The hand-shaped hollow stares back at you — worn smooth by centuries of palms that knew the answer. Yours wasn't one of them. Dr. Jones would have had this in minutes. The team tries not to say that out loud, but everyone's thinking it. Morale takes a massive hit...",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_jones_t2.id, [jones.id]);

  const m_jones_t3 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Map the False Exit",
      sheetLetter: "E",
      description:
        "Something was odd when you first entered the chamber, and now you realize what. Off to the left, beyond a low archway — a corridor that tilts *up*. After a temple where everything descends, an upward slope feels like sunlight. But three months of schematics trained you to map before you move.",
      puzzleDescription:
        "Seven carved waymarkers once lined the corridor walls. Arrange them in the order you'd encounter them walking through the passage.\n\n| # | Description |\n|---|-------------|\n| 1 | \"The slope levels off. A draft from above. On the ceiling, a crack admits a thin shaft of light. The passage continues straight.\" |\n| 2 | \"Past the carvings, the downward slope steepens. The air grows warmer. A carved sun on the right wall — identical to one seen before, but on the wrong side.\" |\n| 3 | \"The archway opens into a passage that slopes gently upward. The air grows warmer. On the left wall, a carved sun — the first hopeful symbol in this place.\" |\n| 4 | \"The slope levels off. The passage opens into a chamber. Your lamplight reveals familiar shapes — your own equipment, your own markings. You have not climbed. You have descended.\" |\n| 5 | \"A right turn. The shaft of light falls behind. The passage begins to slope downward. The walls are bare stone.\" |\n| 6 | \"The passage turns sharply right. After the bare stone, angular glyphs reappear — and they are the same. You are seeing the backs of the same carvings.\" |\n| 7 | \"The passage turns sharply left. The carved sun is gone, replaced by repeating angular glyphs. The upward slope continues.\" |\n\nEnter the marker numbers in traversal order.",
      requiredClueSets: [{ cardSetId: csStoneMarker.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansFalseExit.id,
      consequenceCompleted:
        "Nobody speaks for a while. The corridor map sits on the table like a confession. You found the way up — and it goes down. The QRians built this for people who think like you. That changes everything about how you move through this temple.",
      consequenceNotCompleted:
        "The waymarkers sit scattered on the table, unsorted. Somewhere behind that archway, a corridor tilts upward into the dark. It looks like hope. You couldn't prove whether it is.",
      sortOrder: 5,
    },
  });
  await assignMissionHouses(m_jones_t3.id, [jones.id]);

  // ═══════════════════════════════════════════════════════════════════
  // ACT 1 MISSIONS — CROFT COMPANY
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 missions — Croft...");

  const m_croft_crew = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Recover the Grappling Rigs",
      sheetLetter: "A",
      description:
        "Your signature grappling rigs — high-tension cable, Croft-issue hooks, the works — are stashed on the ledge where you climbed in, eight feet up. The floodwater is rising toward them. There's a dry alcove higher up the wall, well above the waterline — if you can rig a haul route, the gear is safe.",
      puzzleDescription:
        "Seven route-setting kit components need to be assembled in the correct rigging sequence. Each component's description hints at when it's needed. Enter the item numbers in assembly order.\n\n| # | Component | Description |\n|---|-----------|-------------|\n| 1 | Rope Clamps | \"Toothed grips. Bite the rope going up, lock tight coming down.\" |\n| 2 | Cargo Hook | \"Heavy clip. The last thing on the line. Gear bags attach here.\" |\n| 3 | Anchor Plate | \"Flat bracket. Bolts flush to the starting anchor for a tie-off point.\" |\n| 4 | Haul Pulley | \"Wheeled block. Mounts at the top to run the haul line through.\" |\n| 5 | Wall Studs | \"Threaded steel bolts. First into bare rock. Nothing holds without them.\" |\n| 6 | Top Bolts | \"Expansion bolts for the alcove. Useless until someone climbs up.\" |\n| 7 | Fixed Line | \"Stiff rope. Ties off at the base, hangs the full height.\" |",
      requiredClueSets: [{ cardSetId: csSteelHardware.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansRigs.id,
      consequenceCompleted:
        "The grappling rigs ride on your strongest backs, and nobody complains. You set a route up a wall in a flooding temple with scattered kit and no safety net — and it held. Lara would have done it faster. But she'd have done it the same way. The other teams watched you work. They don't have cable. They don't have hooks. Whatever's above you in this temple, you can reach it. That's not confidence — that's equipment.",
      consequenceNotCompleted:
        "The water took the entry ledge, and everything on it. Cable, hooks, launcher — all of it sitting under dark water that's still rising. You had the kit. You had the training. You just couldn't get it rigged in time. Croft Company without grappling gear is a climbing team with nothing to climb with. When this temple pushes everyone upward — and it will — the other houses will improvise. You'll just... look up.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_croft_crew.id, [croft.id]);

  const m_croft_flood = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Solve the Stone Jigsaw",
      sheetLetter: "B",
      description:
        "Water pours through a crack in the far wall where a sealed passage gave way. Scattered across the floor — odd blocks with symbols marked along their edges and a letter on each face. They're clearly meant to fit together somehow.",
      puzzleDescription:
        "Five flat stone fragments originally sealed the passage. Each has a symbol on its left edge, a different symbol on its right edge, and a letter on its face. Adjacent fragments must have matching edge symbols. Assemble them in a line and read the letters.\n\n| Tile | Left Edge | Right Edge | Letter |\n|------|-----------|------------|--------|\n| 1 | ☆ | ● | S |\n| 2 | ● | ▲ | T |\n| 3 | ▲ | ◆ | O |\n| 4 | ◆ | ◗ | N |\n| 5 | ◗ | ♦ | E |\n\nEnter the word the letters spell.",
      requiredClueSets: [{ cardSetId: csEdgeBlock.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansJigsaw.id,
      consequenceCompleted:
        "The passage holds. Whatever route Croft planned through here stays open. And the blueprint on the stones — that's worth studying later.",
      consequenceNotCompleted:
        "The passage is impassable. You'll have to route around, losing time.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_croft_flood.id, [croft.id]);

  const m_croft_t1 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Reach the Impossible Vase",
      sheetLetter: "C",
      description:
        "Far off to the left, right at the fuzzy edge of the shadows — atop a ledge fifteen feet above the floor, a vibrantly red, sparkling porcelain vase. It catches the torchlight in flashes — impossibly intact and clean after all these years. Nothing survives centuries in a sealed chamber looking like it was fired yesterday.",
      puzzleDescription:
        "Nine metal spokes with inscriptions can be driven into the wall as climbing footholds. The QRians designed them to be placed in a specific order — top to bottom, they read a sentence. Write each spoke's word on an index card and rearrange until the sentence forms. Enter the spoke numbers in sentence order.\n\n| Spoke | Word |\n|-------|------|\n| 1 | FIND |\n| 2 | EVER |\n| 3 | WHO |\n| 4 | WAY |\n| 5 | WILL |\n| 6 | THOSE |\n| 7 | NO |\n| 8 | ENTER |\n| 9 | OUT |",
      requiredClueSets: [{ cardSetId: csMetalSpoke.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansVase.id,
      consequenceCompleted:
        "The climb was clean. The team moved like one body — boost, grip, pull. Lara would have been proud. And what you're holding is worth more than the whole expedition budget — a material that shouldn't exist, in a temple that shouldn't be here. Confidence is high, and you all guard it jealously.",
      consequenceNotCompleted:
        "Fifteen feet. You couldn't make fifteen feet. And now the floodwater has slowly swallowed the base of the wall, making a second attempt impossible. That vase will sit on that ledge for another few centuries. Every other team probably saw you try. What would Lara say? Morale takes a serious hit, and you all wonder how you'll fare with the next chambers to come...",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_croft_t1.id, [croft.id]);

  const m_croft_t2 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Activate the Teaching Stone",
      sheetLetter: "D",
      description:
        "In the dead center of the chamber — a wide stone disc on a pedestal, pale and luminous. Two concentric rings of number slots scored into its face — some filled, some empty. Small bone tokens with numbers carved into them lie scattered near the base — palm-sized, smooth, clearly meant to fit into the disc's slots.",
      puzzleDescription:
        "The disc has 8 positions, each with an inner ring slot and an outer ring slot. 5 positions are complete. 3 are missing — your Numbered Bone Tokens provide the missing inner values. Discover the pattern in the inner ring, then find the rule that transforms inner values to outer values.\n\n| Position | Inner | Outer |\n|----------|-------|-------|\n| 1 | 1 | 3 |\n| 2 | 3 | 8 |\n| 3 | **?** | **?** |\n| 4 | 7 | 18 |\n| 5 | **?** | **?** |\n| 6 | 11 | 28 |\n| 7 | 13 | 33 |\n| 8 | **?** | **?** |\n\nYour bone tokens provide the missing inner values: **5**, **9**, and **15**.\n\nCalculate the three missing outer values and enter them separated by spaces.",
      requiredClueSets: [{ cardSetId: csBoneToken.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansTeaching.id,
      consequenceCompleted:
        "The teaching machine works. The QRians worshipped mathematics with carved stone. Every equation was a prayer, every proof a hymn. Lara would have recognized this instantly.",
      consequenceNotCompleted:
        "The disc sits incomplete, its lesson unlearned. Whatever the QRians carved into this machine, the classroom stays closed.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_croft_t2.id, [croft.id]);

  const m_croft_t3 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Follow the Drag Marks",
      sheetLetter: "E",
      description:
        "Against the near wall, low and easy to miss — a squat doorway set into stone rougher than the rest, as if finished in a hurry. Beyond it, darkness. On the floor, deep parallel grooves gouged into stone, wide as a body, dragging inward.",
      puzzleDescription:
        "Inside the sealed chamber: remains, tools, and a personal inscription scratched into the wall in QRian glyphs. Use your Ancient Pottery Shards — each has glyph-to-letter pairings etched by the builders as teaching aids — to decode the inscription.\n\nThe wall inscription:\n\n{{{TELL MY CHILD I LOVED THEM STILL}}}\n\nEnter the decoded message.",
      requiredClueSets: [{ cardSetId: csPotteryShard.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansDragMarks.id,
      consequenceCompleted:
        "The chamber goes quiet. Drake found the builders' defiant inscription — 'we who built this will never let them leave.' You found what one of them actually wanted to say.",
      consequenceNotCompleted:
        "The glyphs stay scratched in the wall, unread. Someone's last message, carved in the dark. Whatever they wanted the world to know dies with them again.",
      sortOrder: 5,
    },
  });
  await assignMissionHouses(m_croft_t3.id, [croft.id]);

  // ═══════════════════════════════════════════════════════════════════
  // STORY SHEETS (Act 1)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating story sheets...");

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: drake.id,
      act: 1,
      title: "Drake Delegation — Act 1: The Flood",
      content: `You are the Drake Delegation — relic hunters by trade, mercenaries by reputation. Your outfit has built a career recovering the priceless knowledge of ancient civilizations, by any means necessary. But your last string of jobs has ended in failure, and the funds are running dry. This temple — recently discovered, untouched, the biggest find in years — is the job that saves the outfit. Or buries it.

You had no time for pleasantries. You blasted your way in with dynamite. Maybe it caused this flood. Doesn't matter now. Got a job to do. Across the chamber, a group with whips and pencils behind their ears is already crouched over inscriptions — the Jones Junket. Near the far wall, a crew in jorts and immaculate hair is prying at the stone — the Croft Company. You didn't expect them. That changes nothing.

The water is rising. You have what you have. Move.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: jones.id,
      act: 1,
      title: "Jones Junket — Act 1: The Flood",
      content: `You are the Jones Junket — scholars, disciples, and lifelong devotees of the legendary Indiana Jones. You have spent years at his seminars, absorbing every word, preparing for this very moment: your maiden expedition. Three months of painstaking schematic analysis revealed a secret entrance into the temple's lower level. Three months! And worth every second.

If you succeed here, the great Indiana Jones will finally retire, and your careers begin. No pressure.

You entered through the hidden passage to find you are not alone. Across the chamber, a crew in tactical gear and balaclavas is inspecting the walls near a blast hole — the Drake Delegation, apparently. They used *dynamite*. Near the far wall, a team in jorts and styled hair is pulling at the stone — the Croft Company. Neither group appears to have brought pencils. The water is rising — and given the blast hole in the wall, it's not hard to guess why.

Your notes didn't mention flooding. Adapt.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: croft.id,
      act: 1,
      title: "Croft Company — Act 1: The Flood",
      content: `You are the Croft Company — handpicked by the legendary Lara Croft herself. Friends, hired hands, and devoted followers of the most relentless relic hunter alive. When Croft caught wind of this temple, she dispatched you immediately, convinced — in that way only she can be — that this would be the next biggest thing. You trust her. You're also a little terrified of her.

Lara isn't here. You are. Make her proud.

You dug your way in from below, tomb-raider style, and emerged to find company. Near a freshly blasted hole in the wall, a crew in tactical gear and balaclavas is scanning the perimeter — the Drake Delegation. They used dynamite. Across the chamber, a group clutching whips and pencils is already hunched over inscriptions — the Jones Junket. You look much more stylish. The water is rising — probably thanks to whatever that blast hole did to the foundation.

Tie your hair back. Let's go.`,
    },
  });

  // ═══════════════════════════════════════════════════════════════════

  console.log(
    `\n✓ Created "${GAME_NAME}" with 3 houses, 15 card sets, 15 answers, 15 Act 1 missions, 3 story sheets.\n`,
  );
  console.log("Game ID:", game.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
