import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

// === Missions ===

const missionInclude = {
  missionHouses: {
    include: {
      house: { select: { id: true, name: true, color: true } },
    },
  },
  missionCard: { select: { id: true, humanCardId: true, title: true } },
  design: { select: { id: true, name: true } },
};

export async function listMissions(
  gameId: string,
  filters?: { houseId?: string; act?: number },
) {
  const where: any = { gameId };
  if (filters?.act) where.act = filters.act;

  let missions = await prisma.mission.findMany({
    where,
    include: missionInclude,
    orderBy: [{ act: "asc" }, { sortOrder: "asc" }],
  });

  if (filters?.houseId) {
    missions = missions.filter((m: any) =>
      m.missionHouses.some((mh: any) => mh.houseId === filters.houseId),
    );
  }

  return missions;
}

export async function getMission(gameId: string, missionId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: missionInclude,
  });
  if (!mission || mission.gameId !== gameId) {
    throw new AppError(404, "Mission not found");
  }
  return mission;
}

export async function createMission(gameId: string, data: Record<string, any>) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const houseIds: string[] = data.houseIds ?? [];
  delete data.houseIds;

  const maxSort = await prisma.mission.aggregate({
    where: { gameId },
    _max: { sortOrder: true },
  });

  const allowed = [
    "act", "title", "description", "puzzleDescription", "missionCardId",
    "requiredClueSets", "answerTemplateType", "answerId", "designId",
    "consequenceCompleted", "consequenceNotCompleted",
    "consequenceImageCompleted", "consequenceImageNotCompleted",
    "mechanicalEffectCompleted", "mechanicalEffectNotCompleted",
    "sortOrder", "notes",
  ];

  const createData: Record<string, any> = { gameId };
  for (const key of allowed) {
    if (key in data) createData[key] = data[key];
  }
  if (!("sortOrder" in data)) {
    createData.sortOrder = (maxSort._max.sortOrder ?? 0) + 1;
  }
  if (!("title" in data)) createData.title = "New Mission";
  if (!("description" in data)) createData.description = "";
  if (!("act" in data)) createData.act = 1;

  const mission = await prisma.mission.create({ data: createData as any });

  if (houseIds.length > 0) {
    await prisma.missionHouse.createMany({
      data: houseIds.map((houseId) => ({ missionId: mission.id, houseId })),
    });
  }

  return prisma.mission.findUnique({
    where: { id: mission.id },
    include: missionInclude,
  });
}

export async function updateMission(gameId: string, missionId: string, data: Record<string, any>) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.gameId !== gameId) {
    throw new AppError(404, "Mission not found");
  }

  const houseIds: string[] | undefined = data.houseIds;
  delete data.houseIds;

  const allowed = [
    "act", "title", "description", "puzzleDescription", "missionCardId",
    "requiredClueSets", "answerTemplateType", "answerId", "designId",
    "isCompleted", "completedAt", "lockedOut", "lockedOutReason",
    "consequenceCompleted", "consequenceNotCompleted",
    "consequenceImageCompleted", "consequenceImageNotCompleted",
    "mechanicalEffectCompleted", "mechanicalEffectNotCompleted",
    "sortOrder", "notes",
  ];

  const updateData: Record<string, any> = {};
  for (const key of allowed) {
    if (key in data) updateData[key] = data[key];
  }

  // If marking as completed, set completedAt
  if (data.isCompleted === true && !mission.isCompleted) {
    updateData.completedAt = new Date();
  } else if (data.isCompleted === false) {
    updateData.completedAt = null;
  }

  await prisma.mission.update({ where: { id: missionId }, data: updateData });

  if (houseIds !== undefined) {
    await prisma.missionHouse.deleteMany({ where: { missionId } });
    if (houseIds.length > 0) {
      await prisma.missionHouse.createMany({
        data: houseIds.map((houseId) => ({ missionId, houseId })),
      });
    }
  }

  return prisma.mission.findUnique({
    where: { id: missionId },
    include: missionInclude,
  });
}

export async function deleteMission(gameId: string, missionId: string) {
  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission || mission.gameId !== gameId) {
    throw new AppError(404, "Mission not found");
  }
  await prisma.mission.delete({ where: { id: missionId } });
}

export async function getActBreakSummary(gameId: string, act: number) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const houses = await prisma.house.findMany({
    where: { gameId },
    orderBy: { name: "asc" },
  });

  const missions = await prisma.mission.findMany({
    where: { gameId, act },
    include: missionInclude,
    orderBy: { sortOrder: "asc" },
  });

  return houses.map((house: any) => {
    const houseMissions = missions.filter((m: any) =>
      m.missionHouses.some((mh: any) => mh.houseId === house.id),
    );

    return {
      house: { id: house.id, name: house.name, color: house.color },
      missions: houseMissions.map((m: any) => ({
        id: m.id,
        title: m.title,
        isCompleted: m.isCompleted,
        completedAt: m.completedAt?.toISOString() ?? null,
        consequence: m.isCompleted
          ? m.consequenceCompleted
          : m.consequenceNotCompleted,
        consequenceImage: m.isCompleted
          ? m.consequenceImageCompleted
          : m.consequenceImageNotCompleted,
        mechanicalEffect: m.isCompleted
          ? m.mechanicalEffectCompleted
          : m.mechanicalEffectNotCompleted,
      })),
      completedCount: houseMissions.filter((m: any) => m.isCompleted).length,
      totalCount: houseMissions.length,
    };
  });
}
