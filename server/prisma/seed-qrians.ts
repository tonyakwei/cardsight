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
import { createRequire } from "module";
import { FINALE_CLAUSES, FINALE_OUTCOMES } from "../../shared/finale.js";

const prisma = new PrismaClient();
const require = createRequire(import.meta.url);
const physicalCards: { id: string }[] = require("../../shared/physical-cards.json");

const GAME_NAME = "Temple of the QRians";
const physicalCardIndex: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
let designByCardSet: Record<string, string> = {};

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

async function assignCardHouses(cardId: string, houseIds: string[]) {
  for (const houseId of houseIds) {
    await prisma.cardHouse.create({ data: { cardId, houseId } });
  }
}

function nextPhysicalCardId(act: number) {
  const idx = physicalCardIndex[act];
  const next = physicalCards[idx];
  if (!next) {
    throw new Error(`Ran out of physical cards while seeding Act ${act} content`);
  }
  physicalCardIndex[act] = idx + 1;
  return next.id;
}

async function createClueCard(opts: {
  gameId: string;
  cardSetId: string;
  act: number;
  clueVisibleCategory: string;
  header: string;
  description: string;
  houseIds: string[];
  designId?: string;
}) {
  const designId = opts.designId ?? designByCardSet[opts.cardSetId] ?? null;
  const card = await prisma.card.create({
    data: {
      gameId: opts.gameId,
      physicalCardId: nextPhysicalCardId(opts.act),
      act: opts.act,
      cardSetId: opts.cardSetId,
      designId,
      clueVisibleCategory: opts.clueVisibleCategory,
      complexity: "simple",
      header: opts.header,
      description: opts.description,
    },
  });
  await assignCardHouses(card.id, opts.houseIds);
  return card;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("Cleaning existing game...");
  await cleanExistingGame();

  // Shuffle the physical-card pool so card sets don't end up sequential
  // (otherwise the printed colors leak the set-membership before the QR scan).
  for (let i = physicalCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [physicalCards[i], physicalCards[j]] = [physicalCards[j], physicalCards[i]];
  }

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

  // Act 2 — Drake
  const csApothecaryNote = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Apothecary Note", color: "#15803d" },
  });
  const csDrevuTile = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Drevu's Tile-Insert", color: "#7f1d1d" },
  });
  const csRedWallTile = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Red Wall Tile", color: "#dc2626" },
  });
  const csBarkLabel = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Bark Label", color: "#854d0e" },
  });
  const csTogomTablet = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Togom Riddle-Tablet", color: "#1e293b" },
  });

  // Act 2 — Jones
  const csClayShelfLabel = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Painted Clay Shelf-Label", color: "#a16207" },
  });
  const csAmberWallTile = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Amber Wall Tile", color: "#ca8a04" },
  });
  const csVeshTile = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Vesh's Tile-Insert", color: "#b45309" },
  });
  const csBurialRiteFragment = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Burial-Rite Fragment", color: "#facc15" },
  });
  const csSefaTablet = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Sefa Riddle-Tablet", color: "#fbbf24" },
  });

  // Act 2 — Croft
  const csCalculationTablet = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Calculation Tablet", color: "#475569" },
  });
  const csLensLabel = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Lens-Label", color: "#a78bfa" },
  });
  const csKraneTile = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Krane's Tile-Insert", color: "#7c3aed" },
  });
  const csPurpleWallTile = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Purple Wall Tile", color: "#6d28d9" },
  });
  const csYenusTablet = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Yenus Riddle-Tablet", color: "#312e81" },
  });

  // Act 3
  const csAct3History = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Act 3 History Fragment", color: "#0f766e" },
  });
  const csAct3Outcome = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Act 3 Major Decision", color: "#ca8a04" },
  });
  const csAct3Clause = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Act 3 Settlement Clause", color: "#475569" },
  });

  // ═══════════════════════════════════════════════════════════════════
  // DESIGNS (themes — assigned per card set)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating designs...");

  const designErodedStone = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Eroded Stone",
      bgColor: "#3a342e",
      bgGradient: "linear-gradient(180deg, #3a342e 0%, #2a2520 50%, #1c1814 100%)",
      textColor: "#e8e0d0",
      accentColor: "#c08552",
      secondaryColor: "#8b6f47",
      fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
      cardStyle: "standard",
      animationIn: "fade",
      borderStyle: "1px solid rgba(192, 133, 82, 0.25)",
      overlayEffect: "static-noise",
    },
  });

  const designTarnishedMetal = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Tarnished Metal",
      bgColor: "#1a1f23",
      bgGradient: "linear-gradient(180deg, #1a1f23 0%, #14181b 50%, #0c0e10 100%)",
      textColor: "#d4dce0",
      accentColor: "#5fb3a1",
      secondaryColor: "#7a8a8f",
      fontFamily: "'Helvetica Neue', system-ui, sans-serif",
      cardStyle: "standard",
      animationIn: "slide-up",
      borderStyle: "1px solid rgba(95, 179, 161, 0.25)",
      overlayEffect: "scanlines",
    },
  });

  const designDampParchment = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Damp Parchment",
      bgColor: "#f4ead2",
      bgGradient: "linear-gradient(180deg, #f4ead2 0%, #e8dcb8 50%, #d8c89a 100%)",
      textColor: "#3b2818",
      accentColor: "#8b3a1f",
      secondaryColor: "#5e4d2f",
      fontFamily: "'Crimson Text', 'Georgia', serif",
      cardStyle: "standard",
      animationIn: "fade",
      borderStyle: "1px solid rgba(94, 77, 47, 0.3)",
    },
  });

  const designBotanicalCipher = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Botanical Cipher",
      bgColor: "#1f2a1c",
      bgGradient: "linear-gradient(180deg, #2a3826 0%, #1f2a1c 60%, #131a11 100%)",
      textColor: "#e6dcb8",
      accentColor: "#d4a857",
      secondaryColor: "#7d8b56",
      fontFamily: "'Cormorant Garamond', 'Georgia', serif",
      cardStyle: "standard",
      animationIn: "fade",
      borderStyle: "1px solid rgba(212, 168, 87, 0.3)",
      overlayEffect: "particles",
    },
  });

  const designCompartmentWhisper = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Compartment Whisper",
      bgColor: "#0a0708",
      bgGradient: "radial-gradient(ellipse at top, #1a1410 0%, #0a0708 70%, #000000 100%)",
      textColor: "#d4c8a8",
      accentColor: "#a87f3f",
      secondaryColor: "#6b4f1f",
      fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
      cardStyle: "standard",
      animationIn: "decrypt",
      borderStyle: "1px solid rgba(168, 127, 63, 0.4)",
      overlayEffect: "glow",
    },
  });

  const designTranslatorsLight = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Translator's Light",
      bgColor: "#f7f1e1",
      bgGradient: "linear-gradient(180deg, #f7f1e1 0%, #ede4cc 50%, #e0d4b3 100%)",
      textColor: "#1c2a4a",
      accentColor: "#3b5fa8",
      secondaryColor: "#7a6a48",
      fontFamily: "'Georgia', 'Crimson Text', serif",
      cardStyle: "standard",
      animationIn: "fade",
      borderStyle: "1px solid rgba(59, 95, 168, 0.3)",
    },
  });

  const designTwilightHistory = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Twilight History",
      bgColor: "#0d0a1f",
      bgGradient: "linear-gradient(180deg, #1a1432 0%, #0d0a1f 60%, #050309 100%)",
      textColor: "#e0d4f0",
      accentColor: "#d4a85f",
      secondaryColor: "#6b5a8b",
      fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
      cardStyle: "standard",
      animationIn: "decrypt",
      borderStyle: "1px solid rgba(212, 168, 95, 0.3)",
      overlayEffect: "glow",
    },
  });

  // CardSet → Design assignment table
  designByCardSet = {
    // Eroded Stone (stone-family)
    [csInscribedStone.id]: designErodedStone.id,
    [csCeramicTile.id]: designErodedStone.id,
    [csStoneVessel.id]: designErodedStone.id,
    [csSlate.id]: designErodedStone.id,
    [csStoneMarker.id]: designErodedStone.id,
    [csEdgeBlock.id]: designErodedStone.id,
    [csRedWallTile.id]: designErodedStone.id,
    [csAmberWallTile.id]: designErodedStone.id,
    [csPurpleWallTile.id]: designErodedStone.id,
    // Tarnished Metal (metal-family)
    [csMechanicalPart.id]: designTarnishedMetal.id,
    [csMetalFragment.id]: designTarnishedMetal.id,
    [csMetalSpoke.id]: designTarnishedMetal.id,
    [csSteelHardware.id]: designTarnishedMetal.id,
    // Damp Parchment (paper-family)
    [csDampPage.id]: designDampParchment.id,
    [csApothecaryNote.id]: designDampParchment.id,
    [csTogomTablet.id]: designDampParchment.id,
    [csSefaTablet.id]: designDampParchment.id,
    [csYenusTablet.id]: designDampParchment.id,
    // Botanical Cipher (organic/painted-family)
    [csPaintedDisc.id]: designBotanicalCipher.id,
    [csClayShelfLabel.id]: designBotanicalCipher.id,
    [csBarkLabel.id]: designBotanicalCipher.id,
    [csLensLabel.id]: designBotanicalCipher.id,
    [csBurialRiteFragment.id]: designBotanicalCipher.id,
    // Compartment Whisper (N-trio tile-inserts)
    [csDrevuTile.id]: designCompartmentWhisper.id,
    [csVeshTile.id]: designCompartmentWhisper.id,
    [csKraneTile.id]: designCompartmentWhisper.id,
    // Translator's Light (glyph rosetta / scholarly working surface)
    [csClayTablet.id]: designTranslatorsLight.id,
    [csPotteryShard.id]: designTranslatorsLight.id,
    [csCalculationTablet.id]: designTranslatorsLight.id,
    [csBoneToken.id]: designTranslatorsLight.id,
    // Twilight History (Act 3 history + reference cards)
    [csAct3History.id]: designTwilightHistory.id,
    [csAct3Outcome.id]: designTwilightHistory.id,
    [csAct3Clause.id]: designTwilightHistory.id,
  };

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

  // ─── Act 2 answers — Drake ──────────────────────────────────────────

  const ansPowderQuietBed = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "bye",
      acceptAlternatives: ["BYE", "Bye", "goodbye", "GOODBYE", "farewell"],
      hint: "The pharmacist categorized three batches — A, B, C. Mark each batch separately on the grid. The path connecting each batch's harvest order traces a single letter. Three letters, one word.",
      hintAfterAttempts: 2,
    },
  });

  const ansDrevuCompartment = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "shatter divorce",
      acceptAlternatives: [
        "shatter, divorce", "shatter-divorce", "SHATTER DIVORCE",
        "fragment divorce", "break divorce", "splinter divorce", "burst divorce", "crumble divorce",
        "shatter separate", "shatter breakup", "shatter end", "shatter regret", "shatter die",
      ],
      hint: "Two procedures, two answers. Procedure 1 is a fragile object failing in stages. Procedure 2 is a romantic timeline — and the QRians were pessimists who recorded only the tragic ending of any process they observed.",
      hintAfterAttempts: 2,
    },
  });

  const ansRedWall = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "it was making us obsessed",
      acceptAlternatives: ["IT WAS MAKING US OBSESSED", "it-was-making-us-obsessed"],
      hint: "Each red tile shows the same phrase with a different set of letters worn smooth. Lay your three tiles side by side. At every blank, the missing letter is visible on one of the other two tiles.",
      hintAfterAttempts: 2,
    },
  });

  const ansReagentAlcove = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "bronze glass soap dye perfume",
      acceptAlternatives: [
        "bronze, glass, soap, dye, perfume",
        "bronze-glass-soap-dye-perfume",
        "BRONZE GLASS SOAP DYE PERFUME",
        "brass glass soap dye perfume",
        "bronze crystal soap dye perfume",
        "bronze glass lye dye perfume",
        "bronze glass soap pigment perfume",
        "bronze glass soap dye scent",
        "bronze glass soap dye fragrance",
        "bronze glass soap dye essence",
      ],
      hint: "Each station-cluster of 2 reagents was making one named compound. Match the loose bark-labels back to their stations and read each cluster as a recipe. Five compounds together tell you what they were stockpiling. Enter the five compound names in station order: 1, 2, 3, 4, 5.",
      hintAfterAttempts: 2,
    },
  });

  const ansReinforcedBunker = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "orbit grenade",
      acceptAlternatives: ["orbit, grenade", "orbit-grenade", "ORBIT GRENADE"],
      hint: "Two cryptic riddles. The first hides 'or' in the round shape of an old word for the path of a moon. The second is an anagram of ENRAGED with one letter added.",
      hintAfterAttempts: 2,
    },
  });

  // ─── Act 2 answers — Jones ──────────────────────────────────────────

  const ansSealedPantry = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "pepper porridge oil cake milk",
      acceptAlternatives: [
        "pepper, porridge, oil, cake, milk",
        "pepper-porridge-oil-cake-milk",
        "PEPPER PORRIDGE OIL CAKE MILK",
        "peppercorn porridge oil cake milk",
        "spice porridge oil cake milk",
        "pepper oatmeal oil cake milk",
        "pepper gruel oil cake milk",
        "pepper porridge oils cake milk",
        "pepper porridge oil honeycake milk",
        "pepper porridge oil loaf milk",
        "pepper porridge oil cake cream",
        "pepper porridge oil cake dairy",
      ],
      hint: "Each shelf-cluster of 2 ingredients was making one named food. Match the loose labels back to their shelves and read each cluster as a recipe. Five preparations together tell you the pantry's purpose. Enter the five preparation names in shelf order: 1, 2, 3, 4, 5.",
      hintAfterAttempts: 2,
    },
  });

  const ansAmberWall = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "this place once made us wise",
      acceptAlternatives: ["THIS PLACE ONCE MADE US WISE", "this-place-once-made-us-wise"],
      hint: "Each amber tile shows the same phrase with a different set of letters worn smooth. Lay your three tiles side by side. At every blank, the missing letter is visible on one of the other two tiles.",
      hintAfterAttempts: 2,
    },
  });

  const ansVeshCompartment = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "vein sneeze",
      acceptAlternatives: [
        "vein, sneeze", "vein-sneeze", "VEIN SNEEZE",
        "vein achoo", "vein blast", "vein spray", "vein expel", "vein relief",
      ],
      hint: "Two procedures, two answers. Procedure 1 follows the branching hierarchy of a plant from largest to smallest. Procedure 2 walks through the body's reaction to an irritant — what's the reflex at the end?",
      hintAfterAttempts: 2,
    },
  });

  const ansHangingGarden = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "jaw",
      acceptAlternatives: ["JAW", "Jaw", "jaws", "bone"],
      hint: "Three burial-rite fragments sort the canopy by phonetic articulation: closers, openers, carriers. Each card defines one class. Mark every instance of that class on the canopy map; the order you crack them in traces a single letter. Three letters, one word.",
      hintAfterAttempts: 2,
    },
  });

  const ansCeilingInscription = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "flower butterfly",
      acceptAlternatives: ["flower, butterfly", "flower-butterfly", "FLOWER BUTTERFLY"],
      hint: "Two cryptic riddles. The first sounds like 'flow-er' when said aloud — but the thing it names doesn't flow at all. The second uses 'queen' as a clue to a specific kind of insect that adds 'butter' to its name.",
      hintAfterAttempts: 2,
    },
  });

  // ─── Act 2 answers — Croft ──────────────────────────────────────────

  const ansReckoningFloor = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "time",
      acceptAlternatives: ["TIME", "Time"],
      hint: "Four calculation tablets, four digit-classes (3, 5, 7, 9). For each, find every numbered instance on the pebble floor and connect them in order. The path traces a letter. Four letters, one word.",
      hintAfterAttempts: 2,
    },
  });

  const ansSightingWall = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "dawn midnight mirage eclipse sunset",
      acceptAlternatives: [
        "dawn, midnight, mirage, eclipse, sunset",
        "dawn-midnight-mirage-eclipse-sunset",
        "DAWN MIDNIGHT MIRAGE ECLIPSE SUNSET",
        "sunrise midnight mirage eclipse sunset",
        "daybreak midnight mirage eclipse sunset",
        "dawn midnight illusion eclipse sunset",
        "dawn midnight mirage occultation sunset",
        "dawn midnight mirage eclipse sundown",
        "dawn midnight mirage eclipse dusk",
        "dawn midnight mirage eclipse twilight",
      ],
      hint: "Each cluster of 2 lens-slits aimed at one phenomenon. Match the loose labels to their lenses; read each cluster as a single observation. Every one of them is a moment where the sky's behavior shifts. Enter the five observations in cluster order: 1, 2, 3, 4, 5.",
      hintAfterAttempts: 2,
    },
  });

  const ansKraneCompartment = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "storm crash",
      acceptAlternatives: [
        "storm, crash", "storm-crash", "STORM CRASH",
        "rain crash", "thunder crash", "lightning crash", "pour crash", "downpour crash", "break crash",
        "storm flow", "storm break", "storm crest", "storm recede", "storm surge", "storm foam", "storm wash",
      ],
      hint: "Two procedures, two answers. Procedure 1 walks the sky from clear to dark — what's the climax? Procedure 2 traces the cycle of water against shore — what's the final motion?",
      hintAfterAttempts: 2,
    },
  });

  const ansPurpleWall = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "until we slowly realized",
      acceptAlternatives: ["UNTIL WE SLOWLY REALIZED", "until-we-slowly-realized"],
      hint: "Each purple tile shows the same phrase with a different set of letters worn smooth. Lay your three tiles side by side. At every blank, the missing letter is visible on one of the other two tiles.",
      hintAfterAttempts: 2,
    },
  });

  const ansHighLedge = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "present ground",
      acceptAlternatives: [
        "present, ground", "present-ground", "PRESENT GROUND",
        "present round",
      ],
      hint: "Two cryptic riddles. The first riddle is a single word with two meanings at once — a gift, and a moment in time. The second tells you what to do with a letter: add a G, then remove it.",
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
  // ACT 1 CLUE CARDS
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 clue cards...");

  // Drake A1M1 — Fuse Charges (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csMechanicalPart.id, act: 1,
    clueVisibleCategory: "Small Mechanical Part",
    header: "Detonator Components, Set I",
    description:
      "Two precision instruments, scattered in the silt. Each is etched with a part-name and a fitter's note.\n\n**Whisper Pins:** *\"Delicate. These seat into the base before anything else.\"*\n\n**Dragon Teeth:** *\"The heavy cores. They nest right on top of the pins.\"*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMechanicalPart.id, act: 1,
    clueVisibleCategory: "Small Mechanical Part",
    header: "Detonator Components, Set II",
    description:
      "Three more precision instruments, recovered together.\n\n**Ember Dust:** *\"Volatile. Packed between the cores and the plates. Don't sneeze.\"*\n\n**Striker Plates:** *\"Press flat against the dust layer. Takes the initial impact.\"*\n\n**Coil Segments:** *\"The ignition thread. Winds through the clips and connects to the shell trigger.\"*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMechanicalPart.id, act: 1,
    clueVisibleCategory: "Small Mechanical Part",
    header: "Detonator Components, Set III",
    description:
      "The last two pieces, picked out of the muck.\n\n**Ghost Shells:** *\"The outer housing. Nothing goes on after these.\"*\n\n**Fang Clips:** *\"Lock the plates in place. Snaps onto the strikers before you seal.\"*",
    houseIds: [drake.id],
  });

  // Drake A1M2 — Stone Wheel (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csInscribedStone.id, act: 1,
    clueVisibleCategory: "Inscribed Chunk of Stone",
    header: "Inscribed Chunk of Stone, Fragment I",
    description:
      "A heavy chunk of carved stone, pulled from beneath a fallen pillar. Translation key etched into one face.\n\n{{{P}}} = P\n{{{U}}} = U\n{{{T}}} = T\n{{{E}}} = E",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csInscribedStone.id, act: 1,
    clueVisibleCategory: "Inscribed Chunk of Stone",
    header: "Inscribed Chunk of Stone, Fragment II",
    description:
      "Another keystone, half-buried in silt.\n\n{{{R}}} = R\n{{{G}}} = G\n{{{L}}} = L\n{{{O}}} = O",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csInscribedStone.id, act: 1,
    clueVisibleCategory: "Inscribed Chunk of Stone",
    header: "Inscribed Chunk of Stone, Fragment III",
    description:
      "The smallest fragment of the three.\n\n{{{H}}} = H\n{{{F}}} = F",
    houseIds: [drake.id],
  });

  // Drake A1M3 — Shadow Astrolabe (5 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csPaintedDisc.id, act: 1,
    clueVisibleCategory: "Strange Painted Disc",
    header: "Strange Painted Disc, I",
    description:
      "A ceramic disc, painted around its rim with a color sequence. Etched beneath: a single clue word.\n\n**Sequence:** Black → Indigo → Orange → **?** → Orange → Indigo → Black\n\n**Clue:** *Up*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPaintedDisc.id, act: 1,
    clueVisibleCategory: "Strange Painted Disc",
    header: "Strange Painted Disc, II",
    description:
      "**Sequence:** **?** → Yellow → Brown → Black\n\n**Clue:** *Curved*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPaintedDisc.id, act: 1,
    clueVisibleCategory: "Strange Painted Disc",
    header: "Strange Painted Disc, III",
    description:
      "**Sequence:** Red → **?** → Brown\n\n**Clue:** *Rare*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPaintedDisc.id, act: 1,
    clueVisibleCategory: "Strange Painted Disc",
    header: "Strange Painted Disc, IV",
    description:
      "**Sequence:** Green → Yellow → Orange → Red → **?**\n\n**Clue:** *Harvest*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPaintedDisc.id, act: 1,
    clueVisibleCategory: "Strange Painted Disc",
    header: "Strange Painted Disc, V",
    description:
      "**Sequence:** **?** → Red → Orange → Yellow\n\n**Clue:** *Forge*",
    houseIds: [drake.id],
  });

  // Drake A1M4 — Construction Hoist (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csMetalFragment.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Fragment",
    header: "Hoist Marking, Set I",
    description:
      "Three iron fragments, prised from the central pulley.\n\n**Position 1:** {{{LEAVE}}} = LEAVE\n\n**Position 2:** {{{WHO}}} = WHO\n\n**Position 3:** {{{THIS}}} = THIS",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMetalFragment.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Fragment",
    header: "Hoist Marking, Set II",
    description:
      "Three more fragments, pulled from a tangled chain.\n\n**Position 4:** {{{NEVER}}} = NEVER\n\n**Position 5:** {{{WE}}} = WE\n\n**Position 6:** {{{THEM}}} = THEM",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMetalFragment.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Fragment",
    header: "Hoist Marking, Set III",
    description:
      "The last three, scratched and corroded.\n\n**Position 7:** {{{BUILT}}} = BUILT\n\n**Position 8:** {{{LET}}} = LET\n\n**Position 9:** {{{WILL}}} = WILL",
    houseIds: [drake.id],
  });

  // Drake A1M5 — Scraped Gap (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csDampPage.id, act: 1,
    clueVisibleCategory: "Mysterious Damp Page",
    header: "Mysterious Damp Page, Bundle I",
    description:
      "Three damp pages from a torn journal, recovered from the trunk.\n\n**Day 1 (Entry 1):** \"We found the entrance today. Discovery of a lifetime.\"\n\n**Day 3 (Entry 2):** \"Architecture beyond anything in the textbooks.\"\n\n**Day 5 (Entry 3):** \"Found a camp from decades ago. No skeletons.\"",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csDampPage.id, act: 1,
    clueVisibleCategory: "Mysterious Damp Page",
    header: "Mysterious Damp Page, Bundle II",
    description:
      "**Day 7 (Entry 4):** \"Their log echoes ours. Panic sets in.\"\n\n**Day 9 (Entry 5):** \"Every route slopes down. None lead up.\"",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csDampPage.id, act: 1,
    clueVisibleCategory: "Mysterious Damp Page",
    header: "Mysterious Damp Page, Bundle III",
    description:
      "**Day 11 (Entry 6):** \"Compass spins. Water from walls we never passed.\"\n\n**Undated (Entry 7):** \"Every staircase descends. We cannot find a path up.\"",
    houseIds: [drake.id],
  });

  // Jones A1M1 — Ceremonial Whips (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csClayTablet.id, act: 1,
    clueVisibleCategory: "Coded Clay Tablet",
    header: "Coded Clay Tablet, I",
    description:
      "A fragment of a translator's tablet, slick with floodwater.\n\n{{{T}}} = T\n{{{I}}} = I\n{{{M}}} = M\n{{{E}}} = E",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csClayTablet.id, act: 1,
    clueVisibleCategory: "Coded Clay Tablet",
    header: "Coded Clay Tablet, II",
    description:
      "Another fragment, etched in a steadier hand.\n\n{{{S}}} = S\n{{{O}}} = O\n{{{N}}} = N\n{{{C}}} = C",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csClayTablet.id, act: 1,
    clueVisibleCategory: "Coded Clay Tablet",
    header: "Coded Clay Tablet, III",
    description:
      "The last fragment.\n\n{{{A}}} = A\n{{{L}}} = L\n{{{V}}} = V\n{{{H}}} = H",
    houseIds: [jones.id],
  });

  // Jones A1M2 — Ancient Drainage (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csCeramicTile.id, act: 1,
    clueVisibleCategory: "Grooved Ceramic Tile",
    header: "Grooved Ceramic Tile, Bundle I",
    description: `Three pipe-tiles, scattered by the flood.

**V1 — Straight (L↔R):** Standard pass-through.

\`\`\`text
+-----------+
|           |
+-----------+
\`\`\`

**V2 — Elbow (L, B):** Turns down.

\`\`\`text
+-----------+
|           |
+---------+ |
          | |
          +-+
\`\`\`

**V5 — Elbow (R, B):** Marked **SABOTAGED** — chisel marks across the seal.

\`\`\`text
+-----------+
|    xx     |
| +---------+
| |
| |
+-+
\`\`\``,
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCeramicTile.id, act: 1,
    clueVisibleCategory: "Grooved Ceramic Tile",
    header: "Grooved Ceramic Tile, Bundle II",
    description: `**V3 — T-junction (L, R, T):** Three openings; the top is a dead-end.

\`\`\`text
  +-+
  | |
  | |
+-------+
|       |
+-------+
\`\`\`

**V4 — Elbow (T, L):** Comes in from above, exits left.

\`\`\`text
          +-+
          | |
 +--------+ |
 |          |
+-----------+
\`\`\``,
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCeramicTile.id, act: 1,
    clueVisibleCategory: "Grooved Ceramic Tile",
    header: "Grooved Ceramic Tile, Bundle III",
    description: `**V6 — Elbow (T, R):** Comes in from above, exits right.

\`\`\`text
+-+
| |
| +--------+
|          |
+-----------+
\`\`\`

**Straight (L↔R), no valve:** Just channel.

\`\`\`text
+-----------+
|           |
+-----------+
\`\`\``,
    houseIds: [jones.id],
  });

  // Jones A1M3 — Scattered Offerings (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csStoneVessel.id, act: 1,
    clueVisibleCategory: "Sealed Stone Vessel",
    header: "Sealed Stone Vessel, Pair A",
    description:
      "Two stone vessels, knocked from the wall by the flood.\n\n**Vessel 1 — squat bowl:** carved figures kneel before stars. Inside: fine powder, unmistakably lapis lazuli, ground to dust. Letter on underside: **S**.\n\n**Vessel 5 — tall cup:** carved figures stand in a circle, arms raised. Inside: crystallized residue, translucent and faintly sweet — ancient honey, hardened to glass. Letter: **O**.",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csStoneVessel.id, act: 1,
    clueVisibleCategory: "Sealed Stone Vessel",
    header: "Sealed Stone Vessel, Pair B",
    description:
      "**Vessel 3 — wide dish:** carved hands reach toward a flowering branch. Inside: chalky dust with a bright metallic sheen — crushed malachite. Letter: **O**.\n\n**Vessel 2 — shallow saucer:** carved terraced structure with figures building. Inside: thick, glassy resin — hardened tree sap, amber-colored where the light catches it. Letter: **H**.",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csStoneVessel.id, act: 1,
    clueVisibleCategory: "Sealed Stone Vessel",
    header: "Sealed Stone Vessel, Pair C",
    description:
      "**Vessel 6 — round pot:** carved waves crashing against cliffs. Inside: ground mineral powder with a deep, vivid sheen — cobalt ore. Letter: **C**.\n\n**Vessel 4 — narrow chalice:** carved spiral descending into earth. Inside: thin green-blue patina — verdigris, the residue left when copper corrodes. Letter: **L**.",
    houseIds: [jones.id],
  });

  // Jones A1M4 — Sliding Panels (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csSlate.id, act: 1,
    clueVisibleCategory: "Flat Inscribed Slate",
    header: "Flat Inscribed Slate, Set I",
    description:
      "Three slates dislodged from the wall grid.\n\n**Panel 1:** {{{SEALED}}} = SEALED\n\n**Panel 2:** {{{TOO}}} = TOO\n\n**Panel 3:** {{{FOREVER}}} = FOREVER",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSlate.id, act: 1,
    clueVisibleCategory: "Flat Inscribed Slate",
    header: "Flat Inscribed Slate, Set II",
    description:
      "**Panel 4:** {{{THOSE}}} = THOSE\n\n**Panel 5:** {{{AWAY}}} = AWAY\n\n**Panel 6:** {{{LONG}}} = LONG",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSlate.id, act: 1,
    clueVisibleCategory: "Flat Inscribed Slate",
    header: "Flat Inscribed Slate, Set III",
    description:
      "**Panel 7:** {{{WERE}}} = WERE\n\n**Panel 8:** {{{WHO}}} = WHO\n\n**Panel 9:** {{{STAYED}}} = STAYED",
    houseIds: [jones.id],
  });

  // Jones A1M5 — False Exit (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csStoneMarker.id, act: 1,
    clueVisibleCategory: "Worn Stone Marker",
    header: "Worn Stone Marker, Set I",
    description:
      "Two waymarkers from the corridor wall.\n\n**Marker 3:** \"The archway opens into a passage that slopes gently upward. The air grows warmer. On the left wall, a carved sun — the first hopeful symbol in this place.\"\n\n**Marker 7:** \"The passage turns sharply left. The carved sun is gone, replaced by repeating angular glyphs. The upward slope continues.\"",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csStoneMarker.id, act: 1,
    clueVisibleCategory: "Worn Stone Marker",
    header: "Worn Stone Marker, Set II",
    description:
      "**Marker 1:** \"The slope levels off. A draft from above. On the ceiling, a crack admits a thin shaft of light. The passage continues straight.\"\n\n**Marker 5:** \"A right turn. The shaft of light falls behind. The passage begins to slope downward. The walls are bare stone.\"\n\n**Marker 6:** \"The passage turns sharply right. After the bare stone, angular glyphs reappear — and they are the same. You are seeing the backs of the same carvings.\"",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csStoneMarker.id, act: 1,
    clueVisibleCategory: "Worn Stone Marker",
    header: "Worn Stone Marker, Set III",
    description:
      "**Marker 2:** \"Past the carvings, the downward slope steepens. The air grows warmer. A carved sun on the right wall — identical to one seen before, but on the wrong side.\"\n\n**Marker 4:** \"The slope levels off. The passage opens into a chamber. Your lamplight reveals familiar shapes — your own equipment, your own markings. You have not climbed. You have descended.\"",
    houseIds: [jones.id],
  });

  // Croft A1M1 — Grappling Rigs (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csSteelHardware.id, act: 1,
    clueVisibleCategory: "Unmarked Steel Hardware",
    header: "Unmarked Steel Hardware, Bundle I",
    description:
      "Three pieces of climbing kit, scattered when the bag burst.\n\n**#1 Rope Clamps:** *\"Toothed grips. Bite the rope going up, lock tight coming down.\"*\n\n**#3 Anchor Plate:** *\"Flat bracket. Bolts flush to the starting anchor for a tie-off point.\"*\n\n**#5 Wall Studs:** *\"Threaded steel bolts. First into bare rock. Nothing holds without them.\"*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSteelHardware.id, act: 1,
    clueVisibleCategory: "Unmarked Steel Hardware",
    header: "Unmarked Steel Hardware, Bundle II",
    description:
      "**#2 Cargo Hook:** *\"Heavy clip. The last thing on the line. Gear bags attach here.\"*\n\n**#4 Haul Pulley:** *\"Wheeled block. Mounts at the top to run the haul line through.\"*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSteelHardware.id, act: 1,
    clueVisibleCategory: "Unmarked Steel Hardware",
    header: "Unmarked Steel Hardware, Bundle III",
    description:
      "**#6 Top Bolts:** *\"Expansion bolts for the alcove. Useless until someone climbs up.\"*\n\n**#7 Fixed Line:** *\"Stiff rope. Ties off at the base, hangs the full height.\"*",
    houseIds: [croft.id],
  });

  // Croft A1M2 — Stone Jigsaw (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csEdgeBlock.id, act: 1,
    clueVisibleCategory: "Odd Edge-Marked Block",
    header: "Odd Edge-Marked Block, Pair I",
    description:
      "Two stone fragments from the breached passage.\n\n**Tile 1:** Left edge ☆, right edge ●. Letter on face: **S**.\n\n**Tile 2:** Left edge ●, right edge ▲. Letter on face: **T**.",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csEdgeBlock.id, act: 1,
    clueVisibleCategory: "Odd Edge-Marked Block",
    header: "Odd Edge-Marked Block, Pair II",
    description:
      "**Tile 3:** Left edge ▲, right edge ◆. Letter on face: **O**.\n\n**Tile 4:** Left edge ◆, right edge ◗. Letter on face: **N**.",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csEdgeBlock.id, act: 1,
    clueVisibleCategory: "Odd Edge-Marked Block",
    header: "Odd Edge-Marked Block, Last Fragment",
    description:
      "**Tile 5:** Left edge ◗, right edge ♦. Letter on face: **E**.",
    houseIds: [croft.id],
  });

  // Croft A1M3 — Impossible Vase (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csMetalSpoke.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Spoke",
    header: "Inscribed Metal Spoke, Bundle I",
    description:
      "Two iron spokes, scattered at the base of the wall.\n\n**Spoke 1:** {{{FIND}}} = FIND\n\n**Spoke 2:** {{{EVER}}} = EVER",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMetalSpoke.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Spoke",
    header: "Inscribed Metal Spoke, Bundle II",
    description:
      "**Spoke 3:** {{{WHO}}} = WHO\n\n**Spoke 4:** {{{WAY}}} = WAY\n\n**Spoke 5:** {{{WILL}}} = WILL",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMetalSpoke.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Spoke",
    header: "Inscribed Metal Spoke, Bundle III",
    description:
      "**Spoke 6:** {{{THOSE}}} = THOSE\n\n**Spoke 7:** {{{NO}}} = NO\n\n**Spoke 8:** {{{ENTER}}} = ENTER\n\n**Spoke 9:** {{{OUT}}} = OUT",
    houseIds: [croft.id],
  });

  // Croft A1M4 — Teaching Stone (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csBoneToken.id, act: 1,
    clueVisibleCategory: "Numbered Bone Token",
    header: "Numbered Bone Token, First",
    description:
      "A bone disc, palm-smooth from centuries of handling. A single number carved into the face: **5**.\n\n*The slot it fits is at Position 3 of the disc.*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBoneToken.id, act: 1,
    clueVisibleCategory: "Numbered Bone Token",
    header: "Numbered Bone Token, Second",
    description:
      "Another bone disc.\n\n**Number: 9**\n\n*The slot is at Position 5.*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBoneToken.id, act: 1,
    clueVisibleCategory: "Numbered Bone Token",
    header: "Numbered Bone Token, Third",
    description:
      "**Number: 15**\n\n*The slot is at Position 8.*",
    houseIds: [croft.id],
  });

  // Croft A1M5 — Drag Marks (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csPotteryShard.id, act: 1,
    clueVisibleCategory: "Ancient Pottery Shard",
    header: "Ancient Pottery Shard, Fragment I",
    description:
      "A pottery shard scratched with QRian-letter pairings — a builder's teaching aid.\n\n{{{T}}} = T\n{{{E}}} = E\n{{{L}}} = L\n{{{M}}} = M",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPotteryShard.id, act: 1,
    clueVisibleCategory: "Ancient Pottery Shard",
    header: "Ancient Pottery Shard, Fragment II",
    description:
      "{{{C}}} = C\n{{{H}}} = H\n{{{I}}} = I\n{{{D}}} = D",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPotteryShard.id, act: 1,
    clueVisibleCategory: "Ancient Pottery Shard",
    header: "Ancient Pottery Shard, Fragment III",
    description:
      "{{{O}}} = O\n{{{V}}} = V\n{{{S}}} = S\n{{{Y}}} = Y",
    houseIds: [croft.id],
  });

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
  // ACT 2 MISSIONS — DRAKE DELEGATION
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 2 missions — Drake...");

  const m_drake_a2_powder = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Powder of the Quiet Bed",
      sheetLetter: "A",
      description:
        "Sweeping across the far wall bedded in vines, you stop. What looked like a garden — dozens of flower and leaf arrangements pinned to the vine surface — is actually a grid. The same few shapes, repeating in patterns. Your medic says it first: it's writing. The whole wall is writing. Scattered across the chamber floor are loose working notes — the pharmacist's own records. You'll want to gather those before the wall means anything.",
      puzzleDescription:
        "The pharmacist's working notes describe three batches — A, B, and C — pinned across the wall as QRian glyphs. For each batch, find every specimen of that glyph that bears a harvest-sequence number. Mark them on the printed grid, then connect the numbered instances in order — the connecting line traces a single QRian super-glyph, one letter per batch. Three super-glyphs spell a single English word.\n\nWhat does the wall say?",
      requiredClueSets: [{ cardSetId: csApothecaryNote.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansPowderQuietBed.id,
      consequenceCompleted:
        "The three shapes resolve: B — Y — E. A farewell. The pharmacist embedded a goodbye in the arrangement of every plant in this room. Batch A was the sedative. Batch B was the paralytic. Batch C was the terminal compound. The Green Department wasn't a medicine garden — it was an execution chamber dressed up as horticulture.",
      consequenceNotCompleted:
        "The grid means nothing without the notes to decode it. We're carrying a map we can't read. Whatever the pharmacist was tracking in those batch ledgers stays in the wall. File the grid as unresolved intelligence and press on.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_drake_a2_powder.id, [drake.id]);

  const m_drake_a2_drevu = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Drevu's Compartment",
      sheetLetter: "B",
      description:
        "Off the side-passage and into a dim alcove: a stone table set in the corner, surface scored with rows of inset tile-slots — some filled, some empty. Above the table, a sealed compartment, no hinge. Your bomb-handler reads the gaps. *Passcode lock. The other houses are holding our missing tiles.*",
      puzzleDescription:
        "The stone table holds two procedure-rows of four inset tile-slots each. Steps 1, 2, and 3 of each procedure carry word-tiles distributed across the three houses — pool them by trading. **Step 4 of each procedure is blank. Your job is to infer the word that completes the progression.**\n\nProcedure I goes: ___ → ___ → ___ → **?**\nProcedure II goes: ___ → ___ → ___ → **?**\n\nSolve both. Enter the two inferred words separated by a space. The compartment opens.",
      requiredClueSets: [{ cardSetId: csDrevuTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansDrevuCompartment.id,
      consequenceCompleted:
        "Both passcodes enter. The compartment opens. Inside: a folded record by Mason Lamenter Drevu. He wrote the order to send slave-builders to die in the Source's chamber, asked forgiveness, and saw it through anyway. He knew. He couldn't stop it. He asked forgiveness anyway. The QRians knew what they were doing to the builders, and at least one of them never made peace with it.",
      consequenceNotCompleted:
        "The compartment stays sealed; the lock holds. The host's voice goes quiet — *we came close.* Drevu's record stays inside. We will not learn whose forgiveness he asked for, or whether he meant it. File and press on.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_drake_a2_drevu.id, [drake.id]);

  const m_drake_a2_redwall = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Wall of Repetitions, Red",
      sheetLetter: "C",
      description:
        "Through the doorway and into the long chamber: the temple's east wall stretches floor-to-ceiling, carved with the same QRian phrase repeated over and over — hundreds of stacked rewrites, each eroded in its own way. Behind you, you realize: Jones and Croft are already at their own sections of the wall, working amber tiles and purple. Your bomb-handler crouches at the red tiles. They wrote it this many times so the eroded ones could still be read against the rest. Some of yours are with the others. You'll want them back to read the wall whole.",
      puzzleDescription:
        "Three red tiles, each carrying the same phrase with a different set of letter-positions worn smooth. The blanks are partitioned: every position is blanked on exactly one tile. Pool all three red tiles, fill each blank from the other two, reconstruct the phrase.\n\nWhat is carved into the red wall?",
      requiredClueSets: [{ cardSetId: csRedWallTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansRedWall.id,
      consequenceCompleted:
        "The wall says: IT WAS MAKING US OBSESSED. Not the Source — the place. The QRians felt it happening, and they were the ones writing it down, watching themselves go obsessive, recording the diagnosis in the act of being broken. Across all three houses, the wall reads: *THIS PLACE ONCE MADE US WISE / UNTIL WE SLOWLY REALIZED / IT WAS MAKING US OBSESSED.* They wrote the confession at scale because they wanted anyone to read it.",
      consequenceNotCompleted:
        "Without the red tiles, the closing line is unreadable. We caught only fragments — *MAKING US* — and don't know what made them what. File the wall as conclusive of nothing and press on.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_drake_a2_redwall.id, [drake.id]);

  const m_drake_a2_alcove = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Reagent Alcove",
      sheetLetter: "D",
      description:
        "One of your crew leans against the wrong stretch of wall and a panel swings inward. Behind: a low-ceilinged alcove, every surface stacked with sealed glass phials, ceramic crucibles, fired-clay jars. The smell stops you. Chemicals — not medicine, engineering. Your bomb-handler crouches. *They were making something here.* Bark labels lie scattered across the floor, torn loose when the panel slammed. The other houses have a few. You'll want them back.",
      puzzleDescription:
        "Five station-clusters of 2 reagents each. Match the scattered bark-labels back to their stations and read each cluster as a recipe — the named compound it produces.\n\nName each compound the QRians were producing. Enter all five compound names in station order, separated by spaces:\n\n1. ___ + ___ → ?\n2. ___ + ___ → ?\n3. ___ + ___ → ?\n4. ___ + ___ → ?\n5. ___ + ___ → ?",
      requiredClueSets: [{ cardSetId: csBarkLabel.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansReagentAlcove.id,
      consequenceCompleted:
        "Five compounds resolve: BRONZE, GLASS, SOAP, DYE, PERFUME. At a glance, ordinary — the working stock of any well-funded QRian workshop. But not in this alcove. Refined past tools, past cups, past cloth, past ceremony. Your bomb-handler reads the back wall — half-finished assemblies, brackets, casings, sealed reservoirs — and the picture sharpens. The QRians were assembling these compounds into something purpose-built to push back against the Source's influence directly. They were trying to fight the thing that was eating them. The seal wasn't surrender. It was Plan B.",
      consequenceNotCompleted:
        "Without the labels, the alcove is a chemist's vault of unmarked reagents and half-built apparatus. We know they were making something. We don't know what. File the panel and press on.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_drake_a2_alcove.id, [drake.id]);

  const m_drake_a2_bunker = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Reinforced Bunker",
      sheetLetter: "E",
      description:
        "Past the central archway, into a side gallery: one stretch of wall is *wrong*. The masonry too dense, the cuts too tight, the surface scarred where someone tried — and failed — to chisel through. Your bomb-handler runs a hand along the seam. *They sealed something behind this on purpose.* You've got the Fuse Charges. Place them. There's a name carved above the seal: PRIEST PHYSICIST TOGOM. He didn't want company.",
      puzzleDescription:
        "Two-stage gate. First, place the saved Fuse Charges (Act 1 crew item) to breach the bunker. Second, solve the two cryptic riddles to release the inner scroll-case. *Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet I:** *\"Round and round this bit, but it's not 'and.'\"*\n\n**Tablet II:** *\"When shuffled, it's even more explosive than 'enraged.'\"*\n\nEnter the two riddle-answers separated by a space.",
      requiredClueSets: [{ cardSetId: csTogomTablet.id, count: 2 }],
      answerTemplateType: "single_answer",
      answerId: ansReinforcedBunker.id,
      consequenceCompleted:
        "The charges blow inward. Smoke clears. Inside, on a stone shelf, the scrolls — Togom's life work. The translation: *we discovered this place; people who came back had something in their eyes — wisdom — and the effect was geographic, indestructible, and could not be destroyed.* The Source is bound to this place. Empirical, observable, indestructible. Whatever Togom thought, he thought it carefully enough to seal it behind a wall.",
      consequenceNotCompleted:
        "Without the charges, the bunker stays sealed; or with the riddles unsolved, the inner case refuses to open. Either way, Togom's scrolls stay locked behind stone. File for now and press on.",
      sortOrder: 5,
    },
  });
  await assignMissionHouses(m_drake_a2_bunker.id, [drake.id]);

  // ═══════════════════════════════════════════════════════════════════
  // ACT 2 MISSIONS — JONES JUNKET
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 2 missions — Jones...");

  const m_jones_a2_pantry = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Sealed Pantry",
      sheetLetter: "A",
      description:
        "Off the main chamber to the right: an archway you missed, choked with vines so thick you nearly walked past it. Push through. Inside, a storeroom — fired-clay jars on stone shelves, every one sealed, every one heavy. Some shelves still bear their painted labels. Others are bare, the labels fallen, scattered. Your historian inhales slow. *This was a pantry.* Whoever ate from this pantry was eating with intention. The other houses pocketed a few of the labels. You'll want them back.",
      puzzleDescription:
        "Five shelf-clusters of 2 ingredients each. Match the scattered painted clay labels back to their shelves and read each cluster as a recipe — the named preparation it produces.\n\nName each preparation kept in this pantry. Enter all five preparation names in shelf order, separated by spaces:\n\n1. ___ + ___ → ?\n2. ___ + ___ → ?\n3. ___ + ___ → ?\n4. ___ + ___ → ?\n5. ___ + ___ → ?",
      requiredClueSets: [{ cardSetId: csClayShelfLabel.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansSealedPantry.id,
      consequenceCompleted:
        "Five preparations resolve: PEPPER, PORRIDGE, OIL, CAKE, MILK. Look at your kitchen at home — none of these would surprise you. But that's the point. To the QRians of this era, these weren't kitchen staples. They were *nootropics*: pepper sharpened the senses, porridge anchored the body, oil eased thought, cake kept the mind warm, milk steadied a slipping center. Every jar in this pantry is a food the QRians genuinely believed could armor the mind against drift. They medicated themselves with breakfast, with dinner, with the everyday stock of a kitchen — eating their way through the contagion in the only language their medical understanding offered.",
      consequenceNotCompleted:
        "Without the labels, the pantry is rows of sealed jars and silent shelves. We know they ate here. We don't know what they ate or why they kept it. File the storeroom as ambiguous and press on.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_jones_a2_pantry.id, [jones.id]);

  const m_jones_a2_amberwall = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Wall of Repetitions, Amber",
      sheetLetter: "B",
      description:
        "Through the doorway and into the long chamber: the temple's east wall stretches floor-to-ceiling, carved with the same QRian phrase repeated over and over — hundreds of stacked rewrites, each eroded in its own way. Behind you, you realize: Drake and Croft are already at their own sections of the wall, working red tiles and purple. Your linguist drops at the amber tiles. *They wrote it this many times so the eroded ones could still be read against the rest.* Some of yours are with the others. You'll want them back.",
      puzzleDescription:
        "Three amber tiles, each carrying the same phrase with a different set of letter-positions worn smooth. The blanks are partitioned: every position is blanked on exactly one tile. Pool all three amber tiles, fill each blank from the other two, reconstruct the phrase.\n\nWhat is carved into the amber wall?",
      requiredClueSets: [{ cardSetId: csAmberWallTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansAmberWall.id,
      consequenceCompleted:
        "The wall says: THIS PLACE ONCE MADE US WISE. The QRians' opening confession. They didn't come here as scientists who made a discovery — they came here because being here MADE them scientists. The place was the source of their wisdom, and they knew it. Across all three houses, the wall reads: *THIS PLACE ONCE MADE US WISE / UNTIL WE SLOWLY REALIZED / IT WAS MAKING US OBSESSED.* The first line is not a celebration. It's the first line of an autopsy.",
      consequenceNotCompleted:
        "Without the amber tiles, the opening line is broken. *PLACE* and *WISE* stand out from the corruption, but how they connect stays lost. File and press on.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_jones_a2_amberwall.id, [jones.id]);

  const m_jones_a2_vesh = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Vesh's Compartment",
      sheetLetter: "C",
      description:
        "Off the side-passage and into a quiet alcove: a stone table set in the corner, surface marked in careful columns of inset tile-slots — some filled, some empty. Above the table, a sealed compartment, no hinge. Your linguist reads the rows. *Phrase-lock. Some tiles are with the other houses.*",
      puzzleDescription:
        "The stone table holds two procedure-rows of four inset tile-slots each. Steps 1, 2, and 3 of each procedure carry word-tiles distributed across the three houses — pool them by trading. **Step 4 of each procedure is blank. Your job is to infer the word that completes the progression.**\n\nProcedure I goes: ___ → ___ → ___ → **?**\nProcedure II goes: ___ → ___ → ___ → **?**\n\nSolve both. Enter the two inferred words separated by a space. The compartment opens.",
      requiredClueSets: [{ cardSetId: csVeshTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansVeshCompartment.id,
      consequenceCompleted:
        "Both passcodes enter. The compartment opens. Inside: a logged record by Witness Chronicler Vesh. He wrote it like a ledger — *the construction was assigned to expendable labor; their disposal at completion was logistical.* No anguish, no pride, just the cycles. The QRians had a class system that absorbed the moral cost without flinching.",
      consequenceNotCompleted:
        "The compartment stays sealed; the lock holds. The host's voice goes quiet — *we came close.* Vesh's record stays inside. We will not learn how cleanly he chose to write his cycles. File and press on.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_jones_a2_vesh.id, [jones.id]);

  const m_jones_a2_garden = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Hanging Garden of Names",
      sheetLetter: "D",
      description:
        "Through the doors and into the dome: a greenhouse three stories high, glass long shattered, vines hanging in a forest of root-curtains. Each braid weighted at its tip with a fired-clay tag the size of a fist. Thousands. They turn slow in the draft, clicking against each other like wind chimes made of teeth. Every tag carries one painted glyph. The doors behind you grind shut. The QRians left a path through this — but only in the air. You've got the Ceremonial Whips. Set them.",
      puzzleDescription:
        "The canopy hangs at lethal density — any contact-retrieval drops the curtain onto a floor pressure-plate that completes the seal. Only a precision whip-crack can drop a single tag. You have a printed overhead map of the canopy. Each burial-rite fragment names one glyph-class (closers / openers / carriers, sorted by phonetic articulation) and tells you to strike each instance in numerical order. Each card's strike-sequence traces one QRian super-glyph. Three cards → three letters → one English word.\n\nWhat hangs in this garden?",
      requiredClueSets: [{ cardSetId: csBurialRiteFragment.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansHangingGarden.id,
      consequenceCompleted:
        "Three shapes resolve: J — A — W. The tags weren't tags. When a QRian died, they kept the speaking-bone — the only part of the body that had carried words. Bone crumbled; clay replaced it; the names stayed. This garden is a library of voices, kept in the shape of the part of the body that voiced them. They classified their own corpses by phonetic articulation. They could not stop classifying. They could not stop.",
      consequenceNotCompleted:
        "Without the whips, the canopy is unreachable — the only path through this room is under it. The team picks along the central walkway with eyes down, hands clenched, the dead clicking softly above. We will not learn what was hung here. File and press on.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_jones_a2_garden.id, [jones.id]);

  const m_jones_a2_ceiling = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Ceiling Inscription",
      sheetLetter: "E",
      description:
        "Northeast corner of the chamber, where the ceiling slopes low to meet the wall: faint chiseled glyphs catch the lamp-light. Your linguist freezes. *That's a name.* The carvings name an author the others walked past — and below the inscription, a stone tile sits slightly proud of the wall. A pull-tab. The compartment behind it is untouched. Above the tile: BOTANIST THEOLOGIAN SEFA. She wanted to be found.",
      puzzleDescription:
        "Two cryptic riddles seal the inner scroll-case. *Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet I:** *\"It is said to flow, but it doesn't. Instead, it stands beautifully.\"*\n\n**Tablet II:** *\"You would think that you put on your bread, but instead it soars like a queen.\"*\n\nEnter the two riddle-answers separated by a space.",
      requiredClueSets: [{ cardSetId: csSefaTablet.id, count: 2 }],
      answerTemplateType: "single_answer",
      answerId: ansCeilingInscription.id,
      consequenceCompleted:
        "The tile pulls away. Behind it, exactly the depth of an arm: a tightly-wrapped scroll-bundle, untouched. Sefa's writing. The translation: *all those affected by the Source suddenly carried the power of a blocky, descriptive language… it exploded throughout our civilization… it affected our entire culture, intimately, perhaps too intimately.* The Source manifested in language. The QRians' blocky script — every glyph the team has been decoding all year — is the Source's signature. To write QRian was to be touched.",
      consequenceNotCompleted:
        "Sefa's compartment is open but the inner cylinder won't release without the riddle-answers. Her scrolls stay wrapped in their case. We came so close. File for now and press on.",
      sortOrder: 5,
    },
  });
  await assignMissionHouses(m_jones_a2_ceiling.id, [jones.id]);

  // ═══════════════════════════════════════════════════════════════════
  // ACT 2 MISSIONS — CROFT COMPANY
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 2 missions — Croft...");

  const m_croft_a2_floor = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Reckoning Floor",
      sheetLetter: "A",
      description:
        "Down the steps and across the chamber floor: a wide stone slab, set with thousands of pebbles, each carved with a single number. Something was being calculated. Your engineer crouches and starts mapping it — and stops. In QRian, math and language sit close enough that a calculation doesn't end in a number; it ends in a word. The other houses have pocketed the calculator's working notes. You'll want them back to read what's frozen here.",
      puzzleDescription:
        "Four calculation tablets — one per digit-class (3, 5, 7, 9). For each digit-class, find every instance on the printed pebble floor that bears a small calculation-sequence number. Connect them in numerical order. The path traces a single QRian super-glyph, one letter per digit-class. Four super-glyphs spell a single English word.\n\nWhat were the QRians measuring?",
      requiredClueSets: [{ cardSetId: csCalculationTablet.id, count: 4 }],
      answerTemplateType: "single_answer",
      answerId: ansReckoningFloor.id,
      consequenceCompleted:
        "Four shapes resolve: T — I — M — E. Not a quantity. Not a duration. The word itself. The QRians' math couldn't separate counting from spelling — when they ran a calculation about something, the calculation produced the name of what they were counting. The answer to *how long do we have* was TIME, written in the only thing that could write it: a measurement of itself. They knew. They counted. They knew.",
      consequenceNotCompleted:
        "Without the calculator's working notes, the pebble floor is a frozen abacus running no software. We know they were measuring something. Not what. File the field as ambiguous and press on.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_croft_a2_floor.id, [croft.id]);

  const m_croft_a2_sighting = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Sighting Wall",
      sheetLetter: "B",
      description:
        "Up the ledge your climber uncovered: the chamber narrows to a wall, and the wall is full of slits. Thin vertical cuts, each one no wider than a hand, set at varying heights, looking out — over the canopy, the basin, the far ridges. Set into many of the slits: amber lenses, polished smooth, each one labeled in a careful hand. Other slits are bare; their labels gone, scattered to the chamber below. Your climber goes still. *This wasn't a fortress wall.* It was an eye.",
      puzzleDescription:
        "Five clusters of 2 slits/lenses each, every cluster tracking one observable phenomenon. Match the scattered lens-labels back to their slits and read each cluster as a single observation.\n\nName each phenomenon the QRians were observing. Enter all five observation names in cluster order, separated by spaces:\n\n1. ___ + ___ → ?\n2. ___ + ___ → ?\n3. ___ + ___ → ?\n4. ___ + ___ → ?\n5. ___ + ___ → ?",
      requiredClueSets: [{ cardSetId: csLensLabel.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansSightingWall.id,
      consequenceCompleted:
        "Five observations resolve: DAWN, MIDNIGHT, MIRAGE, ECLIPSE, SUNSET. Not weather forecasting. Not crop timing. Not warfare reconnaissance. The QRians were *triangulating their own location in the universe* — watching the sky's transitions for what they couldn't otherwise know. This place was special to them. They built this wall to find out *how* special. They were measuring whether the Source was bound to this geography, or bigger than that. The geography is the disease, and they were the only people who knew it.",
      consequenceNotCompleted:
        "Without the labels, the lenses look out on an indifferent horizon. We know they watched. We don't know what they were watching for. File the wall as observatory of unknown purpose and press on.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_croft_a2_sighting.id, [croft.id]);

  const m_croft_a2_krane = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Krane's Compartment",
      sheetLetter: "C",
      description:
        "Off the side-passage and into a tight alcove: a stone table set in the corner, mechanism still snug — rows of inset tile-slots, some filled, some empty. Above the table, a sealed compartment, no hinge. Your point climber checks the slots. *Mechanism's plain. The other houses have what we need.*",
      puzzleDescription:
        "The stone table holds two procedure-rows of four inset tile-slots each. Steps 1, 2, and 3 of each procedure carry word-tiles distributed across the three houses — pool them by trading. **Step 4 of each procedure is blank. Your job is to infer the word that completes the progression.**\n\nProcedure I goes: ___ → ___ → ___ → **?**\nProcedure II goes: ___ → ___ → ___ → **?**\n\nSolve both. Enter the two inferred words separated by a space. The compartment opens.",
      requiredClueSets: [{ cardSetId: csKraneTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansKraneCompartment.id,
      consequenceCompleted:
        "Both passcodes enter. The compartment opens. Inside: a working note by Foreman Geometer Krane. He liked it. Liked the elegance. Liked the system. *We assigned tasks by aptitude — the strong to lifting, the deft to inlay, the small to ducting. Their elimination at completion was a kindness.* The QRians weren't a uniform culture in their last days — some of them found the slave-system *beautiful*. The temple stands because somebody ran the math and called the math good.",
      consequenceNotCompleted:
        "The compartment stays sealed; the lock holds. The host's voice goes quiet — *we came close.* Krane's record stays inside. We will not learn what he found elegant, or why. File and press on.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_croft_a2_krane.id, [croft.id]);

  const m_croft_a2_purplewall = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Wall of Repetitions, Purple",
      sheetLetter: "D",
      description:
        "Through the doorway and into the long chamber: the temple's east wall stretches floor-to-ceiling, carved with the same QRian phrase repeated over and over — hundreds of stacked rewrites, each eroded in its own way. Behind you, you realize: Drake and Jones are already at their own sections of the wall, working red tiles and amber. Your point climber kneels at the purple tiles. *They wrote it this many times so the eroded ones could still be read against the rest.* Some of yours are with the others. You'll want them back.",
      puzzleDescription:
        "Three purple tiles, each carrying the same phrase with a different set of letter-positions worn smooth. The blanks are partitioned: every position is blanked on exactly one tile. Pool all three purple tiles, fill each blank from the other two, reconstruct the phrase.\n\nWhat is carved into the purple wall?",
      requiredClueSets: [{ cardSetId: csPurpleWallTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansPurpleWall.id,
      consequenceCompleted:
        "The wall says: UNTIL WE SLOWLY REALIZED. The middle of a sentence. The hinge. Wisdom turning to obsession, slowly enough to inscribe the realization mid-fall. Across all three houses, the wall reads: *THIS PLACE ONCE MADE US WISE / UNTIL WE SLOWLY REALIZED / IT WAS MAKING US OBSESSED.* They watched themselves become what they were becoming, and they had a word for that watching: *slowly.* They had time to write it down. They had time to anticipate a reader. We are the reader.",
      consequenceNotCompleted:
        "Without the purple tiles, the middle line stays in pieces. *SLOWLY* survived the most readings. Whatever was happening slowly, we don't know what. File and press on.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_croft_a2_purplewall.id, [croft.id]);

  const m_croft_a2_ledge = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "The High Ledge",
      sheetLetter: "E",
      description:
        "Up the gallery wall: a small ledge, twelve feet of sheer rock above the chamber floor — too high to jump, too smooth to climb. A compartment is cut into the face of it, sealed with a wooden lid that looks impossibly fresh. Your point climber tilts her head back. *Whoever lived up there wanted to be alone.* You've got the Grappling Rigs. Set the lines. A name is carved into the lid above: PHILOSOPHER MATHEMATICIAN YENUS. He kept his work where the floor couldn't reach.",
      puzzleDescription:
        "Two-stage gate. First, set the saved Grappling Rigs (Act 1 crew item) and climb the ledge. Second, solve the two cryptic riddles to release the inner scroll-case. *Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet I:** *\"The gift you always have, at all times.\"*\n\n**Tablet II:** *\"Add a G; it describes the Earth. Remove the G; it describes the Earth.\"*\n\nEnter the two riddle-answers separated by a space.",
      requiredClueSets: [{ cardSetId: csYenusTablet.id, count: 2 }],
      answerTemplateType: "single_answer",
      answerId: ansHighLedge.id,
      consequenceCompleted:
        "The lid lifts. The compartment is small but dry — Yenus chose his ledge well. Inside: the scrolls. The translation: *this place was special… it gave us a sense of understanding which vastly accelerated our civilization… farmers became mathematicians; merchants became astronomers… little did we know that this obsession was an unstoppable force.* The Source didn't just affect them, it *gave* them — mathematics, logic, physics, all suddenly, all intuitively. Civilization-altering wisdom for free. They didn't realize until too late that the wisdom and the obsession were the same thing.",
      consequenceNotCompleted:
        "Without the rigs, the ledge is unreachable — Yenus chose his elevation well. Or with the riddles unsolved, the inner case won't release. Either way, the scrolls stay out of reach. File and press on.",
      sortOrder: 5,
    },
  });
  await assignMissionHouses(m_croft_a2_ledge.id, [croft.id]);

  // ═══════════════════════════════════════════════════════════════════
  // ACT 2 CLUE CARDS
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 2 clue cards...");

  // Drake A2M1 — Powder of the Quiet Bed (3 cards, all Drake)
  await createClueCard({
    gameId: game.id, cardSetId: csApothecaryNote.id, act: 2,
    clueVisibleCategory: "Apothecary Note",
    header: "Apothecary Note, Folded",
    description:
      "*Folded note in the pharmacist's hand.*\n\n**Batch A — Soporific base compound.** Mark all Batch A specimens on the canopy grid. Connect them in harvest-sequence order. The path traces the first letter of the answer.",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csApothecaryNote.id, act: 2,
    clueVisibleCategory: "Apothecary Note",
    header: "Apothecary Note, Ink-stained",
    description:
      "*Ink-stained note from the same hand.*\n\n**Batch B — Activating agent.** Mark all Batch B specimens. Connect in harvest order. The shape is the second letter.",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csApothecaryNote.id, act: 2,
    clueVisibleCategory: "Apothecary Note",
    header: "Apothecary Note, Torn",
    description:
      "*Torn note. The bottom edge is missing.*\n\n**Batch C — Terminal compound.** Mark all Batch C specimens. Connect in harvest order. The shape is the third and last letter.",
    houseIds: [drake.id],
  });

  // Drake A2M2 — Drevu's Compartment (3 cards, distributed Drake/Jones/Croft)
  await createClueCard({
    gameId: game.id, cardSetId: csDrevuTile.id, act: 2,
    clueVisibleCategory: "Drevu's Tile-Insert",
    header: "Drevu's Compartment Tile, Slot 1",
    description:
      "*A loose tile prised from Drevu's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 1 of 4:** drop\n\n**Procedure II — step 1 of 4:** date\n\n*(Steps 2 and 3 of each procedure are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csDrevuTile.id, act: 2,
    clueVisibleCategory: "Drevu's Tile-Insert",
    header: "Drevu's Compartment Tile, Slot 2",
    description:
      "*A loose tile prised from Drevu's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 2 of 4:** crack\n\n**Procedure II — step 2 of 4:** move-in\n\n*(Steps 1 and 3 of each procedure are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csDrevuTile.id, act: 2,
    clueVisibleCategory: "Drevu's Tile-Insert",
    header: "Drevu's Compartment Tile, Slot 3",
    description:
      "*A loose tile prised from Drevu's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 3 of 4:** split\n\n**Procedure II — step 3 of 4:** marry\n\n*(Steps 1 and 2 of each procedure are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [croft.id],
  });

  // Drake A2M3 — Wall of Repetitions, Red (3 tiles, distributed)
  await createClueCard({
    gameId: game.id, cardSetId: csRedWallTile.id, act: 2,
    clueVisibleCategory: "Red Wall Tile",
    header: "Red Wall Tile, 1",
    description:
      "*A pried-loose tile from the east wall, color: red. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`_T W_S M_KI_G U_ OB_ES_ED`\n\n*(Two more red tiles are out there with different worn-smooth positions. Pool all three to read it whole — at every blank, the missing letter is visible on one of the other two.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csRedWallTile.id, act: 2,
    clueVisibleCategory: "Red Wall Tile",
    header: "Red Wall Tile, 2",
    description:
      "*A pried-loose tile from the east wall, color: red. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`I_ WA_ MA_IN_ US _BS_SS_D`\n\n*(Two more red tiles are out there with different worn-smooth positions. Pool all three to read it whole.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csRedWallTile.id, act: 2,
    clueVisibleCategory: "Red Wall Tile",
    header: "Red Wall Tile, 3",
    description:
      "*A pried-loose tile from the east wall, color: red. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`IT _AS _AK_NG _S O_SE_SE_`\n\n*(Two more red tiles are out there with different worn-smooth positions. Pool all three to read it whole.)*",
    houseIds: [croft.id],
  });

  // Drake A2M4 — The Reagent Alcove (3 cards, all Drake)
  await createClueCard({
    gameId: game.id, cardSetId: csBarkLabel.id, act: 2,
    clueVisibleCategory: "Bark Label",
    header: "Bark Label, Bundle I",
    description:
      "Bark labels torn loose when the alcove panel slammed. Each label was pinned beneath a station's apparatus.\n\n**Station 1 (2 reagents):** COPPER, TIN\n\n**Station 2 (2 reagents):** SAND, HEAT",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBarkLabel.id, act: 2,
    clueVisibleCategory: "Bark Label",
    header: "Bark Label, Bundle II",
    description:
      "**Station 3 (2 reagents):** FAT, ASH\n\n**Station 4 (2 reagents):** PLANT, STAIN",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBarkLabel.id, act: 2,
    clueVisibleCategory: "Bark Label",
    header: "Bark Label, Bundle III",
    description:
      "**Station 5 (2 reagents):** FLOWER, SPIRIT",
    houseIds: [drake.id],
  });

  // Drake A2M5 — The Reinforced Bunker (2 cards, all Drake)
  await createClueCard({
    gameId: game.id, cardSetId: csTogomTablet.id, act: 2,
    clueVisibleCategory: "Togom Riddle-Tablet",
    header: "Togom Riddle-Tablet, I",
    description:
      "*Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet I:**\n\n*\"Round and round this bit, but it's not 'and.'\"*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csTogomTablet.id, act: 2,
    clueVisibleCategory: "Togom Riddle-Tablet",
    header: "Togom Riddle-Tablet, II",
    description:
      "*Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet II:**\n\n*\"When shuffled, it's even more explosive than 'enraged.'\"*",
    houseIds: [drake.id],
  });

  // Jones A2M1 — The Sealed Pantry (3 cards, all Jones)
  await createClueCard({
    gameId: game.id, cardSetId: csClayShelfLabel.id, act: 2,
    clueVisibleCategory: "Painted Clay Shelf-Label",
    header: "Painted Clay Shelf-Label, Bundle I",
    description:
      "Painted clay shelf-labels, fallen and scattered when the vines breached the pantry. Each label once sat beneath a sealed jar.\n\n**Shelf 1 (2 ingredients):** FRUIT, FIRE\n\n**Shelf 2 (2 ingredients):** OATS, STEW",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csClayShelfLabel.id, act: 2,
    clueVisibleCategory: "Painted Clay Shelf-Label",
    header: "Painted Clay Shelf-Label, Bundle II",
    description:
      "**Shelf 3 (2 ingredients):** PLANT, GREASE\n\n**Shelf 4 (2 ingredients):** HONEY, BREAD",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csClayShelfLabel.id, act: 2,
    clueVisibleCategory: "Painted Clay Shelf-Label",
    header: "Painted Clay Shelf-Label, Bundle III",
    description:
      "**Shelf 5 (2 ingredients):** CREATURE, DRINK",
    houseIds: [jones.id],
  });

  // Jones A2M2 — Wall of Repetitions, Amber (3 tiles, distributed)
  await createClueCard({
    gameId: game.id, cardSetId: csAmberWallTile.id, act: 2,
    clueVisibleCategory: "Amber Wall Tile",
    header: "Amber Wall Tile, 1",
    description:
      "*A pried-loose tile from the east wall, color: amber. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`_HI_ PLA_E O_CE _AD_ US _IS_`\n\n*(Two more amber tiles are out there with different worn-smooth positions. Pool all three to read it whole — at every blank, the missing letter is visible on one of the other two.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csAmberWallTile.id, act: 2,
    clueVisibleCategory: "Amber Wall Tile",
    header: "Amber Wall Tile, 2",
    description:
      "*A pried-loose tile from the east wall, color: amber. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`T_IS _LAC_ ON_E M_DE _S W_SE`\n\n*(Two more amber tiles are out there with different worn-smooth positions. Pool all three to read it whole.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csAmberWallTile.id, act: 2,
    clueVisibleCategory: "Amber Wall Tile",
    header: "Amber Wall Tile, 3",
    description:
      "*A pried-loose tile from the east wall, color: amber. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`TH_S P__CE _NC_ MA_E U_ WI_E`\n\n*(Two more amber tiles are out there with different worn-smooth positions. Pool all three to read it whole.)*",
    houseIds: [croft.id],
  });

  // Jones A2M3 — Vesh's Compartment (3 cards, distributed)
  await createClueCard({
    gameId: game.id, cardSetId: csVeshTile.id, act: 2,
    clueVisibleCategory: "Vesh's Tile-Insert",
    header: "Vesh's Compartment Tile, Slot 1",
    description:
      "*A loose tile prised from Vesh's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 1 of 4:** trunk\n\n**Procedure II — step 1 of 4:** pollen\n\n*(Steps 2 and 3 of each procedure are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csVeshTile.id, act: 2,
    clueVisibleCategory: "Vesh's Tile-Insert",
    header: "Vesh's Compartment Tile, Slot 2",
    description:
      "*A loose tile prised from Vesh's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 2 of 4:** branch\n\n**Procedure II — step 2 of 4:** tingle\n\n*(Steps 1 and 3 of each procedure are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csVeshTile.id, act: 2,
    clueVisibleCategory: "Vesh's Tile-Insert",
    header: "Vesh's Compartment Tile, Slot 3",
    description:
      "*A loose tile prised from Vesh's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 3 of 4:** leaf\n\n**Procedure II — step 3 of 4:** gasp\n\n*(Steps 1 and 2 of each procedure are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [croft.id],
  });

  // Jones A2M4 — The Hanging Garden of Names (3 cards, all Jones)
  await createClueCard({
    gameId: game.id, cardSetId: csBurialRiteFragment.id, act: 2,
    clueVisibleCategory: "Burial-Rite Fragment",
    header: "Burial-Rite Fragment, Folded",
    description:
      "*A folded scrap of inscribed bark — sorting instructions for the canopy.*\n\n\"Strike first the **speakers** — every glyph that closes the mouth. The dead spoke our names back to us in the order we forgot them; we wrote each name on the bone that had carried it. Crack each in turn.\"\n\n*(Use the printed canopy map. Mark every closer-class glyph with a sequence number, then crack them in numerical order. The path traces a single letter.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBurialRiteFragment.id, act: 2,
    clueVisibleCategory: "Burial-Rite Fragment",
    header: "Burial-Rite Fragment, Charred",
    description:
      "*A charred scrap, edges blackened.*\n\n\"Then the **openers** — glyphs that part the lips. We did not bury our scholars. To bury would have meant we stopped recording. We hung them instead, where the wind could still move through what they had said. Crack in turn; let each one fall.\"\n\n*(Mark every opener-class glyph; crack in sequence. The path traces a second letter.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBurialRiteFragment.id, act: 2,
    clueVisibleCategory: "Burial-Rite Fragment",
    header: "Burial-Rite Fragment, Half-Erased",
    description:
      "*A half-erased scrap; some text remains legible.*\n\n\"Last, the **carriers** — glyphs that ride the breath out. A name is only the shape the jaw makes when the body is gone. Strike them in the order the breath leaves.\"\n\n*(Mark every carrier-class glyph; crack in sequence. The path traces the third and final letter.)*",
    houseIds: [jones.id],
  });

  // Jones A2M5 — The Ceiling Inscription (2 cards, all Jones)
  await createClueCard({
    gameId: game.id, cardSetId: csSefaTablet.id, act: 2,
    clueVisibleCategory: "Sefa Riddle-Tablet",
    header: "Sefa Riddle-Tablet, I",
    description:
      "*Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet I:**\n\n*\"It is said to flow, but it doesn't. Instead, it stands beautifully.\"*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSefaTablet.id, act: 2,
    clueVisibleCategory: "Sefa Riddle-Tablet",
    header: "Sefa Riddle-Tablet, II",
    description:
      "*Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet II:**\n\n*\"You would think that you put on your bread, but instead it soars like a queen.\"*",
    houseIds: [jones.id],
  });

  // Croft A2M1 — The Reckoning Floor (4 cards, distributed Croft 1 / Drake 1 / Jones 2)
  await createClueCard({
    gameId: game.id, cardSetId: csCalculationTablet.id, act: 2,
    clueVisibleCategory: "Calculation Tablet",
    header: "Three Calculation Tablet",
    description:
      "*The calculator's working note for digit-class **3**.*\n\n\"Three-class pebbles mark the unit. Find every 3 on the floor record bearing a sequence number. Trace them in order. Their path is the first letter of the answer.\"\n\n*(Math here writes itself in language.)*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCalculationTablet.id, act: 2,
    clueVisibleCategory: "Calculation Tablet",
    header: "Five Calculation Tablet",
    description:
      "*The calculator's working note for digit-class **5**.*\n\n\"Five-class pebbles mark the rate. Find every numbered 5. Trace in sequence. The shape is the second letter.\"",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCalculationTablet.id, act: 2,
    clueVisibleCategory: "Calculation Tablet",
    header: "Seven Calculation Tablet",
    description:
      "*The calculator's working note for digit-class **7**.*\n\n\"Seven-class pebbles mark the elapsed. Trace every numbered 7 in sequence.\"",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCalculationTablet.id, act: 2,
    clueVisibleCategory: "Calculation Tablet",
    header: "Nine Calculation Tablet",
    description:
      "*The calculator's working note for digit-class **9**.*\n\n\"Nine-class pebbles mark the remainder. Trace every numbered 9 in sequence.\"",
    houseIds: [jones.id],
  });

  // Croft A2M2 — The Sighting Wall (3 cards, all Croft)
  await createClueCard({
    gameId: game.id, cardSetId: csLensLabel.id, act: 2,
    clueVisibleCategory: "Lens-Label",
    header: "Lens-Label, Bundle I",
    description:
      "Lens-labels fallen from the sighting wall and scattered to the chamber below. Each label once sat beside a polished amber lens.\n\n**Cluster 1 (2 lenses):** NIGHT, SURRENDER\n\n**Cluster 2 (2 lenses):** DARK, THRONE",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csLensLabel.id, act: 2,
    clueVisibleCategory: "Lens-Label",
    header: "Lens-Label, Bundle II",
    description:
      "**Cluster 3 (2 lenses):** HEAT, LIE\n\n**Cluster 4 (2 lenses):** SHADOW, SUN",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csLensLabel.id, act: 2,
    clueVisibleCategory: "Lens-Label",
    header: "Lens-Label, Bundle III",
    description:
      "**Cluster 5 (2 lenses):** DAY, DEATH",
    houseIds: [croft.id],
  });

  // Croft A2M3 — Krane's Compartment (3 cards, distributed)
  await createClueCard({
    gameId: game.id, cardSetId: csKraneTile.id, act: 2,
    clueVisibleCategory: "Krane's Tile-Insert",
    header: "Krane's Compartment Tile, Slot 1",
    description:
      "*A loose tile prised from Krane's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 1 of 4:** clear\n\n**Procedure II — step 1 of 4:** ebb\n\n*(Steps 2 and 3 of each procedure are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csKraneTile.id, act: 2,
    clueVisibleCategory: "Krane's Tile-Insert",
    header: "Krane's Compartment Tile, Slot 2",
    description:
      "*A loose tile prised from Krane's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 2 of 4:** gather\n\n**Procedure II — step 2 of 4:** gather\n\n*(Yes — both procedures use the same word at this position. The QRians liked the rhyme. Steps 1 and 3 are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csKraneTile.id, act: 2,
    clueVisibleCategory: "Krane's Tile-Insert",
    header: "Krane's Compartment Tile, Slot 3",
    description:
      "*A loose tile prised from Krane's compartment-table. Two slot-numbers and their words are intact.*\n\n**Procedure I — step 3 of 4:** darken\n\n**Procedure II — step 3 of 4:** wave\n\n*(Steps 1 and 2 of each procedure are on tiles the other houses hold. Step 4 of each is the blank passcode slot — you have to infer it.)*",
    houseIds: [croft.id],
  });

  // Croft A2M4 — Wall of Repetitions, Purple (3 tiles, distributed)
  await createClueCard({
    gameId: game.id, cardSetId: csPurpleWallTile.id, act: 2,
    clueVisibleCategory: "Purple Wall Tile",
    header: "Purple Wall Tile, 1",
    description:
      "*A pried-loose tile from the east wall, color: purple. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`_NT_L W_ SL_WL_ R_ALI_ED`\n\n*(Two more purple tiles are out there with different worn-smooth positions. Pool all three to read it whole — at every blank, the missing letter is visible on one of the other two.)*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPurpleWallTile.id, act: 2,
    clueVisibleCategory: "Purple Wall Tile",
    header: "Purple Wall Tile, 2",
    description:
      "*A pried-loose tile from the east wall, color: purple. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`U_TI_ WE _LO_LY _EA_IZ_D`\n\n*(Two more purple tiles are out there with different worn-smooth positions. Pool all three to read it whole.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPurpleWallTile.id, act: 2,
    clueVisibleCategory: "Purple Wall Tile",
    header: "Purple Wall Tile, 3",
    description:
      "*A pried-loose tile from the east wall, color: purple. The phrase is mostly intact, but a third of the letter-positions are eroded smooth.*\n\n`UN_IL _E S_OW_Y R_AL_ZE_`\n\n*(Two more purple tiles are out there with different worn-smooth positions. Pool all three to read it whole.)*",
    houseIds: [jones.id],
  });

  // Croft A2M5 — The High Ledge (2 cards, all Croft)
  await createClueCard({
    gameId: game.id, cardSetId: csYenusTablet.id, act: 2,
    clueVisibleCategory: "Yenus Riddle-Tablet",
    header: "Yenus Riddle-Tablet, I",
    description:
      "*Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet I:**\n\n*\"The gift you always have, at all times.\"*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csYenusTablet.id, act: 2,
    clueVisibleCategory: "Yenus Riddle-Tablet",
    header: "Yenus Riddle-Tablet, II",
    description:
      "*Translated from QRian wordplay; the original puns are English-equivalent in form.*\n\n**Tablet II:**\n\n*\"Add a G; it describes the Earth. Remove the G; it describes the Earth.\"*",
    houseIds: [croft.id],
  });

  // ═══════════════════════════════════════════════════════════════════
  // STORY SHEETS (Act 2)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 2 story sheets...");

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: drake.id,
      act: 2,
      title: "Drake Delegation — Act 2: The Corruption",
      content: `You climbed up out of the floodwater into the Green Department — a vast botanical chamber the QRians built above their lower temple. Vines hang in three-story curtains. Glass phials line stone shelves. The air is heavier here, sweeter, wrong.

The temple is sealing itself. Every passage you came up through is grinding shut behind you, and the doors ahead are narrowing on a clock you can't see. Twenty minutes, maybe less.

This was a working chamber. Pharmacists, chemists, builders, engineers. The QRians made things here — and not all of them were medicine. Drake's instinct: find what they were really making. The other houses are reading walls. You came to read inventories.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: jones.id,
      act: 2,
      title: "Jones Junket — Act 2: The Corruption",
      content: `You climbed up out of the floodwater into the Green Department — the QRians' upper temple, garden and library and infirmary all at once. Sunlight comes down through shattered glass three stories above you. The vines are alive. The air smells of something half-medicinal, half-fungal.

The temple is sealing itself. You can hear the doors closing one corridor at a time. The clock is real and it is short.

This is the chamber of the writers. Wall after wall of carved phrase, hung tag after hung tag of painted glyph, scroll after sealed scroll. They wrote *constantly*. They could not stop. Jones's instinct: read everything. Whatever the QRians wanted preserved, they preserved it in language — and language is what you came here to read.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: croft.id,
      act: 2,
      title: "Croft Company — Act 2: The Corruption",
      content: `You climbed up out of the floodwater into the Green Department — a high chamber the QRians built into the canopy itself. Stone slabs underfoot, slits in the walls looking out over the basin, a sighting wall full of polished lenses pointed at a sky you can't see from here.

The temple is sealing itself. Every passage you came up through is closing on a deadline you can feel in your teeth.

This chamber was built by people who measured. They were calculating something — on the floor, through the lenses, in the columns of inset tiles cut into stone tables. Croft's instinct: read what they were measuring. Math doesn't lie, and the QRians left their math behind. If they ran out of time partway through a calculation, the answer is still in the room.`,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACT 1 → ACT 2 CONSEQUENCE GATES
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 → Act 2 consequence gates...");

  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_drake_crew.id,
      targetMissionId: m_drake_a2_bunker.id,
      type: "lock",
      triggerOnFailure: true,
      triggerOnSuccess: false,
      message:
        "You didn't recover the Fuse Charges in Act 1 — this mission is impossible. Togom's bunker is sealed behind reinforced masonry; only precision explosives will breach it. The wall stays shut and his scrolls stay buried.",
      sortOrder: 1,
    },
  });

  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_jones_crew.id,
      targetMissionId: m_jones_a2_garden.id,
      type: "lock",
      triggerOnFailure: true,
      triggerOnSuccess: false,
      message:
        "You didn't recover the Ceremonial Whips in Act 1 — this mission is impossible. The canopy hangs at lethal density; only a precision whip-crack can drop a single tag without dropping the whole curtain onto the floor seal. The room is unreachable.",
      sortOrder: 1,
    },
  });

  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_croft_crew.id,
      targetMissionId: m_croft_a2_ledge.id,
      type: "lock",
      triggerOnFailure: true,
      triggerOnSuccess: false,
      message:
        "You didn't recover the Grappling Rigs in Act 1 — this mission is impossible. Yenus's ledge is twelve feet of sheer rock with no holds. Without your rigs, the compartment stays out of reach.",
      sortOrder: 1,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACT 3 HISTORY CARDS
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 3 history cards...");

  const act3HistoryCards: {
    header: string;
    description: string;
    order: number;
    houseIds: string[];
    notes: string;
  }[] = [
    {
      header: "Letter from a Schoolmaster",
      description: `*From the first year of the valley schools*

This year, four children from the farms were sent to us for lessons. By the second month, two were solving proofs that my best students used to need a year to understand. One girl, Mila, corrected my star-table in front of the whole class. She was right.

The council calls the Source a blessing from the earth. I am beginning to think they may be right. I have never seen people learn this quickly.`,
      order: 1,
      houseIds: [croft.id],
      notes: "Discovery era. Jones-leaning evidence: the Source accelerated learning dramatically.",
    },
    {
      header: "Clinic Record: First Exposure",
      description: `*From the third season of supervised visits*

Teren, age fifteen. First supervised visit to the bright chamber.

He returned alert, articulate, and able to complete number exercises well above his level. He also showed little interest in food, slept poorly, and became distressed when the counting stones were taken from his hands.

Recommendation: no second visit until he can be made to leave the problem unfinished without distress.`,
      order: 2,
      houseIds: [drake.id],
      notes: "Discovery era. Croft-leaning evidence: the benefit was real, but so were the first visible harms.",
    },
    {
      header: "Note Tied to a Box of Learning Blocks",
      description: `*Written after the new square script was adopted for children*

These stone blocks are for the younger pupils. The new square symbols are easier to sort, easier to stack, and easier to remember than the old hand.

Keep them out of the sleeping rooms.

Last week I found two children awake after midnight, building perfect towers in the dark and whispering sums to each other.`,
      order: 3,
      houseIds: [jones.id],
      notes: "Discovery era hinge card: practical educational gains and compulsion arrive together.",
    },
    {
      header: "Order Limiting Second Visits",
      description: `*Issued after repeat visits became common*

By order of the Survey Council: no citizen may enter the bright chamber twice in the same ten-day unless called by the schools or the measuring office.

This rule is not a punishment. It is a correction. Too many who leave the chamber ask to return before their work is even copied down.`,
      order: 4,
      houseIds: [croft.id],
      notes: "Discovery era. Drake-leaning evidence: boundary-setting began early because people could not leave the Source alone.",
    },
    {
      header: "The Fifty-Seventh Lesson",
      description: `*From the year the schools began promoting children early*

By the fifty-seventh lesson, even the fisherman's son could derive the sky-table. We have begun promoting children before their elders can finish the proofs they wrote for them.

I record this with pride, and with some shame: the Source has made fools into scholars so quickly that we have mistaken speed for wisdom.`,
      order: 5,
      houseIds: [drake.id],
      notes: "Dependency era. Jones-leaning evidence: the Source kept producing astonishing advancement.",
    },
    {
      header: "Kitchen Complaint from the Workers' Hall",
      description: `*From the period of first public disturbances*

Today seven laborers refused to sit because the table had eight places. Yesterday a mother sent back bread because it was round.

They speak more gently than before. They thank me. They apologize. Then they leave the food untouched and go back to the stones.

We are feeding the mind and forgetting the mouth.`,
      order: 6,
      houseIds: [drake.id],
      notes: "Dependency era. Croft-leaning evidence: the corruption became social and ordinary.",
    },
    {
      header: "Order to Break the Fifth Drain",
      description: `*Written after the night returns began*

Valve Five is to be struck dead by chisel before dusk.

Too many have learned the drainage paths and use them to return to the lower chamber unseen. They say they are only checking a line of figures. They say they can still stop whenever they wish. They say this while already asking for the key.

We do not break this passage because it failed. We break it because we can no longer trust ourselves with a way back.`,
      order: 7,
      houseIds: [jones.id],
      notes: "Dependency era. Drake-leaning evidence: the QRians no longer trusted voluntary restraint.",
    },
    {
      header: "Letter of Priest-Scientist Ennar",
      description: `*Written after the first routes were closed*

My students solved in one season what my teachers could not solve in twenty years. The city calls this a blessing. I did too, once.

Yesterday I found Tarek still at his tablet after sunset, after moonrise, after dawn. He had not eaten. When I touched his shoulder, he wept as if I were dragging him from prayer.

We are becoming excellent at the cost of becoming unable to stop.`,
      order: 8,
      houseIds: [croft.id],
      notes: "Dependency era hinge card: the Source's gift and pathology are inseparable.",
    },
    {
      header: "The Last Copyist's Oath",
      description: `*From the final months before the upper archive was closed*

There are nine of us left in the upper archive, and three can no longer hold a stylus steady. We have begun copying the star tables onto thinner clay because the stone shelves must be given to grain and seal-tools.

If the chambers are closed before we finish, let it be written that we did not hide the truth because we feared it. We hid it because we feared leaving nothing behind except a warning and a locked door.`,
      order: 9,
      houseIds: [croft.id],
      notes: "Consent era. Jones-leaning evidence: even at the end, preserving knowledge mattered.",
    },
    {
      header: "Plain Warning for the Lower Stair",
      description: `*Posted after the old warnings were judged a failure*

DO NOT GO LOWER. THE AIR BELOW MAKES THE MIND WRONG.

Do not pray there. Do not study there. Do not sleep near the bright stone. If you have been below and now wish only to count, sort, or return, you are already touched. Tell another and let them bind your hands.`,
      order: 10,
      houseIds: [jones.id],
      notes: "Consent era. Croft-leaning evidence: the QRians eventually reframed the Source as a plain hazard.",
    },
    {
      header: "Foreman Krane's Completion Record",
      description: `*Written during the final closing of the temple*

West choke-point sealed at dusk. False stair cut and dressed to appear older than the true passage. Third gate lowered before noon.

The council's order stands: no straight road in, no clear road out, and no chamber that opens without witness. If we build mercy into the plan, someone later will mistake it for an invitation.

Six laborers were lost today. The work continues at first light.`,
      order: 11,
      houseIds: [drake.id],
      notes: "Consent era. Drake-leaning evidence: the temple was consciously designed as prison architecture.",
    },
    {
      header: "Testimony of Sefa Before the Closing",
      description: `*Recorded on the last day before the lower seal was set*

We had the land-killing compounds. We tested them on the moss terraces, and nothing green returned. We could have made the valley unlivable and called that virtue.

Instead we chose the temple, though it would take our own with it. I do not know if this was courage, vanity, or merely the last form our love of order could take.

I know only that we chose to leave the future a danger behind stone, not a world already ruined by our fear.`,
      order: 12,
      houseIds: [jones.id],
      notes: "Consent era hinge card: the QRians chose containment over annihilation, but without moral certainty.",
    },
  ];

  for (const historyCard of act3HistoryCards) {
    const card = await prisma.card.create({
      data: {
        gameId: game.id,
        physicalCardId: nextPhysicalCardId(3),
        act: 3,
        subtype: "history",
        historyTimelineOrder: historyCard.order,
        cardSetId: csAct3History.id,
        designId: designByCardSet[csAct3History.id],
        clueVisibleCategory: "History Fragment",
        complexity: "simple",
        header: historyCard.header,
        description: historyCard.description,
        notes: historyCard.notes,
      },
    });
    await assignCardHouses(card.id, historyCard.houseIds);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ACT 3 REFERENCE CARDS
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 3 reference cards...");

  // Each Act 3 outcome lives with the house that would propose it.
  const outcomeHouseByOutcomeId: Record<string, string> = {
    destroy_source: drake.id,       // Drake — finality / settle the threat
    recontain_source: croft.id,     // Croft — stewardship / contain don't open
    open_for_research: jones.id,    // Jones — knowledge / publish + access
  };

  // Each Act 3 clause lives with the house whose platform would propose it.
  // Other houses can agree or refuse; only the holder can put it on the table.
  const clauseHouseByClauseId: Record<string, string> = {
    // Jones — Knowledge platform: writing survives, world hears, museums get pieces.
    copy_inscriptions: jones.id,
    publish_discovery: jones.id,
    preserve_some_artifacts: jones.id,
    // Croft — Stewardship platform: shared, supervised, glory-free, future warned.
    open_under_guard: croft.id,
    three_house_custody: croft.id,
    no_house_takes_credit: croft.id,
    leave_unmistakable_warning: croft.id,
    // Drake — Containment platform: lock it down forever, nothing leaves.
    falsify_reports: drake.id,
    no_artifacts_leave: drake.id,
    suppress_location: drake.id,
    archive_everything_then_destroy: drake.id,
    bury_approach: drake.id,
  };

  for (const outcome of FINALE_OUTCOMES) {
    const card = await prisma.card.create({
      data: {
        gameId: game.id,
        physicalCardId: nextPhysicalCardId(3),
        act: 3,
        subtype: "reference",
        cardSetId: csAct3Outcome.id,
        designId: designByCardSet[csAct3Outcome.id],
        clueVisibleCategory: "Major Decision",
        complexity: "simple",
        header: outcome.label,
        description: outcome.description,
        notes: `Act 3 outcome reference card (${outcome.id}).`,
      },
    });
    const ownerHouseId = outcomeHouseByOutcomeId[outcome.id];
    if (ownerHouseId) {
      await assignCardHouses(card.id, [ownerHouseId]);
    }
  }

  for (const clause of FINALE_CLAUSES) {
    const card = await prisma.card.create({
      data: {
        gameId: game.id,
        physicalCardId: nextPhysicalCardId(3),
        act: 3,
        subtype: "reference",
        cardSetId: csAct3Clause.id,
        designId: designByCardSet[csAct3Clause.id],
        clueVisibleCategory: "Settlement Clause",
        complexity: "simple",
        header: clause.label,
        description: clause.description,
        notes: `Act 3 clause reference card (${clause.id}).`,
      },
    });
    const ownerHouseId = clauseHouseByClauseId[clause.id];
    if (ownerHouseId) {
      await assignCardHouses(card.id, [ownerHouseId]);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STORY SHEETS (Act 3)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 3 story sheets...");

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: drake.id,
      act: 3,
      title: "Drake Delegation — Act 3: The Dying Light",
      content: `The temple is not just old. It is a decision someone else made and forced into stone.

Act 3 begins with comparison, not conquest. Pool what your house knows with what the others know. Reconstruct the order of the QRians' rise, dependence, and collapse. Only then decide what the living owe the future.

Drake's instinct is simple: if the Source remained dangerous even after the builders understood it, then leaving a live wound behind is cowardice disguised as caution. You do not have to destroy it at any cost. But you must push for an ending that actually settles the threat, not one that merely postpones it.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: jones.id,
      act: 3,
      title: "Jones Junket — Act 3: The Dying Light",
      content: `The final chamber is now a matter of history as much as danger.

Act 3 begins by comparing notes across all three houses. Build the temple's true timeline together. What did the Source give the QRians? What did it take from them? What did they choose at the end?

Jones's instinct is equally simple: destroying or burying the Source without understanding what it made possible would be a second tragedy. Push for a future in which truth survives, even if access must be constrained. If the room decides to close the book, make sure it does not also burn the archive.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: croft.id,
      act: 3,
      title: "Croft Company — Act 3: The Dying Light",
      content: `The QRians left behind more than ruins. They left behind a warning poorly translated by the centuries.

Act 3 starts with collective reconstruction. Compare evidence, assemble the true order of events, and decide what the builders were trying to prevent.

Croft's instinct is stewardship. Some discoveries are real and beautiful and still too dangerous to treat as prizes. Push for an ending that protects the world from the Source without reducing the room to panic. The question is not just what you can reach. It is what should be left unopened, and how clearly you owe that warning to whoever comes next.`,
    },
  });

  // ═══════════════════════════════════════════════════════════════════

  console.log(
    `\n✓ Created "${GAME_NAME}" with 3 houses, 33 card sets, 7 designs, 30 answers, 15 Act 1 missions, 15 Act 2 missions, 47 Act 1 cards, 43 Act 2 cards, 27 Act 3 cards, 3 Act 1→Act 2 lock gates, and 9 story sheets.\n`,
  );
  console.log("Game ID:", game.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
