import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

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
