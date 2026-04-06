import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

// === Cards ===

const cardInclude = {
  design: { select: { id: true, name: true } },
  cardSet: { select: { id: true, name: true, color: true } },
  cardHouses: {
    include: {
      house: { select: { id: true, name: true, color: true } },
    },
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
  const allowed = [
    "humanCardId", "title", "description", "act",
    "cardSetId", "clueVisibleCategory", "notes",
    "designId", "answerTemplateType", "answerId", "isAnswerable",
    "lockedOut", "lockedOutReason",
    "selfDestructTimer", "selfDestructText",
    "hasEntryGate", "entryGateText", "answerVisibleAfterDestruct",
    "isFinished", "sortOrder",
  ];

  const updateData: Record<string, any> = {};
  for (const key of allowed) {
    if (key in data) {
      updateData[key] = data[key];
    }
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

  const card = await prisma.card.create({
    data: {
      gameId,
      humanCardId: data.humanCardId || "NEW",
      title: data.title || "New Card",
      description: data.description,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      ...data,
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
          data: { selfDestructedAt: null, isSolved: false },
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
      data: { selfDestructedAt: null, isSolved: false },
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
    prisma.card.updateMany({
      where: { gameId },
      data: { selfDestructedAt: null, isSolved: false },
    }),
    prisma.mission.updateMany({
      where: { gameId },
      data: { isCompleted: false, completedAt: null },
    }),
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
