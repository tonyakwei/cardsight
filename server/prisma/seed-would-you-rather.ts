import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

const prisma = new PrismaClient();
const require = createRequire(import.meta.url);
const physicalCards: { id: string; color: string; number: number; name: string }[] = require("../../shared/physical-cards.json");

const GAME_STATUS = "draft" as const;
const GAME_NAME = "Would You Rather";
const GAME_DESCRIPTION =
  "A reflective prompt game that uses the red and blue physical cards for philosophy, identity, and life-values conversations.";
const MOBILE_CARD_CSS = `
  .card-header {
    font-size: clamp(1.9rem, 7vw, 2.5rem) !important;
    line-height: 1.08 !important;
    letter-spacing: -0.02em;
  }

  .card-description {
    font-size: clamp(1.08rem, 4.6vw, 1.18rem) !important;
    line-height: 1.55 !important;
  }

  .card-description p:last-child {
    margin-bottom: 0;
  }
`;

type PromptCard = {
  color: "red" | "blue";
  number: number;
  header: string;
  description: string;
};

type SeedDesign = {
  name: string;
  bgColor: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
  fontFamily: string;
  animationIn: string;
  overlayEffect: string | null;
  customCss: string;
};

const PROMPT_CARDS: PromptCard[] = [
  {
    color: "red",
    number: 1,
    header: "Guiltless Strawberry",
    description:
      "Would you rather be completely free of guilt for everything you've done, or keep your guilt if it makes you a better person?",
  },
  {
    color: "red",
    number: 2,
    header: "Adamant Brick",
    description:
      "Would you rather be known as someone who never compromises, or someone who changes when truth demands it?",
  },
  {
    color: "red",
    number: 3,
    header: "Regal Cardinal",
    description:
      "Would you rather have great influence without being loved, or be deeply loved without having influence?",
  },
  {
    color: "red",
    number: 4,
    header: "Thermonuclear Chili",
    description:
      "Would you rather speak every hard truth the moment you feel it, or hold truths back to protect peace?",
  },
  {
    color: "red",
    number: 5,
    header: "Unyielding Inferno",
    description:
      "Would you rather pursue one calling with total intensity, or live a balanced life with room for many loves?",
  },
  {
    color: "red",
    number: 6,
    header: "Voluptuous Lobster",
    description:
      "Would you rather be desired for your presence, or respected for your character?",
  },
  {
    color: "red",
    number: 7,
    header: "Welcoming Evening",
    description:
      "Would you rather make people feel safe, or make people feel fully alive?",
  },
  {
    color: "red",
    number: 8,
    header: "Glistening Cherry",
    description:
      "Would you rather have a life that looks beautiful from the outside, or one that feels meaningful from the inside?",
  },
  {
    color: "red",
    number: 9,
    header: "Enchanted Rose",
    description:
      "Would you rather experience one transcendent love that changes you, or many steady loves that sustain you?",
  },
  {
    color: "blue",
    number: 1,
    header: "Splintered Sapphire",
    description:
      "Would you rather know an uncomfortable truth about yourself, or keep a comforting illusion that helps you function?",
  },
  {
    color: "blue",
    number: 2,
    header: "Dancing Dolphin",
    description:
      "Would you rather move through life guided by curiosity, or by discipline?",
  },
  {
    color: "blue",
    number: 3,
    header: "Sleeping Ocean",
    description:
      "Would you rather have inner peace without ambition, or ambition without inner peace?",
  },
  {
    color: "blue",
    number: 4,
    header: "Indomitable Sky",
    description:
      "Would you rather believe your life has a fixed purpose, or that you are free to invent it?",
  },
  {
    color: "blue",
    number: 5,
    header: "Brooding Glacier",
    description:
      "Would you rather be emotionally transparent and vulnerable, or private and difficult to fully know?",
  },
  {
    color: "blue",
    number: 6,
    header: "Tardy Bluebird",
    description:
      "Would you rather arrive late to your \"best life\" but with wisdom, or arrive early and spend years learning by mistake?",
  },
  {
    color: "blue",
    number: 7,
    header: "Overripe Blueberry",
    description:
      "Would you rather let go of a version of yourself that once worked, or keep it too long because it feels familiar?",
  },
  {
    color: "blue",
    number: 8,
    header: "Elusive Jellyfish",
    description:
      "Would you rather be fully understood by a few people, or endlessly interesting to many?",
  },
  {
    color: "blue",
    number: 9,
    header: "Ripped Jeans",
    description:
      "Would you rather live as your most authentic self and be judged, or be socially admired for a version of yourself that isn't fully real?",
  },
];

const DESIGN_DEFINITIONS: Record<"red" | "blue", SeedDesign> = {
  red: {
    name: "Would You Rather Red",
    bgColor: "#1b0f12",
    bgGradient:
      "radial-gradient(circle at 18% 16%, rgba(255, 145, 120, 0.18), transparent 28%), linear-gradient(180deg, #2c1518 0%, #1b0f12 58%, #11090b 100%)",
    textColor: "#f9ebe5",
    accentColor: "#ff8c74",
    secondaryColor: "#ffc2b3",
    fontFamily: "Georgia, serif",
    animationIn: "fade",
    overlayEffect: "glow",
    customCss: MOBILE_CARD_CSS,
  },
  blue: {
    name: "Would You Rather Blue",
    bgColor: "#0d1823",
    bgGradient:
      "radial-gradient(circle at 78% 14%, rgba(115, 190, 255, 0.2), transparent 30%), linear-gradient(180deg, #152637 0%, #0d1823 58%, #09111a 100%)",
    textColor: "#edf5fb",
    accentColor: "#7dc9ff",
    secondaryColor: "#c1e6ff",
    fontFamily: "Georgia, serif",
    animationIn: "fade",
    overlayEffect: "scanlines",
    customCss: MOBILE_CARD_CSS,
  },
};

function getPhysicalCardId(color: "red" | "blue", number: number) {
  const match = physicalCards.find((card) => card.color === color && card.number === number);
  if (!match) {
    throw new Error(`Missing physical card for ${color} ${number}`);
  }
  return match.id;
}

async function cleanExistingGame(name: string) {
  const existing = await prisma.game.findFirst({
    where: { name },
    select: { id: true },
  });

  if (!existing) return;
  const gameId = existing.id;

  await prisma.triggeredConsequence.deleteMany({ where: { gameId } });
  await prisma.missionConsequence.deleteMany({
    where: { sourceMission: { gameId } },
  });
  await prisma.missionAnswerAttempt.deleteMany({ where: { gameId } });
  await prisma.missionScanEvent.deleteMany({ where: { gameId } });
  await prisma.storySheet.deleteMany({ where: { gameId } });
  await prisma.showtimeSlot.deleteMany({
    where: { showtime: { gameId } },
  });
  await prisma.showtime.deleteMany({ where: { gameId } });
  await prisma.missionHouse.deleteMany({
    where: { mission: { gameId } },
  });
  await prisma.mission.deleteMany({ where: { gameId } });
  await prisma.cardHouse.deleteMany({ where: { card: { gameId } } });
  await prisma.setReview.deleteMany({ where: { gameId } });
  await prisma.answerAttempt.deleteMany({ where: { gameId } });
  await prisma.scanEvent.deleteMany({ where: { gameId } });
  await prisma.card.deleteMany({ where: { gameId } });
  await prisma.singleAnswer.deleteMany({ where: { gameId } });
  await prisma.multipleAnswer.deleteMany({ where: { gameId } });
  await prisma.design.deleteMany({ where: { gameId } });
  await prisma.cardSet.deleteMany({ where: { gameId } });
  await prisma.house.deleteMany({ where: { gameId } });
  await prisma.game.delete({ where: { id: gameId } });
}

async function seedWouldYouRatherGame() {
  if (PROMPT_CARDS.length !== 18) {
    throw new Error(`Expected 18 prompt cards, got ${PROMPT_CARDS.length}`);
  }

  await cleanExistingGame(GAME_NAME);

  const game = await prisma.game.create({
    data: {
      name: GAME_NAME,
      description: GAME_DESCRIPTION,
      status: GAME_STATUS,
      currentAct: 1,
      printTheme: "classic",
    },
  });

  const designIds = {} as Record<"red" | "blue", string>;

  for (const color of ["red", "blue"] as const) {
    const design = await prisma.design.create({
      data: {
        gameId: game.id,
        name: DESIGN_DEFINITIONS[color].name,
        bgColor: DESIGN_DEFINITIONS[color].bgColor,
        bgGradient: DESIGN_DEFINITIONS[color].bgGradient,
        textColor: DESIGN_DEFINITIONS[color].textColor,
        accentColor: DESIGN_DEFINITIONS[color].accentColor,
        secondaryColor: DESIGN_DEFINITIONS[color].secondaryColor,
        fontFamily: DESIGN_DEFINITIONS[color].fontFamily,
        cardStyle: "standard",
        animationIn: DESIGN_DEFINITIONS[color].animationIn,
        borderStyle: "1px solid rgba(255,255,255,0.12)",
        overlayEffect: DESIGN_DEFINITIONS[color].overlayEffect,
        customCss: DESIGN_DEFINITIONS[color].customCss,
      },
    });
    designIds[color] = design.id;
  }

  for (const [index, card] of PROMPT_CARDS.entries()) {
    await prisma.card.create({
      data: {
        gameId: game.id,
        physicalCardId: getPhysicalCardId(card.color, card.number),
        act: 1,
        subtype: "reference",
        complexity: "simple",
        clueVisibleCategory: "Would You Rather",
        header: card.header,
        description: card.description,
        designId: designIds[card.color],
        sortOrder: index + 1,
        isFinished: true,
      },
    });
  }

  return game;
}

async function main() {
  const game = await seedWouldYouRatherGame();
  console.log(`Seeded ${GAME_NAME} (${game.id}) as ${GAME_STATUS}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
