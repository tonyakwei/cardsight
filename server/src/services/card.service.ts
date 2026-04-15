import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import { validateAnswer } from "./answer-validation.js";
import { buildDesign } from "./design-builder.js";
import type {
  CardViewerResponse,
  CardComplexity,
  AnswerMeta,
  ScanResponse,
  ExamineResponse,
  AnswerResponse,
} from "@cardsight/shared";

/**
 * Resolve a cardId that may be either a game card UUID or a physical card UUID.
 * Tries game card ID first (for admin QR preview), then resolves physical card
 * UUID via the active game's current act.
 */
async function resolveCard<T>(
  cardId: string,
  query: (id: string) => Promise<T | null>,
): Promise<T> {
  // 1. Try as game card ID (direct DB lookup)
  const byId = await query(cardId);
  if (byId) return byId;

  // 2. Try as physical card UUID — find the active game
  const activeGame = await prisma.game.findFirst({
    where: { status: "active" },
    select: { id: true, currentAct: true },
  });

  if (!activeGame) {
    throw new AppError(404, "Card not found");
  }

  // Look up the card for the current act
  const byPhysical = await prisma.card.findFirst({
    where: {
      physicalCardId: cardId,
      gameId: activeGame.id,
      act: activeGame.currentAct,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (byPhysical) {
    return (await query(byPhysical.id))!;
  }

  // Check if card exists in a different act (wrong act scan)
  const inOtherAct = await prisma.card.findFirst({
    where: {
      physicalCardId: cardId,
      gameId: activeGame.id,
      deletedAt: null,
    },
    select: { act: true },
  });

  if (inOtherAct) {
    throw new AppError(410, "This card is not active in the current act");
  }

  throw new AppError(404, "Card not found");
}

export async function getCardForViewer(
  cardId: string,
): Promise<CardViewerResponse> {
  const card = await resolveCard(cardId, (id) =>
    prisma.card.findUnique({
      where: { id },
      include: { design: true },
    }),
  );

  // Determine card status
  let status: CardViewerResponse["status"] = "available";

  if (card.lockedOut) {
    status = "locked_out";
  } else if (
    card.selfDestructedAt &&
    new Date() > new Date(card.selfDestructedAt)
  ) {
    status = "self_destructed";
  } else if (card.isSolved) {
    status = "answered";
  }

  // Build design object
  const design = buildDesign(card.design);

  // Build answer metadata (without revealing correct answers)
  // Complex cards are always answerable; simple cards never show answer input
  // Show answer meta when available, OR when self-destructed but answer should remain visible
  let answerMeta: AnswerMeta | null = null;
  const isComplex = card.complexity === "complex";
  const isAnswerable = isComplex && card.isAnswerable;
  const showAnswer =
    status === "available" ||
    (status === "self_destructed" && card.answerVisibleAfterDestruct);

  if (isAnswerable && card.answerTemplateType && card.answerId && showAnswer) {
    answerMeta = await buildAnswerMeta(
      card.answerTemplateType,
      card.answerId,
      cardId,
    );
  }

  // For complex cards that are solved, reveal the clueContent
  const clueContent = (isComplex && card.isSolved) ? card.clueContent : null;

  return {
    id: card.id,
    header: card.header,
    description:
      status === "self_destructed" ? null : card.description,
    clueVisibleCategory: card.clueVisibleCategory,
    complexity: card.complexity as CardComplexity,
    clueContent,
    act: card.act,
    design,
    status,
    lockedOutReason: card.lockedOutReason,
    selfDestructText:
      card.selfDestructText ??
      "This card's information is no longer available.",
    selfDestructedAt: card.selfDestructedAt?.toISOString() ?? null,
    selfDestructTimer: card.selfDestructTimer,
    isExamined: card.examinedAt !== null,
    examinedAt: card.examinedAt?.toISOString() ?? null,
    examineText: card.examineText,
    isAnswerable,
    answerTemplateType: card.answerTemplateType,
    answerMeta,
    answerVisibleAfterDestruct: card.answerVisibleAfterDestruct,
    isSolved: card.isSolved,
  };
}

export async function recordScan(
  cardId: string,
  sessionHash?: string,
  userAgent?: string,
): Promise<ScanResponse> {
  const card = await resolveCard(cardId, (id) =>
    prisma.card.findUnique({
      where: { id },
      select: {
        id: true,
        gameId: true,
        selfDestructTimer: true,
        selfDestructedAt: true,
      },
    }),
  );

  // Log the scan event
  await prisma.scanEvent.create({
    data: {
      cardId: card.id,
      gameId: card.gameId,
      sessionHash,
      userAgent,
    },
  });

  return {
    selfDestructedAt: card.selfDestructedAt?.toISOString() ?? null,
    alreadyScanned: card.selfDestructedAt !== null,
  };
}

export async function examineCard(
  cardId: string,
): Promise<ExamineResponse> {
  const card = await resolveCard(cardId, (id) =>
    prisma.card.findUnique({
      where: { id },
      select: {
        id: true,
        examinedAt: true,
        selfDestructTimer: true,
        selfDestructedAt: true,
      },
    }),
  );

  const updateData: Record<string, any> = {};

  // Mark as examined if not already
  if (!card.examinedAt) {
    updateData.examinedAt = new Date();
  }

  // Initialize self-destruct timer on examine (not on scan)
  let selfDestructedAt = card.selfDestructedAt;
  if (card.selfDestructTimer && !card.selfDestructedAt) {
    selfDestructedAt = new Date(
      Date.now() + card.selfDestructTimer * 1000,
    );
    updateData.selfDestructedAt = selfDestructedAt;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.card.update({
      where: { id: card.id },
      data: updateData,
    });
  }

  return {
    selfDestructedAt: selfDestructedAt?.toISOString() ?? null,
  };
}

export async function checkAnswer(
  cardId: string,
  answer: string | string[] | Record<string, string>,
  sessionHash?: string,
): Promise<AnswerResponse> {
  const card = await resolveCard(cardId, (id) =>
    prisma.card.findUnique({
      where: { id },
      select: {
        id: true,
        gameId: true,
        isAnswerable: true,
        isSolved: true,
        answerTemplateType: true,
        answerId: true,
        lockedOut: true,
      },
    }),
  );

  if (!card.isAnswerable || !card.answerTemplateType || !card.answerId) {
    throw new AppError(400, "This card does not accept answers");
  }

  if (card.lockedOut) {
    throw new AppError(403, "This card is locked");
  }

  if (card.isSolved) {
    return {
      correct: true,
      attemptNumber: 0,
      hint: null,
      lockedOut: false,
      message: "This puzzle has already been solved!",
    };
  }

  // Count previous attempts for this card
  const previousAttempts = await prisma.answerAttempt.count({
    where: { cardId: card.id },
  });

  const attemptNumber = previousAttempts + 1;

  // Check the answer based on template type
  const correct = await validateAnswer(
    card.answerTemplateType,
    card.answerId,
    answer,
  );

  // Get most recent scan for timing
  const lastScan = await prisma.scanEvent.findFirst({
    where: { cardId: card.id },
    orderBy: { scannedAt: "desc" },
  });

  const timeSinceScanMs = lastScan
    ? Date.now() - lastScan.scannedAt.getTime()
    : null;

  // Log the attempt
  await prisma.answerAttempt.create({
    data: {
      cardId: card.id,
      gameId: card.gameId,
      attemptNumber,
      answerGiven: typeof answer === "string" ? answer : JSON.parse(JSON.stringify(answer)),
      isCorrect: correct,
      timeSinceScanMs,
      sessionHash,
    },
  });

  // If correct, mark card as solved + auto-complete any linked mission
  if (correct) {
    await prisma.card.update({
      where: { id: card.id },
      data: { isSolved: true },
    });

    // Check if this card is a mission card and auto-complete the mission
    await prisma.mission.updateMany({
      where: {
        missionCardId: card.id,
        isCompleted: false,
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return {
      correct: true,
      attemptNumber,
      hint: null,
      lockedOut: false,
      message: "Correct!",
    };
  }

  // Check if we should show a hint or lock out
  let hint: string | null = null;
  let lockedOut = false;
  if (card.answerTemplateType === "single_answer") {
    const template = await prisma.singleAnswer.findUnique({
      where: { id: card.answerId },
    });
    if (
      template?.hint &&
      attemptNumber >= template.hintAfterAttempts
    ) {
      hint = template.hint;
    }

    // Lock out if max attempts reached
    if (template?.maxAttempts && attemptNumber >= template.maxAttempts) {
      await prisma.card.update({
        where: { id: card.id },
        data: { lockedOut: true, lockedOutReason: "Too many incorrect attempts." },
      });
      lockedOut = true;
    }
  }

  return {
    correct: false,
    attemptNumber,
    hint,
    lockedOut,
    message: lockedOut ? "Too many attempts. This card is now locked." : "Incorrect. Try again.",
  };
}

// === Private helpers ===

async function buildAnswerMeta(
  type: string,
  answerId: string,
  cardId: string,
): Promise<AnswerMeta> {
  const attemptCount = await prisma.answerAttempt.count({
    where: { cardId },
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

  // Default fallback for types not yet implemented
  return {
    type: type as AnswerMeta["type"],
    hintAvailable: false,
  };
}

// validateAnswer is imported from ./answer-validation.ts
