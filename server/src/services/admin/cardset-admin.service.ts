import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import { pickAllowedFields } from "../../utils/pick-fields.js";

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

  // Count modified cards since review — parallelized instead of sequential
  const reviewedSets = sets.filter((s) => s.setReviews[0]?.reviewedAt);
  const modifiedCounts = new Map<string, number>();

  if (reviewedSets.length > 0) {
    const counts = await Promise.all(
      reviewedSets.map((s) =>
        prisma.card.count({
          where: { gameId, cardSetId: s.id, updatedAt: { gt: s.setReviews[0].reviewedAt } },
        }).then((count) => ({ id: s.id, count })),
      ),
    );
    for (const { id, count } of counts) modifiedCounts.set(id, count);
  }

  return sets.map((set) => {
    const reviewedAt = set.setReviews[0]?.reviewedAt ?? null;
    return {
      id: set.id,
      name: set.name,
      color: set.color,
      notes: set.notes,
      cardCount: set._count.cards,
      reviewedAt: reviewedAt?.toISOString() ?? null,
      modifiedSinceReview: reviewedAt
        ? modifiedCounts.get(set.id) ?? 0
        : set._count.cards,
    };
  });
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

  const updateData = pickAllowedFields(data, ["name", "color", "notes"]);

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
