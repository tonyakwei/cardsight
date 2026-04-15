import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import { pickAllowedFields } from "../../utils/pick-fields.js";
import { houseSelect, designSelect } from "./prisma-includes.js";

// === Showtimes ===

const showtimeInclude = {
  design: { select: designSelect },
  slots: {
    include: { house: { select: houseSelect } },
    orderBy: { sortOrder: "asc" as const },
  },
};

export async function listShowtimes(gameId: string) {
  return prisma.showtime.findMany({
    where: { gameId },
    include: showtimeInclude,
    orderBy: [{ act: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getShowtime(gameId: string, showtimeId: string) {
  const st = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: showtimeInclude,
  });
  if (!st || st.gameId !== gameId) throw new AppError(404, "Showtime not found");
  return st;
}

export async function createShowtime(gameId: string, data: Record<string, any>) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const houses = await prisma.house.findMany({
    where: { gameId },
    orderBy: { name: "asc" },
  });

  const maxSort = await prisma.mission.aggregate({
    where: { gameId },
    _max: { sortOrder: true },
  });

  const showtime = await prisma.showtime.create({
    data: {
      gameId,
      act: data.act ?? 1,
      title: data.title ?? "New Showtime",
      revealTitle: data.revealTitle ?? "Analysis Complete",
      revealDescription: data.revealDescription ?? null,
      designId: data.designId ?? null,
      syncWindowMs: data.syncWindowMs ?? 3000,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      notes: data.notes ?? null,
    },
  });

  // Auto-create one slot per house
  for (let i = 0; i < houses.length; i++) {
    await prisma.showtimeSlot.create({
      data: {
        showtimeId: showtime.id,
        houseId: houses[i].id,
        label: `${houses[i].name} Analysis`,
        sortOrder: i,
      },
    });
  }

  return prisma.showtime.findUnique({
    where: { id: showtime.id },
    include: showtimeInclude,
  });
}

export async function updateShowtime(gameId: string, showtimeId: string, data: Record<string, any>) {
  const st = await prisma.showtime.findUnique({ where: { id: showtimeId } });
  if (!st || st.gameId !== gameId) throw new AppError(404, "Showtime not found");

  const updateData = pickAllowedFields(data, [
    "act", "title", "revealTitle", "revealDescription",
    "designId", "showHouseLabels", "syncWindowMs", "sortOrder", "notes",
  ]);

  await prisma.showtime.update({ where: { id: showtimeId }, data: updateData });

  // Update slots if provided
  if (data.slots && Array.isArray(data.slots)) {
    for (const slotData of data.slots) {
      if (!slotData.id) continue;
      const slotUpdate = pickAllowedFields(slotData, [
        "label", "description", "answerTemplateType", "answerId", "sortOrder",
      ]);
      await prisma.showtimeSlot.update({ where: { id: slotData.id }, data: slotUpdate });
    }
  }

  return prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: showtimeInclude,
  });
}

export async function deleteShowtime(gameId: string, showtimeId: string) {
  const st = await prisma.showtime.findUnique({ where: { id: showtimeId } });
  if (!st || st.gameId !== gameId) throw new AppError(404, "Showtime not found");
  await prisma.showtime.delete({ where: { id: showtimeId } });
}

export async function triggerShowtime(gameId: string, showtimeId: string) {
  const st = await prisma.showtime.findUnique({ where: { id: showtimeId } });
  if (!st || st.gameId !== gameId) throw new AppError(404, "Showtime not found");

  return prisma.showtime.update({
    where: { id: showtimeId },
    data: { phase: "revealed", revealedAt: new Date() },
    include: showtimeInclude,
  });
}

export async function resetShowtime(gameId: string, showtimeId: string) {
  const st = await prisma.showtime.findUnique({ where: { id: showtimeId } });
  if (!st || st.gameId !== gameId) throw new AppError(404, "Showtime not found");

  await prisma.$transaction([
    prisma.showtimeSlot.updateMany({
      where: { showtimeId },
      data: { inputValue: null, filledAt: null, isCorrect: null, syncPressedAt: null },
    }),
    prisma.showtime.update({
      where: { id: showtimeId },
      data: { phase: "filling", revealedAt: null },
    }),
  ]);

  return prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: showtimeInclude,
  });
}
