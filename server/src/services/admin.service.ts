import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";

// === Games ===

export async function listGames() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { cards: true } },
    },
  });

  return games.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    status: g.status,
    cardCount: g._count.cards,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }));
}

export async function getGame(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      _count: { select: { cards: true, designs: true } },
    },
  });

  if (!game) throw new AppError(404, "Game not found");

  const finishedCount = await prisma.card.count({
    where: { gameId, isFinished: true },
  });

  return {
    id: game.id,
    name: game.name,
    description: game.description,
    status: game.status,
    cardCount: game._count.cards,
    designCount: game._count.designs,
    finishedCount,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

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

// === Card Sets ===

export async function listCardSets(gameId: string) {
  const sets = await prisma.cardSet.findMany({
    where: { gameId },
    include: {
      _count: { select: { cards: true } },
      setReviews: { select: { reviewedAt: true } },
    },
    orderBy: { name: "asc" },
  });

  const result = [];
  for (const set of sets) {
    const reviewedAt = set.setReviews[0]?.reviewedAt ?? null;

    let modifiedSinceReview = set._count.cards;
    if (reviewedAt) {
      modifiedSinceReview = await prisma.card.count({
        where: {
          gameId,
          cardSetId: set.id,
          updatedAt: { gt: reviewedAt },
        },
      });
    }

    result.push({
      id: set.id,
      name: set.name,
      color: set.color,
      notes: set.notes,
      cardCount: set._count.cards,
      reviewedAt: reviewedAt?.toISOString() ?? null,
      modifiedSinceReview,
    });
  }

  return result;
}

export async function createCardSet(gameId: string, data: { name: string; color?: string; notes?: string }) {
  return prisma.cardSet.create({
    data: {
      gameId,
      name: data.name,
      color: data.color ?? "#8b5cf6",
      notes: data.notes,
    },
  });
}

export async function updateCardSet(gameId: string, id: string, data: Record<string, any>) {
  const set = await prisma.cardSet.findUnique({ where: { id } });
  if (!set || set.gameId !== gameId) throw new AppError(404, "Card set not found");

  const allowed = ["name", "color", "notes"];
  const updateData: Record<string, any> = {};
  for (const key of allowed) {
    if (key in data) updateData[key] = data[key];
  }

  return prisma.cardSet.update({ where: { id }, data: updateData });
}

export async function reviewCardSet(gameId: string, cardSetId: string) {
  return prisma.setReview.upsert({
    where: {
      gameId_cardSetId: { gameId, cardSetId },
    },
    create: {
      gameId,
      cardSetId,
      reviewedAt: new Date(),
    },
    update: {
      reviewedAt: new Date(),
    },
  });
}

// === Houses ===

export async function listHouses(gameId: string) {
  return prisma.house.findMany({
    where: { gameId },
    include: { _count: { select: { cards: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createHouse(gameId: string, data: { name: string; color?: string }) {
  return prisma.house.create({
    data: {
      gameId,
      name: data.name,
      color: data.color ?? "#3b82f6",
    },
  });
}

export async function updateHouse(gameId: string, id: string, data: Record<string, any>) {
  const house = await prisma.house.findUnique({ where: { id } });
  if (!house || house.gameId !== gameId) throw new AppError(404, "House not found");

  const allowed = ["name", "color"];
  const updateData: Record<string, any> = {};
  for (const key of allowed) {
    if (key in data) updateData[key] = data[key];
  }

  return prisma.house.update({ where: { id }, data: updateData });
}

// === Simulator ===

export async function getSimulatorData(gameId: string) {
  const houses = await prisma.house.findMany({
    where: { gameId },
    orderBy: { name: "asc" },
  });

  const cards = await prisma.card.findMany({
    where: { gameId, deletedAt: null },
    include: {
      cardSet: { select: { id: true, name: true, color: true } },
      cardHouses: {
        include: { house: { select: { id: true, name: true, color: true } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return { houses, cards };
}

export async function saveTableAssignments(
  gameId: string,
  assignments: { cardId: string; tableHouseId: string | null }[],
) {
  await prisma.$transaction(
    assignments.map((a) =>
      prisma.card.update({
        where: { id: a.cardId },
        data: { tableHouseId: a.tableHouseId },
      }),
    ),
  );
}

export async function autoDistribute(gameId: string, act: number) {
  const houses = await prisma.house.findMany({
    where: { gameId },
    orderBy: { name: "asc" },
  });

  if (houses.length === 0) throw new AppError(400, "No houses to distribute to");

  const cards = await prisma.card.findMany({
    where: { gameId, act, deletedAt: null },
    orderBy: { sortOrder: "asc" },
  });

  // Fisher-Yates shuffle
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Round-robin deal
  const assignments = shuffled.map((card, i) => ({
    cardId: card.id,
    tableHouseId: houses[i % houses.length].id,
  }));

  await prisma.$transaction(
    assignments.map((a) =>
      prisma.card.update({
        where: { id: a.cardId },
        data: { tableHouseId: a.tableHouseId },
      }),
    ),
  );

  return assignments;
}

// === Designs (read-only) ===

export async function listDesigns(gameId: string) {
  return prisma.design.findMany({
    where: { gameId },
    orderBy: { name: "asc" },
  });
}

// === Answers (read-only) ===

export async function listAnswerTemplates(gameId: string, type: string) {
  if (type === "single_answer") {
    return prisma.singleAnswer.findMany({
      where: { gameId },
      orderBy: { createdAt: "desc" },
    });
  }
  return [];
}

// === Create Game ===

export async function createGame(data: { name: string; description?: string }) {
  return prisma.game.create({
    data: {
      name: data.name,
      description: data.description,
      status: "draft",
    },
    include: {
      _count: { select: { cards: true, designs: true } },
    },
  });
}

// === Duplicate Game ===

export async function duplicateGame(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  return prisma.$transaction(async (tx) => {
    // 1. Create the new game
    const newGame = await tx.game.create({
      data: {
        name: game.name + " (Copy)",
        description: game.description,
        status: "draft",
        duplicatedFromId: game.id,
      },
    });

    // 2. Duplicate CardSets
    const oldCardSets = await tx.cardSet.findMany({ where: { gameId } });
    const cardSetMap = new Map<string, string>();
    for (const cs of oldCardSets) {
      const newCS = await tx.cardSet.create({
        data: {
          gameId: newGame.id,
          name: cs.name,
          color: cs.color,
          notes: cs.notes,
        },
      });
      cardSetMap.set(cs.id, newCS.id);
    }

    // 3. Duplicate Houses
    const oldHouses = await tx.house.findMany({ where: { gameId } });
    const houseMap = new Map<string, string>();
    for (const h of oldHouses) {
      const newH = await tx.house.create({
        data: {
          gameId: newGame.id,
          name: h.name,
          color: h.color,
        },
      });
      houseMap.set(h.id, newH.id);
    }

    // 4. Duplicate Designs
    const oldDesigns = await tx.design.findMany({ where: { gameId } });
    const designMap = new Map<string, string>();
    for (const d of oldDesigns) {
      const newD = await tx.design.create({
        data: {
          gameId: newGame.id,
          name: d.name,
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
        },
      });
      designMap.set(d.id, newD.id);
    }

    // 5. Duplicate SingleAnswers
    const oldAnswers = await tx.singleAnswer.findMany({ where: { gameId } });
    const answerMap = new Map<string, string>();
    for (const a of oldAnswers) {
      const newA = await tx.singleAnswer.create({
        data: {
          gameId: newGame.id,
          correctAnswer: a.correctAnswer,
          caseSensitive: a.caseSensitive,
          trimWhitespace: a.trimWhitespace,
          acceptAlternatives: a.acceptAlternatives,
          hint: a.hint,
          hintAfterAttempts: a.hintAfterAttempts,
        },
      });
      answerMap.set(a.id, newA.id);
    }

    // 6. Duplicate Cards
    const oldCards = await tx.card.findMany({ where: { gameId } });
    const cardMap = new Map<string, string>();
    for (const c of oldCards) {
      const newCard = await tx.card.create({
        data: {
          gameId: newGame.id,
          humanCardId: c.humanCardId,
          act: c.act,
          cardSetId: c.cardSetId ? cardSetMap.get(c.cardSetId) ?? null : null,
          clueVisibleCategory: c.clueVisibleCategory,
          title: c.title,
          description: c.description,
          answerTemplateType: c.answerTemplateType,
          answerId: c.answerId ? answerMap.get(c.answerId) ?? null : null,
          isAnswerable: c.isAnswerable,
          lockedOut: c.lockedOut,
          lockedOutReason: c.lockedOutReason,
          selfDestructTimer: c.selfDestructTimer,
          selfDestructedAt: null,
          selfDestructText: c.selfDestructText,
          designId: c.designId ? designMap.get(c.designId) ?? null : null,
          hasEntryGate: c.hasEntryGate,
          entryGateText: c.entryGateText,
          answerVisibleAfterDestruct: c.answerVisibleAfterDestruct,
          sortOrder: c.sortOrder,
          notes: c.notes,
          isFinished: c.isFinished,
          isSolved: false,
          deletedAt: null,
        },
      });
      cardMap.set(c.id, newCard.id);
    }

    // 7. Duplicate CardHouse rows
    const oldCardHouses = await tx.cardHouse.findMany({
      where: { cardId: { in: oldCards.map((c) => c.id) } },
    });
    if (oldCardHouses.length > 0) {
      await tx.cardHouse.createMany({
        data: oldCardHouses
          .filter((ch) => cardMap.has(ch.cardId) && houseMap.has(ch.houseId))
          .map((ch) => ({
            cardId: cardMap.get(ch.cardId)!,
            houseId: houseMap.get(ch.houseId)!,
          })),
      });
    }

    // Return the full new game
    return tx.game.findUnique({
      where: { id: newGame.id },
      include: {
        _count: { select: { cards: true, designs: true } },
      },
    });
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
    prisma.scanEvent.deleteMany({ where: { gameId } }),
    prisma.answerAttempt.deleteMany({ where: { gameId } }),
  ]);

  return prisma.card.findMany({
    where: { gameId },
    include: cardInclude,
    orderBy: { sortOrder: "asc" },
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
