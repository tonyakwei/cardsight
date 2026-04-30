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
  HistoryTimelineScanResult,
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
      include: {
        design: true,
        game: {
          select: {
            blurNudgeEnabled: true,
            historyTimelineArmed: true,
            historyTimelineSolvedAt: true,
          },
        },
      },
    }),
  );

  const isHistoryCard = card.subtype === "history";
  const isReferenceCard = card.subtype === "reference";
  const isDirectViewCard = isHistoryCard || isReferenceCard;
  const historyTimelineTotalCards = isHistoryCard
    ? await prisma.card.count({
      where: {
        gameId: card.gameId,
        subtype: "history",
        historyTimelineOrder: { not: null },
        deletedAt: null,
      },
    })
    : 0;

  // Determine card status
  let status: CardViewerResponse["status"] = "available";

  if (card.lockedOut) {
    status = "locked_out";
  } else if (
    !isDirectViewCard &&
    card.selfDestructedAt &&
    new Date() > new Date(card.selfDestructedAt)
  ) {
    status = "self_destructed";
  } else if (!isDirectViewCard && card.isSolved) {
    status = "answered";
  }

  // Build design object
  const design = buildDesign(card.design);

  // Build answer metadata (without revealing correct answers)
  // Complex cards are always answerable; simple cards never show answer input
  // Show answer meta when available, OR when self-destructed but answer should remain visible
  let answerMeta: AnswerMeta | null = null;
  const isComplex = card.complexity === "complex";
  const isAnswerable = !isDirectViewCard && isComplex && card.isAnswerable;
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
  const clueContent = !isDirectViewCard && isComplex && card.isSolved ? card.clueContent : null;

  return {
    id: card.id,
    header: card.header,
    description:
      status === "self_destructed" ? null : card.description,
    clueVisibleCategory: card.clueVisibleCategory,
    complexity: card.complexity as CardComplexity,
    subtype: card.subtype,
    clueContent,
    act: card.act,
    design,
    status,
    lockedOutReason: card.lockedOutReason,
    selfDestructText:
      card.selfDestructText ??
      "This card's information is no longer available.",
    selfDestructedAt: isDirectViewCard ? null : card.selfDestructedAt?.toISOString() ?? null,
    selfDestructTimer: isDirectViewCard ? null : card.selfDestructTimer,
    isExamined: isDirectViewCard || card.examinedAt !== null,
    examinedAt: card.examinedAt?.toISOString() ?? null,
    examineText: card.examineText,
    isAnswerable,
    answerTemplateType: isDirectViewCard ? null : card.answerTemplateType,
    answerMeta,
    answerVisibleAfterDestruct: isDirectViewCard ? false : card.answerVisibleAfterDestruct,
    isSolved: card.isSolved,
    blurNudgeEnabled: card.game.blurNudgeEnabled,
    historyTimeline: isHistoryCard
      ? {
        order: card.historyTimelineOrder,
        totalCards: historyTimelineTotalCards,
        isArmed: card.game.historyTimelineArmed,
        isSolved: card.game.historyTimelineSolvedAt !== null,
      }
      : null,
  };
}

/**
 * Era-grouped timeline verification: cards are split into 3 equal-size eras
 * (Discovery / Dependency / Consent). The scan attempt must produce the cards
 * in era order — but the order within an era is up to the players. Re-scanning
 * a card already submitted in this attempt is treated as a fail.
 */
function eraOf(order: number, totalCards: number): number {
  if (totalCards <= 0) return 0;
  return Math.floor(((order - 1) * 3) / totalCards);
}

async function getHistoryTimelineResult(
  gameId: string,
  cardId: string,
  historyTimelineOrder: number | null,
): Promise<HistoryTimelineScanResult | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      historyTimelineArmed: true,
      historyTimelineAttemptIndex: true,
      historyTimelineAttemptedCardIds: true,
      historyTimelineSolvedAt: true,
    },
  });

  if (!game || !game.historyTimelineArmed || historyTimelineOrder === null) {
    return null;
  }

  const orderedCards = await prisma.card.findMany({
    where: {
      gameId,
      subtype: "history",
      historyTimelineOrder: { not: null },
      deletedAt: null,
    },
    select: {
      id: true,
      historyTimelineOrder: true,
    },
    orderBy: [
      { historyTimelineOrder: "asc" },
      { sortOrder: "asc" },
    ],
  });

  const totalCards = orderedCards.length;
  const expectedIndex = game.historyTimelineAttemptIndex;
  const attemptedIds = new Set(game.historyTimelineAttemptedCardIds);

  if (totalCards === 0 || expectedIndex >= totalCards) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        historyTimelineArmed: false,
        historyTimelineAttemptIndex: 0,
        historyTimelineAttemptedCardIds: [],
      },
    });
    return {
      result: "failed",
      currentIndex: 0,
      totalCards,
      expectedOrder: 1,
      message: "Timeline configuration is invalid.",
    };
  }

  // Reject re-scanning a card already submitted in the current attempt.
  if (attemptedIds.has(cardId)) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        historyTimelineArmed: false,
        historyTimelineAttemptIndex: 0,
        historyTimelineAttemptedCardIds: [],
      },
    });
    return {
      result: "failed",
      currentIndex: expectedIndex,
      totalCards,
      expectedOrder: expectedIndex + 1,
      message: "History chronology failed. The host must re-arm the check.",
    };
  }

  const expectedEra = eraOf(expectedIndex + 1, totalCards);
  const scannedEra = eraOf(historyTimelineOrder, totalCards);

  if (scannedEra !== expectedEra) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        historyTimelineArmed: false,
        historyTimelineAttemptIndex: 0,
        historyTimelineAttemptedCardIds: [],
      },
    });
    return {
      result: "failed",
      currentIndex: expectedIndex,
      totalCards,
      expectedOrder: expectedIndex + 1,
      message: "History chronology failed. The host must re-arm the check.",
    };
  }

  const nextIndex = expectedIndex + 1;
  const nextAttempted = [...game.historyTimelineAttemptedCardIds, cardId];

  if (nextIndex >= totalCards) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        historyTimelineArmed: false,
        historyTimelineAttemptIndex: 0,
        historyTimelineAttemptedCardIds: [],
        historyTimelineSolvedAt: new Date(),
      },
    });
    return {
      result: "solved",
      currentIndex: totalCards,
      totalCards,
      expectedOrder: nextIndex,
      message: "HISTORY VERIFIED",
    };
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      historyTimelineAttemptIndex: nextIndex,
      historyTimelineAttemptedCardIds: nextAttempted,
    },
  });

  return {
    result: "correct",
    currentIndex: nextIndex,
    totalCards,
    expectedOrder: nextIndex,
    message: "History fragment verified.",
  };
}

export async function recordScan(
  cardId: string,
  sessionHash?: string,
  userAgent?: string,
  houseId?: string,
): Promise<ScanResponse> {
  const card = await resolveCard(cardId, (id) =>
    prisma.card.findUnique({
      where: { id },
      select: {
        id: true,
        gameId: true,
        subtype: true,
        historyTimelineOrder: true,
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
      houseId: houseId ?? null,
      sessionHash,
      userAgent,
    },
  });

  const historyTimeline =
    card.subtype === "history"
      ? await getHistoryTimelineResult(card.gameId, card.id, card.historyTimelineOrder)
      : null;

  return {
    selfDestructedAt: card.selfDestructedAt?.toISOString() ?? null,
    alreadyScanned: card.selfDestructedAt !== null,
    historyTimeline,
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
  houseId?: string,
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
  const validation = await validateAnswer(
    card.answerTemplateType,
    card.answerId,
    answer,
  );
  const correct = validation.correct;
  const fieldResults = validation.fieldResults;

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
      houseId: houseId ?? null,
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
      fieldResults,
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
  } else if (card.answerTemplateType === "multiple_text") {
    const template = await prisma.multipleAnswer.findUnique({
      where: { id: card.answerId },
    });
    if (template?.hint && attemptNumber >= template.hintAfterAttempts) {
      hint = template.hint;
    }
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
    fieldResults,
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

  if (type === "multiple_text") {
    const template = await prisma.multipleAnswer.findUnique({
      where: { id: answerId },
    });
    const fields = (template?.fields as unknown as { prompt?: string | null }[]) ?? [];
    return {
      type: "multiple_text",
      labels: fields.map((f) => f.prompt ?? ""),
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
