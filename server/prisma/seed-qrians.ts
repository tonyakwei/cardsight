/**
 * seed-qrians.ts — "Temple of the QRians"
 *
 * Playtest game: three expedition teams explore a sealed QRian temple.
 * Three acts: The Flood, The Corruption, The Dying Light.
 *
 * Run:   npx tsx server/prisma/seed-qrians.ts
 *
 * Idempotent: deletes any existing "Temple of the QRians" game first.
 *
 * This seed is iterative — Act 1 structure first, details added over time.
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

  // Delete in dependency order
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
        "Three expedition teams enter a sealed temple built by the QRians — a recently discovered civilization with a language built from blocky geometric symbols. The temple was sealed centuries ago with warnings carved into every surface. Three acts: The Flood, The Corruption, The Dying Light.",
      status: "draft",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // HOUSES
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating houses...");
  const drake = await prisma.house.create({
    data: {
      gameId: game.id,
      name: "Drake Delegation",
      color: "#dc2626", // red — tactical, aggressive
    },
  });

  const jones = await prisma.house.create({
    data: {
      gameId: game.id,
      name: "Jones Junket",
      color: "#ca8a04", // amber — academic, warm
    },
  });

  const croft = await prisma.house.create({
    data: {
      gameId: game.id,
      name: "Croft Company",
      color: "#7c3aed", // purple — bold, stylish
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // ANSWERS (Act 1)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating answers...");

  const ansShadowAstrolabe = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "638517492",
      acceptAlternatives: [
        "6 3 8 5 1 7 4 9 2",
        "6-3-8-5-1-7-4-9-2",
      ],
      hint: "The sentence reads: THOSE WHO ENTER WILL FIND NO WAY OUT EVER. Match each word to its spoke number.",
      hintAfterAttempts: 3,
    },
  });

  const ansSlidingPanels = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "489627153",
      acceptAlternatives: [
        "4 8 9 6 2 7 1 5 3",
        "4-8-9-6-2-7-1-5-3",
      ],
      hint: "The sentence reads: THOSE WHO STAYED TOO LONG WERE SEALED AWAY FOREVER. Match each word to its panel number.",
      hintAfterAttempts: 3,
    },
  });

  // TODO: Add answers for other missions as they are designed

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
        "Your handy-dandy Drake-trademarked precision explosives are dead weight without the fuse charges, and you see the floodwater creeping towards them. You could commit time and effort to retrieve them — but precision explosives inside a temple could bring it all down on your heads.",
      consequenceCompleted:
        "The fuse charges are secure. The precision explosives are live and ready. Whether that's a comfort or a liability remains to be seen — but at least you have options.",
      consequenceNotCompleted:
        "The floodwater swallowed the fuse charges. Your precision explosives are paperweights now. The one thing that made you Drake is gone, and the temple ahead doesn't care...",
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
        "Set into the far wall — a heavy stone wheel, seized with age. Channels are carved into the floor below it, radiating outward. Your tactical eyes read it immediately: this thing controls the water flow. It won't budge by force alone. If you could figure out how to release it, you might be able to redirect the flooding itself!",
      consequenceCompleted:
        "The wheel turned. The flood is a designed system — not your fault after all. And now you control part of it. The other teams don't need to know that.",
      consequenceNotCompleted:
        "The wheel wouldn't budge. The water kept rising, and the other teams kept glancing your way — after all, you're the ones who blasted in with dynamite. The blame sits heavy...",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_drake_flood.id, [drake.id]);

  const m_drake_t1 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Reach the Impossible Vase",
      sheetLetter: "C",
      description:
        "Far off to the left, right at the fuzzy edge of the shadows — atop a ledge, a vibrantly red, sparkling porcelain vase. It seems impossibly intact and clean after all these years. But how? What must it mean? With enough effort, scaling the ledge should be possible... If it's not a rare find, you can probably at least pawn it off.",
      consequenceCompleted:
        "The vase is in your hands — impossibly advanced, impossibly beautiful. This alone could fund the outfit for a year. You grip it tight. Nobody touches this.",
      consequenceNotCompleted:
        "The vase sits up there still, gleaming, untouched, as the water rises beneath it. Another prize you couldn't reach. The outfit can't afford many more of these...",
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
        "Directly overhead, near the center of the chamber — thick iron chains hang from the dark above, taut and corroded green, dropping to a stone slab pulled tight against the floor. Whatever's under that slab, someone went through a lot of trouble to keep it there. In Drake terms, that means it's worth something. You could try to decode the markings on the mechanism and find out.",
      consequenceCompleted:
        "The hoist lifted. What you found underneath changes the math on this whole temple. Built in months, not years. Thousands of workers. This wasn't devotion — this was desperation. Good intel.",
      consequenceNotCompleted:
        "The chains wouldn't give. Whatever's under that slab stays under that slab. The other teams are pulling ahead while you're standing here staring at a ceiling...",
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
        "Along the back wall, half-hidden behind a collapsed pillar — a dark crack in the stone, just wide enough to squeeze through sideways. Both edges scored with bright scratches, as if something metal was forced through recently. A faint breeze from inside. You've squeezed through worse for less money. You could find out...",
      consequenceCompleted:
        "You found them. Another expedition — gear, journals, bones. They were so excited to be first. They never left. Their last entry still echoes: 'Every staircase descends.' You pocket the journal. Knowledge is leverage.",
      consequenceNotCompleted:
        "The gap stays dark. Whatever's on the other side, you'll never know. Could've been nothing. Could've been the find that turned this whole job around...",
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
        "In the rush through the hidden passage, the ceremonial whips were left behind — and the floodwater is creeping toward them. They're not strictly necessary, but an expedition without whips is... well, it's not really an expedition, is it? Losing them could crush Junket morale before the real work even begins. You could organize a retrieval effort, if you can spare the time.",
      consequenceCompleted:
        "The whips are back where they belong — on your belts. It's a small thing, maybe, but the team stands a little taller. Dr. Jones would approve. The expedition feels real now.",
      consequenceNotCompleted:
        "The whips are gone. Swallowed by the water along with a piece of what made this feel like a real expedition. Nobody says it out loud, but the mood shifts. You're just people in a wet cave now...",
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
        "Along the lower walls, half-obscured by chunky green mineral deposits — carved channels and what appear to be valve controls, covered by vines and moss. But you recognize infrastructure when you see it. You didn't spend three months on schematics for nothing. If you could decipher the activation sequence, you might be able to slow the flooding...",
      consequenceCompleted:
        "The drainage engaged — partially. Someone sabotaged it, deliberately, with QRian tools. They built this system and then broke it on purpose. That's unsettling, but at least you proved the schematics were worth the time.",
      consequenceNotCompleted:
        "The valve controls wouldn't respond. Three months of schematics and you couldn't crack a plumbing system. The water keeps rising, indifferent to your preparation...",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_jones_flood.id, [jones.id]);

  const m_jones_t1 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Study the Elevated Archive",
      sheetLetter: "C",
      description:
        "As your eyes crawl up the right side of the stone chamber — a shaft of light illuminates pale stone tablets in carved alcoves near the ceiling. One has shifted forward, and the glyphs on its face catch the light: round, flowing shapes, nothing like the rigid carvings below. With care, reaching them should be feasible... This could be direct evidence of the temple's religiosity.",
      consequenceCompleted:
        "The tablets are extraordinary — early-period records in a completely different glyph style. Prayers that are also mathematical proofs. The same glyph means 'divine' and 'proven.' This is a career-defining find. Dr. Jones himself would weep.",
      consequenceNotCompleted:
        "The tablets remain in their alcoves, unreachable, their secrets facing the ceiling. You know they're important — you could see the different glyphs from below. That knowledge without access is its own kind of torment...",
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
        "Peering straight across the haze of the chamber — small flat rocks, so precisely placed and stacked on one another that they form a grid in the wall. They can clearly be slid around. But several panels are missing — dislodged and scattered across the chamber floor. You can see that the other teams have already picked some up. At the grid's center: a dark, hand-shaped hollow, worn silk-smooth by what must have been hundreds of palms pressed into it over centuries. This is exactly the kind of mechanism Dr. Jones described in his 42nd lecture. If you could recover the missing panels, you could try the activation sequence...",
      puzzleDescription:
        "You'll need translation fragments found elsewhere in the temple to decode the panel glyphs. Each fragment reveals translated words for specific numbered panels. Write each word on an index card and rearrange until the sentence forms. Enter the panel numbers in the correct order.\n\n| Panel | Word |\n|-------|------|\n| 1 | SEALED |\n| 2 | TOO |\n| 3 | FOREVER |\n| 4 | THOSE |\n| 5 | AWAY |\n| 6 | LONG |\n| 7 | WERE |\n| 8 | WHO |\n| 9 | STAYED |",
      answerTemplateType: "single_answer",
      answerId: ansSlidingPanels.id,
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
        "Something was odd when you first entered the chamber, and now you realize what. Off to the left, beyond a low archway — a corridor that tilts *up*. After a temple where everything descends, an upward slope feels like sunlight. Three months of schematics trained your eyes for exactly this kind of anomaly. It's worth mapping — carefully, methodically, the way you were taught...",
      consequenceCompleted:
        "You mapped it. The corridor goes up, curves, curves again — and deposits you one level lower. A trap designed for scholars. The walls repeat one phrase: 'You are not leaving. You were never going to leave.' The team is shaken. This place was built to catch people exactly like you.",
      consequenceNotCompleted:
        "The upward corridor remains unmapped. You noticed the anomaly but couldn't follow through. Somewhere in your gut, you wonder if that's a mercy...",
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
        "Your signature grappling rigs — high-tension cable, Croft-issue hooks, the works — are sitting on a ledge, half-kissed by the rising water. They're heavy. Really heavy. Hauling them through tight passages will slow you down. But if there's climbing to be done later, and there's always climbing to be done, you'll want them. Lara would never leave them behind. Then again, Lara isn't the one carrying them.",
      consequenceCompleted:
        "The rigs are on your backs. Heavy, yes — but the team feels complete. Lara's gear, Lara's mission, Lara's people. Whatever's up there, you can reach it now.",
      consequenceNotCompleted:
        "The water took the rigs. Lara's gear, gone. The team feels lighter and emptier at the same time. If there's climbing ahead, you'll have to improvise — and Lara does not like improvisation...",
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
        "Water is pouring through a crack in the far wall where a sealed passage has given way. Scattered across the floor, partially in the water — flat stone fragments, each carved with glyphs. It seems you could piece them back into the wall to stem the flow. Your hands are strong and your eyes are sharp. This is what you were built for.",
      consequenceCompleted:
        "The stones fit. The water slowed. And the image you assembled — it looked like a prayer, but the math in it... Lara would have stared at this for hours. You took a photo in your mind. Something here is not what it seems.",
      consequenceNotCompleted:
        "The stones wouldn't fit. The water kept coming, scattering the fragments further with every surge. Whatever picture they formed is lost now, scattered across the flooded floor...",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_croft_flood.id, [croft.id]);

  const m_croft_t1 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Reach the Shadow Astrolabe",
      sheetLetter: "C",
      description:
        "Deep in the far corner, high up — a glint in the dark, like a single star in a black sky. As your eyes focus, you see concentric rings, dark as iron, catching torchlight in flashes — etched with markings so fine they shimmer. It's by far the most beautiful thing in this entire temple, and it's sitting on a ledge fifteen feet above the floor. You'll need to find QRian metal spokes scattered around the chamber to use as footholds — you've spotted some nearby, but others seem to have ended up near the other teams. Fifteen feet is nothing for this crew. You could get up there...",
      puzzleDescription:
        "You'll need metal spokes to drive into the wall as footholds. The QRians designed these spokes to be driven in a specific order — top to bottom, they read a translated QRian sentence. Write each spoke's word on an index card and rearrange until the sentence forms. Enter the spoke numbers in the correct order.\n\n| Spoke | Word |\n|-------|------|\n| 1 | FIND |\n| 2 | EVER |\n| 3 | WHO |\n| 4 | WAY |\n| 5 | WILL |\n| 6 | THOSE |\n| 7 | NO |\n| 8 | ENTER |\n| 9 | OUT |",
      answerTemplateType: "single_answer",
      answerId: ansShadowAstrolabe.id,
      consequenceCompleted:
        "The climb was clean. The team moved like one body — boost, grip, pull. Lara would have been proud. Confidence is high, and you've already bagged something that should make this whole expedition historically monumental. You all guard it jealously.",
      consequenceNotCompleted:
        "Fifteen feet. You couldn't make fifteen feet. And now the floodwater has slowly swallowed the priceless, mysterious device forever. Every other team probably saw you try. What would Lara say? Morale takes a serious hit, and you all wonder how you'll fare with the next chambers to come...",
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
        "In the dead center of the chamber, a wide stone disc sits on a raised pedestal — pale, glowing a faint warm amber against the dark walls. A perfect circle is carved into its face, and around the rim, small rectangular slots are cut at precise intervals, like teeth on a gear. It looks like it's waiting for something to be inserted. Behind it, an entire wall of glyphs. Lara would already be elbow-deep in this thing. You could figure out what goes in the slots...",
      consequenceCompleted:
        "The stone came alive. Moving pieces, mechanical math, a teaching device disguised as an altar. The QRians didn't worship gods — they worshipped calculation. Lara would sell her estate to see this. You saw it first.",
      consequenceNotCompleted:
        "The stone sits there, inert, waiting. The slots remain empty. Whatever it does, whatever it teaches — someone else will have to figure it out. The team moves on, but a few of you keep looking back...",
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
        "Against the near wall, low and easy to miss — a squat doorway set into stone that's rougher, cruder than the rest, as if finished in a hurry. Beyond it, a corridor so dark the torchlight dies a few feet in. On the floor, gouged into the stone: deep parallel grooves, wide as a body, dragging inward into the black. Something was dragged in there. Or someone. Of all the groups here, you're certainly the ones least afraid of the dark. You could follow the marks and see where they lead...",
      consequenceCompleted:
        "You followed the marks into the dark. You found them — the builders. Sealed inside their own work, tools still in hand. One wall had a single carved plea in old glyphs. The team is quiet on the way back. Lara sends people into tombs. You just found out what that means.",
      consequenceNotCompleted:
        "The dark corridor stays dark. The drag marks lead inward, unanswered. Some of the team look relieved. Others can't stop glancing at that doorway. What's in there? Maybe it's better not to know...",
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
    `\n✓ Created "${GAME_NAME}" with 3 houses, 15 Act 1 missions, 3 story sheets.\n`
  );
  console.log("Game ID:", game.id);
  console.log("Houses:", drake.id, jones.id, croft.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
