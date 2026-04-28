import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import { pickAllowedFields } from "../../utils/pick-fields.js";
import { houseSelect } from "./prisma-includes.js";

const storySheetInclude = {
  house: { select: houseSelect },
};

export async function listStorySheets(
  gameId: string,
  filters?: { houseId?: string; act?: number },
) {
  const where: any = { gameId };
  if (filters?.houseId) where.houseId = filters.houseId;
  if (filters?.act) where.act = filters.act;

  return prisma.storySheet.findMany({
    where,
    include: storySheetInclude,
    orderBy: [{ act: "asc" }, { sortOrder: "asc" }],
  });
}

export async function getStorySheet(gameId: string, storySheetId: string) {
  const sheet = await prisma.storySheet.findUnique({
    where: { id: storySheetId },
    include: storySheetInclude,
  });
  if (!sheet || sheet.gameId !== gameId) {
    throw new AppError(404, "Story sheet not found");
  }
  return sheet;
}

export async function createStorySheet(gameId: string, data: Record<string, any>) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  return prisma.storySheet.create({
    data: {
      gameId,
      houseId: data.houseId,
      act: data.act ?? 1,
      title: data.title ?? "Story Sheet",
      content: data.content ?? "",
      notes: data.notes ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
    include: storySheetInclude,
  });
}

export async function updateStorySheet(gameId: string, storySheetId: string, data: Record<string, any>) {
  const sheet = await prisma.storySheet.findUnique({ where: { id: storySheetId } });
  if (!sheet || sheet.gameId !== gameId) {
    throw new AppError(404, "Story sheet not found");
  }

  const updateData = pickAllowedFields(data, [
    "title", "content", "notes", "act", "houseId", "sortOrder",
  ]);

  return prisma.storySheet.update({
    where: { id: storySheetId },
    data: updateData,
    include: storySheetInclude,
  });
}

export async function deleteStorySheet(gameId: string, storySheetId: string) {
  const sheet = await prisma.storySheet.findUnique({ where: { id: storySheetId } });
  if (!sheet || sheet.gameId !== gameId) {
    throw new AppError(404, "Story sheet not found");
  }
  await prisma.storySheet.delete({ where: { id: storySheetId } });
}

export async function getStorySheetPrintData(gameId: string, act: number) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const sheets = await prisma.storySheet.findMany({
    where: { gameId, act },
    include: storySheetInclude,
    orderBy: [{ sortOrder: "asc" }],
  });

  // Also fetch missions for this act to include on the print
  const missions = await prisma.mission.findMany({
    where: { gameId, act },
    include: {
      missionHouses: {
        include: { house: { select: { id: true, name: true, color: true } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return sheets.map((sheet: any) => ({
    id: sheet.id,
    house: sheet.house,
    act: sheet.act,
    title: sheet.title,
    content: sheet.content,
    missions: missions
      .filter((m: any) => m.missionHouses.some((mh: any) => mh.houseId === sheet.houseId))
      .map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        storySheetBlurb: m.storySheetBlurb,
      })),
  }));
}
