import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import { pickAllowedFields } from "../../utils/pick-fields.js";

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

  const updateData = pickAllowedFields(data, ["name", "color"]);

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
    assignments.map((a: any) =>
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
  const assignments = shuffled.map((card: any, i: number) => ({
    cardId: card.id,
    tableHouseId: houses[i % houses.length].id,
  }));

  await prisma.$transaction(
    assignments.map((a: any) =>
      prisma.card.update({
        where: { id: a.cardId },
        data: { tableHouseId: a.tableHouseId },
      }),
    ),
  );

  return assignments;
}
