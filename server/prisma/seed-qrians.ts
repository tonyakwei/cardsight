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

// Stable UUIDs locked in 2026-05-04. Reseeds reuse these so printed mission
// QR codes (on story sheets) and saved cs_house cookies on player phones
// keep working. To add a new mission, generate a fresh UUID with
// `node -e "console.log(crypto.randomUUID())"` and slot it in by title.
// NEVER reuse a UUID for a different mission — old printed QRs would route
// to the wrong content.
const STABLE_GAME_ID = "c4743025-8672-4a08-9833-29594252693b";
const STABLE_HOUSE_IDS = {
  drake: "930e42aa-6e84-4a63-b346-74eacf0e1f03",
  jones: "13397b03-825e-40c1-9385-d15e97d18da6",
  croft: "2f24877d-333e-435a-9700-f981c90c3d5f",
} as const;
const STABLE_MISSION_IDS: Record<string, string> = {
  // Act 1 — Drake
  "Secure Your Fuse Charges": "d3b7e743-85c1-4d8b-977e-246ae8d0360a",
  "Operate the Stone Wheel": "96257809-4a39-4b17-b995-3f1d489a1bad",
  "Reach the Shadow Astrolabe": "643cd86a-9017-444b-8171-a188ec7366d7",
  "Activate the Construction Hoist": "2e48c0e5-29fc-4214-9921-1c3157e5b861",
  "Investigate the Scraped Gap": "331188df-4e55-4130-bbcd-4ae58018e762",
  // Act 1 — Jones
  "Retrieve Your Ceremonial Whips": "49769804-1a04-44e3-8634-86ee5d606392",
  "Activate the Ancient Drainage": "54876e1c-044b-47a1-9776-43720f59832d",
  "Sort the Scattered Offerings": "4a138024-face-42e5-915f-aa9229461089",
  "Examine the Sliding Panels": "7ca0d122-d186-4baa-8709-7b37ba73633d",
  "Map the False Exit": "7a6e5782-3dfa-44b8-bee1-5da7aceeb4da",
  // Act 1 — Croft
  "Recover Your Grappling Rigs": "642a4b7f-34fe-4c81-a37a-a53d7a512118",
  "Solve the Stone Jigsaw": "f2ccad0c-bbc5-456f-a78b-fba72522fd1f",
  "Reach the Impossible Vase": "f91e0d04-3046-472a-ab80-f712063a9a76",
  "Activate the Teaching Stone": "427d6720-e6ae-4dfb-bf66-32c54d2e0f78",
  "Follow the Drag Marks": "d5f92a51-ed24-4658-9e9f-a87d3abd6310",
  // Act 2 — Drake
  "Powder of the Quiet Bed": "91d694e0-311a-4134-b864-744edd74f9f7",
  "Drevu's Compartment": "1d45338f-58f8-40ec-994a-65013c5d1c72",
  "The Wall of Repetitions, Red": "6b2c42b9-0764-46ca-9379-86faedc28e2e",
  "The Reagent Alcove": "213f3323-85da-4fc1-bc9f-aa10f357a94b",
  "The Reinforced Bunker": "75ca2bb8-b166-418f-aa09-3c0ca573331b",
  // Act 2 — Jones
  "The Sealed Pantry": "09047829-3e1c-4cbe-9eaf-8244b5ed1f8e",
  "The Wall of Repetitions, Amber": "764404ed-eeae-4a9f-9fed-125c4ec8bf8c",
  "Vesh's Compartment": "7bb89378-2ab9-4d0c-ba1a-679e1b53ae4a",
  "The Hanging Garden of Names": "55202ffb-52a4-4ec6-94b1-84f693209832",
  "The Ceiling Inscription": "3ad37d5a-d0ae-4b86-adc9-29196ed4dcc3",
  // Act 2 — Croft
  "The Reckoning Floor": "7da0d896-5027-4c08-acfb-7a9cdc952065",
  "The Sighting Wall": "a5ad8223-54bb-4062-85a0-8a7bfe0cef48",
  "Krane's Compartment": "b420b5bb-e8a5-4ef2-8eda-07b0edefdf96",
  "The Wall of Repetitions, Purple": "838fd464-b0bd-417b-bc3d-4c22097994d0",
  "The High Ledge": "6257519d-9a59-47a7-83e5-2156a6a579e0",
};

/**
 * Drop-in replacement for prisma.mission.create that auto-injects the stable
 * UUID looked up by title. Throws if the title isn't registered above —
 * forces every new mission to get a stable ID before it ships.
 */
async function createMission(args: Parameters<typeof prisma.mission.create>[0]) {
  const title = (args.data as { title?: string }).title;
  if (!title) {
    throw new Error("createMission: data.title is required");
  }
  const id = STABLE_MISSION_IDS[title];
  if (!id) {
    throw new Error(
      `createMission: no stable UUID for "${title}". Add one to STABLE_MISSION_IDS.`,
    );
  }
  return prisma.mission.create({ ...args, data: { id, ...args.data } });
}

// Three white physical cards reserved for the "A Trip Down Memory Lane" cards.
// One placed at each table — the cookie's house decides which memory plays.
const MEMORY_PHYSICAL_IDS = {
  drake: "ea00af39-b3bb-457b-98c3-6db7cd83ad5f", // Forgotten Snowflake (white #1)
  jones: "83296f7e-1fe9-4c79-83db-e43da386915f", // Motherly Moon       (white #2)
  croft: "5462a9e9-ea11-4824-bb06-e273cbd6d525", // Propitious Dove     (white #3)
} as const;
const MEMORY_PHYSICAL_IDS_LIST = Object.values(MEMORY_PHYSICAL_IDS);

const MEMORY_LOCKOUT_MESSAGE =
  "Your team is far too busy fulfilling missions to reflect on their past. Do some more missions and try scanning this card again.";

const MEMORY_STORY_DRAKE = `*From the eyes of a person from Drake Delegation...*

He had his boots up on the desk and his shirt half-tucked, the way he always did. The ring on the chain at his throat caught the light when he leaned forward. "Sign here," he said, sliding the license across. "Don't read it. They never write the fun parts down."

I picked up the pen. He grinned. "Listen. Out there, you're going to be the only one in the room who thinks something's possible. That feeling — everybody else looking at you like you've lost it — that's how you'll know you're close. Always be bold. Have a confidence nobody else gets to share. That's the whole job."

He flipped a stick of dynamite end over end and caught it without watching. "Welcome to the trade." I nodded. Slowly, then quickly. It was time to make some noise.`;

const MEMORY_STORY_JONES = `*From the eyes of a person from Jones Junket...*

He didn't turn around when I came in. The fedora sat on the desk, the way it had every afternoon I'd come, for fifteen years. "Sit down," he said, his back still to me. Then, after a long moment: "You're ready."

I started to say something. He held up a hand. "There are things out there you will never accept. Things you will never understand. That isn't what worries me." He turned then, and the scar on his chin caught the lamp. "Promise me you will stay curious. All of it. Even when it costs you."

He slid a coiled whip across the desk — new leather, still stiff, the grip wrapped tight. I nodded. Slowly, then quickly. It was time to take up the mantle.`;

const MEMORY_STORY_CROFT = `*From the eyes of a person from Croft Company...*

She walked ten paces ahead of me down the trail, the braid swinging against her pack, her boots leaving sharp prints in the wet earth. "—and the Hittite vassal treaties echo this almost word for word, which is how we know the tablet was political and not religious, though of course the priest-class would have read both functions into it, the way the second-dynasty scribes did in Ugarit, which —" She kept going. I had stopped writing two sentences ago. The rain was cooling on the back of my neck.

She stopped. Did not turn fully — just enough to see me over her shoulder, her face very calm. "Someday you'll know all this, and more too." Then she turned and walked on, still talking, the words slipping into the canopy above us.

I nodded. Slowly, then quickly. It was time to start catching up.`;

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
  await prisma.multipleAnswer.deleteMany({ where: { gameId: gid } });
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
  selfDestructTimer?: number;
  selfDestructText?: string;
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
      selfDestructTimer: opts.selfDestructTimer ?? null,
      selfDestructText: opts.selfDestructText ?? null,
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

  // Reserve 3 specific white cards for the "A Trip Down Memory Lane" cards
  // (one per house). Pulling them out of the shuffle pool now keeps clue
  // cards from being assigned the same UUIDs.
  for (const reservedId of MEMORY_PHYSICAL_IDS_LIST) {
    const idx = physicalCards.findIndex((p) => p.id === reservedId);
    if (idx !== -1) physicalCards.splice(idx, 1);
  }

  // ═══════════════════════════════════════════════════════════════════
  // GAME
  // ═══════════════════════════════════════════════════════════════════

  // Demote any other active game so the new one is the unique active.
  // The QR scan resolver does findFirst({ status: "active" }) and would
  // pick whichever it finds first, so we enforce the invariant up front.
  await prisma.game.updateMany({
    where: { status: "active" },
    data: { status: "completed" },
  });

  console.log("Creating game...");
  const game = await prisma.game.create({
    data: {
      id: STABLE_GAME_ID,
      name: GAME_NAME,
      description:
        "Three expedition teams enter a sealed temple built by the QRians — a civilization that fused mathematics and religion. The temple was sealed centuries ago with warnings carved into every surface. Three acts: The Flood, The Corruption, The Dying Light.",
      status: "active",
      printTheme: "temple",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // HOUSES
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating houses...");
  const drake = await prisma.house.create({
    data: { id: STABLE_HOUSE_IDS.drake, gameId: game.id, name: "Drake Delegation", color: "#dc2626", slug: "drake" },
  });
  const jones = await prisma.house.create({
    data: { id: STABLE_HOUSE_IDS.jones, gameId: game.id, name: "Jones Junket", color: "#ca8a04", slug: "jones" },
  });
  const croft = await prisma.house.create({
    data: { id: STABLE_HOUSE_IDS.croft, gameId: game.id, name: "Croft Company", color: "#7c3aed", slug: "croft" },
  });

  // ═══════════════════════════════════════════════════════════════════
  // MEMORY CARDS — "A Trip Down Memory Lane" (Act 1)
  // ═══════════════════════════════════════════════════════════════════
  // Three white physical cards, one per house. At scan time the cookie's
  // house decides which memory plays — the scanned card's identity is
  // irrelevant. Gated by completing 3 missions in Act 1.

  console.log("Creating memory cards...");
  await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: MEMORY_PHYSICAL_IDS.drake,
      act: 1,
      subtype: "memory",
      memoryHouseId: drake.id,
      header: "A Trip Down Memory Lane",
      description: MEMORY_STORY_DRAKE,
      lockoutMessage: MEMORY_LOCKOUT_MESSAGE,
      complexity: "simple",
    },
  });
  await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: MEMORY_PHYSICAL_IDS.jones,
      act: 1,
      subtype: "memory",
      memoryHouseId: jones.id,
      header: "A Trip Down Memory Lane",
      description: MEMORY_STORY_JONES,
      lockoutMessage: MEMORY_LOCKOUT_MESSAGE,
      complexity: "simple",
    },
  });
  await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: MEMORY_PHYSICAL_IDS.croft,
      act: 1,
      subtype: "memory",
      memoryHouseId: croft.id,
      header: "A Trip Down Memory Lane",
      description: MEMORY_STORY_CROFT,
      lockoutMessage: MEMORY_LOCKOUT_MESSAGE,
      complexity: "simple",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // CARD SETS (clue categories)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating card sets...");

  // Drake
  const csDetonatorComponent = await prisma.cardSet.create({
    data: { gameId: game.id, name: "Detonator Component", color: "#6b7280" },
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
    data: { gameId: game.id, name: "Pipe Bundle", color: "#b45309" },
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
      fontFamily: "'IM Fell DW Pica SC', 'Cormorant Garamond', serif",
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

  // Per-house Settlement designs — for Act 3 outcomes + clauses, themed to
  // the house that holds them. Bigger headline, drop shadow, instant zoom-in
  // (no "hacker" decrypt intro).
  const settlementCustomCss = `
    .card-header {
      font-size: 4.5rem !important;
      letter-spacing: 0.02em;
      text-shadow: 0 4px 18px rgba(0, 0, 0, 0.65), 0 1px 0 rgba(0, 0, 0, 0.5);
      overflow-wrap: break-word;
      word-break: break-word;
      hyphens: auto;
    }
    .card-description {
      font-size: 1.4rem !important;
    }
    .card-item-tag {
      opacity: 0.8 !important;
    }
  `;

  const designDrakeSettlement = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Drake Settlement",
      bgColor: "#3a0a08",
      bgGradient: "linear-gradient(160deg, #5a1410 0%, #3a0a08 55%, #1c0504 100%)",
      textColor: "#fce6dc",
      accentColor: "#ff8a72",
      secondaryColor: "#c0392b",
      fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
      cardStyle: "standard",
      animationIn: "zoom-in",
      borderStyle: "1px solid rgba(220, 38, 38, 0.45)",
      customCss: settlementCustomCss,
    },
  });

  const designJonesSettlement = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Jones Settlement",
      bgColor: "#2c1f06",
      bgGradient: "linear-gradient(160deg, #5a3e0f 0%, #3a280a 55%, #1a1305 100%)",
      textColor: "#fbeed0",
      accentColor: "#ffd56a",
      secondaryColor: "#ca8a04",
      fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
      cardStyle: "standard",
      animationIn: "zoom-in",
      borderStyle: "1px solid rgba(202, 138, 4, 0.55)",
      customCss: settlementCustomCss,
    },
  });

  const designCroftSettlement = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Croft Settlement",
      bgColor: "#1f0a3a",
      bgGradient: "linear-gradient(160deg, #321558 0%, #1f0a3a 55%, #0c0418 100%)",
      textColor: "#ece0fc",
      accentColor: "#c8a7ff",
      secondaryColor: "#7c3aed",
      fontFamily: "'Cinzel', 'Cormorant Garamond', serif",
      cardStyle: "standard",
      animationIn: "zoom-in",
      borderStyle: "1px solid rgba(124, 58, 237, 0.55)",
      customCss: settlementCustomCss,
    },
  });

  const settlementDesignByHouseId: Record<string, string> = {
    [drake.id]: designDrakeSettlement.id,
    [jones.id]: designJonesSettlement.id,
    [croft.id]: designCroftSettlement.id,
  };

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
    [csDetonatorComponent.id]: designTarnishedMetal.id,
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
      correctAnswer: "purge the floor",
      acceptAlternatives: [],
      hint: "Ignore the dividers between glyph groups. Read all the letters as one continuous string, then find where the real words begin and end. The answer is the unlock sentence.",
      hintAfterAttempts: 2,
    },
  });

  const ansAstrolabe = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Disc I — missing color",
          correctAnswer: "blue",
          acceptAlternatives: ["light blue"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Disc II — missing color",
          correctAnswer: "green",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Disc III — missing color",
          correctAnswer: "pink",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Disc IV — missing color",
          correctAnswer: "brown",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Disc V — missing color",
          correctAnswer: "silver",
          acceptAlternatives: ["grey", "gray", "black"],
          caseSensitive: false,
          trimWhitespace: true,
        },
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
      correctAnswer: "489267153",
      acceptAlternatives: [
        "4 8 9 2 6 7 1 5 3",
        "4-8-9-2-6-7-1-5-3",
        "489267315",
        "4 8 9 2 6 7 3 1 5",
        "4-8-9-2-6-7-3-1-5",
      ],
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
      acceptAlternatives: [
        "5 3 7 1 6 4 2",
        "5-3-7-1-6-4-2",
        "5371462",
        "5 3 7 1 4 6 2",
        "5-3-7-1-4-6-2",
      ],
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

  const ansTeaching = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Position 3 — Outer value",
          correctAnswer: "13",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Position 5 — Outer value",
          correctAnswer: "23",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Position 8 — Outer value",
          correctAnswer: "38",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
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
      hint: "The pharmacist categorized three batches — A, B, C. For each batch, find every numbered specimen on the grid and connect them in the order the pharmacist marked them. The path traces a single letter. Three batches, three letters, one word. Some batch flowers may have no number — they belong to the glyph but stand alone.",
      hintAfterAttempts: 2,
    },
  });

  const ansDrevuCompartment = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Procedure I — Step 4",
          correctAnswer: "shatter",
          acceptAlternatives: ["fragment", "break", "splinter", "burst", "crumble"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Procedure II — Step 4",
          correctAnswer: "divorce",
          acceptAlternatives: ["separate", "breakup", "break up", "end", "regret", "die"],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
      hint: "Two procedures, two answers. Procedure 1 is a fragile object failing in stages. Procedure 2 is a romantic timeline — and the QRians were pessimists who recorded only the tragic ending of any process they observed.",
      hintAfterAttempts: 2,
    },
  });

  const ansRedWall = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "it was making us obsessed",
      acceptAlternatives: ["IT WAS MAKING US OBSESSED", "it-was-making-us-obsessed", "itwasmakingusobsessed", "ITWASMAKINGUSOBSESSED"],
      hint: "Each red tile is a 21-character rewrite. At every position, the original letter is the one that appears on two of the three tiles; the lone outlier is drift. Walk the three tiles position by position.",
      hintAfterAttempts: 2,
    },
  });

  const ansReagentAlcove = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Station 1 — compound",
          correctAnswer: "bronze",
          acceptAlternatives: ["brass"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Station 2 — compound",
          correctAnswer: "glass",
          acceptAlternatives: ["crystal"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Station 3 — compound",
          correctAnswer: "soap",
          acceptAlternatives: ["lye"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Station 4 — compound",
          correctAnswer: "dye",
          acceptAlternatives: ["pigment", "ink"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Station 5 — compound",
          correctAnswer: "perfume",
          acceptAlternatives: ["scent", "fragrance", "essence"],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
      hint: "Each station-cluster of 2 reagents was making one named compound. Match the loose bark-labels back to their stations and read each cluster as a recipe. Five compounds together tell you what they were stockpiling. Write each compound name in its station's slot, in order.",
      hintAfterAttempts: 2,
    },
  });

  const ansReinforcedBunker = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Togom Riddle-Tablet I",
          correctAnswer: "orbit",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Togom Riddle-Tablet II",
          correctAnswer: "grenade",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
    },
  });

  // ─── Act 2 answers — Jones ──────────────────────────────────────────

  const ansSealedPantry = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Shelf 1 — preparation",
          correctAnswer: "pepper",
          acceptAlternatives: ["peppercorn", "spice"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Shelf 2 — preparation",
          correctAnswer: "porridge",
          acceptAlternatives: ["oatmeal", "gruel"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Shelf 3 — preparation",
          correctAnswer: "oil",
          acceptAlternatives: ["oils"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Shelf 4 — preparation",
          correctAnswer: "cake",
          acceptAlternatives: ["honeycake", "honey cake", "loaf"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Shelf 5 — preparation",
          correctAnswer: "milk",
          acceptAlternatives: ["cream", "dairy", "broth"],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
      hint: "Each shelf-cluster of 2 ingredients was making one named food. Match the loose labels back to their shelves and read each cluster as a recipe. Five preparations together tell you the pantry's purpose.",
      hintAfterAttempts: 2,
    },
  });

  const ansAmberWall = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "this place once made us wise",
      acceptAlternatives: ["THIS PLACE ONCE MADE US WISE", "this-place-once-made-us-wise", "thisplaceoncemadeuswise", "THISPLACEONCEMADEUSWISE"],
      hint: "Each amber tile is a 23-character rewrite. At every position, the original letter is the one that appears on two of the three tiles; the lone outlier is drift. Walk the three tiles position by position.",
      hintAfterAttempts: 2,
    },
  });

  const ansVeshCompartment = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Procedure I — Step 4",
          correctAnswer: "vein",
          acceptAlternatives: ["root", "vien"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Procedure II — Step 4",
          correctAnswer: "sneeze",
          acceptAlternatives: ["achoo", "blast", "spray", "expel", "relief"],
          caseSensitive: false,
          trimWhitespace: true,
        },
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

  const ansCeilingInscription = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Sefa Riddle-Tablet I",
          correctAnswer: "flower",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Sefa Riddle-Tablet II",
          correctAnswer: "butterfly",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
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
      hint: "For each, find every numbered instance on the pebble floor and connect them in order. The path traces a letter. What kind of letter? Four letters, one word.",
      hintAfterAttempts: 2,
    },
  });

  const ansSightingWall = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Cluster 1 — observation",
          correctAnswer: "dawn",
          acceptAlternatives: ["sunrise", "daybreak", "first light"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Cluster 2 — observation",
          correctAnswer: "midnight",
          acceptAlternatives: ["midnite"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Cluster 3 — observation",
          correctAnswer: "mirage",
          acceptAlternatives: ["illusion"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Cluster 4 — observation",
          correctAnswer: "eclipse",
          acceptAlternatives: ["occultation"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Cluster 5 — observation",
          correctAnswer: "sunset",
          acceptAlternatives: ["sundown", "dusk", "twilight"],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
      hint: "Each cluster of 2 lens-slits aimed at one phenomenon. Match the loose labels to their lenses; read each cluster as a single observation. Every one of them is a moment where the sky's behavior shifts. Write each observation in its cluster's slot, in order.",
      hintAfterAttempts: 2,
    },
  });

  const ansKraneCompartment = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Procedure I — Step 4",
          correctAnswer: "storm",
          acceptAlternatives: ["rain", "thunder", "lightning", "pour", "downpour", "break"],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Procedure II — Step 4",
          correctAnswer: "crash",
          acceptAlternatives: ["flow", "break", "crest", "recede", "surge", "foam", "wash"],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
      hint: "Two procedures, two answers. Procedure 1 walks the sky from clear to dark — what's the climax? Procedure 2 traces the cycle of water against shore — what's the final motion?",
      hintAfterAttempts: 2,
    },
  });

  const ansPurpleWall = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "until we slowly realized",
      acceptAlternatives: ["UNTIL WE SLOWLY REALIZED", "until-we-slowly-realized", "untilweslowlyrealized", "UNTILWESLOWLYREALIZED"],
      hint: "Each purple tile is a 21-character rewrite. At every position, the original letter is the one that appears on two of the three tiles; the lone outlier is drift. Walk the three tiles position by position.",
      hintAfterAttempts: 2,
    },
  });

  const ansHighLedge = await prisma.multipleAnswer.create({
    data: {
      gameId: game.id,
      fields: [
        {
          prompt: "Yenus Riddle-Tablet I",
          correctAnswer: "present",
          acceptAlternatives: [],
          caseSensitive: false,
          trimWhitespace: true,
        },
        {
          prompt: "Yenus Riddle-Tablet II",
          correctAnswer: "ground",
          acceptAlternatives: ["round"],
          caseSensitive: false,
          trimWhitespace: true,
        },
      ],
      hint: "Two cryptic riddles. The first riddle is a single word with two meanings at once — a gift, and a moment in time. The second tells you what to do with a letter: add a G, then remove it.",
      hintAfterAttempts: 2,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACT 1 MISSIONS — DRAKE DELEGATION
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 missions — Drake...");

  const m_drake_crew = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Secure Your Fuse Charges",
      storySheetBlurb:
        "Your famous precision explosives are dead weight without the fuse charges. Seven components scattered across the chamber when the blast hit \u2014 and other teams swept some up in the chaos. They know exactly what they're holding. You're going to have to get them back, then rebuild the sequence from memory\u2026",
      correctAnswerReveal:
        "Click. Click. Click. Seven components, locked in sequence, just like training. The precision explosives are live. Whether you'll need them down here is another question \u2014 but up ahead, in whatever comes next, you'll have options the other teams don't.",
      description:
        "",
      puzzleDescription:
        "Seven detonator components need to be assembled in the correct order — but the components are scattered across the chamber, and other teams swept some up in the chaos. (The labels on the inventory (#1–#7) do not indicate assembly order).\n\nYou're going to have to gather all *Detonator Component*s from the chamber, read each part's numbered label for hints about where it sits in the sequence, then assemble the detonator in order.\n\nWhat's the order?",
      requiredClueSets: [{ cardSetId: csDetonatorComponent.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansFuseCharges.id,
      consequenceCompleted:
        "The charges are assembled and secured. The team moves with a little more swagger \u2014 you're the only crew in this temple with a real ace up your sleeve. Whatever's ahead, you can blow through it. Literally.",
      consequenceNotCompleted:
        "The components are scattered, some lost to the water, some still in the hands of teams who wouldn't give them up in time. Your precision explosives are gone. Drake without firepower is just... people in balaclavas. Morale takes a serious hit...",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_drake_crew.id, [drake.id]);

  const m_drake_flood = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Operate the Stone Wheel",
      storySheetBlurb:
        "All houses blame you for the flooding. But set into the far wall, there's a heavy stone wheel \u2014 with channels radiating from its location across the floor \u2014 your tactical eyes assume something instantly: it likely controls the water. Five sets of QRian glyphs are carved into the face of the wheel. Decode them and turn the wheel appropriately, and something might happen to the water... The English -> QRian translation tablets fragments you found before you entered the temple's basement were scattered in the blast, though... some of the other teams probably have the pieces\u2026",
      correctAnswerReveal:
        "The wheel grinds and turns. You see water redirects start to flow through the ancient channels, and it's clear this water mechanism was designed! The ability to bring water into the temple was purposeful. The flood isn't from the dynamite. The temple was built to purge itself. Your blast didn't cause this! Despite turning the wheel, though, the water keeps rising — *but slower, now*. The mechanism diverts part of the flood into channels gurgling somewhere deep below the floor. Not enough to stop it. Enough to buy the room a little more time.",
      description:
        "",
      puzzleDescription:
        "The wheel's face shows 6 groups of glyphs separated by carved dividers:\n\n{{{PUR}}} | {{{GET}}} | {{{HE}}} | {{{F}}} | {{{LO}}} | {{{OR}}}\n\nUse your Inscribed Chunks of Stone to decode each glyph group into letters. The groups may not align with word boundaries \u2014 read all the letters as one continuous string to find the hidden command.\n\nWrite the unlock sentence - it reveals how you have to manipulate the wheel to make it work.",
      requiredClueSets: [{ cardSetId: csInscribedStone.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansStoneWheel.id,
      consequenceCompleted:
        "Drake is exonerated. The flood is by design \u2014 and everyone should know... And owe you an apology!\n\nThey won't give you one.",
      consequenceNotCompleted:
        "You couldn't figure it out. To the other teams, you just looked like masked men staring endlessly at a stone wheel while you scratched your heads. The other teams probably think you have smooth brains.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_drake_flood.id, [drake.id]);

  const m_drake_t1 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Reach the Shadow Astrolabe",
      storySheetBlurb:
        "At the center of the chamber \u2014 a stone table, and on it a thick glass dome. Inside: a strange, beautiful contraption with golden concentric rings, its markings shimmering. Looking up close, it looks like it's mapping the temple itself. The base has rotating discs; it's some sort of combination lock - made out of ceramic! But instead of numbers - it's colors. Some of the discs are missing though. If you find the missing discs, and rotate them to the right color... You might be able to unlock what's within... ",
      correctAnswerReveal:
        "Click. Click. Click. Click. Click. The dome splits along hidden seams and opens like a flower. These QRians were advanced!! Picking it up, the contraption is heavier than it looks. Up close, the etchings aren't decorative \u2014 they're architectural. This device maps the temple itself. Every corridor, every chamber. Your team traces the paths and the realization hits: this place was designed to trap people. You're holding the blueprint of a perfect trap \u2014 and you're standing in it.",
      description:
        "",
      puzzleDescription:
        "Five ceramic discs with painted color markings are needed to unlock the dome. Each disc shows a color sequence with one color missing, and a single clue word etched into it. Each sequence represents something real that changes color \u2014 figure out what each represents, then determine the missing color. The QRians were a peculiar people...\n\nThe discs are scattered across the chamber, each likely held by the different expeditions. Gather all five *Strange Painted Disc*s (numbered I through V) to see each sequence and clue word, then slot each missing disc into its right place and color...",
      requiredClueSets: [{ cardSetId: csPaintedDisc.id, count: 5 }],
      answerTemplateType: "multiple_text",
      answerId: ansAstrolabe.id,
      consequenceCompleted:
        "The team moves differently now. It actually is a map! A *fascinating* one, and likely the only one! Playing around with it, you learn something the other teams don't: this temple was built to trap anyone who entered. But Drake doesn't panic about being trapped. Drake plans around it. The astrolabe gets stowed carefully. The other teams have no idea you have it.",
      consequenceNotCompleted:
        "The dome sits there, sealed, the golden rings shimmering under glass as the floodwater creeps across the table's base. You knew what you had to do. But you just couldn't do it. Drake always said, 'If you feel like a failure, it's because you are one.'",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_drake_t1.id, [drake.id]);

  const m_drake_t2 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Activate the Construction Hoist",
      storySheetBlurb:
        "Off to the side overhead \u2014 thick iron chains hang from the ceiling, taut and corroded green, but connected to an enormous stone tablet on the floor. Whatever these temple builders put under there, they hid it on purpose. The iron chains, tangled like many shoelaces, appear to be an ancient hoist system! You have a feeling that pulling the chains in the right order will get the hoist to lift the tablet, but you're going to investigate to figure it out...",
      correctAnswerReveal:
        "As you pull the chains, the sentence becomes clear: **WE WHO BUILT THIS WILL NEVER GET TO LEAVE.** Nobody speaks for a moment. The builders carved a warning into their own machinery \u2014 not for themselves, for whoever came after. The chains grind. The stone slab lifts. Underneath: a crypt of seemingly hundreds of mummified bodies. The builders themselves. This temple was built in months by people - who were never meant to leave.",
      description:
        "",
      puzzleDescription:
        "There's 9 separate chains, each inscribed with QRian glyphs - and it appears that each chain had a metallic label attached to it.\n\nGood news: those metallic labels appear to be translations the QRians made themselves for their language!\n\nBad news: The metallic labels themselves for the chains broke off when the mechanism seized during your explosion and scattered throughout the chamber.\n\nGather all sets of *Inscribed Metal Fragment*s, and figure out what order you have to pull the chains to get the hoist to work. The QRians did love their mysterious messages...\n\n| Chain | Glyph |\n|-------|-------|\n| 1 | {{{LEAVE}}} |\n| 2 | {{{WHO}}} |\n| 3 | {{{THIS}}} |\n| 4 | {{{NEVER}}} |\n| 5 | {{{WE}}} |\n| 6 | {{{TO}}} |\n| 7 | {{{BUILT}}} |\n| 8 | {{{GET}}} |\n| 9 | {{{WILL}}} |",
      requiredClueSets: [{ cardSetId: csMetalFragment.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansHoist.id,
      consequenceCompleted:
        "\"We who built this will never get to leave.\" The builders were entombed. Thousands of them, working at speed, maybe knowing the purpose. The other teams see a temple. Drake sees a prison built at industrial speed \u2014 and prisons are made to be broken out of.",
      consequenceNotCompleted:
        "The hoist lays unused, the slab pulled tight. Whatever the QRians hid underneath stays buried. Drake without answers is just people in balaclavas staring at chains.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_drake_t2.id, [drake.id]);

  const m_drake_t3 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Investigate the Scraped Gap",
      storySheetBlurb:
        "Along the back wall, half-hidden behind a collapsed pillar \u2014 a dark crack - just enough for a person to scrape through - lies visible, scarred with bright metal scratches. There's a faint breeze coming from that direction. Shockingly, next to the crack - there's an old paperbound journal! Did someone sneak past this way? You'll want to collect the other scattered pages to figure out what it reads...",
      correctAnswerReveal:
        "*Click!* *Creak!* The trunk opens. Inside: a hand-drawn cross-section of the temple, every route mapped and marked with an X. The final annotation in the same hand: 'Every staircase leads nowhere.' Modern ink. Modern paper. These people mapped the routes that don't work \u2014 and never found one that did. It seems every single staircase in this temple is going to lead to your doom... That's not going to be the way out of here...",
      description:
        "",
      puzzleDescription:
        "As one of you squeezes inside the gap: a previous expedition's camp. A locked trunk with a note pinned to the lid:\n\n*\"If you find this, the lock code is hidden in my journal. Take the character at each position. You'll need to unscramble the letters. 1:12, 2:19, 3:25, 4:12, 5:28, 6:19, 7:8. Count every character \u2014 letters, spaces, punctuation.\"*\n\nThe journal pages are scattered across with the other expeditions. Gather all the *Mysterious Damp Page*s from the chamber, and find out the codeword to unlock the trunk...",
      requiredClueSets: [{ cardSetId: csDampPage.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansScrapedGap.id,
      consequenceCompleted:
        "Those people mapped every route that doesn't work. That's intelligence. Drake uses intelligence. And bombs.",
      consequenceNotCompleted:
        "The crack in the wall stays dark. Whatever happened to whoever left those scratches \u2014 you'll never know.",
      sortOrder: 5,
    },
  });
  await assignMissionHouses(m_drake_t3.id, [drake.id]);

  // ═══════════════════════════════════════════════════════════════════
  // ACT 1 MISSIONS — JONES JUNKET
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 missions — Jones...");

  const m_jones_crew = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Retrieve Your Ceremonial Whips",
      storySheetBlurb:
        "In the rush through the hidden passage, your ceremonial whips were left behind — and the floodwater is swallowing the way back. That passage branches into half-submerged corridors, each with a QRian word carved above. But right next to the passageway's entrance, you see some QRian glyphs... Likely information that will tell you which corridor is safe. One swimmer, one big breath. So you need to know what it means...\nInterestingly, you see the other teams handling some clay tablets that seem to translate limited QRian words into known languages... Priceless! What if you could get those?",
      correctAnswerReveal:
        "TIME is your choice. Your swimmer drops into the half-submerged corridor and kicks forward into the dark — thirty seconds of nothing but echoing water and held breath from everyone watching the entrance. Then a splash and a sound of a massive gasp of air. Hallelujah!! The whips are here, bundled in oilskin in their packages, dry as the day they were left. Your swimmer holds the bundle of whips high above their head like a trophy, and you all shout like excited baboons. You just read a dead language off a temple wall and it told you exactly where to go. Dr. Jones spent thirty years trying to crack QRian script. His students just did it in a flooding corridor with fragments and adrenaline.",
      description:
        "",
      puzzleDescription:
        "The corridor entrances are labeled with QRian glyphs:\n\n{{{STONE}}} |\n\n{{{SILENCE}}} | \n\n{{{ANCIENT}}} | \n\n{{{OCEAN}}} | \n\n{{{TIME}}}\n\nA wall inscription reads:\n\n{{{IT EATS ALL STONE NONE CAN SEE IT}}}\n\nUse the Coded Clay Tablets to decode the glyph-to-letter mappings. The inscription is probably some weird allegory - civilizations at this time loved that kind of stuff — figure it out, and the answer matches one of the corridor labels.\n\nChoose the correct passageway label. You've literally got one chance.",
      requiredClueSets: [{ cardSetId: csClayTablet.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansWhips.id,
      consequenceCompleted:
        "The whips are secured and the team is buzzing \u2014 not because of what you retrieved, but because of how you retrieved it. You read the wall. You actually read it. The other houses are navigating this temple with torches and guesswork. You're navigating it with the language of the people who built it. Every inscription from here on isn't decoration \u2014 it's a signpost, and you're the only ones who can follow it.",
      consequenceNotCompleted:
        "The glyph riddle is still on the wall and the corridors are still half-submerged, but the water isn't waiting. Somewhere down one of those passages, the ceremonial whips sit on a dry shelf that won't be dry much longer. Dr. Jones trusted you to carry the whips, and the whips made this feel like a Jones expedition instead of a university field trip that got out of hand. The deeper chambers will have more words. Harder ones.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_jones_crew.id, [jones.id]);

  const m_jones_flood = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Activate the Ancient Drainage",
      storySheetBlurb:
        "Along the lower walls, half-obscured by mineral deposits — a 3x3 grid of carved pipe sections, an engineered drainage network. Source and drain are visible but seven sections of pipes are missing! If you can find those pipes - maybe with the others - can you start draining the floodwater?",
      correctAnswerReveal:
        "The valves click open in sequence and water flows through channels that haven't moved in centuries. **The floodwater begins to drop, just a little.** But V5 stays dead — deliberate chisel marks. When you look closely, it appears that the tools were QRian in origin - they have distinctive {{{O}}} {{{X}}} or other weird symbols at the sabotage points... They built a drainage system then crippled it. Without that one sabotaged section, the rest still drains. Slower than it should. But it drains.",
      description:
        "",
      puzzleDescription:
        "A 3×3 pipe grid. SOURCE (top-left, opens Right) and DRAIN (bottom-right, opens Left) are fixed. Seven pipe sections must be placed so water flows through ALL 9 cells in one continuous path. Each section has specific openings (Left, Right, Top, Bottom), and one valve is sabotaged — still part of the path, but broken...\n\nThe pipe sections were dislodged by the flood and scattered across the chamber — some in your hands, others pocketed by the houses around you. You're going to need to gather all sets of *Pipe Bundle*s from the chamber to learn each section's openings...\n\nFind out the valve numbers in flow order, skipping the sabotaged one.",
      requiredClueSets: [{ cardSetId: csCeramicTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansDrainage.id,
      consequenceCompleted:
        "The drainage system didn't work, but you learn something arguably more concerning to your intellectual minds. The QRians, originally, they decided to have a drainage system, and then somehow later it was deliberately destroyed. Why? What was happening here? Your team feels a pit in their stomach.",
      consequenceNotCompleted:
        "The drainage stays sabotaged and the flood climbs into the upper chambers. You may have been able to help everyone, but you failed miserably. Jones can study and study for hours - but when push comes to shove in the real world... they choke.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_jones_flood.id, [jones.id]);

  const m_jones_t1 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Sort the Scattered Offerings",
      storySheetBlurb:
        "High on the far wall — three deep alcoves, each stained a different color from centuries of offerings. Six stone vessels lie on the floor below, knocked loose by either the flood, or the Drake's explosion. Each holds a residue and carries a letter. Read the alcoves right and they'll tell you what this place actually is. Some vessels are with you; the others have the rest…",
      correctAnswerReveal:
        "The vessels settle into place with a satisfying click, each residue matching its alcove's ancient stain. The letters read left to right across the wall: S-C-H-O-O-L. This wasn't a temple. It was a school. Three alcoves, three departments of knowledge — the blue for sky-reading, the amber for building, the green for earth-work. The QRians didn't come here to worship. They came here to learn. Or maybe both? And the offerings weren't sacrifices — they were materials. Lapis for pigment, resin for binding, malachite for dye. What looked like ritual devotion was a curriculum. Or either or?",
      description:
        "",
      puzzleDescription:
        "Three alcoves are stained from centuries of use:\n\n- **Left alcove:** stained deep BLUE 🔵\n- **Center alcove:** stained AMBER-GOLD 🟡\n- **Right alcove:** stained DARK GREEN 🟢\n\nSix numbered vessels lie below — each has an interior residue and a letter carved underneath. The flood scattered them across the chamber floor; some are in your hands, others picked up by the houses around you.\n\nGather all the *Sealed Stone Vessel*s from the chamber to read each vessel's residue and letter. Then match each vessel to the alcove whose stain its residue connects to, and read the letters in order: left alcove to right, lower-numbered vessel first within each pair. The letters will reveal what this place truly was.",
      requiredClueSets: [{ cardSetId: csStoneVessel.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansOfferings.id,
      consequenceCompleted:
        "The vessels are placed correctly and the word hangs in the air like a held breath. SCHOOL. Dr. Jones spent thirty years calling this a temple. His students just proved it was a university - of strange construction. Nobody says \"career-defining discovery\" out loud, but everyone is thinking it. The other teams are exploring a temple. You're standing in a lecture hall.",
      consequenceNotCompleted:
        "The six vessels sit on the floor, unsorted, their residues slowly flaking away in the damp air. Whatever those alcoves were trying to tell you, the message goes unread. The other teams are moving faster now, and your scholarly advantage \u2014 the thing that makes Jones different from people who just break down walls \u2014 didn't deliver when it mattered. Dr. Jones's first expedition, and the reading went wrong.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_jones_t1.id, [jones.id]);

  const m_jones_t2 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Examine the Sliding Panels",
      storySheetBlurb:
        "When you forget the churning of the flood and just focus across the haze of the chamber — you can make out some small flat stones - so precisely placed - they form a grid in the wall. Yet several of the panels are missing, scattered across the chamber floor. And at the grid's center: a hand-shaped hollow, worn silk-smooth by centuries of palms. Can these panels... move? And can be placed in a straight line? Your archaeological training activates - it was probably some special kind of lock. If you get those other panels that the other expedition teams hold, what could you possibly unlock...?",
      correctAnswerReveal:
        "The panels slide open. Behind them — a small, sealed chamber. The walls are covered in carvings. Not official inscriptions — personal ones. Someone lived in here. The markings are dense, obsessive - but clearly methodical and... brilliant? What kind of mission did this person have? ",
      description:
        "",
      puzzleDescription:
        "Nine flat inscribed slates can be placed on that wall and be moved. The slate has some QRian glyphs on it, but the slates were dislodged long ago and scattered across the chamber floor. The other teams hold some of them. \n\nGather all the *Flat Inscribed Slate*s from the chamber. When you have the slates in your hands, your research of QRian scripts will likely be able to help you translate each slate. The correct order of the slates will likely be a sentence.\n\n| Slate Slot | Glyph |\n|-------|-------|\n| 1 | {{{SEALED}}} |\n| 2 | {{{TOO}}} |\n| 3 | {{{FOREVER}}} |\n| 4 | {{{THOSE}}} |\n| 5 | {{{AWAY}}} |\n| 6 | {{{LONG}}} |\n| 7 | {{{WERE}}} |\n| 8 | {{{WHO}}} |\n| 9 | {{{STAYED}}} |",
      requiredClueSets: [{ cardSetId: csSlate.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansPanels.id,
      consequenceCompleted:
        "You feel you discovered something really important about the temple - and those who spent time here. The team is rattled — but also electrified. Whatever this temple was built to do, you're getting closer to understanding it. Dr. Jones never mentioned anything like this in his lectures. You're all going to be historical legends, right when your careers start! Citation needed.",
      consequenceNotCompleted:
        "The panels sit there, immovable, mocking. The hand-shaped hollow stares back at you — worn smooth by centuries of palms that knew the answer. Yours wasn't one of them. Dr. Jones would have had this in minutes. The team tries not to say that out loud, but everyone's thinking it. Morale takes a massive hit... You're just a bunch of shmucks.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_jones_t2.id, [jones.id]);

  const m_jones_t3 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Map the False Exit",
      storySheetBlurb:
        "Off to the left, beyond a low archway — a corridor that tilts *up*. After a temple where everything descends, an upward slope feels like sunlight. It looks like a way out. Three months of schematics say: don't trust it. But why is it there? The carved waymarkers fell long ago — some are with you, others were pocketed by the houses around you…",
      correctAnswerReveal:
        "The map is complete — and the realization hits like cold water. The corridor spirals. What felt like climbing was descent. You just did a massive U-turn and wasted all this time.",
      description:
        "",
      puzzleDescription:
        "Seven carved waymarkers once lined the corridor walls. They fell long ago, and the houses around you pocketed them off the chamber floor as worn old stones — numbered 1–7 in the catalogue, but the numbers are just labels. They do not indicate the path order.\n\nGather all *Worn Stone Marker*s from the chamber, and then arrange them in the order your team would logically witness or walk through when going through the passageway...",
      requiredClueSets: [{ cardSetId: csStoneMarker.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansFalseExit.id,
      consequenceCompleted:
        "Nobody speaks for a while. You found a way up — and it goes down. The QRians built this for people who think like you - thinking that doors are there for a reason. That changes everything about how you move through this temple.",
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

  const m_croft_crew = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Recover Your Grappling Rigs",
      storySheetBlurb:
        "Your signature grappling rigs — high-tension cable, Croft-issue hooks, spring-loaded launcher — sit on the ledge where you climbed in from below. The floodwater is rising. Without them, every climb in this temple is improvisation. And also, you're significantly less sexy. To rig a climbing route up, you're going to have to gather components from your handy climbing kit — too bad many of the components scattered to the other expedition teams...",
      correctAnswerReveal:
        "Stud. Plate. Line. Clamp. Climb. Bolt. Pulley. Hook. To your Croft team, it's like music. The climbing route is erected up cleanly: twenty feet of ancient stone, the fixed line humming with tension, the haul pulley spinning true. A few team members are able to haul their way up to the ledge, and like an assembly, grab the grappling hooks and toss them safely, down. Your hooks are back. You feel like superheroes. Or better yet, climbers with grappling hooks.",
      description:
        "",
      puzzleDescription:
        "Seven route-setting kit components need to be assembled in the correct rigging sequence — but the bag burst when you scrambled in, and pieces of kit are scattered across the chamber floor in other teams' hands. The numbered tags (#1–#7) on each piece are inventory labels only; they do not indicate rigging order.\n\nGather all sets of *Unmarked Steel Hardware* from the chamber, read each component's tag for a hint about when it's needed, then write the seven item numbers in assembly order. Those beautiful grappling hooks are waiting for you...",
      requiredClueSets: [{ cardSetId: csSteelHardware.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansRigs.id,
      consequenceCompleted:
        "The grappling rigs ride on your strongest backs, and nobody complains. You set a route up a wall in a flooding temple with scattered kit and no safety net — and it held. Lara would be proud (though she would have done it faster). Now, whatever's above you in this temple, you can reach it. That's beyond confidence — that's preparation.",
      consequenceNotCompleted:
        "You had the kit. You had the training. You just couldn't get it rigged in time. Croft Company without grappling gear is a climbing team with nothing to climb with. When this temple pushes everyone upward — and it will — the other houses will improvise. You'll just... look up, shamefully.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_croft_crew.id, [croft.id]);

  const m_croft_flood = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Solve the Stone Jigsaw",
      storySheetBlurb:
        "Water pours through a crack where a sealed passage gave way. Five flat stone fragments that originally helped seal it lie scattered on the floor. Each tile has strange, carved symbols on its sides, and a letter on its face. You think, in the right configuration, you can re-connect those stone fragments together to lock the seal and reduce the flooding. Some fragments are with you, others pocketed after the explosion scattered them — you're gonna need them...",
      correctAnswerReveal:
        "The fragments lock together. The crack seals. When you look closer at the assembled surface.. you see diagrams that can simultaneously be described as construction diagrams... and sacred imagery? People in prayer? The 'worship scene' is a blueprint. The QRians dressed their engineering in sacred imagery...\n\nBut the water only slows just a little bit...",
      description:
        "",
      puzzleDescription:
        "Five flat stone fragments originally sealed the passage — each has a symbol on its left edge, a different symbol on its right edge, and a letter on its face. The fragments are scattered across the chamber, some in your hands, others picked up by the houses around you.\n\nGather all sets of *Odd Edge-Marked Block*s from the chamber. You know that when you figure out the right order, it's going to spell a word. The QRians were interesting like that. Figure out the order, and figure out the word.",
      requiredClueSets: [{ cardSetId: csEdgeBlock.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansJigsaw.id,
      consequenceCompleted:
        "While the flood continued to pour in - only just slowed - you are all too excited with this marvellous find about the QRians - and their unusual sacrosanct acceptance of engineering. Why? How? Either way, this is clearly a culture touched by a strong persuasion. Maybe even putting the Greeks' obsession with logic to shame...",
      consequenceNotCompleted:
        "The flood continued to pour through to the chambers completely. You all pride yourselves in the toughness of solving climbing puzzles, but you couldn't solve a simple ancient jigsaw... Jeez...",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_croft_flood.id, [croft.id]);

  const m_croft_t1 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Reach the Impossible Vase",
      storySheetBlurb:
        "Far off to the left, at the fuzzy edge of the shadows — atop a ledge fifteen feet above the floor, there exists a vibrantly red porcelain vase. Impossibly intact after centuries. Whatever this material is, it shouldn't exist. Weirdly, this seems to be an engineered kind of wall - there are square holes inside where spokes seem to be able to go on. Stick them in the right order, and you should be able to climb up without exhausting other tools you have...",
      correctAnswerReveal:
        "Each spoke locks with a deep, satisfying click — one after another, climbing holds materializing out of the wall. The climb is clean: fifteen feet of ancient stone, and at the top, the vase. It's heavier than it looks. Up close, the surface isn't glazed — it's fused, as if the ceramic itself was transformed at the molecular level. The material is harder than any material you've ever seen in your many expeditions. The vase is flawless - not just 'well-preserved.' Whatever the QRians knew about materials, they were centuries ahead of anyone else. And they used that knowledge to make a vase. The question is: what else did they make with it?",
      description:
        "",
      puzzleDescription:
        "Nine metal spokes can be driven into the wall as climbing footholds, each inscribed with a QRian glyph (maybe a sentence?) — but the spokes are scattered, some in your hands, others picked up by the teams around you. The QRians designed them to be placed in a specific order: bottom to top, it seems. Otherwise, they don't hold...\n\nGather all sets of *Inscribed Metal Spoke*s from the chamber. With enough luck, your team QRian glyph expert will be able to decipher what the words are - if they can physically hold the spokes. That vase looks delicious...\n\n| Spoke | Glyph |\n|-------|-------|\n| 1 | {{{FIND}}} |\n| 2 | {{{EVER}}} |\n| 3 | {{{WHO}}} |\n| 4 | {{{WAY}}} |\n| 5 | {{{WILL}}} |\n| 6 | {{{THOSE}}} |\n| 7 | {{{NO}}} |\n| 8 | {{{ENTER}}} |\n| 9 | {{{OUT}}} |",
      requiredClueSets: [{ cardSetId: csMetalSpoke.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansVase.id,
      consequenceCompleted:
        "The climb was clean. The team moved like one body — boost, grip, pull. Lara would have said to put more booty into it - but that's OK - you got what you needed. And what you're holding is obviously worth more than the whole expedition budget — a material that shouldn't exist, in a temple that shouldn't be here. Confidence is high, and you all guard the vase jealously.",
      consequenceNotCompleted:
        "Fifteen feet. You couldn't make fifteen feet. And now the floodwater has slowly swallowed the base of the wall, making more attempts impossible. That vase will sit on that ledge for another few centuries. Every other team probably saw you try. What would Lara say? Morale takes a serious hit, and you all wonder how you'll fare with the next chambers to come...",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_croft_t1.id, [croft.id]);

  const m_croft_t2 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Activate the Teaching Stone",
      storySheetBlurb:
        "Dead center of the chamber — a wide stone disc on a pedestal, pale and luminous. Two concentric rings of number slots scored into its face. Some positions are filled, some empty. You know it'll hum when the math is right — the QRians worshipped numbers, and this is their hymnal. Inserts lie scattered near the base. You'll need to gather them — some are with the others - to get this thing humming again. *You take one look at the rings and feel a pit in your stomach. This one is going to be hard.*",
      correctAnswerReveal:
        "The outer numbers click into place. The disc hums \u2014 stone pieces shift and rotate, mechanically demonstrating the principle. The QRians didn't just use math. They built physical devotions to it. This wasn't an altar. It was a classroom \u2014 and you just passed the entrance exam to a school that's been closed for centuries.",
      description:
        "",
      puzzleDescription:
        "The disc has 8 positions, each with an inner ring slot and an outer ring slot. 5 positions are complete; 3 are missing both their inner and outer values. Numbered Bone Tokens scattered around the pedestal supply the missing inner values \u2014 the houses around you have picked up the rest.\n\n| Position | Inner | Outer |\n|----------|-------|-------|\n| 1 | 1 | 3 |\n| 2 | 3 | 8 |\n| 3 | **?** | **?** |\n| 4 | 7 | 18 |\n| 5 | **?** | **?** |\n| 6 | 11 | 28 |\n| 7 | 13 | 33 |\n| 8 | **?** | **?** |\n\nGather all sets of *Numbered Bone Token* from the chamber to learn the missing inner values. Discover the pattern in the inner ring, then find the rule that transforms inner values to outer values, and calculate the three missing outer values \u2014 one per slot.",
      requiredClueSets: [{ cardSetId: csBoneToken.id, count: 3 }],
      answerTemplateType: "multiple_text",
      answerId: ansTeaching.id,
      consequenceCompleted:
        "Y'all feel like brainiacs! Perhaps that was already obvious. What was not obvious was that the teaching machine would still work! The QRians worshipped mathematics with carved stone. Every equation was a prayer, every proof a hymn. It's a fascinating appreciation of mathematics, which is almost heavenly, almost beautiful. You feel it touching your team, too. Interesting...",
      consequenceNotCompleted:
        "The disc sits incomplete, its lesson unlearned. Whatever the QRians carved into this machine, the classroom stays closed.\n\nMath was never your forte, clearly.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_croft_t2.id, [croft.id]);

  const m_croft_t3 = await createMission({
    data: {
      gameId: game.id,
      act: 1,
      title: "Follow the Drag Marks",
      storySheetBlurb:
        "Against the near wall, low and easy to miss \u2014 a squat doorway set into rough, hurried stone. Beyond it, darkness. On the floor: deep parallel grooves, wide as a body, dragging inward. Whoever was dragged in there isn't coming back. Their last words might. Pottery shards bearing glyph fragments lie nearby \u2014 some are with you, others pocketed\u2026",
      correctAnswerReveal:
        "The letters form one by one. TELL. MY. CHILD. I. LOVED. THEM. STILL. Not a confession. Not a warning. A message never delivered, from a parent who built their own tomb and spent their last breath thinking of someone who would never know where they went. What was this place?",
      description:
        "",
      puzzleDescription:
        "Inside the sealed chamber: remains, tools, and a personal inscription scratched into the wall in QRian glyphs. Use your Ancient Pottery Shards — each has glyph-to-letter pairings etched by the builders as teaching aids — to decode the inscription.\n\nThe wall inscription:\n\n{{{TELL MY CHILD I LOVED THEM STILL}}}\n\nWhat was this desperate message?",
      requiredClueSets: [{ cardSetId: csPotteryShard.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansDragMarks.id,
      consequenceCompleted:
        "The chamber goes quiet. You realize this is a place that has some secrets you may be very, very far from understanding. It's very unsettling. You begin to wonder about the other several billion things the person may have said instead. What an interesting thought...\n\nDid any other expedition team find anything like this?",
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
    gameId: game.id, cardSetId: csDetonatorComponent.id, act: 1,
    clueVisibleCategory: "Detonator Component",
    header: "Detonator Components",
    description:
      "Three precision instruments, scattered in the silt. Each is etched with a part-name and a fitter's note.\n\n**#1 Anchor Pins:** *\"Delicate. These seat into the base before anything else.\"*\n\n**#4 Primer Powder:** *\"Volatile. Packed between the cores and the plates. Don't sneeze.\"*\n\n**#6 Retainer Clips:** *\"Lock the plates in place. Snaps onto the strikers before you seal.\"*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csDetonatorComponent.id, act: 1,
    clueVisibleCategory: "Detonator Component",
    header: "Detonator Components",
    description:
      "Two precision instruments, recovered together.\n\n**#2 Outer Casings:** *\"The outer housing. Nothing goes on after these.\"*\n\n**#5 Striker Plates:** *\"Press flat against the dust layer. Takes the initial impact.\"*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csDetonatorComponent.id, act: 1,
    clueVisibleCategory: "Detonator Component",
    header: "Detonator Components",
    description:
      "Two pieces, picked out of the muck.\n\n**#3 Booster Cores:** *\"The heavy cores. They nest right on top of the pins.\"*\n\n**#7 Det Cord:** *\"The ignition thread. Winds through the clips and connects to the shell trigger.\"*",
    houseIds: [drake.id],
  });

  // Drake A1M2 — Stone Wheel (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csInscribedStone.id, act: 1,
    clueVisibleCategory: "Inscribed Chunk of Stone",
    header: "Inscribed Chunk of Stone",
    description:
      "A heavy chunk of carved stone, pulled from beneath a fallen pillar. Translation key etched into one face.\n\n{{{P}}} = P\n\n{{{U}}} = U\n\n{{{T}}} = T\n\n{{{E}}} = E",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csInscribedStone.id, act: 1,
    clueVisibleCategory: "Inscribed Chunk of Stone",
    header: "Inscribed Chunk of Stone",
    description:
      "A keystone, half-buried in silt.\n\n{{{R}}} = R\n\n{{{G}}} = G\n\n{{{L}}} = L\n\n{{{O}}} = O",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csInscribedStone.id, act: 1,
    clueVisibleCategory: "Inscribed Chunk of Stone",
    header: "Inscribed Chunk of Stone",
    description:
      "A small fragment, no bigger than a fist.\n\n{{{H}}} = H\n\n{{{F}}} = F",
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
      "A second ceramic disc, the painted rim chipped along one edge. Etched beneath: a single clue word.\n\n**Sequence:** **?** → Yellow → Brown → Black\n\n**Clue:** *Curved*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPaintedDisc.id, act: 1,
    clueVisibleCategory: "Strange Painted Disc",
    header: "Strange Painted Disc, III",
    description:
      "A small ceramic disc, half its painted rim worn to grey. Etched beneath: a single clue word.\n\n**Sequence:** Red → **?** → Brown\n\n**Clue:** *Rare*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPaintedDisc.id, act: 1,
    clueVisibleCategory: "Strange Painted Disc",
    header: "Strange Painted Disc, IV",
    description:
      "A wide ceramic disc, the colors still bright where silt protected them. Etched beneath: a single clue word.\n\n**Sequence:** Green → Yellow → Orange → Red → **?**\n\n**Clue:** *Harvest*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPaintedDisc.id, act: 1,
    clueVisibleCategory: "Strange Painted Disc",
    header: "Strange Painted Disc, V",
    description:
      "A heavy ceramic disc, recovered face-down from the chamber floor. Etched beneath: a single clue word.\n\n**Sequence:** **?** → Red → Orange → Yellow\n\n**Clue:** *Forge*",
    houseIds: [drake.id],
  });

  // Drake A1M4 — Construction Hoist (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csMetalFragment.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Fragment",
    header: "Hoist Marking, Set I",
    description:
      "Three iron fragments, scattered from the hoist.\n\n{{{LEAVE}}} = LEAVE\n\n{{{WHO}}} = WHO\n\n{{{THIS}}} = THIS",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMetalFragment.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Fragment",
    header: "Hoist Marking, Set II",
    description:
      "Three somewhat rusted metallic labels, clearly meant for the hoist system at the side of the chamber:\n\n{{{NEVER}}} = NEVER\n\n{{{WE}}} = WE\n\n{{{TO}}} = TO",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMetalFragment.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Fragment",
    header: "Hoist Marking, Set III",
    description:
      "Three fragments, scratched and corroded.\n\n{{{BUILT}}} = BUILT\n\n{{{GET}}} = GET\n\n{{{WILL}}} = WILL",
    houseIds: [drake.id],
  });

  // Drake A1M5 — Scraped Gap (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csDampPage.id, act: 1,
    clueVisibleCategory: "Mysterious Damp Page",
    header: "Mysterious Damp Page",
    description:
      "Three damp pages from a torn journal, recovered from the trunk.\n\n**Day 3 (Entry 2):** \"Architecture beyond anything in the textbooks.\"\n\n**Day 9 (Entry 5):** \"Every route slopes down. None lead up.\"\n\n**Undated (Entry 7):** \"Every staircase descends. We cannot find a path up.\"\n\n*The ink is bleeding fast. Read it before it's gone.*",
    selfDestructTimer: 75,
    selfDestructText: "The ink has bled into the wet paper. The page is unreadable now.",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csDampPage.id, act: 1,
    clueVisibleCategory: "Mysterious Damp Page",
    header: "Mysterious Damp Page",
    description:
      "Damp journal pages, ink bleeding at the edges.\n\n**Day 1 (Entry 1):** \"We found the entrance today. Discovery of a lifetime.\"\n\n**Day 7 (Entry 4):** \"Their log echoes ours. Panic sets in.\"\n\n*The ink is bleeding fast. Read it before it's gone.*",
    selfDestructTimer: 75,
    selfDestructText: "The ink has bled into the wet paper. The page is unreadable now.",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csDampPage.id, act: 1,
    clueVisibleCategory: "Mysterious Damp Page",
    header: "Mysterious Damp Page",
    description:
      "Damp journal pages, water-stained but still legible.\n\n**Day 5 (Entry 3):** \"Found a camp from decades ago. No skeletons.\"\n\n**Day 11 (Entry 6):** \"Compass spins. Water from walls we never passed.\"\n\n*The ink is bleeding fast. Read it before it's gone.*",
    selfDestructTimer: 75,
    selfDestructText: "The ink has bled into the wet paper. The page is unreadable now.",
    houseIds: [drake.id],
  });

  // Jones A1M1 — Ceremonial Whips (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csClayTablet.id, act: 1,
    clueVisibleCategory: "Coded Clay Tablet",
    header: "Coded Clay Tablet",
    description:
      "A fragment of a translator's tablet, slick with floodwater.\n\n{{{T}}} = T\n\n{{{I}}} = I\n\n{{{S}}} = S\n\n{{{O}}} = O",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csClayTablet.id, act: 1,
    clueVisibleCategory: "Coded Clay Tablet",
    header: "Coded Clay Tablet",
    description:
      "A clay-tablet fragment, etched in a steady hand.\n\n{{{M}}} = M\n\n{{{N}}} = N\n\n{{{A}}} = A\n\n{{{L}}} = L",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csClayTablet.id, act: 1,
    clueVisibleCategory: "Coded Clay Tablet",
    header: "Coded Clay Tablet",
    description:
      "A small clay fragment, edges chipped.\n\n{{{E}}} = E\n\n{{{C}}} = C\n\n{{{V}}} = V\n\n{{{H}}} = H",
    houseIds: [jones.id],
  });

  // Jones A1M2 — Ancient Drainage (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csCeramicTile.id, act: 1,
    clueVisibleCategory: "Pipe Bundle",
    header: "Pipe Bundle",
    description: `Three pipe sections, scattered by the flood.

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
    clueVisibleCategory: "Pipe Bundle",
    header: "Pipe Bundle",
    description: "Two pipe sections, mineral-crusted from a long flood-cycle.\n\n**V3 — T-junction (L, R, T):** Three openings; the top is a dead-end. *The dead-end seats into a recess carved into the chamber wall — only fits in the middle row of the grid.*\n\n```text\n  +-+\n  | |\n  | |\n+-------+\n|       |\n+-------+\n```\n\n**V4 — Elbow (T, L):** Comes in from above, exits left.\n\n```text\n          +-+\n          | |\n +--------+ |\n |          |\n+-----------+\n```",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCeramicTile.id, act: 1,
    clueVisibleCategory: "Pipe Bundle",
    header: "Pipe Bundle",
    description: "Two pipe sections, recovered from beneath a fallen slab.\n\n**V6 — Elbow (T, R):** Comes in from above, exits right.\n\n```text\n+-+\n| |\n| +--------+\n|          |\n+-----------+\n```\n\n**Unnumbered Channel (L↔R) — straight pass-through, NO valve. Installed at the bottom of the grid, against the chamber floor. Do not include this piece in your answer:**\n\n```text\n+-----------+\n|           |\n+-----------+\n```",
    houseIds: [jones.id],
  });

  // Jones A1M3 — Scattered Offerings (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csStoneVessel.id, act: 1,
    clueVisibleCategory: "Sealed Stone Vessel",
    header: "Sealed Stone Vessel",
    description:
      "Two stone vessels, knocked from the wall by the flood.\n\n**Vessel 1 — squat bowl:** carved figures kneel before stars. Inside: fine powder, unmistakably lapis lazuli, ground to dust. Letter on underside: **S**.\n\n**Vessel 5 — tall cup:** carved figures stand in a circle, arms raised. Inside: crystallized residue, translucent and faintly sweet — ancient honey, hardened to glass. Letter: **O**.",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csStoneVessel.id, act: 1,
    clueVisibleCategory: "Sealed Stone Vessel",
    header: "Sealed Stone Vessel",
    description:
      "Two stone vessels, scattered across the alcove floor.\n\n**Vessel 3 — wide dish:** carved hands reach toward a flowering branch. Inside: chalky dust with a bright metallic sheen — crushed malachite. Letter: **O**.\n\n**Vessel 2 — shallow saucer:** carved terraced structure with figures building. Inside: thick, glassy resin — hardened tree sap, amber-colored where the light catches it. Letter: **H**.",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csStoneVessel.id, act: 1,
    clueVisibleCategory: "Sealed Stone Vessel",
    header: "Sealed Stone Vessel",
    description:
      "Two stone vessels, recovered from the silt.\n\n**Vessel 6 — round pot:** carved waves crashing against cliffs. Inside: ground mineral powder with a deep, vivid sheen — cobalt ore. Letter: **C**.\n\n**Vessel 4 — narrow chalice:** carved spiral descending into earth. Inside: thin green-blue patina — verdigris, the residue left when copper corrodes. Letter: **L**.",
    houseIds: [jones.id],
  });

  // Jones A1M4 — Sliding Panels (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csSlate.id, act: 1,
    clueVisibleCategory: "Flat Inscribed Slate",
    header: "Flat Inscribed Slate",
    description:
      "Three slates dislodged from the wall grid.\n\n**Panel 1:** {{{SEALED}}} = SEALED\n\n**Panel 2:** {{{TOO}}} = TOO\n\n**Panel 3:** {{{FOREVER}}} = FOREVER",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSlate.id, act: 1,
    clueVisibleCategory: "Flat Inscribed Slate",
    header: "Flat Inscribed Slate",
    description:
      "Three slates, dust-caked, knocked loose from the wall grid.\n\n**Panel 4:** {{{THOSE}}} = THOSE\n\n**Panel 5:** {{{AWAY}}} = AWAY\n\n**Panel 6:** {{{LONG}}} = LONG",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSlate.id, act: 1,
    clueVisibleCategory: "Flat Inscribed Slate",
    header: "Flat Inscribed Slate",
    description:
      "Three slates, edges chipped from the fall.\n\n**Panel 7:** {{{WERE}}} = WERE\n\n**Panel 8:** {{{WHO}}} = WHO\n\n**Panel 9:** {{{STAYED}}} = STAYED",
    houseIds: [jones.id],
  });

  // Jones A1M5 — False Exit (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csStoneMarker.id, act: 1,
    clueVisibleCategory: "Worn Stone Marker",
    header: "Worn Stone Marker",
    description:
      "Three waymarkers, fallen from the corridor wall.\n\n**Marker 1:** \"The slope levels off. A draft from above. On the ceiling, a crack admits a thin shaft of light. The passage continues straight.\"\n\n**Marker 4:** \"The slope levels off. The passage opens into a chamber. Your lamplight reveals familiar shapes — your own equipment, your own markings. You have not climbed. You have descended.\"\n\n**Marker 6:** \"The passage turns sharply right. After the bare stone, angular glyphs reappear — and they are the same. You are seeing the backs of the same carvings.\"",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csStoneMarker.id, act: 1,
    clueVisibleCategory: "Worn Stone Marker",
    header: "Worn Stone Marker",
    description:
      "Two waymarkers from the corridor wall.\n\n**Marker 2:** \"Past the carvings, the downward slope steepens. The air grows warmer. A carved sun on the right wall — identical to one seen before, but on the wrong side.\"\n\n**Marker 7:** \"The passage turns sharply left. The carved sun is gone, replaced by repeating angular glyphs. The upward slope continues.\"",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csStoneMarker.id, act: 1,
    clueVisibleCategory: "Worn Stone Marker",
    header: "Worn Stone Marker",
    description:
      "Two waymarkers, half-buried in dust.\n\n**Marker 3:** \"The archway opens into a passage that slopes gently upward. The air grows warmer. On the left wall, a carved sun — the first hopeful symbol in this place.\"\n\n**Marker 5:** \"A right turn. The shaft of light falls behind. The passage begins to slope downward. The walls are bare stone.\"",
    houseIds: [jones.id],
  });

  // Croft A1M1 — Grappling Rigs (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csSteelHardware.id, act: 1,
    clueVisibleCategory: "Unmarked Steel Hardware",
    header: "Unmarked Steel Hardware",
    description:
      "Three pieces of climbing kit, scattered when the bag burst.\n\n**#4 Haul Pulley:** *\"Wheeled block. Mounts at the top to run the haul line through.\"*\n\n**#5 Wall Studs:** *\"Threaded steel bolts. First into bare rock. Nothing holds without them.\"*\n\n**#7 Fixed Line:** *\"Stiff rope. Ties off at the base, hangs the full height.\"*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSteelHardware.id, act: 1,
    clueVisibleCategory: "Unmarked Steel Hardware",
    header: "Unmarked Steel Hardware",
    description:
      "Two pieces of climbing kit, recovered from the chamber floor.\n\n**#2 Cargo Hook:** *\"Heavy clip. The last thing on the line. Gear bags attach here.\"*\n\n**#6 Top Bolts:** *\"Expansion bolts for the alcove. Useless until someone climbs up.\"*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csSteelHardware.id, act: 1,
    clueVisibleCategory: "Unmarked Steel Hardware",
    header: "Unmarked Steel Hardware",
    description:
      "Two pieces of climbing kit, picked out of the silt.\n\n**#1 Rope Clamps:** *\"Toothed grips. Bite the rope going up, lock tight coming down.\"*\n\n**#3 Anchor Plate:** *\"Flat bracket. Bolts flush to the starting anchor for a tie-off point.\"*",
    houseIds: [croft.id],
  });

  // Croft A1M2 — Stone Jigsaw (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csEdgeBlock.id, act: 1,
    clueVisibleCategory: "Odd Edge-Marked Block",
    header: "Odd Edge-Marked Block, Pair I",
    description:
      "Two stone fragments from the breached passage.\n\n**Tile 1:** Left edge ☆, right edge ●. Letter on face: **S**.\n\n**Tile 4:** Left edge ◆, right edge ◗. Letter on face: **N**.",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csEdgeBlock.id, act: 1,
    clueVisibleCategory: "Odd Edge-Marked Block",
    header: "Odd Edge-Marked Block, Pair II",
    description:
      "Two stone fragments, jagged at the edges.\n\n**Tile 2:** Left edge ●, right edge ▲. Letter on face: **T**.\n\n**Tile 5:** Left edge ◗, right edge ♦. Letter on face: **E**.",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csEdgeBlock.id, act: 1,
    clueVisibleCategory: "Odd Edge-Marked Block",
    header: "Odd Edge-Marked Block, Lone Fragment",
    description:
      "A stone fragment, edges scarred.\n\n**Tile 3:** Left edge ▲, right edge ◆. Letter on face: **O**.",
    houseIds: [croft.id],
  });

  // Croft A1M3 — Impossible Vase (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csMetalSpoke.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Spoke",
    header: "Inscribed Metal Spoke",
    description:
      "Two iron spokes, rusted. Ready to support a climb.\n\n**Spoke 1:** {{{FIND}}} = FIND\n\n**Spoke 2:** {{{EVER}}} = EVER",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMetalSpoke.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Spoke",
    header: "Inscribed Metal Spoke",
    description:
      "Three iron spokes, dust-caked from the fall.\n\n**Spoke 3:** {{{WHO}}} = WHO\n\n**Spoke 4:** {{{WAY}}} = WAY\n\n**Spoke 5:** {{{WILL}}} = WILL",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csMetalSpoke.id, act: 1,
    clueVisibleCategory: "Inscribed Metal Spoke",
    header: "Inscribed Metal Spoke",
    description:
      "Four iron spokes, corroded green at their tips.\n\n**Spoke 6:** {{{THOSE}}} = THOSE\n\n**Spoke 7:** {{{NO}}} = NO\n\n**Spoke 8:** {{{ENTER}}} = ENTER\n\n**Spoke 9:** {{{OUT}}} = OUT",
    houseIds: [croft.id],
  });

  // Croft A1M4 — Teaching Stone (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csBoneToken.id, act: 1,
    clueVisibleCategory: "Numbered Bone Token",
    header: "Numbered Bone Token",
    description:
      "A bone disc, palm-smooth from centuries of handling. A single number carved into the face: **5**.\n\n*The slot it fits is at Position 3 of the disc.*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBoneToken.id, act: 1,
    clueVisibleCategory: "Numbered Bone Token",
    header: "Numbered Bone Token",
    description:
      "A bone disc, smooth and pale.\n\n**Number: 9**\n\n*The slot is at Position 5.*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBoneToken.id, act: 1,
    clueVisibleCategory: "Numbered Bone Token",
    header: "Numbered Bone Token",
    description:
      "A bone disc, smooth and pale.\n\n**Number: 15**\n\n*The slot is at Position 8.*",
    houseIds: [croft.id],
  });

  // Croft A1M5 — Drag Marks (3 cards)
  await createClueCard({
    gameId: game.id, cardSetId: csPotteryShard.id, act: 1,
    clueVisibleCategory: "Ancient Pottery Shard",
    header: "Large Ancient Pottery Shard",
    description:
      "A pottery shard scratched with QRian-letter pairings — a builder's teaching aid.\n\n{{{T}}} = T\n\n{{{E}}} = E\n\n{{{L}}} = L\n\n{{{M}}} = M",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPotteryShard.id, act: 1,
    clueVisibleCategory: "Ancient Pottery Shard",
    header: "Crooked Ancient Pottery Shard",
    description:
      "A crooked sliver of pottery, more curve than flat. Letter-pairings are scratched along its outer face.\n\n{{{C}}} = C\n\n{{{H}}} = H\n\n{{{I}}} = I\n\n{{{D}}} = D",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPotteryShard.id, act: 1,
    clueVisibleCategory: "Ancient Pottery Shard",
    header: "Painted Ancient Pottery Shard",
    description:
      "A pottery shard with traces of red glaze still clinging to its edge. Letter-pairings are scratched through the paint.\n\n{{{O}}} = O\n\n{{{V}}} = V\n\n{{{S}}} = S\n\n{{{Y}}} = Y",
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
      content: "You blasted your way in with dynamite. The other houses can read their walls — you're here to take what pays. The water is rising; the longer you stand around, the less you walk out with.",
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: jones.id,
      act: 1,
      title: "Jones Junket — Act 1: The Flood",
      content: "You spent three months reading schematics for this. The QRians wrote everything down — read the walls, and they'll tell you where to go. The water is rising; whatever it eats first is gone for good.",
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: croft.id,
      act: 1,
      title: "Croft Company — Act 1: The Flood",
      content: "Lara dispatched you, and you don't disappoint Lara. Every chamber has a way up — find it before the water finds you. The other houses brought torches and guesses; you brought rope.",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACT 2 MISSIONS — DRAKE DELEGATION
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 2 missions — Drake...");

  const m_drake_a2_powder = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "Powder of the Quiet Bed",
      storySheetBlurb:
        "Sweeping across the far wall bedded in vines, you stop. What looked like a garden — flower arrangements pinned to vines — is actually a grid. The same shapes, repeating in patterns. Your medic says it: the flowers are extremely intentionally planted. Whatever the pharmacist here was making, the arrangement of the flowers probably communicates something about what they were working on... Working notes are scattered across the floor — you'll need them before the wall means anything…",
      correctAnswerReveal:
        "The three shapes resolve: B — Y — E. Not a formula. Not a dosing instruction. A farewell. The pharmacist embedded a goodbye in the arrangement of every plant in this room. The team's medic tells you: Batch A was the sedative. Batch B was the paralytic. Batch C was the terminal compound. Together they didn't just quiet the builders — they ended them. The QRians said goodbye to their own labor force in the language of botany, and left the word hidden in the wall they built.",
      description:
        "",
      puzzleDescription:
        "It takes a while, but you bombmen slowly understand the pharmacist's working note. They describe three batches of flowers — A, B, and C — each pinned across the wall as one specific variety of flower. For each batch, every numbered specimen of that flower-type on the printed grid, can be connected in the order the pharmacist marked them - to trace a QRian letter. If a flower in the batch has no number, it belongs to the glyph but stands alone. Three letters should spell a single English word.\n\nWhat does the wall say?",
      requiredClueSets: [{ cardSetId: csApothecaryNote.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansPowderQuietBed.id,
      consequenceCompleted:
        "As terrifying as this revelation of the terminal herbal mixture is, you all get a feeling it was done with zero malice. It was done almost as a sense of sad duty, and it was recorded artfully. Why did they choose to do this? ",
      consequenceNotCompleted:
        "The flower grid means nothing without the notes to decode it. We're carrying a map we can't read. Whatever the pharmacist was trying to do with these flowers stays hidden to you...",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_drake_a2_powder.id, [drake.id]);

  const m_drake_a2_drevu = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "Drevu's Compartment",
      storySheetBlurb:
        "Off the side-passage and into a dim alcove: a stone table set in the corner, surface scored with rows of inset tile-slots. Above it, a sealed compartment, no hinge. Your bomb-handler reads the gaps. Some weird passcode lock. Whoever Drevu was, he wrote it down before he sealed it. The other houses are holding tiles you'll need back…",
      correctAnswerReveal:
        "Both passcodes enter. The compartment opens. Inside: a folded record by **Mason Lamenter Drevu**.\n> *'We had no choice. The Source corrupts those who linger. We cannot send our scholars to build, our priests, our mathematicians \u2014 any of them taken by the work, taken by the place, lost to the obsession. So we sent the others. The unprotected. The ones who would carry the work but not the worth. They build without knowing what they build. They will not return. None of them. We have written the order. We will see it through. Forgive us. There was no other way.'*",
      description:
        "",
      puzzleDescription:
        "The stone table holds two procedure-rows of four inset tile-slots each. Slots 1, 2, and 3 are not here but probably scattered with the teams. **But slot 4 of each procedure is legitimately missing.** You're going to need to infer the word that completes the progression somehow...\n\nProcedure I goes: ___ → ___ → ___ → **?**\nProcedure II goes: ___ → ___ → ___ → **?**\n\nOnce you figure out slot 4 of each progression you'll be able to open the compartment...",
      requiredClueSets: [{ cardSetId: csDrevuTile.id, count: 3 }],
      answerTemplateType: "multiple_text",
      answerId: ansDrevuCompartment.id,
      consequenceCompleted:
        "You're touched by this Drevu character. He knew. He couldn't stop what he had to do. He asked forgiveness anyway. The QRians knew what they were doing to the builders, and at least one of them never made peace with it.",
      consequenceNotCompleted:
        "The compartment stays sealed; the lock holds. *We came close.* Drevu's record stays inside. We will not learn whose forgiveness he asked for, or whether he meant it. File and press on.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_drake_a2_drevu.id, [drake.id]);

  const m_drake_a2_redwall = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Wall of Repetitions, Red",
      storySheetBlurb:
        "Through the doorway and into the long chamber: the temple's east wall stretches floor-to-ceiling, carved with the same QRian phrase repeated over and over. You see the other expedition teams examining the wall, too. Hundreds of stacked rewrites, each eroded in its own way. Your bomb-handler crouches at the red tiles — carved this many times so the wall would still say it after the wall failed. Some of yours are with the others — you'll want them back…",
      correctAnswerReveal:
        "The wall says: **IT WAS MAKING US OBSESSED**. But what is \"it\"? And you feel like there is more to the message. Maybe you are missing something?",
      description:
        "",
      puzzleDescription:
        "Three red tiles, each a 21-character rewrite of the same eroded inscription. The carvers' chisels drifted at scattered positions: at every position, two of the three tiles preserved the original letter and one drifted to something else. The drift pattern is different on every tile.\n\nGather all three red *Wall Tile*s from the chamber. Lay the 21 characters of each tile side by side. At every position, the letter that appears on two tiles is the truth; the lone outlier is drift.\n\nWhat is carved into the red wall?",
      requiredClueSets: [{ cardSetId: csRedWallTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansRedWall.id,
      consequenceCompleted:
        "The wall says: IT WAS MAKING US OBSESSED. What is it? Some thing? Some place? Some one? The QRians felt something happening, and they were the ones writing it down, watching themselves go obsessive, recording the diagnosis in the act of being broken... If only they had a big enough bomb to solve their problem...",
      consequenceNotCompleted:
        "You don't figure out what the nonsense on the wall is. Your stomachs grumble from hunger... Little did you know, you just let everyone down.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_drake_a2_redwall.id, [drake.id]);

  const m_drake_a2_alcove = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Reagent Alcove",
      storySheetBlurb:
        "One of your crew leans against the wrong wall and a panel swings inward. He collapses on his behind. But, behind his behind: a low-ceilinged alcove stacked with sealed phials, crucibles, fired-clay jars. Your fuse-carrier crouches. Five compounds, refined very carefully. They were making something. Maybe arming against something... Bark labels lie scattered across the floor — some yours, others taken. You'll want them back…",
      correctAnswerReveal:
        "You all think... At a glance, ordinary — the working stock of any well-funded QRian workshop. But not in *this* alcove. The bronze is refined past tools. The glass past cups. The dyes too saturated for cloth, the perfumes too concentrated for ceremony. Whoever stocked this room wasn't decorating. The QRians were taking the most everyday compounds their civilization knew how to refine, and strengthening and combining them into something *purpose-built*. To counter something? You all wonder if that's true - or if your militaristic minds just think it's true.",
      description:
        "",
      puzzleDescription:
        "Five station-clusters of 2 reagents each. The scattered bark-labels, with their dual labels, can be read as a recipe for the named compound.\n\nFind out each compound the QRians were producing, one station at a time.",
      requiredClueSets: [{ cardSetId: csBarkLabel.id, count: 3 }],
      answerTemplateType: "multiple_text",
      answerId: ansReagentAlcove.id,
      consequenceCompleted:
        "You all wonder what the QRians were trying to create. You are not sure what it was, but everyone in your team respects people that can plan, build... and fight back, if need be.",
      consequenceNotCompleted:
        "Without the labels, the alcove is a chemist's vault of unmarked reagents and half-built apparatus. We know they were making something. We don't know what. File the panel and press on.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_drake_a2_alcove.id, [drake.id]);

  const m_drake_a2_bunker = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Reinforced Bunker",
      storySheetBlurb:
        "Past the central archway, into a side gallery: one stretch of wall is *wrong*. The masonry too dense, the cuts too tight. Your match-striker runs a hand along the seam. Whatever Togom hid in there, he sealed it from his own people. You've got the Fuse Charges — place them. A name is carved above: PRIEST PHYSICIST TOGOM. Riddle-tablets are nearby — gather them…",
      correctAnswerReveal:
        "The charges blow inward. Smoke clears. The bunker is small \u2014 barely a closet \u2014 and inside, on a stone shelf, are the scrolls. Togom's life work, sealed for whoever could solve his riddles. Your linguist unrolls the topmost. The translation reads:\n> *'We discovered this place on one of our expeditions. People who came back from this place suddenly had something in their eyes \u2014 some sort of wisdom. We eventually held more expeditions to this area, and realized that all who came toward this area and stayed there for a while would suddenly become a lot more logical in their thinking. It had to do with the area itself. Nothing we destroyed or built seemed to prevent this consequence. The effect could not be destroyed.'*",
      description:
        "",
      puzzleDescription:
        "You realize your **saved Fuse Charges** are *perfect* for breaching the bunker. Lucky you saved them — you blast right in.\n\nInside, you realize you'll have to solve the two cryptic riddles inscribed on the *Togom Riddle-Tablets* to release the inner scroll-case.\n\nGather both Togom Riddle-Tablets from the chamber, read the wordplay on each, and write each tablet's answer in its slot.",
      requiredClueSets: [{ cardSetId: csTogomTablet.id, count: 2 }],
      answerTemplateType: "multiple_text",
      answerId: ansReinforcedBunker.id,
      consequenceCompleted:
        "The things you learn from the scrolls blow your mind... er, metaphorically, not literally. Nevertheless, there was some sort of wisdom in this place? How did it work? You think it would be good, once you leave this place, to run some good, deep mathematical analyses...",
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

  const m_jones_a2_pantry = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Sealed Pantry",
      storySheetBlurb:
        "Off the main chamber to the right: an archway you missed, choked with vines. Push through. A storeroom — fired-clay jars on stone shelves, every one sealed. Some shelves still bear painted labels. Others are bare, the labels fallen. Whoever ate from this pantry was eating with intention. But what intention? The fallen labels are scattered — some pocketed, you'll want them back…",
      correctAnswerReveal:
        "Five preparations resolve: **PEPPER. PORRIDGE. OIL. CAKE. MILK.** Look at your kitchen at home \u2014 none of these would surprise you. But that's the point. To the QRians of this era, these weren't kitchen staples. They were *nootropics*. Pepper sharpened the senses. Porridge anchored the body. Oil eased thought. Cake \u2014 sweetened with honey \u2014 kept the mind warm and present. Milk steadied a person whose center was slipping. Every jar in this pantry is a food the QRians of this period genuinely believed could armor the mind against drift. They medicated themselves with breakfast. With dinner. With the everyday stock of a kitchen, deliberately preserved, deliberately stored, deliberately *kept*. They were eating their way through the contagion in the only language their medical understanding offered.",
      description:
        "",
      puzzleDescription:
        "Five shelf-clusters of 2 ingredients each. Match the scattered painted clay labels back to their shelves and read each cluster as a recipe — the named preparation it produces.\n\nName each preparation kept in this pantry. Let's find out what was being communicated by these recipes...\n\n1. ___ + ___ → ?\n2. ___ + ___ → ?\n3. ___ + ___ → ?\n4. ___ + ___ → ?\n5. ___ + ___ → ?",
      requiredClueSets: [{ cardSetId: csClayShelfLabel.id, count: 3 }],
      answerTemplateType: "multiple_text",
      answerId: ansSealedPantry.id,
      consequenceCompleted:
        "They medicated themselves with breakfast. The QRians weren't superstitious — they were precise, drafting a defense out of their everyday kitchen. Folk pharmacology, ethnobotany, proto-medicine — there's a paper in this room, maybe a department. The question you carry out is the one you can't answer yet: did it work?",
      consequenceNotCompleted:
        "Without the labels, the pantry is rows of sealed jars and silent shelves. We know they ate here. We don't know what they ate or why they kept it. File the storeroom as ambiguous and press on.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_jones_a2_pantry.id, [jones.id]);

  const m_jones_a2_amberwall = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Wall of Repetitions, Amber",
      storySheetBlurb:
        "Through the doorway and into the long chamber: the temple's east wall stretches floor-to-ceiling, carved with the same QRian phrase repeated over and over. You see the other expedition teams examining the wall, too. Hundreds of stacked rewrites, each eroded in its own way. Your linguist drops at the amber tiles. It's a confession the QRians wrote at scale. Some of yours are with the others — you'll want them back…",
      correctAnswerReveal:
        "The wall says: **THIS PLACE ONCE MADE US WISE**. *Once.* Past tense. They wouldn't carve a wall this many times for something they still had — whatever made them wise, they lost it. There's more on the other walls. Are you missing something?",
      description:
        "",
      puzzleDescription:
        "Three amber tiles, each a 23-character rewrite of the same eroded inscription. The carvers' chisels drifted at scattered positions: at every position, two of the three tiles preserved the original letter and one drifted to something else. The drift pattern is different on every tile.\n\nGather all three amber *Wall Tile*s from the chamber. Lay the 23 characters of each tile side by side. At every position, the letter that appears on two tiles is the truth; the lone outlier is drift.\n\nWhat is carved into the amber wall?",
      requiredClueSets: [{ cardSetId: csAmberWallTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansAmberWall.id,
      consequenceCompleted:
        "THIS PLACE ONCE MADE US WISE. The QRians aren't claiming credit. They're filing a confession: every field they're famous for, every breakthrough, was on loan from this place. They were tenants in their own genius. And the past tense is what bothers you — what did they do that made the gift stop?",
      consequenceNotCompleted:
        "Three eroded copies should have converged on the truth. They didn't — not for your team. The first line of the QRians' confession stays scattered. *PLACE* and *WISE* glare out from the corruption with nothing between them. Dr. Jones would have gotten this. The team doesn't say so out loud.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_jones_a2_amberwall.id, [jones.id]);

  const m_jones_a2_vesh = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "Vesh's Compartment",
      storySheetBlurb:
        "Off the side-passage and into a quiet alcove: a stone table in the corner, surface marked in careful columns of inset tile-slots. Above it, a sealed compartment, no hinge. Your linguist reads the rows. Phrase-lock. Vesh logged something this place wanted forgotten. Some of your tiles are with the other houses \u2014 you'll need them back\u2026",
      correctAnswerReveal:
        "The compartment opens. Inside: a logged record by **Witness Chronicler Vesh**. You see a scroll...\n\n> *'The construction was assigned to expendable labor. The decision was made on the principle that exposure to the Source would corrupt any individual of consequence to our civilization, and we could not afford the loss. The expendable population — captured peoples, criminals, the unaccountable — were directed to the work. They built in shifts of approximately forty days. Their disposal at completion was logistical. The temple was completed in less than two cycles, an impressive output. Records to follow.'*\n\nVesh chose his lock from the body's own vocabulary — what carries, and what the body tries to expel. He believed that whatever was here moved through bodies the way pollen moves through tissue, and he locked his record with words that proved it to himself. Whether he was right or not, his framework is the framework he used to decide who to send. ",
      description:
        "",
      puzzleDescription:
        "The stone table holds two procedure-rows of four inset tile-slots each. Slots 1, 2, and 3 are not here but probably scattered with the teams. **But slot 4 of each procedure is legitimately missing.** You're going to need to infer the word that completes the progression somehow...\n\nProcedure I goes: ___ → ___ → ___ → **?**\nProcedure II goes: ___ → ___ → ___ → **?**\n\nOnce you figure out slot 4 of each progression you'll be able to open the compartment...",
      requiredClueSets: [{ cardSetId: csVeshTile.id, count: 3 }],
      answerTemplateType: "multiple_text",
      answerId: ansVeshCompartment.id,
      consequenceCompleted:
        "The QRians had a class system that absorbed the moral cost of what it took to build this temple without flinching, and Vesh wrote the receipt. No anguish, no pride, just the cycles. \n\nYou wonder, what was it like... Did he enjoy doing the math?",
      consequenceNotCompleted:
        "The compartment stays sealed; the lock holds. *We came close.* Vesh's record stays inside. We will not learn how cleanly he chose to write his cycles. File and press on.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_jones_a2_vesh.id, [jones.id]);

  const m_jones_a2_garden = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Hanging Garden of Names",
      storySheetBlurb:
        "Through the doors and into the dome: a greenhouse three stories high — slits through stone instead of glass — full of hanging vines. Many are weighted at their tips with a bonelike tag. Thousands. They turn slow in the draft from the slits. Each tag appears to have a small face on its underside, visible only from below. And all the tags are arranged, in the vines, in a strange ritualistic order... As if they spell something, in three dimensions, that you can only read by lying back and looking up... Incredible...",
      correctAnswerReveal:
        "You did it. It's \"J — A — W\". It makes sense. The bonelike structures you are seeing are the parts of the jaws of dead QRians. They found the power of speech and communication so beautiful and so specific to each person, that is how they memorized them - and as bones can last thousands of years - they felt that the souls of their citizens could hopefully last for years too...",
      description:
        "",
      puzzleDescription:
        "The canopy hangs at high altitude and high density. Lie face-up beneath it — each tag shows a small face on its underside, visible only from below: closed mouth, open mouth, or mid-mouth. The face marks the class of the tag's glyph (closers, openers, carriers) by the QRian phonetic articulation it carried.\n\nEach *Burial-Rite Fragment* names one class and the ritual order in which to strike its tags. Crack the whips precisely — these vines are too close-packed to pull by hand, and a clumsy strike will drop the wrong names. After completing a fragment's rite, lie face-up again: the empty positions where that class's tags hung now outline a single QRian super-glyph against the surviving canopy — a single English letter.\n\nThree fragments, three letters, one English word. What must this place say?",
      requiredClueSets: [{ cardSetId: csBurialRiteFragment.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansHangingGarden.id,
      consequenceCompleted:
        "You are all touched by this - but you wonder - why would they construct such a wonderful design?",
      consequenceNotCompleted:
        "You don't figure out what beauties are here. Just another mystery left unsolved. It gives you a terrible bellyache.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_jones_a2_garden.id, [jones.id]);

  const m_jones_a2_ceiling = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Ceiling Inscription",
      storySheetBlurb:
        "Northeast corner of the chamber, where the ceiling slopes low to meet the wall: faint chiseled glyphs catch the lamp-light. Your linguist freezes. That's a name. Below the inscription, a stone tile sits slightly proud of the wall \u2014 a pull-tab. Sefa wanted to be found. The riddle is her invitation. Riddle-tablets are scattered nearby \u2014 you'll want them all to release the case\u2026",
      correctAnswerReveal:
        "The tile pulls away. Behind it, exactly the depth of an arm: a tightly-wrapped scroll-bundle. Sefa's writing, untouched. Your linguist unrolls the topmost. The translation reads:\n> *'All those affected by the Source suddenly carried the power of a blocky, descriptive language. The script exploded throughout our civilization \u2014 everyone began using these blocky letters to communicate. It seemed effective at first. It was a powerful way to evolve our language. But it affected our entire culture, intimately, perhaps too intimately.'*",
      description:
        "",
      puzzleDescription:
        "Two cryptic riddles, inscribed on the *Sefa Riddle-Tablets*, seal the inner scroll-case behind the loose ceiling tile.\n\nGather both Sefa Riddle-Tablets from the chamber, read the wordplay on each, and write each tablet's answer in its slot.",
      requiredClueSets: [{ cardSetId: csSefaTablet.id, count: 2 }],
      answerTemplateType: "multiple_text",
      answerId: ansCeilingInscription.id,
      consequenceCompleted:
        "You almost cheer at reading this smoking gun. It explains so much! If you can just take this scroll outside this temple, you'll be the most famous researchers the world has ever seen. You might even get biopics! But - back to reality - what the scroll admits is jaw-dropping. What kind of power was here?",
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

  const m_croft_a2_floor = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Reckoning Floor",
      storySheetBlurb:
        "Down the steps and across the chamber floor: a wide stone slab, set with thousands of pebbles, each carved with a single number. Your engineer crouches and starts tracing stones with their fingers. They stop and look up. \"They were measuring something... Calculating something...\" Can you find out what?",
      correctAnswerReveal:
        "TIME. The QRian language was so intertwined with mathematics, that they could communicate what they were calculating... as they calculated it. It seems the QRians were calculating something about time. How long they'd been around? How long the world had existed? Or perhaps how long they had left?",
      description:
        "",
      puzzleDescription:
        "There are some tablets cast across the floor with some QRian markings. It seems clear that these tablets can help certain parts of the calculation floor come to light... You don't know how, but you do know that QRian mathematics and language seem intimately intertwined...\n\nYou're going to need to find all those Calculation Tablets first.",
      requiredClueSets: [{ cardSetId: csCalculationTablet.id, count: 4 }],
      answerTemplateType: "single_answer",
      answerId: ansReckoningFloor.id,
      consequenceCompleted:
        "It's clear that this civilization had a level of mathematical understanding so far developed, it's almost like they were cognitively different. It's weird and wonderful at the same time to the team, but now you're wondering... Where are they?",
      consequenceNotCompleted:
        "Without the calculator's working notes, the pebble floor is a frozen abacus running no software. We know they were measuring something. Not what. File the find as ambiguous and press on. You're sexy climbers, not eggheads.",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_croft_a2_floor.id, [croft.id]);

  const m_croft_a2_sighting = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Sighting Wall",
      storySheetBlurb:
        "Up the ledge your climber uncovered: the chamber narrows to a wall full of slits. Thin vertical cuts, each no wider than a hand, looking out over canopy and basin and far ridges. Set into many: amber lenses, polished smooth, each labeled. The QRians were measuring whether this place was special. The lenses know. Other slits are bare; their labels fell and scattered. *The first one your climber lifts crumbles in their fingers. They glance at you, then at the doors the other houses came through. Every label in this room is on the same clock \u2014 ours, theirs, all of them.*",
      correctAnswerReveal:
        "Yes, this is right. Not weather forecasting. Not crop timing. Not warfare reconnaissance. The QRians were *triangulating their own location in the universe*. They watched the sky for what they couldn't otherwise know — where they sat in the bigger pattern, what their place was relative to fixed stars, how the weather over this valley differed from the weather over every other valley. This place was very, very special to them. They built this lens wall to find out *how* special. It's like they thought here was... **the Source** of something... Or in Cartesian terms... an origin...",
      description:
        "",
      puzzleDescription:
        "There are five clusters of 2 slits/lenses each, every cluster tracking one observable phenomenon. The dual names of the clusters, when imaginatively understood, will help you realize exactly what each lens was for.\n\nFind out each phenomenon the QRians were observing, one cluster at a time.",
      requiredClueSets: [{ cardSetId: csLensLabel.id, count: 3 }],
      answerTemplateType: "multiple_text",
      answerId: ansSightingWall.id,
      consequenceCompleted:
        "The QRians were *triangulating their own location in the universe* — watching the sky's transitions for what they couldn't otherwise know. This place was special to them. They built this wall to find out *how* special. They were measuring whether the Source was bound to this geography, or bigger than that. ",
      consequenceNotCompleted:
        "Without the labels, the lenses look out on an indifferent horizon. They say something... But we don't know what they were watching for. File the wall as an observatory of unknown purpose and press on. They probably just liked the sunsets.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_croft_a2_sighting.id, [croft.id]);

  const m_croft_a2_krane = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "Krane's Compartment",
      storySheetBlurb:
        "Off the side-passage and into a tight alcove: a stone table set in the corner, mechanism still snug — rows of inset tile-slots, some filled, some empty. Above it, a sealed compartment, no hinge. Your point climber checks the slots. It probably still works - it might help open the compartment above. \"Krane\" helped design this temple. This individual left a signed working note behind, before he sealed the compartment. The other houses have tiles you'll need back…",
      correctAnswerReveal:
        "Both passcodes enter. The compartment opens. Inside: another working note by **Foreman Geometer Krane**.\n> *'The labor system was elegant. We needed builders we could afford to lose. We had them. The captives were efficient when motivated, the criminals when threatened, and the **unchanged** when convinced of purpose. We assigned tasks by aptitude — the strong to lifting, the deft to inlay, the small to ducting. The work proceeded smoothly. Their elimination at completion was a kindness; we would not return them to a world we have decided they can no longer rejoin. The temple stands as proof of what we gained... and what we lost.'*",
      description:
        "",
      puzzleDescription:
        "The stone table holds two procedure-rows of four inset tile-slots each. Slots 1, 2, and 3 are not here but probably scattered with the teams. **But slot 4 of each procedure is legitimately missing.** You're going to need to infer the word that completes the progression somehow...\n\nProcedure I goes: ___ → ___ → ___ → **?**\nProcedure II goes: ___ → ___ → ___ → **?**\n\nOnce you figure out slot 4 of each progression you'll be able to open the compartment...",
      requiredClueSets: [{ cardSetId: csKraneTile.id, count: 3 }],
      answerTemplateType: "multiple_text",
      answerId: ansKraneCompartment.id,
      consequenceCompleted:
        "A lot of civilizations build these temples with their slaves, with their convicts - but there's something special here. Eliminating the people that helped build the temple? Why build this temple at all? Why have a flood system? What was this for... And who were the... **unchanged**?",
      consequenceNotCompleted:
        "The compartment stays sealed; the lock holds. *We came close.* Krane's record stays inside. We will not learn what he found elegant, or why. File and press on.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_croft_a2_krane.id, [croft.id]);

  const m_croft_a2_purplewall = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The Wall of Repetitions, Purple",
      storySheetBlurb:
        "Through the doorway and into the long chamber: the temple's east wall stretches floor-to-ceiling, carved with the same QRian phrase repeated over and over. You see the other expedition teams examining the wall, too. Hundreds of stacked rewrites, each eroded in its own way. Your point climber kneels at the purple tiles — the hinge of the confession, wisdom turning to obsession slowly enough to write down. Some of yours are with the others — you'll want them back…",
      correctAnswerReveal:
        "The wall says: **UNTIL WE SLOWLY REALIZED**. It seems to be part of a sentence. Are you missing something?",
      description:
        "",
      puzzleDescription:
        "Three purple tiles, each a 21-character rewrite of the same eroded inscription. The carvers' chisels drifted at scattered positions: at every position, two of the three tiles preserved the original letter and one drifted to something else. The drift pattern is different on every tile.\n\nGather all three purple *Wall Tile*s from the chamber. Lay the 21 characters of each tile side by side. At every position, the letter that appears on two tiles is the truth; the lone outlier is drift.\n\nWhat is carved into the purple wall?",
      requiredClueSets: [{ cardSetId: csPurpleWallTile.id, count: 3 }],
      answerTemplateType: "single_answer",
      answerId: ansPurpleWall.id,
      consequenceCompleted:
        "\"UNTIL WE SLOWLY REALIZED.\" As beautiful as this place is, it's also grim. Something amazing and terrifying was happening here.",
      consequenceNotCompleted:
        "You don't have time to look at ancient chicken scratch, especially when there are so many transcription errors. Strangely, though - you have a feeling you let everyone down...",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_croft_a2_purplewall.id, [croft.id]);

  const m_croft_a2_ledge = await createMission({
    data: {
      gameId: game.id,
      act: 2,
      title: "The High Ledge",
      storySheetBlurb:
        "Up the gallery wall: a small ledge, twelve feet of sheer rock above the chamber floor \u2014 too high to jump, too smooth to climb. A compartment cut into the face, sealed with a wooden lid. Your point climber tilts her head back. He kept his theory above where the floor could reach. You've got the Grappling Rigs \u2014 set the lines. Riddle-tablets are nearby \u2014 gather them\u2026",
      correctAnswerReveal:
        "The lid lifts. The compartment is small but dry \u2014 Yenus chose his ledge well. Inside: the scrolls. Your engineer unrolls the topmost. The translation reads:\n> *'This place was special. Almost divine, even. It gave us a sense of understanding which vastly accelerated our civilization. We understood mathematics, logic, physics \u2014 somehow suddenly, somehow intuitively. And somehow obsessively. We used our new knowledge to build our civilization to great heights. Farmers became mathematicians; merchants became astronomers; we became the envy of the land. Little did we know that this obsession was an unstoppable force\u2026'*",
      description:
        "",
      puzzleDescription:
        "You realize your **saved Grappling Rigs** are *perfect* for reaching the ledge. Lucky you saved them — you set the lines and climb right up.\n\nInside, you realize you'll have to solve the two cryptic riddles inscribed on the *Yenus Riddle-Tablets* to release the inner scroll-case.\n\nGather both Yenus Riddle-Tablets from the chamber, read the wordplay on each, and write each tablet's answer in its slot.",
      requiredClueSets: [{ cardSetId: csYenusTablet.id, count: 2 }],
      answerTemplateType: "multiple_text",
      answerId: ansHighLedge.id,
      consequenceCompleted:
        "The translation: *this place was special… it gave us a sense of understanding which vastly accelerated our civilization… farmers became mathematicians; merchants became astronomers… little did we know that this obsession was an unstoppable force.* The Source didn't just affect them, it *gave* them — mathematics, logic, physics, all suddenly, all intuitively. Civilization-altering wisdom for free. They didn't realize until too late that the wisdom and the obsession were the same thing.",
      consequenceNotCompleted:
        "Without the rigs, the ledge is unreachable \u2014 Yenus chose his elevation well. Or with the riddles unsolved, the inner case won't release. Either way, the scrolls stay out of reach. File and press on.",
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
      "*Folded note in the pharmacist's hand.*\n\n**Batch A — Soporific base compound.** *The pink flowers (🌸).* On the printed grid, connect every numbered Batch A flower in the order the pharmacist marked them. If any Batch A flower has no number, it belongs to the glyph but stands alone. The path traces the first letter of the answer.",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csApothecaryNote.id, act: 2,
    clueVisibleCategory: "Apothecary Note",
    header: "Apothecary Note, Ink-stained",
    description:
      "*Ink-stained note from the same hand.*\n\n**Batch B — Activating agent.** *The purple flowers (🪻).* On the printed grid, connect every numbered Batch B flower in the order the pharmacist marked them. If any Batch B flower has no number, it belongs to the glyph but stands alone. The shape is the second letter.",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csApothecaryNote.id, act: 2,
    clueVisibleCategory: "Apothecary Note",
    header: "Apothecary Note, Torn",
    description:
      "*Torn note. The bottom edge is missing.*\n\n**Batch C — Terminal compound.** *The wilting flowers (🥀).* On the printed grid, connect every numbered Batch C flower in the order the pharmacist marked them. If any Batch C flower has no number, it belongs to the glyph but stands alone. The shape is the third and last letter.",
    houseIds: [croft.id],
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
      "*A pried-loose tile from the east wall, color: red. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`XVWRSMAPINCUSOBSQSFED`\n\n*(Two more red tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original; the lone outlier is drift.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csRedWallTile.id, act: 2,
    clueVisibleCategory: "Red Wall Tile",
    header: "Red Wall Tile, 2",
    description:
      "*A pried-loose tile from the east wall, color: red. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`ITWAJYAKIHGTSRVSESSEW`\n\n*(Two more red tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csRedWallTile.id, act: 2,
    clueVisibleCategory: "Red Wall Tile",
    header: "Red Wall Tile, 3",
    description:
      "*A pried-loose tile from the east wall, color: red. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`ITKASMLKZNGUNOBPECSBD`\n\n*(Two more red tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original.)*",
    houseIds: [croft.id],
  });

  // Drake A2M4 — The Reagent Alcove (3 cards, all Drake)
  await createClueCard({
    gameId: game.id, cardSetId: csBarkLabel.id, act: 2,
    clueVisibleCategory: "Bark Label",
    header: "Bark Label",
    description:
      "Bark labels torn loose when the alcove panel slammed. Each label was pinned beneath a station's apparatus.\n\n**Station 1 (2 reagents):** COPPER, TIN\n\n**Station 2 (2 reagents):** SAND, HEAT",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBarkLabel.id, act: 2,
    clueVisibleCategory: "Bark Label",
    header: "Bark Label",
    description:
      "Bark labels, torn from beneath an apparatus.\n\n**Station 3 (2 reagents):** FAT, ASH\n\n**Station 4 (2 reagents):** PLANT, STAIN",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBarkLabel.id, act: 2,
    clueVisibleCategory: "Bark Label",
    header: "Bark Label",
    description:
      "A bark label, torn from beneath a station's apparatus.\n\n**Station 5 (2 reagents):** FLOWER, SPIRIT",
    houseIds: [croft.id],
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
    houseIds: [jones.id],
  });

  // Jones A2M1 — The Sealed Pantry (3 cards, all Jones)
  await createClueCard({
    gameId: game.id, cardSetId: csClayShelfLabel.id, act: 2,
    clueVisibleCategory: "Painted Clay Shelf-Label",
    header: "Painted Clay Shelf-Label",
    description:
      "Painted clay shelf-labels, fallen and scattered when the vines breached the pantry. Each label once sat beneath a sealed jar.\n\n**Shelf 1 (2 ingredients):** FRUIT, FIRE\n\n**Shelf 2 (2 ingredients):** OATS, STEW",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csClayShelfLabel.id, act: 2,
    clueVisibleCategory: "Painted Clay Shelf-Label",
    header: "Painted Clay Shelf-Label",
    description:
      "Painted clay shelf-labels, fallen from the pantry shelves.\n\n**Shelf 3 (2 ingredients):** PLANT, GREASE\n\n**Shelf 4 (2 ingredients):** HONEY, BREAD",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csClayShelfLabel.id, act: 2,
    clueVisibleCategory: "Painted Clay Shelf-Label",
    header: "Painted Clay Shelf-Label",
    description:
      "A painted clay shelf-label, knocked from a pantry shelf.\n\n**Shelf 5 (2 ingredients):** CREATURE, DRINK",
    houseIds: [drake.id],
  });

  // Jones A2M2 — Wall of Repetitions, Amber (3 tiles, distributed)
  await createClueCard({
    gameId: game.id, cardSetId: csAmberWallTile.id, act: 2,
    clueVisibleCategory: "Amber Wall Tile",
    header: "Amber Wall Tile, 1",
    description:
      "*A pried-loose tile from the east wall, color: amber. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`FHYSPKACQOVCEJADERSWIXE`\n\n*(Two more amber tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original; the lone outlier is drift.)*",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csAmberWallTile.id, act: 2,
    clueVisibleCategory: "Amber Wall Tile",
    header: "Amber Wall Tile, 2",
    description:
      "*A pried-loose tile from the east wall, color: amber. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`THISZLAWEONNEMAPTUSKASY`\n\n*(Two more amber tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csAmberWallTile.id, act: 2,
    clueVisibleCategory: "Amber Wall Tile",
    header: "Amber Wall Tile, 3",
    description:
      "*A pried-loose tile from the east wall, color: amber. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`TRIVPLICEBNCFMGDEUQWISE`\n\n*(Two more amber tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original.)*",
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
      "*A folded scrap of inscribed bark — sorting instructions for the canopy.*\n\n\"Strike first the **speakers** — every glyph that closes the mouth. The dead spoke our names back to us in the order we forgot them; we wrote each name on the bone that had carried it. Crack each in turn.\"\n\n*(Lie face-up beneath the canopy. Identify every closer-class face on the undersides above you. Strike them in the ritual order this fragment gives. The closer-class gaps in the canopy will outline a single letter.)*\n\n*The bark is brittle — it won't survive your warmth long.*",
    selfDestructTimer: 60,
    selfDestructText: "The fragment crumbles to ash between your fingers.",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBurialRiteFragment.id, act: 2,
    clueVisibleCategory: "Burial-Rite Fragment",
    header: "Burial-Rite Fragment, Charred",
    description:
      "*A charred scrap, edges blackened.*\n\n\"Then the **openers** — glyphs that part the lips. We did not bury our scholars. To bury would have meant we stopped recording. We hung them instead, where the wind could still move through what they had said. Crack in turn; let each one fall.\"\n\n*(Identify every opener-class face on the undersides above you; strike in the ritual order. The opener-class gaps will outline a second letter.)*\n\n*The bark is brittle — it won't survive your warmth long.*",
    selfDestructTimer: 60,
    selfDestructText: "The fragment crumbles to ash between your fingers.",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csBurialRiteFragment.id, act: 2,
    clueVisibleCategory: "Burial-Rite Fragment",
    header: "Burial-Rite Fragment, Half-Erased",
    description:
      "*A half-erased scrap; some text remains legible.*\n\n\"Last, the **carriers** — glyphs that ride the breath out. A name is only the shape the jaw makes when the body is gone. Strike them in the order the breath leaves.\"\n\n*(Identify every carrier-class face on the undersides above you; strike in the ritual order. The carrier-class gaps will outline the third and final letter.)*\n\n*The bark is brittle — it won't survive your warmth long.*",
    selfDestructTimer: 60,
    selfDestructText: "The fragment crumbles to ash between your fingers.",
    houseIds: [drake.id],
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
    houseIds: [croft.id],
  });

  // Croft A2M1 — The Reckoning Floor (4 cards, distributed Croft 1 / Drake 1 / Jones 2)
  await createClueCard({
    gameId: game.id, cardSetId: csCalculationTablet.id, act: 2,
    clueVisibleCategory: "Calculation Tablet",
    header: "Three Calculation Tablet",
    description:
      "*The calculator's working note for digit-class **3**.*\n\n\"Three-class pebbles mark the unit. Find every pebble on the floor carved with **3**. The pebbles together form the shape of a QRian super-glyph — the first letter.\"\n\n*(Math here writes itself in language.)*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCalculationTablet.id, act: 2,
    clueVisibleCategory: "Calculation Tablet",
    header: "Five Calculation Tablet",
    description:
      "*The calculator's working note for digit-class **5**.*\n\n\"Five-class pebbles mark the rate. Find every pebble carved with **5**. The pebbles together form the shape of a super-glyph — the second letter.\"",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCalculationTablet.id, act: 2,
    clueVisibleCategory: "Calculation Tablet",
    header: "Seven Calculation Tablet",
    description:
      "*The calculator's working note for digit-class **7**.*\n\n\"Seven-class pebbles mark the elapsed. Find every pebble carved with **7**. Their shape is the third letter.\"",
    houseIds: [jones.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csCalculationTablet.id, act: 2,
    clueVisibleCategory: "Calculation Tablet",
    header: "Nine Calculation Tablet",
    description:
      "*The calculator's working note for digit-class **9**.*\n\n\"Nine-class pebbles mark the remainder. Find every pebble carved with **9**. Their shape is the fourth letter.\"",
    houseIds: [jones.id],
  });

  // Croft A2M2 — The Sighting Wall (3 cards, all Croft)
  await createClueCard({
    gameId: game.id, cardSetId: csLensLabel.id, act: 2,
    clueVisibleCategory: "Lens-Label",
    header: "Lens-Label",
    description:
      "Lens-labels fallen from the sighting wall and scattered to the chamber below. Each label once sat beside a polished amber lens.\n\n**Cluster 1 (2 lenses):** NIGHT, SURRENDER\n\n**Cluster 2 (2 lenses):** DARK, THRONE\n\n*The labels are sun-bleached past safety — they flake apart on contact.*",
    selfDestructTimer: 60,
    selfDestructText: "The label flakes apart in the chamber air. Nothing readable remains.",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csLensLabel.id, act: 2,
    clueVisibleCategory: "Lens-Label",
    header: "Lens-Label",
    description:
      "Lens-labels, fallen from the sighting wall.\n\n**Cluster 3 (2 lenses):** HEAT, FALSEHOOD\n\n**Cluster 4 (2 lenses):** SHADOW, SUN\n\n*The labels are sun-bleached past safety — they flake apart on contact.*",
    selfDestructTimer: 60,
    selfDestructText: "The label flakes apart in the chamber air. Nothing readable remains.",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csLensLabel.id, act: 2,
    clueVisibleCategory: "Lens-Label",
    header: "Lens-Label",
    description:
      "A lens-label, fallen from the sighting wall.\n\n**Cluster 5 (2 lenses):** DAY, DEATH\n\n*The labels are sun-bleached past safety — they flake apart on contact.*",
    selfDestructTimer: 60,
    selfDestructText: "The label flakes apart in the chamber air. Nothing readable remains.",
    houseIds: [jones.id],
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
      "*A pried-loose tile from the east wall, color: purple. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`UFTIKWESQOWVYREJLPZEX`\n\n*(Two more purple tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original; the lone outlier is drift.)*",
    houseIds: [croft.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPurpleWallTile.id, act: 2,
    clueVisibleCategory: "Purple Wall Tile",
    header: "Purple Wall Tile, 2",
    description:
      "*A pried-loose tile from the east wall, color: purple. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`CNTYLWHSLOTLYBEAGIZND`\n\n*(Two more purple tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original.)*",
    houseIds: [drake.id],
  });
  await createClueCard({
    gameId: game.id, cardSetId: csPurpleWallTile.id, act: 2,
    clueVisibleCategory: "Purple Wall Tile",
    header: "Purple Wall Tile, 3",
    description:
      "*A pried-loose tile from the east wall, color: purple. The carvers' chisels drifted at scattered positions; some letters survived, some drifted to look-alikes. The drift pattern is different on every tile.*\n\n`UNDILREMLFWLQRVALIKED`\n\n*(Two more purple tiles are out there with different drift patterns. Pool all three. At every position, the letter that appears on two tiles is the original.)*",
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
    houseIds: [drake.id],
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
      content: "The temple is sealing itself behind you. The other houses are reading walls; you came to raid inventories. Find what the QRians were really making — and pocket it before the doors finish closing.",
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: jones.id,
      act: 2,
      title: "Jones Junket — Act 2: The Corruption",
      content: "The temple is sealing itself behind you. Every wall is a sentence the QRians could not stop writing — decode what they preserved. The doors are closing; what you don't read here, no scholar will read again.",
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: croft.id,
      act: 2,
      title: "Croft Company — Act 2: The Corruption",
      content: "The temple is sealing itself behind you. The QRians left their math frozen in stone — crack what they ran out of time to finish. The doors are closing; the answer's still in the room, but the room won't be.",
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
        "You didn't recover the Grappling Rigs in Act 1 — this mission is impossible. Yenus's ledge is twelve feet of sheer rock with no holds. Without your rigs, - and your kit components used down in the food area - the compartment stays out of reach.",
      sortOrder: 1,
    },
  });

  // Drake M3 Astrolabe failure → no map in Drevu's Compartment
  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_drake_t1.id,
      targetMissionId: m_drake_a2_drevu.id,
      type: "warning",
      triggerOnFailure: true,
      triggerOnSuccess: false,
      message:
        "You don't have the Shadow Astrolabe — without it, your bomb-handler is reading this chamber from instinct, not from the QRians' own map of it. Don't mess up.",
      sortOrder: 1,
    },
  });

  // Jones M2 Drainage failure → 3 cards lost in Act 2 (host pulls at act break)
  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_jones_flood.id,
      targetMissionId: null,
      type: "redistribute",
      triggerOnFailure: true,
      triggerOnSuccess: false,
      message:
        "At act break, pull 3 of Jones's Act 2 clue cards from play before redistribution. The flood reached the upper chambers — three inscriptions Jones would have read have been washed past legibility. Pick which 3 based on what won't soft-fail Jones's most important Act 2 missions; this is meant to make Act 2 harder, not impossible.",
      sortOrder: 1,
    },
  });

  // Croft M2 Jigsaw failure → 2 cards lost in Act 2 (host pulls at act break)
  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_croft_flood.id,
      targetMissionId: null,
      type: "redistribute",
      triggerOnFailure: true,
      triggerOnSuccess: false,
      message:
        "At act break, pull 2 of Croft's Act 2 clue cards from play before redistribution. The unsealed passage flooded the next chamber — two of Croft's Act 2 finds are now underwater. Pick which 2 based on what won't soft-fail Croft's most important Act 2 missions.",
      sortOrder: 1,
    },
  });

  // Croft M3 Teaching Stone success → host narrates a bonus discovery
  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_croft_t2.id,
      targetMissionId: null,
      type: "redistribute",
      triggerOnFailure: false,
      triggerOnSuccess: true,
      message:
        "Team did really well - make some story about how well they did, and how they will find extra items",
      sortOrder: 0,
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
      description: `*2 Seasons After The Source · From the first year of the valley schools*

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
      description: `*27 Seasons After The Source · Issued after repeat visits became common*

By order of the Survey Council: no citizen may enter the bright chamber twice in the same ten-day unless called by the schools or the measuring office.

This rule is not a punishment. It is a correction. Too many who leave the chamber ask to return before their work is even copied down.`,
      order: 4,
      houseIds: [croft.id],
      notes: "Discovery era. Drake-leaning evidence: boundary-setting began early because people could not leave the Source alone.",
    },
    {
      header: "The Fifty-Seventh Lesson",
      description: `*159 Seasons After The Source · Two generations after the first valley schools opened*

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
      description: `*204 Seasons After The Source · Written after the night returns began*

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
      description: `*260 Seasons After The Source · Written during the final closing of the temple*

West choke-point sealed at dusk. False stair cut and dressed to appear older than the true passage. Third gate lowered before noon.

The council's order stands: no straight road in, no clear road out, and no chamber that opens without witness. If we build mercy into the plan, someone later will mistake it for an invitation.

Six laborers were lost today. The work continues at first light.`,
      order: 11,
      houseIds: [drake.id],
      notes: "Consent era. Drake-leaning evidence: the temple was consciously designed as prison architecture.",
    },
    {
      header: "Testimony of Sefa Before the Closing",
      description: `*262 Seasons After The Source · Recorded on the last day before the lower seal was set*

We had the land-killing compounds, and where we tested them, nothing green returned. We could have made the valley unlivable and called that virtue.

Instead we chose the temple. I do not know if this was courage, vanity, or merely the last form our love of order could take.

We chose to leave the future a danger behind stone, not a world already ruined by our fear.`,
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
    // Jones — Knowledge platform: writing survives, world hears, record before any decision.
    copy_inscriptions: jones.id,
    publish_discovery: jones.id,
    preserve_some_artifacts: jones.id,
    no_judgment_without_record: jones.id,
    // Croft — Stewardship platform: shared, supervised, glory-free, future warned.
    three_witness_rule: croft.id,
    three_house_custody: croft.id,
    no_house_takes_credit: croft.id,
    leave_unmistakable_warning: croft.id,
    // Drake — Containment platform: lock it down forever, nothing leaves.
    withhold_mechanism: drake.id,
    no_private_keeping: drake.id,
    suppress_location: drake.id,
    no_ready_passage: drake.id,
  };

  for (const outcome of FINALE_OUTCOMES) {
    const ownerHouseId = outcomeHouseByOutcomeId[outcome.id];
    const card = await prisma.card.create({
      data: {
        gameId: game.id,
        physicalCardId: nextPhysicalCardId(3),
        act: 3,
        subtype: "reference",
        cardSetId: csAct3Outcome.id,
        designId:
          (ownerHouseId && settlementDesignByHouseId[ownerHouseId]) ||
          designByCardSet[csAct3Outcome.id],
        clueVisibleCategory: "Major Decision",
        complexity: "simple",
        header: outcome.label,
        description: outcome.description,
        notes: `Act 3 outcome reference card (${outcome.id}).`,
      },
    });
    if (ownerHouseId) {
      await assignCardHouses(card.id, [ownerHouseId]);
    }
  }

  for (const clause of FINALE_CLAUSES) {
    const ownerHouseId = clauseHouseByClauseId[clause.id];
    const card = await prisma.card.create({
      data: {
        gameId: game.id,
        physicalCardId: nextPhysicalCardId(3),
        act: 3,
        subtype: "reference",
        cardSetId: csAct3Clause.id,
        designId:
          (ownerHouseId && settlementDesignByHouseId[ownerHouseId]) ||
          designByCardSet[csAct3Clause.id],
        clueVisibleCategory: "Settlement Clause",
        complexity: "simple",
        header: clause.label,
        description: clause.description,
        notes: `Act 3 clause reference card (${clause.id}).`,
      },
    });
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
      content: "This is no longer about who finds what. The QRians left a wound — close it cleanly, or close it forever. Drake's instinct: an ending that settles the threat is the only real ending.",
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: jones.id,
      act: 3,
      title: "Jones Junket — Act 3: The Dying Light",
      content: "This is no longer about who finds what. Reconstruct the QRians' rise and fall — together, across the three houses. Jones's instinct: don't burn the archive when you close the book.",
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: croft.id,
      act: 3,
      title: "Croft Company — Act 3: The Dying Light",
      content: "This is no longer about who finds what. Reconstruct what the QRians were trying to prevent — together, across the three houses. Croft's instinct: some discoveries are too dangerous to treat as prizes.",
    },
  });

  // ═══════════════════════════════════════════════════════════════════

  console.log(
    `\n✓ Created "${GAME_NAME}" with 3 houses, 33 card sets, 10 designs, 30 answers, 15 Act 1 missions, 15 Act 2 missions, 47 Act 1 cards, 43 Act 2 cards, 27 Act 3 cards, 3 Act 1→Act 2 lock gates, and 9 story sheets.\n`,
  );
  console.log("Game ID:", game.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
