import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

const prisma = new PrismaClient();
const require = createRequire(import.meta.url);
const physicalCards: { id: string }[] = require("../../shared/physical-cards.json");

const GAME_STATUS = "draft" as const;
const SHARED_PHYSICAL_CARD_IDS = physicalCards.slice(0, 15).map((card) => card.id);

type CardKind =
  | "opening"
  | "mystery"
  | "comedy"
  | "sincerity"
  | "constraint"
  | "reveal";

type SeedCard = {
  kind: CardKind;
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

type SeedGame = {
  name: string;
  description: string;
  theme: "spyhouse" | "heist";
  cards: SeedCard[];
};

const MOBILE_CARD_CSS = `
  .card-header {
    font-size: clamp(2.1rem, 8vw, 2.8rem) !important;
    line-height: 1.08 !important;
    letter-spacing: -0.02em;
  }

  .card-description {
    font-size: clamp(1.05rem, 4.5vw, 1.16rem) !important;
    line-height: 1.58 !important;
  }

  .card-description p:last-child {
    margin-bottom: 0;
  }
`;

const KIND_LABELS: Record<CardKind, string> = {
  opening: "Opening",
  mystery: "Mystery",
  comedy: "Comedy",
  sincerity: "Sincerity",
  constraint: "Constraint",
  reveal: "Reveal",
};

function buildDesigns(theme: SeedGame["theme"]): Record<CardKind, SeedDesign> {
  if (theme === "spyhouse") {
    return {
      opening: {
        name: "Spyhouse Opening",
        bgColor: "#120f12",
        bgGradient:
          "radial-gradient(circle at 18% 20%, rgba(181, 140, 90, 0.14), transparent 30%), linear-gradient(180deg, #19151a 0%, #110f13 55%, #0a090c 100%)",
        textColor: "#efe4d2",
        accentColor: "#d8a15d",
        secondaryColor: "#aeb7c4",
        fontFamily: "Georgia, serif",
        animationIn: "fade",
        overlayEffect: "scanlines",
        customCss: MOBILE_CARD_CSS,
      },
      mystery: {
        name: "Spyhouse Mystery",
        bgColor: "#10151a",
        bgGradient:
          "radial-gradient(circle at 82% 14%, rgba(115, 147, 171, 0.13), transparent 30%), linear-gradient(180deg, #171e25 0%, #10151a 55%, #0b1014 100%)",
        textColor: "#e8e3db",
        accentColor: "#95b5c9",
        secondaryColor: "#d7a55f",
        fontFamily: "Georgia, serif",
        animationIn: "decrypt",
        overlayEffect: "scanlines",
        customCss: MOBILE_CARD_CSS,
      },
      comedy: {
        name: "Spyhouse Comedy",
        bgColor: "#191211",
        bgGradient:
          "radial-gradient(circle at 20% 12%, rgba(214, 132, 93, 0.16), transparent 28%), linear-gradient(180deg, #241716 0%, #191211 58%, #120d0d 100%)",
        textColor: "#f3e5d7",
        accentColor: "#df8b66",
        secondaryColor: "#f0c59a",
        fontFamily: "Georgia, serif",
        animationIn: "slide-up",
        overlayEffect: "glow",
        customCss: MOBILE_CARD_CSS,
      },
      sincerity: {
        name: "Spyhouse Sincerity",
        bgColor: "#161214",
        bgGradient:
          "radial-gradient(circle at 50% 10%, rgba(212, 176, 161, 0.14), transparent 28%), linear-gradient(180deg, #21191c 0%, #161214 58%, #100d10 100%)",
        textColor: "#f2e7dc",
        accentColor: "#d9b8a3",
        secondaryColor: "#ead8c8",
        fontFamily: "Georgia, serif",
        animationIn: "fade",
        overlayEffect: "glow",
        customCss: MOBILE_CARD_CSS,
      },
      constraint: {
        name: "Spyhouse Constraint",
        bgColor: "#121417",
        bgGradient:
          "linear-gradient(180deg, #1a1d21 0%, #121417 58%, #0d0f12 100%)",
        textColor: "#ebedf0",
        accentColor: "#c4d0da",
        secondaryColor: "#9aa6b2",
        fontFamily: "Georgia, serif",
        animationIn: "slide-up",
        overlayEffect: "static",
        customCss: MOBILE_CARD_CSS,
      },
      reveal: {
        name: "Spyhouse Reveal",
        bgColor: "#1a1410",
        bgGradient:
          "radial-gradient(circle at 50% 10%, rgba(240, 197, 124, 0.18), transparent 28%), linear-gradient(180deg, #241a13 0%, #1a1410 56%, #120e0b 100%)",
        textColor: "#f6ead8",
        accentColor: "#f0c57c",
        secondaryColor: "#e0c6a1",
        fontFamily: "Georgia, serif",
        animationIn: "fade",
        overlayEffect: "glow",
        customCss: MOBILE_CARD_CSS,
      },
    };
  }

  return {
    opening: {
      name: "Wonderous Heist Opening",
      bgColor: "#0d1520",
      bgGradient:
        "radial-gradient(circle at 50% 10%, rgba(213, 180, 100, 0.18), transparent 28%), linear-gradient(180deg, #152131 0%, #0d1520 55%, #091017 100%)",
      textColor: "#f4ecda",
      accentColor: "#e1bb62",
      secondaryColor: "#9ed0d7",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      animationIn: "slide-up",
      overlayEffect: "glow",
      customCss: MOBILE_CARD_CSS,
    },
    mystery: {
      name: "Wonderous Heist Mystery",
      bgColor: "#0f1723",
      bgGradient:
        "radial-gradient(circle at 78% 14%, rgba(138, 201, 214, 0.18), transparent 30%), linear-gradient(180deg, #162334 0%, #0f1723 56%, #0a1019 100%)",
      textColor: "#eff0ea",
      accentColor: "#93ccda",
      secondaryColor: "#f0d48b",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      animationIn: "fade",
      overlayEffect: "scanlines",
      customCss: MOBILE_CARD_CSS,
    },
    comedy: {
      name: "Wonderous Heist Comedy",
      bgColor: "#1c1510",
      bgGradient:
        "radial-gradient(circle at 18% 12%, rgba(233, 141, 95, 0.18), transparent 30%), linear-gradient(180deg, #281d16 0%, #1c1510 58%, #14100d 100%)",
      textColor: "#f7eadb",
      accentColor: "#eb9161",
      secondaryColor: "#ffd497",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      animationIn: "slide-up",
      overlayEffect: "glow",
      customCss: MOBILE_CARD_CSS,
    },
    sincerity: {
      name: "Wonderous Heist Sincerity",
      bgColor: "#131913",
      bgGradient:
        "radial-gradient(circle at 50% 10%, rgba(198, 214, 158, 0.16), transparent 28%), linear-gradient(180deg, #1b241a 0%, #131913 58%, #0e120e 100%)",
      textColor: "#f4efdf",
      accentColor: "#c8d69f",
      secondaryColor: "#ead4a2",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      animationIn: "fade",
      overlayEffect: "glow",
      customCss: MOBILE_CARD_CSS,
    },
    constraint: {
      name: "Wonderous Heist Constraint",
      bgColor: "#12161d",
      bgGradient:
        "linear-gradient(180deg, #1a2029 0%, #12161d 58%, #0c1015 100%)",
      textColor: "#eef1f2",
      accentColor: "#d8e1e9",
      secondaryColor: "#9ed0d7",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      animationIn: "slide-up",
      overlayEffect: "static",
      customCss: MOBILE_CARD_CSS,
    },
    reveal: {
      name: "Wonderous Heist Reveal",
      bgColor: "#17140d",
      bgGradient:
        "radial-gradient(circle at 50% 10%, rgba(243, 210, 125, 0.2), transparent 30%), linear-gradient(180deg, #231c12 0%, #17140d 58%, #100d08 100%)",
      textColor: "#f7efdf",
      accentColor: "#f3d27d",
      secondaryColor: "#f0e2bd",
      fontFamily: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      animationIn: "fade",
      overlayEffect: "glow",
      customCss: MOBILE_CARD_CSS,
    },
  };
}

const GAMES: SeedGame[] = [
  {
    name: "The Spyhouse",
    description:
      "A two-player apartment safehouse story game. Two false names, one missing package, and a room that seems designed to make real instincts leak into the fiction.",
    theme: "spyhouse",
    cards: [
      {
        kind: "opening",
        header: "Entry",
        description:
          "You arrive at the safehouse apartment seconds apart, both under false names, both expecting to retrieve a package and leave.\n\nThe package is gone. The place is mostly tidy, but something about the room says whoever left did so quickly and on purpose.\n\nSay your alias, what you were told, and the first thing in the apartment that makes you think this night is going to get stranger.\n\nLet that first detail come from the kind of thing **you** would actually notice first in a room like this.",
      },
      {
        kind: "mystery",
        header: "Something Is Off",
        description:
          "One object in the apartment does not belong here.\n\nBring it into the scene. Choose the kind of detail **you** would notice immediately in a room like this.",
      },
      {
        kind: "mystery",
        header: "The Room Was Watching",
        description:
          "You find a sign that whoever prepared this apartment expected one of you before the other.\n\nShow the sign. Let it reveal the kind of thing **you** use to decide whether someone can be trusted.",
      },
      {
        kind: "mystery",
        header: "Locked Compartment",
        description:
          "There is a drawer, case, or cabinet in the apartment that should have been empty but is not.\n\nOpen it. What you find should feel oddly personal for a professional setup, and it should connect to a real comfort, fascination, or small obsession of yours.",
      },
      {
        kind: "comedy",
        header: "Bad Cover Story",
        description:
          "Your explanation for being here gets worse.\n\nSay it anyway. Let the lie accidentally reveal something true about what **you** are actually good at.",
      },
      {
        kind: "comedy",
        header: "Someone Outside",
        description:
          "You hear movement outside the door.\n\nPretend not to be worried. Show exactly how **you** try to look calm when you are not.",
      },
      {
        kind: "comedy",
        header: "Ridiculous Evidence",
        description:
          "Something embarrassingly minor in the apartment suddenly becomes central evidence.\n\nA receipt. A magnet. A candle. A record sleeve. Choose it, and make it matter far too much. Base it on a real pet peeve, tiny standard, or irrational preference you actually have.",
      },
      {
        kind: "sincerity",
        header: "Unplanned Competence",
        description:
          "You notice the other person doing something unexpectedly capable, careful, or kind.\n\nPut that moment into the scene. Let it come from a real quality you genuinely find reassuring or attractive in people.",
      },
      {
        kind: "sincerity",
        header: "The Assignment Was A Cover",
        description:
          "It starts to feel as if the missing package mattered less than what this room was meant to reveal.\n\nLet yourself say, or almost say, what you thought this assignment was really going to be.",
      },
      {
        kind: "sincerity",
        header: "Too True",
        description:
          "You say something that was meant to stay inside the cover identity, but came out a little too real.\n\nSay it.",
      },
      {
        kind: "constraint",
        header: "The Strange Part",
        description:
          "Begin with:\n\n`The strange part was not the apartment. The strange part was...`\n\nFinish the thought with the kind of vibe, behavior, or quality that genuinely catches your attention in people.",
      },
      {
        kind: "constraint",
        header: "Not My Real Name",
        description:
          "Begin with:\n\n`That wasn't my real name, but it was close to the version of me that...`\n\nFinish it with a real side of yourself, smuggled through the alias.",
      },
      {
        kind: "constraint",
        header: "Why I Stayed",
        description:
          "Somewhere in your next addition, include:\n\n`I stayed because...`\n\nDo not use the words `truth`, `lie`, `package`, or `name`.\n\nWhat follows should come from a real instinct, pull, or preference you actually recognize in yourself.",
      },
      {
        kind: "reveal",
        header: "Midpoint",
        description:
          "A hidden message in the apartment makes one thing clear: one of your false names was expected, and the other was chosen as bait.\n\nReveal what form the message takes, and let it force out something you were trying not to show.",
      },
      {
        kind: "reveal",
        header: "Finale",
        description:
          "You finally understand the package was an excuse to get the two of you into the same room.\n\nDecide who arranged it, what they were testing, and why neither of you left when you had the chance.\n\nEnd on one image:\n- a laugh\n- an unopened door\n- a shared plan\n- the exchange of real names",
      },
    ],
  },
  {
    name: "A Wonderous Heist",
    description:
      "A two-player museum heist story game. Two aliases break into the Museum of Impossible Things, only to discover the vault responds more to motive than to theft.",
    theme: "heist",
    cards: [
      {
        kind: "opening",
        header: "Entry",
        description:
          "You enter the Museum of Impossible Things under false names, there to steal a single item from the Heart Vault before midnight.\n\nNeither of you knows exactly what the target is yet, only that you are both certain you will recognize it when it appears.\n\nSay your alias, what role you seem to play in the heist, and the first thing in the museum that makes you think this place was designed for people like you.\n\nLet that first detail come from the kind of thing **you** would actually notice first in a strange room.",
      },
      {
        kind: "mystery",
        header: "Impossible Room",
        description:
          "A new room appears that should not exist inside the museum.\n\nBring it into the scene. Make it the kind of place **you** would instantly want to inspect more closely.",
      },
      {
        kind: "mystery",
        header: "Trust Test",
        description:
          "You find an instruction that may be helping you or may be studying you.\n\nBring it into the scene. Let it reveal one small thing that genuinely makes you trust someone faster, or one small thing that quietly puts you on guard.",
      },
      {
        kind: "mystery",
        header: "Wrong Motive",
        description:
          "A security system activates, but it does not care whether you are armed or authorized. It cares why you came.\n\nShow how your way through the room reveals something **you** would actually chase hard enough to embarrass yourself a little.",
      },
      {
        kind: "comedy",
        header: "Bad Cover Story",
        description:
          "Your explanation for belonging in the museum gets worse.\n\nSay it anyway. Let the lie accidentally reveal something true about what **you** are actually good at.",
      },
      {
        kind: "comedy",
        header: "The Guard",
        description:
          "A guard sees you and is entirely unconvinced by whatever image you are trying to project.\n\nShow the moment. Let the scene reveal how **you** try to seem smooth when you are improvising.",
      },
      {
        kind: "comedy",
        header: "Signature Move",
        description:
          "In the middle of the heist, you do something completely unnecessary that somehow becomes part of your whole style.\n\nPut it into the scene. Base it on one harmlessly ridiculous thing you are weirdly confident about.",
      },
      {
        kind: "sincerity",
        header: "Taken Things",
        description:
          "You enter a quiet room full of objects other people once tried to steal because they mattered too much to leave behind.\n\nChoose one object that stops you. Let it carry a real desire, comfort, or private wish of yours.",
      },
      {
        kind: "sincerity",
        header: "Crisis Standard",
        description:
          "The vault asks, without asking directly, what makes someone worth choosing when the pressure becomes real.\n\nAnswer in the scene. Let it come from a quality you genuinely find reassuring, attractive, or worth trusting.",
      },
      {
        kind: "sincerity",
        header: "Unexpected Competence",
        description:
          "You notice the other person doing something unexpectedly effective, careful, or kind during the heist.\n\nPut that moment into the scene. Let it come from a real quality you admire in people.",
      },
      {
        kind: "constraint",
        header: "The Plan",
        description:
          "Begin with:\n\n`The plan almost fell apart when I realized...`\n\nFinish the thought with the kind of problem **you** would actually find most distracting, suspicious, or hard to ignore.",
      },
      {
        kind: "constraint",
        header: "The Kind Of Partner",
        description:
          "Begin with:\n\n`You were the kind of partner who...`\n\nFinish it with a detail that works in the heist, but also hides a real compliment you would mean.",
      },
      {
        kind: "constraint",
        header: "The Room Opened",
        description:
          "Begin with:\n\n`The room opened only for people who secretly valued...`\n\nFinish it with a value you genuinely respect enough to notice in real life.",
      },
      {
        kind: "reveal",
        header: "Midpoint",
        description:
          "The Heart Vault sends a message:\n\n`Warning: the target is not an object. Continue only if you are willing to be slightly more honest than your alias intended.`\n\nBring the moment into the scene. Let it force out what you think the vault may really contain, and let that guess borrow from something you actually hope for when a connection feels promising.",
      },
      {
        kind: "reveal",
        header: "Finale",
        description:
          "The Heart Vault opens.\n\nInside is not a jewel, file, or weapon. It is the thing this entire museum was arranged to uncover.\n\nDecide what is inside, why you knew it mattered, and whether the right ending is to steal it, protect it, or share it.\n\nEnd on the kind of ending you would actually find most satisfying for a night like this.",
      },
    ],
  },
];

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

async function seedDateNightGame(definition: SeedGame) {
  if (definition.cards.length !== SHARED_PHYSICAL_CARD_IDS.length) {
    throw new Error(
      `${definition.name}: expected ${SHARED_PHYSICAL_CARD_IDS.length} cards, got ${definition.cards.length}`,
    );
  }

  await cleanExistingGame(definition.name);

  const game = await prisma.game.create({
    data: {
      name: definition.name,
      description: definition.description,
      status: GAME_STATUS,
      currentAct: 1,
      printTheme: "classic",
    },
  });

  const designDefinitions = buildDesigns(definition.theme);
  const designIds = {} as Record<CardKind, string>;

  for (const kind of Object.keys(designDefinitions) as CardKind[]) {
    const designDefinition = designDefinitions[kind];
    const design = await prisma.design.create({
      data: {
        gameId: game.id,
        name: designDefinition.name,
        bgColor: designDefinition.bgColor,
        bgGradient: designDefinition.bgGradient,
        textColor: designDefinition.textColor,
        accentColor: designDefinition.accentColor,
        secondaryColor: designDefinition.secondaryColor,
        fontFamily: designDefinition.fontFamily,
        cardStyle: "standard",
        animationIn: designDefinition.animationIn,
        borderStyle: "1px solid rgba(255,255,255,0.12)",
        overlayEffect: designDefinition.overlayEffect,
        customCss: designDefinition.customCss,
      },
    });
    designIds[kind] = design.id;
  }

  for (const [index, card] of definition.cards.entries()) {
    await prisma.card.create({
      data: {
        gameId: game.id,
        physicalCardId: SHARED_PHYSICAL_CARD_IDS[index],
        act: 1,
        subtype: "reference",
        complexity: "simple",
        clueVisibleCategory: KIND_LABELS[card.kind],
        header: card.header,
        description: card.description,
        designId: designIds[card.kind],
        sortOrder: index + 1,
        isFinished: true,
      },
    });
  }

  return game;
}

async function main() {
  for (const gameDefinition of GAMES) {
    const game = await seedDateNightGame(gameDefinition);
    console.log(`Seeded ${gameDefinition.name} (${game.id}) as ${GAME_STATUS}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
