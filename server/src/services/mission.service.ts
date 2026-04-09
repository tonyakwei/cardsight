import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import { validateAnswer } from "./answer-validation.js";
import type {
  MissionViewerResponse,
  MissionScanResponse,
  MissionAnswerResponse,
  CardDesign,
  AnswerMeta,
  AnswerTemplateType,
} from "@cardsight/shared";

export async function getMissionForViewer(
  missionId: string,
): Promise<MissionViewerResponse> {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      design: true,
      missionHouses: {
        include: { house: { select: { id: true, name: true, color: true } } },
      },
      game: {
        include: {
          cardSets: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  if (!mission) {
    throw new AppError(404, "Mission not found");
  }

  // Build design object
  let design: CardDesign | null = null;
  if (mission.design) {
    const d = mission.design;
    design = {
      bgColor: d.bgColor,
      bgGradient: d.bgGradient,
      bgImageUrl: d.bgImageUrl,
      textColor: d.textColor,
      accentColor: d.accentColor,
      secondaryColor: d.secondaryColor,
      fontFamily: d.fontFamily,
      cardStyle: d.cardStyle,
      animationIn: d.animationIn,
      borderStyle: d.borderStyle,
      overlayEffect: d.overlayEffect,
      customCss: d.customCss,
    };
  }

  // Resolve required clue sets to names/colors
  const clueSets = (mission.requiredClueSets as { cardSetId: string; count: number }[]) || [];
  const cardSetMap = new Map(mission.game.cardSets.map((cs) => [cs.id, cs]));
  const requiredClueSets = clueSets.map((cs) => {
    const set = cardSetMap.get(cs.cardSetId);
    return {
      cardSetName: set?.name ?? "Unknown",
      cardSetColor: set?.color ?? "#888",
      count: cs.count,
    };
  });

  // Build answer meta if answerable
  let answerMeta: AnswerMeta | null = null;
  const isAnswerable = !!mission.answerTemplateType && !!mission.answerId && !mission.isCompleted;
  if (isAnswerable && mission.answerTemplateType && mission.answerId) {
    answerMeta = await buildAnswerMeta(
      mission.answerTemplateType,
      mission.answerId,
      missionId,
    );
  }

  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    puzzleDescription: mission.puzzleDescription,
    act: mission.act,
    design,
    requiredClueSets,
    isCompleted: mission.isCompleted,
    completedAt: mission.completedAt?.toISOString() ?? null,
    lockedOut: mission.lockedOut,
    lockedOutReason: mission.lockedOutReason,
    isAnswerable,
    answerTemplateType: mission.answerTemplateType as AnswerTemplateType | null,
    answerMeta,
    houses: mission.missionHouses.map((mh) => mh.house),
  };
}

export async function recordMissionScan(
  missionId: string,
  houseId?: string,
  sessionHash?: string,
): Promise<MissionScanResponse> {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { id: true, gameId: true, isCompleted: true },
  });

  if (!mission) {
    throw new AppError(404, "Mission not found");
  }

  await prisma.missionScanEvent.create({
    data: {
      missionId: mission.id,
      gameId: mission.gameId,
      houseId: houseId || null,
      sessionHash,
    },
  });

  return { alreadyCompleted: mission.isCompleted };
}

export async function checkMissionAnswer(
  missionId: string,
  answer: string | string[] | Record<string, string>,
  houseId?: string,
  sessionHash?: string,
): Promise<MissionAnswerResponse> {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      gameId: true,
      isCompleted: true,
      answerTemplateType: true,
      answerId: true,
      lockedOut: true,
    },
  });

  if (!mission) {
    throw new AppError(404, "Mission not found");
  }

  if (!mission.answerTemplateType || !mission.answerId) {
    throw new AppError(400, "This mission does not accept answers");
  }

  if (mission.lockedOut) {
    throw new AppError(403, "This mission is locked");
  }

  if (mission.isCompleted) {
    return {
      correct: true,
      attemptNumber: 0,
      hint: null,
      message: "This mission has already been completed!",
    };
  }

  const previousAttempts = await prisma.missionAnswerAttempt.count({
    where: { missionId: mission.id },
  });
  const attemptNumber = previousAttempts + 1;

  const correct = await validateAnswer(
    mission.answerTemplateType,
    mission.answerId,
    answer,
  );

  await prisma.missionAnswerAttempt.create({
    data: {
      missionId: mission.id,
      gameId: mission.gameId,
      houseId: houseId || null,
      attemptNumber,
      answerGiven: typeof answer === "string" ? answer : JSON.parse(JSON.stringify(answer)),
      isCorrect: correct,
      sessionHash,
    },
  });

  if (correct) {
    await prisma.mission.update({
      where: { id: mission.id },
      data: { isCompleted: true, completedAt: new Date() },
    });

    return {
      correct: true,
      attemptNumber,
      hint: null,
      message: "Correct! Mission complete.",
    };
  }

  // Check for hints
  let hint: string | null = null;
  if (mission.answerTemplateType === "single_answer") {
    const template = await prisma.singleAnswer.findUnique({
      where: { id: mission.answerId },
    });
    if (template?.hint && attemptNumber >= template.hintAfterAttempts) {
      hint = template.hint;
    }
  }

  return {
    correct: false,
    attemptNumber,
    hint,
    message: "Incorrect. Try again.",
  };
}

// === Private helpers ===

async function buildAnswerMeta(
  type: string,
  answerId: string,
  missionId: string,
): Promise<AnswerMeta> {
  const attemptCount = await prisma.missionAnswerAttempt.count({
    where: { missionId },
  });

  if (type === "single_answer") {
    const template = await prisma.singleAnswer.findUnique({
      where: { id: answerId },
    });
    return {
      type: "single_answer",
      hintAvailable: !!template?.hint,
      hintAfterAttempts: template?.hintAfterAttempts ?? 3,
    };
  }

  return {
    type: type as AnswerMeta["type"],
    hintAvailable: false,
  };
}
