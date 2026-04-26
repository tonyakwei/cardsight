import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import { pickAllowedFields } from "../../utils/pick-fields.js";
import { houseSelect, designSelect } from "./prisma-includes.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const physicalCards: { id: string; name: string; color: string; number: number }[] = require("../../../../shared/physical-cards.json");

const ALL_PHYSICAL_IDS = physicalCards.map((pc) => pc.id);

async function assertUniqueHistoryTimelineOrder(
  gameId: string,
  historyTimelineOrder: number | null | undefined,
  excludingCardId?: string,
) {
  if (historyTimelineOrder === null || historyTimelineOrder === undefined) return;

  const existing = await prisma.card.findFirst({
    where: {
      gameId,
      subtype: "history",
      historyTimelineOrder,
      deletedAt: null,
      ...(excludingCardId ? { id: { not: excludingCardId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(400, `History timeline order ${historyTimelineOrder} is already in use`);
  }
}

// === Cards ===

const cardInclude = {
  design: { select: designSelect },
  cardSet: { select: houseSelect },
  cardHouses: {
    include: { house: { select: houseSelect } },
  },
};

export async function listCards(
  gameId: string,
  filters?: { cardSetId?: string; act?: number; isFinished?: boolean; showDeleted?: boolean },
) {
  const where: any = { gameId };
  if (!filters?.showDeleted) where.deletedAt = null;
  if (filters?.cardSetId) where.cardSetId = filters.cardSetId;
  if (filters?.act) where.act = filters.act;
  if (filters?.isFinished !== undefined) where.isFinished = filters.isFinished;

  return prisma.card.findMany({
    where,
    include: cardInclude,
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCard(gameId: string, cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: cardInclude,
  });

  if (!card || card.gameId !== gameId) {
    throw new AppError(404, "Card not found");
  }

  return card;
}

export async function updateCard(gameId: string, cardId: string, data: Record<string, any>) {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card || card.gameId !== gameId) {
    throw new AppError(404, "Card not found");
  }

  // Handle houseIds separately
  const houseIds: string[] | undefined = data.houseIds;

  // Filter to only allowed scalar fields
  const updateData = pickAllowedFields(data, [
    "physicalCardId", "header", "description", "clueContent", "complexity", "act",
    "cardSetId", "clueVisibleCategory", "notes", "subtype", "historyTimelineOrder",
    "designId", "answerTemplateType", "answerId", "isAnswerable",
    "lockedOut", "lockedOutReason",
    "selfDestructTimer", "selfDestructText",
    "examineText", "answerVisibleAfterDestruct",
    "isFinished", "sortOrder",
  ]);

  const nextSubtype = updateData.subtype ?? card.subtype;
  if (nextSubtype !== "history") {
    updateData.historyTimelineOrder = null;
  } else {
    await assertUniqueHistoryTimelineOrder(
      gameId,
      updateData.historyTimelineOrder ?? card.historyTimelineOrder,
      cardId,
    );
  }

  // Update card fields
  await prisma.card.update({
    where: { id: cardId },
    data: updateData,
  });

  // Update house assignments if provided
  if (houseIds !== undefined) {
    // Delete all existing
    await prisma.cardHouse.deleteMany({ where: { cardId } });
    // Create new
    if (houseIds.length > 0) {
      await prisma.cardHouse.createMany({
        data: houseIds.map((houseId) => ({ cardId, houseId })),
      });
    }
  }

  // Return full card with includes
  return prisma.card.findUnique({
    where: { id: cardId },
    include: cardInclude,
  });
}

export async function createCard(gameId: string, data: Record<string, any>) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const maxSort = await prisma.card.aggregate({
    where: { gameId },
    _max: { sortOrder: true },
  });

  const houseIds: string[] = data.houseIds ?? [];
  delete data.houseIds;

  // Auto-assign a random unused physical card if not provided (scoped to act)
  const act: number = data.act ?? 1;
  let physicalCardId = data.physicalCardId;
  if (!physicalCardId) {
    physicalCardId = await pickRandomPhysicalCardId(gameId, act);
  }
  delete data.physicalCardId;

  const scalarData = pickAllowedFields(data, [
    "header", "description", "clueContent", "complexity", "act",
    "cardSetId", "clueVisibleCategory", "notes", "subtype", "historyTimelineOrder",
    "designId", "answerTemplateType", "answerId", "isAnswerable",
    "lockedOut", "lockedOutReason",
    "selfDestructTimer", "selfDestructText",
    "examineText", "answerVisibleAfterDestruct",
    "isFinished", "sortOrder",
  ]);

  const subtype = scalarData.subtype ?? "standard";
  const historyTimelineOrder =
    subtype === "history" ? scalarData.historyTimelineOrder ?? null : null;

  if (subtype === "history") {
    await assertUniqueHistoryTimelineOrder(gameId, historyTimelineOrder);
  }

  const card = await prisma.card.create({
    data: {
      gameId,
      physicalCardId,
      header: scalarData.header ?? null,
      description: scalarData.description,
      subtype,
      historyTimelineOrder,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      ...scalarData,
    },
  });

  // Assign houses
  if (houseIds.length > 0) {
    await prisma.cardHouse.createMany({
      data: houseIds.map((houseId) => ({ cardId: card.id, houseId })),
    });
  }

  return prisma.card.findUnique({
    where: { id: card.id },
    include: cardInclude,
  });
}

// === Soft Delete / Restore ===

export async function softDeleteCard(gameId: string, cardId: string) {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card || card.gameId !== gameId) {
    throw new AppError(404, "Card not found");
  }

  return prisma.card.update({
    where: { id: cardId },
    data: { deletedAt: new Date() },
    include: cardInclude,
  });
}

export async function restoreCard(gameId: string, cardId: string) {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card || card.gameId !== gameId) {
    throw new AppError(404, "Card not found");
  }

  return prisma.card.update({
    where: { id: cardId },
    data: { deletedAt: null },
    include: cardInclude,
  });
}

// === Reorder Cards ===

export async function reorderCards(gameId: string, cardIds: string[]) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  await prisma.$transaction(
    cardIds.map((id, index) =>
      prisma.card.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  return prisma.card.findMany({
    where: { gameId },
    include: cardInclude,
    orderBy: { sortOrder: "asc" },
  });
}

// === Bulk Operations ===

export async function bulkOperation(
  gameId: string,
  cardIds: string[],
  action: string,
  value?: any,
) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const cardWhere = { id: { in: cardIds }, gameId };

  switch (action) {
    case "assignDesign":
      await prisma.card.updateMany({ where: cardWhere, data: { designId: value } });
      break;
    case "assignCardSet":
      await prisma.card.updateMany({ where: cardWhere, data: { cardSetId: value ?? null } });
      break;
    case "setAct":
      await prisma.card.updateMany({ where: cardWhere, data: { act: value ?? null } });
      break;
    case "lock":
      await prisma.card.updateMany({ where: cardWhere, data: { lockedOut: true } });
      break;
    case "unlock":
      await prisma.card.updateMany({ where: cardWhere, data: { lockedOut: false } });
      break;
    case "markFinished":
      await prisma.card.updateMany({ where: cardWhere, data: { isFinished: true } });
      break;
    case "markUnfinished":
      await prisma.card.updateMany({ where: cardWhere, data: { isFinished: false } });
      break;
    case "delete":
      await prisma.card.updateMany({ where: cardWhere, data: { deletedAt: new Date() } });
      break;
    case "resetRuntime":
      await prisma.$transaction([
        prisma.card.updateMany({
          where: cardWhere,
          data: { examinedAt: null, selfDestructedAt: null, isSolved: false },
        }),
        prisma.scanEvent.deleteMany({ where: { cardId: { in: cardIds }, gameId } }),
        prisma.answerAttempt.deleteMany({ where: { cardId: { in: cardIds }, gameId } }),
      ]);
      break;
    default:
      throw new AppError(400, `Unknown bulk action: ${action}`);
  }

  return prisma.card.findMany({
    where: { id: { in: cardIds } },
    include: cardInclude,
    orderBy: { sortOrder: "asc" },
  });
}

// === Reset Card Runtime ===

export async function resetCard(gameId: string, cardId: string) {
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card || card.gameId !== gameId) {
    throw new AppError(404, "Card not found");
  }

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: { examinedAt: null, selfDestructedAt: null, isSolved: false },
    }),
    prisma.scanEvent.deleteMany({ where: { cardId } }),
    prisma.answerAttempt.deleteMany({ where: { cardId } }),
  ]);

  return prisma.card.findUnique({
    where: { id: cardId },
    include: cardInclude,
  });
}

export async function resetAllCards(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  await prisma.$transaction([
    prisma.game.update({
      where: { id: gameId },
      data: {
        historyTimelineArmed: false,
        historyTimelineAttemptIndex: 0,
        historyTimelineSolvedAt: null,
      },
    }),
    prisma.card.updateMany({
      where: { gameId },
      data: { examinedAt: null, selfDestructedAt: null, isSolved: false },
    }),
    prisma.triggeredConsequence.deleteMany({ where: { gameId } }),
    prisma.mission.updateMany({
      where: { gameId },
      data: { isCompleted: false, completedAt: null, lockedOut: false, lockedOutReason: null },
    }),
    prisma.missionScanEvent.deleteMany({ where: { gameId } }),
    prisma.missionAnswerAttempt.deleteMany({ where: { gameId } }),
    prisma.showtimeSlot.updateMany({
      where: { showtime: { gameId } },
      data: { inputValue: null, filledAt: null, isCorrect: null, syncPressedAt: null },
    }),
    prisma.showtime.updateMany({
      where: { gameId },
      data: { phase: "filling", revealedAt: null },
    }),
    prisma.scanEvent.deleteMany({ where: { gameId } }),
    prisma.answerAttempt.deleteMany({ where: { gameId } }),
  ]);

  return prisma.card.findMany({
    where: { gameId },
    include: cardInclude,
    orderBy: { sortOrder: "asc" },
  });
}

// === Physical Card Helpers ===

async function getUsedPhysicalIds(gameId: string, act: number): Promise<Set<string>> {
  const existing = await prisma.card.findMany({
    where: { gameId, act },
    select: { physicalCardId: true },
  });
  return new Set(existing.map((c) => c.physicalCardId));
}

async function pickRandomPhysicalCardId(gameId: string, act: number): Promise<string> {
  const used = await getUsedPhysicalIds(gameId, act);
  const available = ALL_PHYSICAL_IDS.filter((id) => !used.has(id));
  if (available.length === 0) {
    throw new AppError(400, `All 54 physical cards are already assigned in act ${act}`);
  }
  return available[Math.floor(Math.random() * available.length)];
}

export async function randomizePhysicalCards(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const cards = await prisma.card.findMany({
    where: { gameId, deletedAt: null },
    select: { id: true, act: true },
    orderBy: { sortOrder: "asc" },
  });

  // Group by act and shuffle independently per act
  const byAct = new Map<number, { id: string }[]>();
  for (const card of cards) {
    const group = byAct.get(card.act) ?? [];
    group.push(card);
    byAct.set(card.act, group);
  }

  const updates: ReturnType<typeof prisma.card.update>[] = [];
  for (const [act, actCards] of byAct) {
    if (actCards.length > ALL_PHYSICAL_IDS.length) {
      throw new AppError(400, `Act ${act} has ${actCards.length} cards but only ${ALL_PHYSICAL_IDS.length} physical cards exist`);
    }
    // Fisher-Yates shuffle
    const shuffled = [...ALL_PHYSICAL_IDS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 0; i < actCards.length; i++) {
      updates.push(
        prisma.card.update({
          where: { id: actCards[i].id },
          data: { physicalCardId: shuffled[i] },
        }),
      );
    }
  }

  await prisma.$transaction(updates);

  return prisma.card.findMany({
    where: { gameId, deletedAt: null },
    include: cardInclude,
    orderBy: { sortOrder: "asc" },
  });
}
