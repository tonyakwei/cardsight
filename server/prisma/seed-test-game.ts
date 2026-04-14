/**
 * seed-test-game.ts — "The Blackwood Files"
 *
 * A complete 3-act test game for CardSight / Twisting Tales.
 * Three rival newspapers investigate a $40M government coverup.
 *
 * Run:   pnpm db:seed-test
 * Or:    npx tsx server/prisma/seed-test-game.ts
 *
 * Idempotent: deletes any existing "The Blackwood Files" game first.
 */

import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const physicalCards: {
  id: string;
  name: string;
  color: string;
  number: number;
}[] = require("../../shared/physical-cards.json");

const prisma = new PrismaClient();

const GAME_NAME = "The Blackwood Files";

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

async function assignHouses(cardId: string, houseIds: string[]) {
  for (const houseId of houseIds) {
    await prisma.cardHouse.create({ data: { cardId, houseId } });
  }
}

async function assignMissionHouses(missionId: string, houseIds: string[]) {
  for (const houseId of houseIds) {
    await prisma.missionHouse.create({ data: { missionId, houseId } });
  }
}

// Physical card by index (0-53)
function pc(index: number) {
  return physicalCards[index].id;
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
        "Three rival newspapers receive fragments of an anonymous tip about Project Greenfield — the mayor's $40 million 'urban renewal initiative.' As they trade sources and evidence, the truth emerges: every dollar has been stolen. Can they break the story before the mayor's office shuts them down?",
      status: "active",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // CARD SETS
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating card sets...");
  const sources = await prisma.cardSet.create({
    data: {
      gameId: game.id,
      name: "Sources",
      color: "#f97316",
      notes:
        "Witness testimony, informant tips, interview transcripts. The human element of the investigation.",
    },
  });

  const documents = await prisma.cardSet.create({
    data: {
      gameId: game.id,
      name: "Documents",
      color: "#6366f1",
      notes:
        "Leaked files, permits, public records, legal papers. Hard evidence.",
    },
  });

  const photos = await prisma.cardSet.create({
    data: {
      gameId: game.id,
      name: "Photos",
      color: "#ec4899",
      notes: "Photographs, surveillance images, physical evidence. Visual proof.",
    },
  });

  const moneyTrail = await prisma.cardSet.create({
    data: {
      gameId: game.id,
      name: "Money Trail",
      color: "#14b8a6",
      notes:
        "Bank records, invoices, transaction logs. Follow the money to find the truth.",
    },
  });

  const connections = await prisma.cardSet.create({
    data: {
      gameId: game.id,
      name: "Connections",
      color: "#8b5cf6",
      notes:
        "Organizational charts, phone records, meeting schedules. Who knows who.",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // HOUSES (the three newspapers)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating houses...");
  const herald = await prisma.house.create({
    data: {
      gameId: game.id,
      name: "The Herald",
      color: "#2563eb",
    },
  });

  const beacon = await prisma.house.create({
    data: {
      gameId: game.id,
      name: "The Beacon",
      color: "#eab308",
    },
  });

  const chronicle = await prisma.house.create({
    data: {
      gameId: game.id,
      name: "The Chronicle",
      color: "#16a34a",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // DESIGNS
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating designs...");
  const leakedDoc = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Leaked Document",
      bgColor: "#faf8f0",
      bgGradient:
        "linear-gradient(180deg, #faf8f0 0%, #f0ead6 50%, #e8e0c8 100%)",
      textColor: "#1a1a1a",
      accentColor: "#8b0000",
      secondaryColor: "#444444",
      fontFamily: "'Courier New', monospace",
      cardStyle: "standard",
      animationIn: "fade",
      borderStyle: "none",
    },
  });

  const tipOff = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Anonymous Tip",
      bgColor: "#0a0a0a",
      bgGradient:
        "linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
      textColor: "#e0e0e0",
      accentColor: "#fbbf24",
      secondaryColor: "#f59e0b",
      fontFamily: "'Courier New', monospace",
      cardStyle: "standard",
      animationIn: "decrypt",
      borderStyle: "1px solid rgba(251, 191, 36, 0.3)",
      overlayEffect: "scanlines",
    },
  });

  const newsroom = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Newsroom Bulletin",
      bgColor: "#0d1117",
      bgGradient:
        "linear-gradient(180deg, #0d1117 0%, #161b22 50%, #21262d 100%)",
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

  const surveillance = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Surveillance",
      bgColor: "#0a0f0a",
      bgGradient:
        "linear-gradient(180deg, #0a0f0a 0%, #0d1a0d 50%, #102010 100%)",
      textColor: "#b0e0b0",
      accentColor: "#22c55e",
      secondaryColor: "#16a34a",
      fontFamily: "'Courier New', monospace",
      cardStyle: "standard",
      animationIn: "glitch",
      borderStyle: "1px solid rgba(34, 197, 94, 0.3)",
      overlayEffect: "static",
    },
  });

  const frontPage = await prisma.design.create({
    data: {
      gameId: game.id,
      name: "Front Page",
      bgColor: "#1a0000",
      bgGradient:
        "linear-gradient(180deg, #1a0000 0%, #2d0000 50%, #400000 100%)",
      textColor: "#ffcdd2",
      accentColor: "#ff5252",
      secondaryColor: "#d32f2f",
      fontFamily: "'Georgia', serif",
      cardStyle: "standard",
      animationIn: "fade",
      borderStyle: "2px solid rgba(255, 82, 82, 0.5)",
      overlayEffect: "glow",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // SINGLE ANSWERS
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating answers...");

  // Card-level answers
  const ansBasement = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "basement",
      acceptAlternatives: ["the basement", "b1", "below ground", "sub-basement"],
      hint: "Think about what's one floor below the ground floor.",
      hintAfterAttempts: 2,
    },
  });

  const ansExpired = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "expired",
      acceptAlternatives: ["it expired", "invalid", "not valid", "lapsed"],
      hint: "The license was valid for 3 years from 2019. The project started in 2024.",
      hintAfterAttempts: 2,
    },
  });

  const ansSameAddress = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "same address",
      acceptAlternatives: [
        "123 oak",
        "the address",
        "they share an address",
        "same office",
        "123 oak street",
      ],
      hint: "Look at the registered addresses on both documents.",
      hintAfterAttempts: 2,
    },
  });

  const ansFive = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "five",
      acceptAlternatives: ["5", "five companies", "5 companies"],
      hint: "Count the companies named with the pattern ____Build.",
      hintAfterAttempts: 2,
    },
  });

  const ansHelenCross = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "Helen Cross",
      acceptAlternatives: [
        "helen cross",
        "h cross",
        "cross",
        "h.c.",
        "hc",
        "helen",
      ],
      hint: "The initials are H.C. — check the corporate filings.",
      hintAfterAttempts: 3,
    },
  });

  const ansMarsh = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "victoria marsh",
      acceptAlternatives: [
        "marsh",
        "mayor marsh",
        "the mayor",
        "victoria",
        "v marsh",
      ],
      hint: "Who has the most to lose?",
      hintAfterAttempts: 2,
    },
  });

  const ansTestimony = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "testimony",
      acceptAlternatives: [
        "she testifies",
        "testify",
        "her testimony",
        "testify against marsh",
        "she'll testify",
      ],
      hint: "In a plea deal, what does the defendant usually give in exchange?",
      hintAfterAttempts: 2,
    },
  });

  const ansPrivateIsland = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "private island",
      acceptAlternatives: ["island", "an island", "a private island", "a island"],
      hint: "What kind of property costs $36 million in the Bahamas?",
      hintAfterAttempts: 2,
    },
  });

  const ansProtectiveCustody = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "protective custody",
      acceptAlternatives: [
        "she's in protective custody",
        "witness protection",
        "AG custody",
        "in custody",
        "safe",
        "she's safe",
      ],
      hint: "The boat was registered to the State Attorney General's Office.",
      hintAfterAttempts: 2,
    },
  });

  const ansDianeLiu = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "Diane Liu",
      acceptAlternatives: [
        "diane liu",
        "liu",
        "diane",
        "d. liu",
        "d liu",
        "the comptroller",
      ],
      hint: "She's the city comptroller who mailed the evidence.",
      hintAfterAttempts: 2,
    },
  });

  const ans40million = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "40",
      acceptAlternatives: [
        "$40",
        "40 million",
        "$40 million",
        "$40M",
        "40m",
        "forty",
        "forty million",
      ],
      hint: "It's the total Project Greenfield budget.",
      hintAfterAttempts: 2,
    },
  });

  // Mission-level answers
  const ans12days = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "12",
      acceptAlternatives: [
        "12 days",
        "twelve",
        "twelve days",
        "march 3",
        "2 weeks",
      ],
      hint: "Compare the permit date to the council vote date.",
      hintAfterAttempts: 2,
    },
  });

  const ans98 = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "98",
      acceptAlternatives: ["98%", "98 percent", "ninety-eight", "ninety eight"],
      hint: "The transfers are the deposit amount minus 2%.",
      hintAfterAttempts: 2,
    },
  });

  const ans1247 = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "1247",
      acceptAlternatives: ["po box 1247", "box 1247", "p.o. box 1247"],
      hint: "The post office clerk would know.",
      hintAfterAttempts: 2,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // CARDS — ACT 1: "THE TIP"
  // 18 physical cards (indices 0-17), 6 per house
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 cards...");

  // --- HERALD Act 1 (physical cards 0-5) ---

  const h1c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(0),
      act: 1,
      cardSetId: sources.id,
      clueVisibleCategory: "Anonymous Tip",
      header: "A Friend's Warning",
      description: `A typed letter, no return address, slipped under your newsroom door:

> *"The permits for Project Greenfield were backdated. Check Building Permit #4471 — the dates don't match the council vote. This is just the beginning.*

> *The money isn't going where they say. Follow it."*

> *— A Friend*

The letter smells faintly of toner. Whoever sent this had access to a City Hall printer.`,
      designId: tipOff.id,
      isFinished: true,
      sortOrder: 1,
    },
  });
  await assignHouses(h1c1.id, [herald.id]);

  const h1c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(1),
      act: 1,
      cardSetId: documents.id,
      clueVisibleCategory: "Permit Filing",
      header: "Building Permit #4471",
      description: `**CITY OF BLACKWOOD — BUILDING PERMIT**

**Project:** Greenfield Community Park, Phase 1
**Applicant:** GreenBuild LLC
**Date Filed:** March 3, 2024
**Status:** Approved

Standard permit for excavation and site preparation.

*But the City Council didn't vote to approve Project Greenfield until March 15. Someone filed this permit twelve days before the project officially existed.*`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 2,
    },
  });
  await assignHouses(h1c2.id, [herald.id]);

  const h1c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(2),
      act: 1,
      cardSetId: documents.id,
      clueVisibleCategory: "Council Record",
      header: "Council Minutes — March 15",
      description: `**BLACKWOOD CITY COUNCIL — MEETING MINUTES**
**Date:** March 15, 2024

*Item 14: Motion to approve Project Greenfield urban renewal initiative. Budget: $40,000,000. Contractor: GreenBuild LLC (sole bid).*

*Vote: 7-2. Dissenting: Councilors Park, Reeves.*

In the margin, handwritten in blue ink: **"Already started? —R"**

Someone on the council noticed.`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 3,
    },
  });
  await assignHouses(h1c3.id, [herald.id]);

  const h1c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(3),
      act: 1,
      cardSetId: sources.id,
      clueVisibleCategory: "Witness Account",
      complexity: "complex",
      header: "The Night Janitor",
      description: `Statement from Raymond Torres, night janitor, Blackwood City Hall:

*"Three weeks before the council vote, I was cleaning the fourth floor — that's where the mayor's office is. Around 11 PM, I saw two men I didn't recognize carrying file boxes labeled 'Greenfield' down the service elevator.*

*They didn't take them to the loading dock. They went one floor below the ground floor — the part of the building that isn't on any directory.*

*Nobody's supposed to know about that level. But I've worked here 22 years."*

**Where did the movers take the boxes?**`,
      clueContent: `**WITNESS CONFIRMED**

The boxes were taken to the **basement** — an unlisted level below City Hall that doesn't appear on any official floor plan.

Raymond Torres can provide after-hours access. Whatever files were moved there before the vote, someone wanted them hidden from the public record.

*This location may become critical in Act 2.*`,
      designId: tipOff.id,
      answerTemplateType: "single_answer",
      answerId: ansBasement.id,
      isAnswerable: true,
      selfDestructTimer: 120,
      selfDestructText:
        "The janitor has stopped answering calls. This lead has gone cold.",
      examineText: "Read Statement",
      isFinished: true,
      sortOrder: 4,
    },
  });
  await assignHouses(h1c4.id, [herald.id]);

  const h1c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(4),
      act: 1,
      cardSetId: photos.id,
      clueVisibleCategory: "Site Photo",
      header: "The Empty Lot",
      description: `**PHOTO: Greenfield Construction Site**
*Taken: Last Tuesday, 2:14 PM*

An empty lot. Chain-link fence around the perimeter. A single sign reads **"GreenBuild LLC — Project Greenfield Phase 1."**

No equipment. No workers. No materials. No evidence of any construction activity whatsoever.

According to city records, **$12 million** has been spent on this site so far.

*Twelve million dollars, and the ground hasn't been touched.*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 5,
    },
  });
  await assignHouses(h1c5.id, [herald.id]);

  const h1c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(5),
      act: 1,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Financial Record",
      header: "Expense Report — Q3",
      description: `**CITY OF BLACKWOOD — QUARTERLY EXPENSE REPORT**

| Line | Vendor | Description | Amount |
|------|--------|-------------|--------|
| 47 | GreenBuild LLC | Site Preparation | $3,200,000 |
| 48 | GreenBuild LLC | Materials Procurement | $4,100,000 |
| 49 | GreenBuild LLC | Consultant Fees | $1,800,000 |

**Total to GreenBuild LLC (Q3):** $9,100,000

That's $9.1 million in a single quarter to a company with no visible operations. The "consultant fees" alone could fund a small school.`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 6,
    },
  });
  await assignHouses(h1c6.id, [herald.id]);

  // --- BEACON Act 1 (physical cards 6-11) ---

  const b1c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(6),
      act: 1,
      cardSetId: sources.id,
      clueVisibleCategory: "Street Tip",
      header: "Overheard at The Capitol Lounge",
      description: `**TIP FROM: Marcus Webb, bartender, The Capitol Lounge**
*(City Hall regulars' bar, 2 blocks from the building)*

*"Last Thursday, two guys in suits — regulars, I think from the DPW — were celebrating at the bar. Loud. Three rounds of bourbon.*

*One of them said, 'Greenfield is going to make us all rich.' The other one laughed and said, 'As long as Marsh keeps signing.'*

*They paid cash. That's unusual — these guys usually run tabs on city cards."*`,
      designId: tipOff.id,
      isFinished: true,
      sortOrder: 7,
    },
  });
  await assignHouses(b1c1.id, [beacon.id]);

  const b1c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(7),
      act: 1,
      cardSetId: sources.id,
      clueVisibleCategory: "Witness Statement",
      header: "The Employee Who Quit",
      description: `**STATEMENT — Former GreenBuild LLC Employee** *(name withheld)*

*"I was hired in April as a 'project coordinator.' Salary: $85,000. I showed up to the office on Oak Street for two weeks.*

*There was nothing to coordinate. The office was two rooms — one with a desk and a phone, one with a shredder that ran all day. A woman named Helen answered calls and fed the shredder.*

*I asked when actual construction would start. Helen said, 'That's not what we do here.' I quit the next day."*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 8,
    },
  });
  await assignHouses(b1c2.id, [beacon.id]);

  const b1c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(8),
      act: 1,
      cardSetId: photos.id,
      clueVisibleCategory: "Surveillance Image",
      header: "After Hours at City Hall",
      description: `**SECURITY CAMERA STILL**
*Location: City Hall parking lot, Camera 3*
*Timestamp: Wednesday, 11:47 PM*

Mayor Marsh's black sedan (plate: BW-MAYOR-1) parked next to an unmarked white van. Two figures visible transferring **file boxes** from the van into the building's service entrance.

The service entrance leads to the lower levels.

*Someone is moving documents in or out of City Hall in the middle of the night.*`,
      designId: surveillance.id,
      isFinished: true,
      sortOrder: 9,
    },
  });
  await assignHouses(b1c3.id, [beacon.id]);

  const b1c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(9),
      act: 1,
      cardSetId: documents.id,
      clueVisibleCategory: "License Record",
      complexity: "complex",
      header: "GreenBuild LLC — Contractor License",
      description: `**STATE CONTRACTOR LICENSE**

**Company:** GreenBuild LLC
**License #:** SC-2019-04472
**Date Issued:** June 15, 2019
**Validity:** This license is valid for **3 years** from the date of issue.

Project Greenfield was approved in **March 2024**.

**What is the current status of this contractor's license?**`,
      clueContent: `**LICENSE STATUS: EXPIRED**

GreenBuild LLC's contractor license expired in **June 2022** — nearly two years before Project Greenfield was approved. No renewal application was ever filed with the state.

This means every contract between GreenBuild LLC and the City of Blackwood is legally invalid. The city has been paying $40 million to an unlicensed contractor.

*This alone could void the entire project.*`,
      designId: leakedDoc.id,
      answerTemplateType: "single_answer",
      answerId: ansExpired.id,
      isAnswerable: true,
      examineText: "Review License",
      isFinished: true,
      sortOrder: 10,
    },
  });
  await assignHouses(b1c4.id, [beacon.id]);

  const b1c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(10),
      act: 1,
      cardSetId: connections.id,
      clueVisibleCategory: "Phone Records",
      header: "The Burner Phone",
      description: `**CALL LOG — Mayor Marsh's Office Line**
*Period: Last 30 days*

**47 outgoing calls** to the same number: (555) 000-7291.

The number traces to a prepaid phone purchased with cash at a gas station on Route 9. Average call duration: 2 minutes.

No calls from this number appear on any official city communication log.

*The mayor is making dozens of calls to someone she doesn't want on the record.*`,
      designId: surveillance.id,
      isFinished: true,
      sortOrder: 11,
    },
  });
  await assignHouses(b1c5.id, [beacon.id]);

  const b1c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(11),
      act: 1,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Receipt",
      header: "Dinner at Chez Laurent",
      description: `**RESTAURANT RECEIPT — Chez Laurent**

**Date:** March 13, 2024 *(two days before the council vote)*
**Party size:** 6
**Total:** $2,847.00
**Payment:** City credit card ending in 4401 (Mayor's Office)

Scrawled on the back of the receipt in black ink:

> **"H.C. — confirm the LLC paperwork is filed before the vote. —V"**

H.C. The initials keep coming up. And "V" — Victoria Marsh?`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 12,
    },
  });
  await assignHouses(b1c6.id, [beacon.id]);

  // --- CHRONICLE Act 1 (physical cards 12-17) ---

  const c1c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(12),
      act: 1,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Bank Statement",
      header: "Follow the Wire Transfers",
      description: `**GREENBUILD LLC — BUSINESS ACCOUNT (partial)**
*First National Bank of Blackwood*

**March Deposits:**
- Mar 5: $1,200,000 — "City of Blackwood — Project Greenfield"
- Mar 18: $800,000 — "City of Blackwood — Project Greenfield"
- Mar 27: $2,100,000 — "City of Blackwood — Project Greenfield"

**March Wire Transfers (same dates):**
- Mar 5: $1,176,000 → Cayman Holdings Trust
- Mar 18: $784,000 → Cayman Holdings Trust
- Mar 27: $2,058,000 → Cayman Holdings Trust

*Every deposit is immediately wired offshore — minus exactly 2%.*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 13,
    },
  });
  await assignHouses(c1c1.id, [chronicle.id]);

  const c1c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(13),
      act: 1,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Invoice",
      header: "Invoice from a Ghost",
      description: `**INVOICE #GF-0042**
**From:** GreenBuild LLC
**To:** City of Blackwood, Dept. of Public Works
**For:** Excavation services, Greenfield Phase 1
**Amount:** $1,200,000

Attached sticky note in unfamiliar handwriting:

> *"There has been no excavation. I drive past this site every day on my commute. The ground has not been touched. Where is this money going? —D.L."*

Someone inside the system is keeping track.`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 14,
    },
  });
  await assignHouses(c1c2.id, [chronicle.id]);

  const c1c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(14),
      act: 1,
      cardSetId: documents.id,
      clueVisibleCategory: "Corporate Filing",
      complexity: "complex",
      header: "Two Registrations, One Address",
      description: `**DOCUMENT A — State Corporate Filing**
GreenBuild LLC
Filed: March 1, 2024
Registered Address: **123 Oak Street, Suite 4B, Blackwood**
Registered Agent: H. Cross

**DOCUMENT B — Campaign Office Registration**
Marsh for Mayor 2024
Filed: January 15, 2024
Campaign Address: **123 Oak Street, Suite 4B, Blackwood**
Campaign Treasurer: H. Cross

**What connects these two organizations?**`,
      clueContent: `**CONNECTION CONFIRMED**

GreenBuild LLC and the mayor's re-election campaign are registered at **the same address: 123 Oak Street, Suite 4B.**

Both list **H. Cross** as a key official. The company receiving $40 million in public funds literally shares an office with the mayor's campaign.

*This is a direct, documentable conflict of interest.*`,
      designId: leakedDoc.id,
      answerTemplateType: "single_answer",
      answerId: ansSameAddress.id,
      isAnswerable: true,
      examineText: "Compare Documents",
      isFinished: true,
      sortOrder: 15,
    },
  });
  await assignHouses(c1c3.id, [chronicle.id]);

  const c1c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(15),
      act: 1,
      cardSetId: connections.id,
      clueVisibleCategory: "Filing Record",
      header: "Too Fast to Be Coincidence",
      description: `**STATE CORPORATE FILING — GreenBuild LLC**

- **Incorporated:** March 1, 2024
- **Project Greenfield council vote:** March 15, 2024
- **First contract signed:** March 16, 2024 (one day after approval)
- **First payment received:** March 19, 2024

The company was created **two weeks** before the project it was hired for was approved. The contract was signed **one day** after the vote.

**Registered Agent:** H. Cross

This wasn't a competitive bid. This was a plan.`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 16,
    },
  });
  await assignHouses(c1c4.id, [chronicle.id]);

  const c1c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(16),
      act: 1,
      cardSetId: sources.id,
      clueVisibleCategory: "Insider Note",
      header: "The Accountant's Warning",
      description: `A handwritten note on a Post-it, found stuck to the back of Invoice #GF-0038:

> *"These numbers don't add up. $9M for 'site prep' with no equipment purchases? No subcontractor payments? No material receipts?*

> *I've been doing municipal accounting for 15 years. I've never seen anything like this. Someone is signing off on payments for work that isn't happening.*

> *I'm keeping copies of everything.*

> *—D.L."*

D.L. — the city comptroller is **Diane Liu**.`,
      designId: tipOff.id,
      isFinished: true,
      sortOrder: 17,
    },
  });
  await assignHouses(c1c5.id, [chronicle.id]);

  const c1c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(17),
      act: 1,
      cardSetId: photos.id,
      clueVisibleCategory: "Office Photo",
      header: "Suite 4B",
      description: `**PHOTO: 123 Oak Street, Second Floor**

Through the window of Suite 4B: a mostly empty room. A desk with a phone. A paper shredder (currently running, based on the indicator light). A stack of file boxes in the corner.

The building directory in the lobby lists Suite 4B as:

> **"Marsh for Mayor Campaign Office"**
> **"GreenBuild LLC"**

The same room. The same suite. The same operation.`,
      designId: surveillance.id,
      isFinished: true,
      sortOrder: 18,
    },
  });
  await assignHouses(c1c6.id, [chronicle.id]);

  // ═══════════════════════════════════════════════════════════════════
  // CARDS — ACT 2: "THE TRAIL"
  // Same 18 physical cards, new content
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 2 cards...");

  // --- HERALD Act 2 ---

  const h2c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(0),
      act: 2,
      cardSetId: documents.id,
      clueVisibleCategory: "Calendar Entry",
      header: "The Comptroller's Last Days",
      description: `**DESK CALENDAR — Diane Liu, City Comptroller**
*(Recovered from her office after she was reported missing)*

Last three weeks of entries:
- **Mon:** "Meeting w/ H.C. — RE: Greenfield audit. 2pm." *(circled in red)*
- **Wed:** "H.C. called again. Wants audit 'paused.'"
- **Fri:** "H.C. IN MY OFFICE. Said the audit 'isn't necessary.' I told her it is."
- **Mon:** "Called AG's office. Left message."
- **Tue:** *(blank)*
- Everything after: **blank.**

Diane Liu has not been seen in two weeks.`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 19,
    },
  });
  await assignHouses(h2c1.id, [herald.id]);

  const h2c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(1),
      act: 2,
      cardSetId: sources.id,
      clueVisibleCategory: "Witness Account",
      header: "Not a Voluntary Leave",
      description: `**STATEMENT — Patricia Okafor, Secretary to the Comptroller**

*"Ms. Liu didn't take leave voluntarily. On that Tuesday — the last day anyone saw her — two people came to her office around 4 PM. A man and a woman. They closed the door.*

*When they left, about 20 minutes later, Ms. Liu was... different. She packed a box, said 'I need to go,' and left. She looked frightened, not relieved.*

*HR sent an email the next day saying she was 'on extended leave.' But she never filed for leave. I would know — I process those forms."*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 20,
    },
  });
  await assignHouses(h2c2.id, [herald.id]);

  const h2c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(2),
      act: 2,
      cardSetId: documents.id,
      clueVisibleCategory: "Audit Draft",
      complexity: "complex",
      header: "The Unfinished Audit",
      description: `**DRAFT — City of Blackwood Internal Audit (INCOMPLETE)**
*Author: D. Liu, City Comptroller*

> "Preliminary findings indicate payments from the Project Greenfield budget to multiple entities beyond the primary contractor:

> 1. **GreenBuild LLC** — $12.3M (excavation, site prep)
> 2. **BlueBuild Corp** — $8.7M (materials)
> 3. **RedBuild Partners** — $6.2M (consulting)
> 4. **YellowBuild Inc** — $7.5M (engineering)
> 5. **WhiteBuild & Associates** — $5.3M (oversight)

> All five entities share the same registered agent. Further investigation—"

*The audit stops mid-sentence.*

**How many shell companies did the comptroller identify?**`,
      clueContent: `**FIVE SHELL COMPANIES CONFIRMED**

The comptroller identified **five** companies — GreenBuild, BlueBuild, RedBuild, YellowBuild, and WhiteBuild — all sharing the same registered agent (H. Cross) and all receiving payments from the Greenfield budget.

Combined payments: **$40 million exactly.** The entire budget, split across five shells.

*The audit was stopped before it could be completed. Now we know why.*`,
      designId: leakedDoc.id,
      answerTemplateType: "single_answer",
      answerId: ansFive.id,
      isAnswerable: true,
      examineText: "Read Audit",
      isFinished: true,
      sortOrder: 21,
    },
  });
  await assignHouses(h2c3.id, [herald.id]);

  const h2c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(3),
      act: 2,
      cardSetId: connections.id,
      clueVisibleCategory: "Visitor Record",
      header: "Helen Cross Was Here",
      description: `**CITY HALL VISITOR LOG — Comptroller's Office**
*(Week before Diane Liu's disappearance)*

| Day | Visitor | Time In | Time Out |
|-----|---------|---------|----------|
| Mon | H. Cross | 2:02 PM | 2:41 PM |
| Tue | H. Cross | 9:15 AM | 9:33 AM |
| Thu | H. Cross | 4:10 PM | 5:02 PM |
| Fri | H. Cross | 3:30 PM | 3:48 PM |

Four visits in one week. Each one longer and later than the last. The final Friday visit — 18 minutes — and then on Tuesday, the comptroller was gone.`,
      designId: surveillance.id,
      isFinished: true,
      sortOrder: 22,
    },
  });
  await assignHouses(h2c4.id, [herald.id]);

  const h2c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(4),
      act: 2,
      cardSetId: sources.id,
      clueVisibleCategory: "Neighbor Statement",
      header: "The Night She Left",
      description: `**STATEMENT — James Whitfield, neighbor at 412 Maple Drive**

*"I've lived next to Diane for eight years. Quiet, reliable. She waters her plants every morning at 6 AM. Every. Morning.*

*That Tuesday night, around 10 PM, a black sedan pulled up. Two men went inside. They came out carrying suitcases — Diane's suitcases, the ones she kept in her hall closet.*

*They put them in the trunk and drove away. The next morning, no plant watering. The house has been dark ever since.*

*I called the police. They said she's 'on leave.' That's not what this looked like."*`,
      designId: tipOff.id,
      isFinished: true,
      sortOrder: 23,
    },
  });
  await assignHouses(h2c5.id, [herald.id]);

  const h2c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(5),
      act: 2,
      cardSetId: photos.id,
      clueVisibleCategory: "Surveillance Photo",
      header: "412 Maple Drive, 10:07 PM",
      description: `**DOORBELL CAMERA — 410 Maple Drive (neighbor's house)**
*Timestamp: Tuesday, 10:07 PM*

Black sedan, license plate partially visible: BW-7██. Two men in dark clothing approach 412 Maple Drive (Diane Liu's residence).

One carries a briefcase. The other has a phone to his ear.

Second still, 10:31 PM: Same men, now carrying two rolling suitcases to the sedan's trunk.

*The timeline matches the neighbor's account exactly. Whoever took Diane Liu knew where she kept her luggage.*`,
      designId: surveillance.id,
      isFinished: true,
      sortOrder: 24,
    },
  });
  await assignHouses(h2c6.id, [herald.id]);

  // --- BEACON Act 2 ---

  const b2c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(6),
      act: 2,
      cardSetId: sources.id,
      clueVisibleCategory: "Street Tip",
      header: "Seen at the Marina",
      description: `**TIP FROM: Anonymous dockworker, Blackwood Marina**

*"About two weeks ago, late at night, a woman matching the description you published got onto a private boat — the 'Legal Tender,' registered to a charter company out of state.*

*She wasn't in handcuffs or anything. She went willingly. But she was looking over her shoulder the whole time. Two people in suits escorted her.*

*The boat headed south. That's all I know."*

The "Legal Tender" — registered to the State Attorney General's Office for witness transport.`,
      designId: tipOff.id,
      isFinished: true,
      sortOrder: 25,
    },
  });
  await assignHouses(b2c1.id, [beacon.id]);

  const b2c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(7),
      act: 2,
      cardSetId: connections.id,
      clueVisibleCategory: "Network Map",
      header: "The Shell Game",
      description: `**FINANCIAL NETWORK DIAGRAM**
*(Assembled from corporate filings and bank records)*

\`\`\`
     City of Blackwood ($40M)
              │
    ┌────┬────┼────┬────┐
    ▼    ▼    ▼    ▼    ▼
  Green Blue  Red  Yel  White
  Build Build Build Build Build
    │    │    │    │    │
    └────┴────┼────┴────┘
              ▼
     Cayman Holdings Trust
        (H. Cross, trustee)
              │
              ▼
            ? ? ?
\`\`\`

Five companies. One destination. All roads lead to the Cayman Islands.

*Where does the money go after the trust?*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 26,
    },
  });
  await assignHouses(b2c2.id, [beacon.id]);

  const b2c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(8),
      act: 2,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Wire Records",
      header: "The $40 Million Pipeline",
      description: `**CONSOLIDATED WIRE TRANSFER LOG**
*(Cayman Holdings Trust — incoming transfers)*

| Source | Total Received |
|--------|---------------|
| GreenBuild LLC | $12,054,000 |
| BlueBuild Corp | $8,526,000 |
| RedBuild Partners | $6,076,000 |
| YellowBuild Inc | $7,350,000 |
| WhiteBuild & Assoc | $5,194,000 |
| **TOTAL** | **$39,200,000** |

Each transfer is exactly **98%** of the corresponding city payment. The remaining 2% ($800,000 total) stayed in each shell company's account — likely as "operating expenses."

*$39.2 million, in one offshore account.*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 27,
    },
  });
  await assignHouses(b2c3.id, [beacon.id]);

  const b2c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(9),
      act: 2,
      cardSetId: documents.id,
      clueVisibleCategory: "Lease Agreement",
      header: "One Landlord, Five Tenants",
      description: `**COMMERCIAL LEASE AGREEMENTS** *(obtained from county records)*

All five shell companies lease office space from the same property management firm: **Cross Property Management LLC.**

| Tenant | Monthly Rent | Suite |
|--------|-------------|-------|
| GreenBuild LLC | $4,200 | 4B |
| BlueBuild Corp | $3,800 | 4C |
| RedBuild Partners | $3,500 | 4D |
| YellowBuild Inc | $3,200 | 4E |
| WhiteBuild & Assoc | $2,900 | 4F |

Cross Property Management is owned by — you guessed it — **Helen Cross.**

She's the landlord, the registered agent, the trustee, and the campaign treasurer. All at once.`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 28,
    },
  });
  await assignHouses(b2c4.id, [beacon.id]);

  const b2c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(10),
      act: 2,
      cardSetId: photos.id,
      clueVisibleCategory: "Building Photo",
      complexity: "complex",
      header: "The Building on Oak Street",
      description: `**PHOTO: 123 Oak Street — Full Building Directory**

Fourth floor directory board, photographed through the lobby window:

- Suite 4A: *Vacant*
- Suite 4B: GreenBuild LLC / Marsh for Mayor
- Suite 4C: BlueBuild Corp
- Suite 4D: RedBuild Partners
- Suite 4E: YellowBuild Inc
- Suite 4F: WhiteBuild & Associates

**Building Owner:** Cross Property Management LLC

Five fake companies, all in one building, all on the same floor, all paying rent to the same person.

**Who owns the property management company?**`,
      clueContent: `**OWNER IDENTIFIED: Helen Cross**

Cross Property Management LLC is wholly owned by **Helen Cross** — the mayor's chief of staff, campaign treasurer, and registered agent for all five shell companies.

She set up the companies, leased them space in her own building, and funneled $40 million through them to an offshore trust she controls.

*The entire operation runs through one person.*`,
      designId: surveillance.id,
      answerTemplateType: "single_answer",
      answerId: ansHelenCross.id,
      isAnswerable: true,
      examineText: "Examine Photo",
      isFinished: true,
      sortOrder: 29,
    },
  });
  await assignHouses(b2c5.id, [beacon.id]);

  const b2c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(11),
      act: 2,
      cardSetId: sources.id,
      clueVisibleCategory: "Tip Line Call",
      header: "She's Alive",
      description: `**TIP LINE TRANSCRIPT — Call #4471**
*Duration: 47 seconds. Voice: altered/disguised.*

> *"Stop looking for the comptroller. She's alive. She's safe. She got out before they could stop her.*

> *Before she left, she mailed everything. Six registered letters. Check PO Box 1247 at the downtown post office.*

> *The letters went to the people who can actually do something about this.*

> *Don't call this number again."*

*Click.*

PO Box 1247. Six letters. If Diane Liu mailed copies of her evidence before she disappeared...`,
      designId: tipOff.id,
      isFinished: true,
      sortOrder: 30,
    },
  });
  await assignHouses(b2c6.id, [beacon.id]);

  // --- CHRONICLE Act 2 ---

  const c2c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(12),
      act: 2,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Account Summary",
      header: "Where the Money Went",
      description: `**CAYMAN HOLDINGS TRUST — Account Summary**
*(Obtained via international records request)*

**Total Received:** $39,200,000
**Total Withdrawn:** $36,200,000
**Remaining Balance:** $3,000,000

The $36.2 million was withdrawn as a single wire transfer to **Caribbean Isle Properties Ltd** — a real estate company based in Nassau, Bahamas.

The remaining $3 million sits in the trust as a "reserve fund."

*$36.2 million. One transaction. What did they buy?*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 31,
    },
  });
  await assignHouses(c2c1.id, [chronicle.id]);

  const c2c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(13),
      act: 2,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Property Record",
      complexity: "complex",
      header: "$36 Million for What?",
      description: `**CARIBBEAN ISLE PROPERTIES LTD — Sales Record**

**Purchaser:** Cayman Holdings Trust
**Amount:** $36,200,000
**Date:** June 2024
**Description:** 12-acre property, Cat Island, Bahamas. Private dock, airstrip, main residence (6 bed, 8 bath), guest houses (x3).

The listing described it as: "An exclusive private island retreat, ideal for those seeking complete privacy and discretion."

$40 million in public funds meant for parks and infrastructure was used to purchase a **______**.`,
      clueContent: `**PURCHASE CONFIRMED: Private Island**

$36.2 million of Blackwood's public money was used to buy a **private island** in the Bahamas.

The city's residents thought their tax dollars were building parks. Instead, they bought a 12-acre tropical paradise for someone who already has a perfectly good mansion on Elm Street.

*This is the story.*`,
      designId: newsroom.id,
      answerTemplateType: "single_answer",
      answerId: ansPrivateIsland.id,
      isAnswerable: true,
      examineText: "Review Records",
      isFinished: true,
      sortOrder: 32,
    },
  });
  await assignHouses(c2c2.id, [chronicle.id]);

  const c2c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(14),
      act: 2,
      cardSetId: documents.id,
      clueVisibleCategory: "Trust Document",
      header: "The Beneficiary",
      description: `**CAYMAN HOLDINGS TRUST — Certificate of Formation**

**Established:** January 2023
**Jurisdiction:** Cayman Islands
**Sole Trustee:** Helen Cross
**Sole Beneficiary:** Victoria Marsh

There it is. In writing. The trust that received $39.2 million in stolen public funds names the **mayor of Blackwood** as its sole beneficiary.

Helen Cross manages the money. Victoria Marsh owns it.

*The connection from public funds to the mayor is now documented and unambiguous.*`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 33,
    },
  });
  await assignHouses(c2c3.id, [chronicle.id]);

  const c2c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(15),
      act: 2,
      cardSetId: connections.id,
      clueVisibleCategory: "Email Evidence",
      header: "The Smoking Gun",
      description: `**PRINTED EMAIL** *(recovered from Diane Liu's files)*

**From:** V.Marsh@blackwood.gov
**To:** H.Cross@greenfield-project.com
**Date:** March 28, 2024
**Subject:** RE: Audit concern

> *Helen,*
>
> *Make sure the Build companies are clean. If the comptroller keeps asking questions, handle it. I don't care how.*
>
> *The council reviews budgets in September. Everything needs to look normal by then.*
>
> *—V*

*The mayor directly instructed her chief of staff to silence the comptroller and cover the money trail.*`,
      designId: frontPage.id,
      isFinished: true,
      sortOrder: 34,
    },
  });
  await assignHouses(c2c4.id, [chronicle.id]);

  const c2c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(16),
      act: 2,
      cardSetId: sources.id,
      clueVisibleCategory: "Post Office Lead",
      header: "PO Box 1247",
      description: `**STATEMENT — Gerald Kim, Clerk, Blackwood Downtown Post Office**

*"Yeah, I remember her. The woman matching that description — about two weeks ago, came in around closing time. Nervous. Rented PO Box 1247 on the spot, paid cash for a year.*

*Then she mailed six registered letters, all from the box. Thick envelopes, the kind you use for legal documents. She made sure every one had a tracking number.*

*Who were they addressed to? I shouldn't say, but... let's just say she was writing to people who could do something about whatever scared her that badly."*`,
      designId: tipOff.id,
      isFinished: true,
      sortOrder: 35,
    },
  });
  await assignHouses(c2c5.id, [chronicle.id]);

  const c2c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(17),
      act: 2,
      cardSetId: photos.id,
      clueVisibleCategory: "Mailed Evidence",
      header: "Letter to the Attorney General",
      description: `**PHOTO: Registered Mail Receipt**

Registered letter from PO Box 1247, Blackwood Downtown Post Office.

**Sender:** D. Liu
**Addressee:** Office of the State Attorney General, Attn: Public Integrity Division
**Tracking #:** RR 1234 5678 US
**Status:** Delivered. Signature confirmed.

*Diane Liu didn't just run. Before she disappeared, she mailed the evidence to the one office with the power to act on it.*

*The Attorney General has had the full paper trail for two weeks. And they haven't said a word.*`,
      designId: surveillance.id,
      isFinished: true,
      sortOrder: 36,
    },
  });
  await assignHouses(c2c6.id, [chronicle.id]);

  // ═══════════════════════════════════════════════════════════════════
  // CARDS — ACT 3: "THE STORY"
  // Same 18 physical cards, final content
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 3 cards...");

  // --- HERALD Act 3 ---

  const h3c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(0),
      act: 3,
      cardSetId: documents.id,
      clueVisibleCategory: "Official Letter",
      header: "The AG Responds",
      description: `**OFFICE OF THE STATE ATTORNEY GENERAL**
**PUBLIC INTEGRITY DIVISION**

*CONFIDENTIAL — Media Coordination*

> *We can confirm that City Comptroller Diane Liu is alive and in protective custody. She has been cooperating with our investigation since making contact two weeks ago.*

> *Ms. Liu provided extensive documentation of financial irregularities in Blackwood's Project Greenfield. Charges are forthcoming.*

> *We request that media partners coordinate publication timing to prevent flight risk.*

*The AG has had the evidence all along. They've been building a case.*`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 37,
    },
  });
  await assignHouses(h3c1.id, [herald.id]);

  const h3c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(1),
      act: 3,
      cardSetId: sources.id,
      clueVisibleCategory: "On-Record Source",
      header: "Councilors Go On Record",
      description: `**ON-THE-RECORD INTERVIEWS**

**Councilor Sarah Park (dissenting vote):**
*"I voted no because the bidding process was a sham. One bid, one contractor, no competition. I raised concerns in the closed session and was told to 'trust the process.' I should have pushed harder."*

**Councilor James Reeves (dissenting vote):**
*"When I asked for GreenBuild's references, I was told the information was 'proprietary.' A $40 million public contract, and we couldn't even verify the contractor's track record. I objected on record. The majority overruled me."*

Two council members willing to testify. The cover story is crumbling.`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 38,
    },
  });
  await assignHouses(h3c2.id, [herald.id]);

  const h3c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(2),
      act: 3,
      cardSetId: documents.id,
      clueVisibleCategory: "Legal Filing",
      complexity: "complex",
      header: "Arrest Warrant — SEALED",
      description: `**STATE OF [STATE] — SEALED ARREST WARRANT**
*(Obtained by court order — embargo until publication)*

**Case No.:** 2024-PI-00891
**Charges:** Embezzlement, fraud, conspiracy, obstruction of justice, witness intimidation
**Issued by:** Hon. Margaret Chen, State Superior Court

**Named Defendants:**
1. ████████ ██████ — Mayor of Blackwood
2. Helen Cross — Chief of Staff / Co-conspirator

*The AG is ready to arrest. The primary target's name is redacted under seal. But based on everything you know — who is Defendant #1?*`,
      clueContent: `**DEFENDANT #1: Mayor Victoria Marsh**

The sealed warrant names **Victoria Marsh**, sitting mayor of Blackwood, on charges of embezzlement, fraud, conspiracy, obstruction of justice, and witness intimidation.

Combined with the charges against Helen Cross, this represents the largest municipal corruption case in the state's history.

*The arrests will happen within 24 hours of publication. The story must break first.*`,
      designId: frontPage.id,
      answerTemplateType: "single_answer",
      answerId: ansMarsh.id,
      isAnswerable: true,
      examineText: "Unseal Warrant",
      selfDestructTimer: 90,
      selfDestructText:
        "The court seal has been restored. This document is no longer accessible.",
      isFinished: true,
      sortOrder: 39,
    },
  });
  await assignHouses(h3c3.id, [herald.id]);

  const h3c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(3),
      act: 3,
      cardSetId: sources.id,
      clueVisibleCategory: "Insider Account",
      header: "The Aide Who Knew",
      description: `**STATEMENT — Thomas Brennan, Former Aide to Mayor Marsh**

*"I left the mayor's office six months ago because I couldn't live with what I knew.*

*Mayor Marsh personally directed the creation of the shell company structure. I was in the room when she and Helen Cross drew it on a whiteboard — five companies, one trust, one island.*

*She said, 'By the time anyone figures this out, I'll be sitting on a beach with forty million dollars.' She laughed.*

*I should have spoken up sooner. I'm speaking up now."*

On the record. Named. Willing to testify.`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 40,
    },
  });
  await assignHouses(h3c4.id, [herald.id]);

  const h3c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(4),
      act: 3,
      cardSetId: connections.id,
      clueVisibleCategory: "Complete Timeline",
      header: "The Full Picture",
      description: `**THE BLACKWOOD FILES — MASTER TIMELINE**

- **Jan 2023:** Cayman Holdings Trust established (Cross trustee, Marsh beneficiary)
- **Mar 1, 2024:** GreenBuild LLC + 4 other shells incorporated
- **Mar 3:** Building permit filed (12 days before approval)
- **Mar 13:** $2,847 dinner, city credit card — "confirm LLC paperwork"
- **Mar 15:** Council approves Project Greenfield, 7-2
- **Mar 16:** First contract signed
- **Mar 19:** First payment: $1.2M to GreenBuild
- **Mar-Sep:** $40M flows through 5 shells → Cayman Trust → Private island
- **Sep:** Comptroller Diane Liu begins asking questions
- **Oct:** Helen Cross pressures Liu to stop audit
- **Oct (late):** Liu contacts AG, mails evidence, enters protective custody
- **Now:** AG has sealed arrest warrants. Papers ready to publish.

*Fifteen months. $40 million. One island. Two people.*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 41,
    },
  });
  await assignHouses(h3c5.id, [herald.id]);

  const h3c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(5),
      act: 3,
      cardSetId: photos.id,
      clueVisibleCategory: "Satellite Image",
      header: "The Mayor's Island",
      description: `**SATELLITE IMAGERY — Cat Island, Bahamas**
*Purchased from commercial satellite provider*

12-acre private island with:
- Main residence (6 bed, 8 bath, infinity pool)
- Three guest houses
- Private dock with 60-ft yacht berth
- Landing strip for small aircraft
- Tennis court, helicopter pad

All purchased with $36.2 million in public funds from the City of Blackwood.

Property records list the owner as "Cayman Holdings Trust."

Beneficiary of Cayman Holdings Trust: **Victoria Marsh, Mayor of Blackwood.**

*Your tax dollars at work.*`,
      designId: frontPage.id,
      isFinished: true,
      sortOrder: 42,
    },
  });
  await assignHouses(h3c6.id, [herald.id]);

  // --- BEACON Act 3 ---

  const b3c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(6),
      act: 3,
      cardSetId: sources.id,
      clueVisibleCategory: "Testimony",
      header: "The Comptroller Speaks",
      description: `**DEPOSITION TRANSCRIPT (excerpt)**
**Witness: Diane Liu, City Comptroller**

*Q: Ms. Liu, did Mayor Marsh ever speak to you directly about the Greenfield audit?*

*A: Yes. Once. She called me into her office on October 3rd. She said, "Diane, the Greenfield project is important to this city. I need you to understand that your audit is causing unnecessary anxiety. I'm asking you — personally — to stop."*

*Q: And what did you do?*

*A: I went back to my office and made six copies of everything.*

The comptroller knew she was being silenced. She prepared for it.`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 43,
    },
  });
  await assignHouses(b3c1.id, [beacon.id]);

  const b3c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(7),
      act: 3,
      cardSetId: sources.id,
      clueVisibleCategory: "Second Source",
      header: "Employee #2 Comes Forward",
      description: `**STATEMENT — Karen Okonkwo, Former BlueBuild Corp "Employee"**

*"I answered a job ad for an 'administrative assistant' at BlueBuild Corp. The pay was good — $65,000 for filing and phones.*

*There was no filing. There were no phones. My job was to sign invoices. Stacks of them, pre-printed, for construction work that BlueBuild was supposedly doing.*

*I signed maybe two hundred invoices in three months. Each one for services I knew weren't real.*

*I quit when I saw the amounts. Millions. I was helping someone steal millions."*

A second employee, a second shell company, the same story.`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 44,
    },
  });
  await assignHouses(b3c2.id, [beacon.id]);

  const b3c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(8),
      act: 3,
      cardSetId: photos.id,
      clueVisibleCategory: "Social Media Photo",
      header: "Vacation Photos",
      description: `**SOCIAL MEDIA POST — Helen Cross (since deleted, cached)**
*Posted: August 2024*

Photo 1: Helen Cross on a white sand beach, turquoise water behind her. Caption: "Finally getting some R&R. The island life is everything they promised."

Photo 2: Victoria Marsh lounging on the deck of a large house, cocktail in hand. The architecture matches the satellite imagery of the Cat Island property.

Caption: **"The boss approves."** 😎🏝️

*Helen Cross posted photos of the mayor relaxing on an island purchased with stolen public funds. And then deleted them.*

*But the internet never forgets.*`,
      designId: surveillance.id,
      isFinished: true,
      sortOrder: 45,
    },
  });
  await assignHouses(b3c3.id, [beacon.id]);

  const b3c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(9),
      act: 3,
      cardSetId: documents.id,
      clueVisibleCategory: "Disclosure Form",
      header: "The Missing Disclosure",
      description: `**MAYOR'S ANNUAL FINANCIAL DISCLOSURE — Victoria Marsh**
*Filed: January 2024 (as required by city charter)*

**Real estate owned:** Residence at 88 Elm Street, Blackwood (est. value: $1.2M)
**Other properties:** None declared.
**Trust interests:** None declared.
**Income sources:** Mayoral salary ($195,000), speaking fees ($12,000)

No mention of:
- Cayman Holdings Trust (sole beneficiary)
- 12-acre private island ($36.2M)
- Any relationship with GreenBuild LLC or affiliated companies

*Failure to disclose is itself a felony. This form adds a separate charge to the indictment.*`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 46,
    },
  });
  await assignHouses(b3c4.id, [beacon.id]);

  const b3c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(10),
      act: 3,
      cardSetId: connections.id,
      clueVisibleCategory: "Network Diagram",
      header: "The Complete Web",
      description: `**THE BLACKWOOD FILES — COMPLETE NETWORK**

\`\`\`
      Mayor Victoria Marsh
        (sole beneficiary)
              │
       Helen Cross
   (chief of staff / trustee /
    registered agent / landlord /
    campaign treasurer)
              │
    ┌────┬────┼────┬────┐
    ▼    ▼    ▼    ▼    ▼
  Green Blue  Red  Yel  White
  Build Build Build Build Build
   ($12M) ($8.7M) ($6.2M) ($7.5M) ($5.3M)
              │
     Cayman Holdings Trust
         ($39.2M received)
              │
   Caribbean Isle Properties
         ($36.2M spent)
              │
       Private Island 🏝️
       Cat Island, Bahamas
\`\`\`

*One mayor. One chief of staff. Five fake companies. One island. $40 million.*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 47,
    },
  });
  await assignHouses(b3c5.id, [beacon.id]);

  const b3c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(11),
      act: 3,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Forensic Report",
      header: "Every Dollar Accounted For",
      description: `**FORENSIC ACCOUNTING SUMMARY**
*Prepared for coordinated publication*

| Stage | Amount | Destination |
|-------|--------|-------------|
| City budget → 5 shells | $40,000,000 | GreenBuild + 4 others |
| Shell operating expenses | $800,000 | Retained (2%) |
| Shells → Cayman Trust | $39,200,000 | Cayman Holdings Trust |
| Trust → Island purchase | $36,200,000 | Cat Island property |
| Trust reserve | $3,000,000 | Cayman account (frozen) |

**Unaccounted:** $0.00

Every single dollar of the $40 million Project Greenfield budget has been traced. Not one cent went to actual construction.

*This is the financial story. It's airtight.*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 48,
    },
  });
  await assignHouses(b3c6.id, [beacon.id]);

  // --- CHRONICLE Act 3 ---

  const c3c1 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(12),
      act: 3,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Transaction Map",
      header: "The Complete Money Trail",
      description: `**PROJECT GREENFIELD — COMPLETE TRANSACTION MAP**

Every transfer, every invoice, every wire — traced from the City of Blackwood treasury to a private island in the Bahamas.

**54 fraudulent invoices** across 5 shell companies.
**$40 million** in public funds redirected.
**0 dollars** spent on actual construction.
**1 private island** purchased.

The data tells the story: this wasn't a project that went wrong. There was never a project. There was only ever a theft.

*The numbers don't lie. They never do.*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 49,
    },
  });
  await assignHouses(c3c1.id, [chronicle.id]);

  const c3c2 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(13),
      act: 3,
      cardSetId: documents.id,
      clueVisibleCategory: "Mailed Copies",
      header: "Diane Liu's Insurance Policy",
      description: `**EVIDENCE RECEIVED BY STATE AG — Catalog**

The six registered letters mailed by Diane Liu contained:

1. Complete copies of all fraudulent invoices (54 documents)
2. Bank statements for all 5 shell company accounts
3. Wire transfer records to Cayman Holdings Trust
4. The Cayman Holdings Trust certificate of formation
5. Mayor Marsh's email to Helen Cross ("handle it")
6. A signed, notarized statement from Diane Liu detailing everything she witnessed

*She copied everything. She mailed it to the one office that could act. Then she went into protective custody.*

*Diane Liu didn't run away. She ran toward the truth.*`,
      designId: leakedDoc.id,
      isFinished: true,
      sortOrder: 50,
    },
  });
  await assignHouses(c3c2.id, [chronicle.id]);

  const c3c3 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(14),
      act: 3,
      cardSetId: moneyTrail.id,
      clueVisibleCategory: "Tax Records",
      header: "Adding Federal Charges",
      description: `**IRS COMPLIANCE CHECK — Cayman Holdings Trust**

Reported income to IRS: $0
Actual income: $39,200,000

Reported real estate holdings: None
Actual: 12-acre private island, Cat Island, Bahamas ($36.2M)

**Tax liability (estimated):** $11,760,000
**Tax paid:** $0.00

*None of the offshore money was reported on any federal tax filing. This adds federal tax evasion charges on top of the state embezzlement case.*

*When this story breaks, the FBI will be involved within the hour.*`,
      designId: newsroom.id,
      isFinished: true,
      sortOrder: 51,
    },
  });
  await assignHouses(c3c3.id, [chronicle.id]);

  const c3c4 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(15),
      act: 3,
      cardSetId: sources.id,
      clueVisibleCategory: "AG Source",
      header: "Charges Tomorrow Morning",
      description: `**CONFIDENTIAL — AG's Office, Background Only**

A senior official in the Attorney General's office, speaking on background:

*"We have everything we need. The comptroller's evidence, combined with what the three newspapers have independently verified, makes this the strongest public corruption case this office has ever filed.*

*The arrests will happen at 8 AM tomorrow. We need the stories published by 7 AM — if Marsh sees the warrant before we move, she has a private airstrip and a jet on standby.*

*The clock is ticking. All three papers need to publish simultaneously."*

7 AM. All three papers. At the same time.`,
      designId: frontPage.id,
      isFinished: true,
      sortOrder: 52,
    },
  });
  await assignHouses(c3c4.id, [chronicle.id]);

  const c3c5 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(16),
      act: 3,
      cardSetId: connections.id,
      clueVisibleCategory: "Plea Deal",
      complexity: "complex",
      header: "Cross Cuts a Deal",
      description: `**AG'S OFFICE — PLEA AGREEMENT (DRAFT)**

**Defendant:** Helen Cross
**Charges:** Conspiracy, fraud, money laundering (reduced from original 14 counts)
**Agreement:** Defendant pleads guilty to 3 counts in exchange for _________ against co-defendant Victoria Marsh.

*Helen Cross is cooperating. She's agreed to provide something the prosecution needs to guarantee a conviction of the mayor.*

**What did Helen Cross trade for her reduced charges?**`,
      clueContent: `**PLEA CONFIRMED: Cross Will Testify**

Helen Cross has agreed to provide **testimony** against Mayor Victoria Marsh in exchange for reduced charges.

She will testify to:
- Marsh's direct involvement in creating the shell company structure
- Marsh's personal direction of the money laundering scheme
- Marsh's order to silence the comptroller

*With Cross's testimony, the case against Marsh is airtight. The mayor has nowhere left to hide.*`,
      designId: frontPage.id,
      answerTemplateType: "single_answer",
      answerId: ansTestimony.id,
      isAnswerable: true,
      examineText: "Read Plea Deal",
      isFinished: true,
      sortOrder: 53,
    },
  });
  await assignHouses(c3c5.id, [chronicle.id]);

  const c3c6 = await prisma.card.create({
    data: {
      gameId: game.id,
      physicalCardId: pc(17),
      act: 3,
      cardSetId: photos.id,
      clueVisibleCategory: "Original Evidence",
      header: "The Letter That Started Everything",
      description: `**PHOTO: The Original Anonymous Tip**

The letter that arrived at all three newsrooms — now confirmed by fingerprint analysis to have been written by **Diane Liu, City Comptroller.**

She typed it on a City Hall printer. She used generic white paper and a standard envelope. She wore gloves — but missed one fingerprint on the inside of the envelope flap.

The woman who started this investigation is the same woman who finished it. She didn't just blow the whistle — she built the entire case, mailed it to the AG, and then trusted three rival newspapers to do the rest.

*She trusted you. All of you. Don't let her down.*

**It's time to publish.**`,
      designId: tipOff.id,
      isFinished: true,
      sortOrder: 54,
    },
  });
  await assignHouses(c3c6.id, [chronicle.id]);

  // ═══════════════════════════════════════════════════════════════════
  // MISSIONS — ACT 1
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 1 missions...");

  // Herald — Act 1
  const m_h1a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Verify the Permit Discrepancy",
      sheetLetter: "A",
      description:
        "Your anonymous source mentioned Building Permit #4471. The dates allegedly don't match the council vote. Gather Documents and Sources clues to verify this claim before going further.",
      puzzleDescription:
        "Cross-reference the building permit with the council minutes. You need **1 Documents clue** and **1 Sources clue** to verify the discrepancy.\n\nHow many days before the council vote was the permit filed?",
      requiredClueSets: [
        { cardSetId: documents.id, count: 1 },
        { cardSetId: sources.id, count: 1 },
      ],
      answerTemplateType: "single_answer",
      answerId: ans12days.id,
      consequenceCompleted:
        "The Herald has independently verified the permit discrepancy — a concrete, documentable fact. Your credibility with sources has increased. **In Act 2, one additional source will come forward to speak with your paper first.**",
      consequenceNotCompleted:
        "Without the verified permit discrepancy, the Herald's investigation starts Act 2 on shakier ground. Other papers may have beaten you to it. **A key Act 2 document may be harder to access.**",
      sortOrder: 1,
    },
  });
  await assignMissionHouses(m_h1a.id, [herald.id]);

  const m_h1b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Locate the Hidden Records Room",
      sheetLetter: "B",
      description:
        "The night janitor mentioned files being moved to an unlisted area of City Hall before the vote. Gather Sources clues to confirm the location and what's stored there.",
      puzzleDescription:
        "You need **2 Sources clues** to piece together where the Greenfield files were hidden. What did the janitor reveal?",
      requiredClueSets: [{ cardSetId: sources.id, count: 2 }],
      consequenceCompleted:
        "The Herald has confirmed the existence of a hidden records room in City Hall's basement. This location will become critical in Act 2.",
      consequenceNotCompleted:
        "The records room remains unconfirmed. Without this lead, finding evidence in Act 2 will require more legwork.",
      sortOrder: 2,
    },
  });
  await assignMissionHouses(m_h1b.id, [herald.id]);

  // Beacon — Act 1
  const m_b1a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Identify 'H.C.'",
      sheetLetter: "C",
      description:
        "The initials 'H.C.' keep appearing — on a restaurant receipt, on corporate filings, in employee testimony. Gather Sources and Connections clues to identify this person.",
      puzzleDescription:
        "You need **1 Sources clue** and **1 Connections clue** to identify the person behind the initials H.C.\n\nWho is H.C.? Provide their full name.",
      requiredClueSets: [
        { cardSetId: sources.id, count: 1 },
        { cardSetId: connections.id, count: 1 },
      ],
      answerTemplateType: "single_answer",
      answerId: ansHelenCross.id,
      consequenceCompleted:
        "The Beacon has identified Helen Cross as the central figure connecting the mayor to GreenBuild LLC. Your paper now has a name to investigate in Act 2.",
      consequenceNotCompleted:
        "'H.C.' remains unidentified. Without a name, your Act 2 investigation into the network will start from scratch.",
      sortOrder: 3,
    },
  });
  await assignMissionHouses(m_b1a.id, [beacon.id]);

  const m_b1b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Document the Empty Site",
      sheetLetter: "D",
      description:
        "Multiple clues suggest the Greenfield construction site is empty despite millions in public spending. Gather Photos and Money Trail clues to document this discrepancy.",
      requiredClueSets: [
        { cardSetId: photos.id, count: 1 },
        { cardSetId: moneyTrail.id, count: 1 },
      ],
      consequenceCompleted:
        "The Beacon has photographic proof and financial records showing $12 million spent on a site with zero construction activity. This is your front-page lead for the initial story.",
      consequenceNotCompleted:
        "Without visual evidence of the empty site, your fraud claims remain harder to prove to readers.",
      sortOrder: 4,
    },
  });
  await assignMissionHouses(m_b1b.id, [beacon.id]);

  // Chronicle — Act 1
  const m_c1a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Trace the Money Offshore",
      sheetLetter: "E",
      description:
        "The bank records show money flowing from the city to GreenBuild and then... somewhere else. Follow the Money Trail to determine where the funds are going.",
      puzzleDescription:
        "You need **2 Money Trail clues** to trace the complete flow of funds.\n\nWhat percentage of each city payment is being transferred offshore? (Just the number.)",
      requiredClueSets: [{ cardSetId: moneyTrail.id, count: 2 }],
      answerTemplateType: "single_answer",
      answerId: ans98.id,
      consequenceCompleted:
        "The Chronicle has documented the offshore pipeline: 98% of every dollar flows to Cayman Holdings Trust. Your paper owns the financial angle of this story.",
      consequenceNotCompleted:
        "The offshore connection remains unproven. Without the money trail, the Chronicle's Act 2 financial investigation starts without its strongest lead.",
      sortOrder: 5,
    },
  });
  await assignMissionHouses(m_c1a.id, [chronicle.id]);

  const m_c1b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Establish the Address Connection",
      sheetLetter: "F",
      description:
        "Cross-reference GreenBuild LLC's corporate filings with other publicly available records. There's a connection hiding in plain sight.",
      requiredClueSets: [
        { cardSetId: documents.id, count: 1 },
        { cardSetId: connections.id, count: 1 },
      ],
      consequenceCompleted:
        "The Chronicle has proven that GreenBuild LLC and the mayor's campaign share an address. This is a documentable conflict of interest that strengthens every other claim.",
      consequenceNotCompleted:
        "The address connection remains undiscovered. Other papers may find it first.",
      sortOrder: 6,
    },
  });
  await assignMissionHouses(m_c1b.id, [chronicle.id]);

  // Cross-house — Act 1 (Herald + Chronicle)
  const m_cross1 = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 1,
      title: "Build the Initial Timeline",
      sheetLetter: "G",
      description:
        "Something doesn't add up about the sequence of events. The Herald has documents showing when things were filed; the Chronicle has financial records showing when money moved. Combine your evidence to construct a chronological timeline of the Greenfield scheme.",
      requiredClueSets: [
        { cardSetId: documents.id, count: 1 },
        { cardSetId: moneyTrail.id, count: 1 },
      ],
      consequenceCompleted:
        "The Herald and Chronicle have jointly established a timeline proving the fraud was planned before the council vote. Both papers enter Act 2 with a shared foundation.",
      consequenceNotCompleted:
        "Without a shared timeline, both papers proceed into Act 2 with independent, potentially conflicting narratives. The mayor's lawyers could exploit the inconsistencies.",
      sortOrder: 7,
    },
  });
  await assignMissionHouses(m_cross1.id, [herald.id, chronicle.id]);

  // ═══════════════════════════════════════════════════════════════════
  // MISSIONS — ACT 2
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 2 missions...");

  // Herald — Act 2
  const m_h2a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Find Diane Liu",
      sheetLetter: "A",
      description:
        "The city comptroller, Diane Liu, has been missing for two weeks. Her office is cleaned out, her house is dark, and HR claims she's 'on leave.' Gather Sources and Connections clues to determine what happened to her.",
      puzzleDescription:
        "You need **2 Sources clues** and **1 Connections clue** to piece together the comptroller's fate.\n\nBased on the evidence, what happened to Diane Liu?",
      requiredClueSets: [
        { cardSetId: sources.id, count: 2 },
        { cardSetId: connections.id, count: 1 },
      ],
      answerTemplateType: "single_answer",
      answerId: ansProtectiveCustody.id,
      consequenceCompleted:
        "The Herald has confirmed Diane Liu is alive and cooperating with the AG. This changes the story from 'missing whistleblower' to 'whistleblower under protection.' The mayor can't claim ignorance.",
      consequenceNotCompleted:
        "Diane Liu's fate remains unknown to your paper. The human angle of the story goes unreported.",
      sortOrder: 8,
    },
  });
  await assignMissionHouses(m_h2a.id, [herald.id]);

  const m_h2b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Expose the Five Shell Companies",
      sheetLetter: "B",
      description:
        "The comptroller's unfinished audit referenced payments to multiple companies beyond GreenBuild. Gather Documents and Money Trail clues to identify the full scope of the shell company network.",
      requiredClueSets: [
        { cardSetId: documents.id, count: 1 },
        { cardSetId: moneyTrail.id, count: 1 },
      ],
      consequenceCompleted:
        "The Herald can now report that the fraud isn't limited to GreenBuild — it spans five coordinated shell companies splitting the full $40 million budget.",
      consequenceNotCompleted:
        "Your paper reports on GreenBuild alone. The full scope of the scheme goes unreported until Act 3.",
      sortOrder: 9,
    },
  });
  await assignMissionHouses(m_h2b.id, [herald.id]);

  // Beacon — Act 2
  const m_b2a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Map Helen Cross's Empire",
      sheetLetter: "C",
      description:
        "Helen Cross isn't just the registered agent — she may be at the center of the entire operation. Gather Connections and Documents clues to map her full involvement.",
      requiredClueSets: [
        { cardSetId: connections.id, count: 1 },
        { cardSetId: documents.id, count: 1 },
      ],
      consequenceCompleted:
        "The Beacon has mapped Helen Cross's complete role: chief of staff, campaign treasurer, registered agent for all 5 shells, trustee of the offshore trust, AND landlord to all 5 companies. She's the linchpin.",
      consequenceNotCompleted:
        "Cross's full role remains unclear. The story paints her as a minor player rather than the operational mastermind.",
      sortOrder: 10,
    },
  });
  await assignMissionHouses(m_b2a.id, [beacon.id]);

  const m_b2b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Recover the Mailed Evidence",
      sheetLetter: "D",
      description:
        "An anonymous caller said the comptroller mailed evidence before disappearing. Gather Sources clues to track down the letters.",
      puzzleDescription:
        "You need **2 Sources clues** to track Diane Liu's mailed evidence.\n\nWhat is the PO Box number she used?",
      requiredClueSets: [{ cardSetId: sources.id, count: 2 }],
      answerTemplateType: "single_answer",
      answerId: ans1247.id,
      consequenceCompleted:
        "The Beacon has confirmed that Diane Liu mailed evidence from PO Box 1247 to the AG's office. The paper trail exists and is in safe hands.",
      consequenceNotCompleted:
        "The mailed evidence remains untraced. Your paper can't confirm the AG has independent corroboration.",
      sortOrder: 11,
    },
  });
  await assignMissionHouses(m_b2b.id, [beacon.id]);

  // Chronicle — Act 2
  const m_c2a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Follow the $40 Million",
      sheetLetter: "E",
      description:
        "The money moved from the city through five shell companies to a Cayman Islands trust. But where did it go from there? Gather Money Trail and Documents clues to trace the final destination.",
      requiredClueSets: [
        { cardSetId: moneyTrail.id, count: 2 },
        { cardSetId: documents.id, count: 1 },
      ],
      consequenceCompleted:
        "The Chronicle has traced every dollar: $40M → 5 shells → Cayman trust → private island. The financial story is complete and airtight.",
      consequenceNotCompleted:
        "The final destination of the money remains unknown. The Chronicle's Act 3 financial reporting will be incomplete.",
      sortOrder: 12,
    },
  });
  await assignMissionHouses(m_c2a.id, [chronicle.id]);

  const m_c2b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 2,
      title: "Connect the Trust to the Mayor",
      sheetLetter: "F",
      description:
        "The Cayman Holdings Trust is at the center of the money trail. Gather Connections and Money Trail clues to identify who controls it and who benefits.",
      requiredClueSets: [
        { cardSetId: connections.id, count: 1 },
        { cardSetId: moneyTrail.id, count: 1 },
      ],
      consequenceCompleted:
        "The Chronicle has the trust certificate: Helen Cross is the trustee, Victoria Marsh is the sole beneficiary. The connection from public funds to the mayor is now documented.",
      consequenceNotCompleted:
        "Without the trust connection, the Chronicle can't directly link the mayor to the stolen money. The story has a critical gap.",
      sortOrder: 13,
    },
  });
  await assignMissionHouses(m_c2b.id, [chronicle.id]);

  // ═══════════════════════════════════════════════════════════════════
  // MISSIONS — ACT 3
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating Act 3 missions...");

  // Herald — Act 3
  const m_h3a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 3,
      title: "Write the Government Corruption Angle",
      sheetLetter: "A",
      description:
        "Your paper's piece focuses on the government corruption: the rigged bid, the backdated permit, the intimidated comptroller, and the sealed arrest warrant. Assemble your Documents and Sources.",
      requiredClueSets: [
        { cardSetId: documents.id, count: 2 },
        { cardSetId: sources.id, count: 1 },
      ],
      sortOrder: 14,
    },
  });
  await assignMissionHouses(m_h3a.id, [herald.id]);

  const m_h3b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 3,
      title: "Secure On-Record Sources",
      sheetLetter: "B",
      description:
        "The story needs named sources willing to go on record. The dissenting councilors and the former aide are ready to talk. Gather their statements.",
      requiredClueSets: [{ cardSetId: sources.id, count: 2 }],
      sortOrder: 15,
    },
  });
  await assignMissionHouses(m_h3b.id, [herald.id]);

  // Beacon — Act 3
  const m_b3a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 3,
      title: "Write the Human Interest Story",
      sheetLetter: "C",
      description:
        "Your paper's angle is the people: the comptroller who risked everything, the employees who discovered they were part of a fraud, the councilors who tried to warn everyone. Gather Sources and Photos.",
      requiredClueSets: [
        { cardSetId: sources.id, count: 1 },
        { cardSetId: photos.id, count: 1 },
      ],
      sortOrder: 16,
    },
  });
  await assignMissionHouses(m_b3a.id, [beacon.id]);

  const m_b3b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 3,
      title: "Assemble the Photo Evidence Package",
      sheetLetter: "D",
      description:
        "Every good story needs visuals. Collect the photographic evidence and connection diagrams that will make the front page unforgettable.",
      requiredClueSets: [
        { cardSetId: photos.id, count: 1 },
        { cardSetId: connections.id, count: 1 },
      ],
      sortOrder: 17,
    },
  });
  await assignMissionHouses(m_b3b.id, [beacon.id]);

  // Chronicle — Act 3
  const m_c3a = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 3,
      title: "Write the Financial Investigation",
      sheetLetter: "E",
      description:
        "Your paper traces every dollar. The complete transaction map, the tax evasion evidence, the forensic accounting — assemble the financial story that makes the case irrefutable.",
      requiredClueSets: [
        { cardSetId: moneyTrail.id, count: 2 },
        { cardSetId: documents.id, count: 1 },
      ],
      sortOrder: 18,
    },
  });
  await assignMissionHouses(m_c3a.id, [chronicle.id]);

  const m_c3b = await prisma.mission.create({
    data: {
      gameId: game.id,
      act: 3,
      title: "Assemble the Complete Case File",
      sheetLetter: "F",
      description:
        "Before publication, compile the definitive case file: the money trail, the network diagram, the plea deal. This is the package that will hold up in court.",
      requiredClueSets: [
        { cardSetId: moneyTrail.id, count: 1 },
        { cardSetId: connections.id, count: 1 },
      ],
      sortOrder: 19,
    },
  });
  await assignMissionHouses(m_c3b.id, [chronicle.id]);

  // ═══════════════════════════════════════════════════════════════════
  // MISSION CONSEQUENCES (Act 1 → Act 2)
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating consequences...");

  // If Herald fails "Verify the Permit Discrepancy" → warning on "Expose the Five Shell Companies"
  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_h1a.id,
      targetMissionId: m_h2b.id,
      triggerOnFailure: true,
      triggerOnSuccess: false,
      type: "warning",
      message:
        "The Herald could not verify the permit discrepancy in Act 1. Your foundation for the shell company exposé is weaker — sources may question your credibility when you approach them.",
    },
  });

  // If Chronicle fails "Trace the Money Offshore" → lock "Follow the $40 Million"
  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_c1a.id,
      targetMissionId: m_c2a.id,
      triggerOnFailure: true,
      triggerOnSuccess: false,
      type: "lock",
      message:
        "The Chronicle failed to trace the offshore pipeline in Act 1. Without the basic money trail established, the full $40 million investigation in Act 2 cannot proceed. Other papers may be ahead of you.",
    },
  });

  // If cross-house "Build Timeline" fails → warning on all Act 2 missions (redistribute)
  await prisma.missionConsequence.create({
    data: {
      sourceMissionId: m_cross1.id,
      triggerOnFailure: true,
      triggerOnSuccess: false,
      type: "redistribute",
      message:
        "The Herald and Chronicle failed to build a shared timeline. At the Act 2 break, the host should redistribute one Sources card from each paper to the other to represent information sharing gaps.",
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // STORY SHEETS
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating story sheets...");

  // Act 1 story sheets
  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: herald.id,
      act: 1,
      title: "The Herald — Act 1: The Anonymous Tip",
      content: `The letter arrived at 6 AM, slipped under the newsroom door before anyone was in. Plain white paper, no return address, laser-printed.

Three sentences changed everything: *"The permits for Project Greenfield were backdated. The money isn't going where they say. Follow it."*

Your editor-in-chief held it up in the morning meeting and said one word: **"Verify."**

You are The Blackwood Herald — this city's paper of record for 114 years. You don't chase rumors. You verify facts, build timelines, and let the documents tell the story.

Your beat for Act 1: **government records and public accountability.**

Someone filed a building permit before the project was approved. Someone is paying millions to a contractor with no visible operations. Someone is moving files in the middle of the night.

Find the documents. Verify the claims. Build the foundation.

The other papers got the same letter. They'll be chasing this too. But nobody builds a case like The Herald. Start with the permits. Follow the paper trail. And remember: nothing goes to print until it's confirmed twice.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: beacon.id,
      act: 1,
      title: "The Beacon — Act 1: The Tip",
      content: `Your tip line rang at 5:47 AM. Unknown number, voice disguised: *"Check Project Greenfield. The permits are backdated. The contractor is fake. Follow the money."* Click.

Twenty minutes later, a typed letter arrived — same claims, more detail. Whoever this source is, they're thorough.

You are The Beacon — Blackwood's scrappiest news outlet. Founded four years ago in a garage. You don't have the Herald's legacy or the Chronicle's data team. What you have is **sources.** People talk to you because you listen.

Your beat for Act 1: **sources and street-level investigation.**

A bartender overheard something at City Hall's regular bar. A former GreenBuild employee walked out after two weeks. Security cameras caught someone moving boxes at midnight.

Get the statements. Build the source network. Find out who's behind the initials "H.C." — they keep appearing everywhere.

The other papers got the same tip. They'll work the documents and the numbers. You work the people. That's where the real story always is.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: chronicle.id,
      act: 1,
      title: "The Chronicle — Act 1: The Numbers Don't Lie",
      content: `The anonymous letter arrived with your morning mail. Your data editor read it once, opened a spreadsheet, and started pulling public financial records.

Within an hour, she found the first anomaly: $9.1 million to a single contractor in one quarter, with no corresponding purchase orders for equipment or materials.

You are The Chronicle — Blackwood's data-driven watchdog publication. You launched two years ago with one thesis: **follow the money, and the story follows.** You don't break news on vibes. You break it on numbers.

Your beat for Act 1: **financial records and corporate connections.**

The bank statements show money flowing from the city to GreenBuild LLC and then immediately offshore. The corporate filings show a company created two weeks before the project it was hired for. An accountant inside the system is leaving notes on invoices.

Trace the money. Map the corporate structure. Find the connections that shouldn't exist.

The other papers will chase sources and documents. You follow the dollars. The numbers don't lie — and neither do you.`,
    },
  });

  // Act 2 story sheets
  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: herald.id,
      act: 2,
      title: "The Herald — Act 2: The Missing Comptroller",
      content: `The tip was real. The permits were backdated. The money is flowing offshore. But now the story has taken a darker turn.

Diane Liu, the city comptroller who was asking questions about Greenfield, has disappeared. HR says she's "on leave." Her neighbors say men in a black car came at night and took her suitcases. Her office calendar shows four visits from Helen Cross in the week before she vanished.

This is no longer just a financial story. Someone is silencing witnesses.

Your beat for Act 2: **find the comptroller and expose the full scope.**

The comptroller started an audit before she vanished. It was unfinished — but what she found before they stopped her could blow this open. Five companies, not just one. $40 million, not just $12 million.

Find out what happened to Diane Liu. Complete the audit she couldn't finish. And watch your backs — if they silenced a city official, they won't hesitate to come after journalists.

Trade what you need with the other papers. Time is running out.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: beacon.id,
      act: 2,
      title: "The Beacon — Act 2: The Network",
      content: `Helen Cross. Now you have a name.

The mayor's chief of staff. Campaign treasurer. Registered agent for GreenBuild LLC. And according to your Act 1 investigation, the initials on every key document.

But Helen Cross isn't just a name on paperwork. She owns the building where all the shell companies are housed. She's the trustee of the offshore account. She visited the comptroller four times the week before the woman disappeared.

Your beat for Act 2: **map Helen Cross's complete role and find the mailed evidence.**

Someone called your tip line with a crucial lead: the comptroller mailed evidence before she disappeared. Six registered letters, sent from a PO Box downtown. If those letters reached the right people, the case may already be building without you.

But you need to find them first. And you need to understand how deep Helen Cross's involvement goes — because she's not just following orders. She built the machine.

The other papers have pieces you need. Trade for them.`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: chronicle.id,
      act: 2,
      title: "The Chronicle — Act 2: Follow the Forty Million",
      content: `$39.2 million. That's how much flowed through Cayman Holdings Trust from five shell companies — 98% of every dollar the city paid for "construction work" that never happened.

But you still don't know where the money went after the trust. The $39.2 million entered the Cayman Islands. $36.2 million left as a single wire transfer. Where did it go?

Your beat for Act 2: **trace the final destination and identify who controls the trust.**

The trust certificate is the key. If you can identify the trustee and the beneficiary, you can draw a direct line from City Hall to the stolen money. And if you can trace that $36.2 million wire transfer, you'll know exactly what $40 million in public funds was actually spent on.

The other papers are chasing the human story — the missing comptroller, the shell company network. You chase the numbers. When this goes to court, it's the financial evidence that puts people in prison.

Get the trust certificate. Trace the final wire. Complete the money map.`,
    },
  });

  // Act 3 story sheets
  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: herald.id,
      act: 3,
      title: "The Herald — Act 3: Press Publish",
      content: `The AG has sealed arrest warrants. The comptroller is in protective custody. Helen Cross is cutting a plea deal. And the arrests happen tomorrow at 8 AM.

You have until 7 AM to publish. If the story breaks before the arrests, the mayor has a private airstrip and enough money to disappear forever. All three papers must publish simultaneously.

Your piece: **the government corruption angle.** The rigged bid. The backdated permits. The intimidated comptroller. The councilors who tried to stop it. And the sealed arrest warrant naming the mayor of Blackwood.

This is what The Herald does. You build the definitive record. You name the names. You hold power accountable.

Assemble your final evidence. Write the story. And when all three papers are ready — press publish together.

*This is the biggest story in Blackwood's history. Make it count.*`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: beacon.id,
      act: 3,
      title: "The Beacon — Act 3: The People's Story",
      content: `Diane Liu risked everything. She made six copies of the evidence, mailed them to the AG, and walked into protective custody with nothing but a suitcase and the knowledge that she'd done the right thing.

Two former employees signed statements admitting they'd been hired to sign fraudulent invoices. Two city councilors are going on record about the rigged vote. And Helen Cross is turning on the mayor to save herself.

Your piece: **the human story.** The people who enabled the fraud and the people who fought it. The whistleblower who trusted three rival newspapers to finish what she started. The vacation photos that prove the mayor was already enjoying her stolen island.

This is what The Beacon does. You tell the stories that matter — the human cost, the moral stakes, the courage it takes to speak up.

Assemble your testimony and your photos. Write the story the way only you can. And when it's time — publish together.

*Diane Liu trusted you. Don't let her down.*`,
    },
  });

  await prisma.storySheet.create({
    data: {
      gameId: game.id,
      houseId: chronicle.id,
      act: 3,
      title: "The Chronicle — Act 3: The Money Never Lies",
      content: `$40,000,000. You can trace every single dollar.

From the city treasury, through five fake companies, into an offshore trust, and out the other side to purchase a private island in the Bahamas. The forensic accounting is complete. The tax evasion evidence adds federal charges. And Helen Cross's plea deal means someone on the inside will testify to every transaction.

Your piece: **the financial investigation.** The complete money map. The transaction records. The tax fraud. The plea deal. Numbers that will hold up in court, on appeal, and in the history books.

This is what The Chronicle does. You follow the money, and the truth follows.

Assemble your final evidence. Write the definitive financial exposé. And when the time comes, publish with the others.

*The numbers don't lie. They never have.*`,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // SHOWTIME — Act 3: "PRESS PUBLISH"
  // ═══════════════════════════════════════════════════════════════════

  console.log("Creating showtime...");

  const showtime = await prisma.showtime.create({
    data: {
      gameId: game.id,
      act: 3,
      title: "PRESS PUBLISH — Coordinated Publication",
      revealTitle: "THE BLACKWOOD FILES — PUBLISHED",
      revealDescription: `**BREAKING NEWS — ALL THREE PAPERS — 7:00 AM**

---

**THE BLACKWOOD HERALD**
# Mayor Marsh Indicted in $40M Fraud Scheme
*Sealed warrant names mayor and chief of staff in largest corruption case in state history*

---

**THE BEACON**
# "She Trusted Us": How One Whistleblower Exposed City Hall's Darkest Secret
*Comptroller Diane Liu mailed the evidence, walked into protective custody, and waited for three newsrooms to do the rest*

---

**THE CHRONICLE**
# Every Dollar Traced: Inside the $40M Pipeline from City Hall to a Private Island
*Five shell companies, one offshore trust, zero construction — the complete financial anatomy of Project Greenfield*

---

At 8:02 AM, state police arrived at the mayor's residence. Victoria Marsh was arrested without incident. Helen Cross surrendered at the AG's office at 8:15 AM.

The Greenfield construction site remains empty. It always was.

Diane Liu issued a statement from protective custody: *"I'm just an accountant. I followed the numbers. The numbers led here."*

**The story is out. The truth is published. The city of Blackwood will never be the same.**`,
      designId: frontPage.id,
      syncWindowMs: 3000,
      notes:
        "This is the finale. All three papers must press PUBLISH within 3 seconds of each other.",
    },
  });

  // Showtime slots — one per paper
  const showtimeSlotAnswer1 = await prisma.singleAnswer.create({
    data: {
      gameId: game.id,
      correctAnswer: "greenfield",
      acceptAlternatives: [
        "project greenfield",
        "the greenfield files",
        "blackwood files",
        "the blackwood files",
        "greenfield fraud",
      ],
      hint: "What's the name of the project at the center of the scandal?",
      hintAfterAttempts: 3,
    },
  });

  await prisma.showtimeSlot.create({
    data: {
      showtimeId: showtime.id,
      houseId: herald.id,
      label: "The Herald — Government Angle",
      description:
        "Enter the name of the project at the center of the corruption scheme.",
      answerTemplateType: "single_answer",
      answerId: showtimeSlotAnswer1.id,
      sortOrder: 0,
    },
  });

  await prisma.showtimeSlot.create({
    data: {
      showtimeId: showtime.id,
      houseId: beacon.id,
      label: "The Beacon — Human Interest Angle",
      description:
        "Enter the name of the whistleblower who started it all.",
      answerTemplateType: "single_answer",
      answerId: ansDianeLiu.id,
      sortOrder: 1,
    },
  });

  await prisma.showtimeSlot.create({
    data: {
      showtimeId: showtime.id,
      houseId: chronicle.id,
      label: "The Chronicle — Financial Angle",
      description:
        "Enter the total amount embezzled from the city (in millions, e.g. '40').",
      answerTemplateType: "single_answer",
      answerId: ans40million.id,
      sortOrder: 2,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n========================================");
  console.log(`  ${GAME_NAME}`);
  console.log("========================================\n");
  console.log(`Game ID: ${game.id}`);
  console.log(`Status: ${game.status}\n`);
  console.log("Houses:");
  console.log(`  The Herald (blue)  — ${herald.id}`);
  console.log(`  The Beacon (gold)  — ${beacon.id}`);
  console.log(`  The Chronicle (green) — ${chronicle.id}\n`);
  console.log("Card Sets:");
  console.log(`  Sources      — ${sources.id}`);
  console.log(`  Documents    — ${documents.id}`);
  console.log(`  Photos       — ${photos.id}`);
  console.log(`  Money Trail  — ${moneyTrail.id}`);
  console.log(`  Connections  — ${connections.id}\n`);
  console.log("Cards: 54 total (18 per act, 6 per house)");
  console.log("  Uses 18 physical cards (indices 0-17), reused across all 3 acts\n");
  console.log("Missions: 19 total");
  console.log("  Act 1: 7 (2/house + 1 cross-house Herald+Chronicle)");
  console.log("  Act 2: 6 (2/house)");
  console.log("  Act 3: 6 (2/house)\n");
  console.log("Consequences: 3 (warning, lock, redistribute)");
  console.log("Story Sheets: 9 (3 houses x 3 acts)");
  console.log("Showtime: 1 (Act 3 — 'Press Publish')\n");
  console.log("Complex cards (with answers): 7");
  console.log("  Act 1: Janitor (basement), License (expired), Address (same address)");
  console.log("  Act 2: Audit (five), Photo (Helen Cross), Property (island)");
  console.log("  Act 3: Warrant (Marsh), Plea deal (testimony)\n");
  console.log("Missions with answers: 4");
  console.log("  Permit Discrepancy (12 days), Identify HC (Helen Cross)");
  console.log("  Trace Money (98%), PO Box (1247)\n");
  console.log("Admin: http://localhost:5173/admin");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
