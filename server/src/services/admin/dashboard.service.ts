import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

// === Live Dashboard ===

export async function getDashboard(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  // Run all queries in parallel
  const [
    totalCards,
    scannedCardIds,
    totalScans,
    totalAttempts,
    correctAttempts,
    recentScans,
    recentAnswers,
    cardsBySet,
    houses,
    missions,
  ] = await Promise.all([
    // Total non-deleted cards
    prisma.card.count({ where: { gameId, deletedAt: null } }),

    // Distinct cards that have been scanned
    prisma.scanEvent.findMany({
      where: { gameId },
      distinct: ["cardId"],
      select: { cardId: true },
    }),

    // Total scan count
    prisma.scanEvent.count({ where: { gameId } }),

    // Total answer attempts
    prisma.answerAttempt.count({ where: { gameId } }),

    // Correct answer attempts
    prisma.answerAttempt.count({ where: { gameId, isCorrect: true } }),

    // Recent scans (last 20)
    prisma.scanEvent.findMany({
      where: { gameId },
      orderBy: { scannedAt: "desc" },
      take: 20,
      include: {
        card: { select: { physicalCardId: true, header: true, cardSetId: true } },
      },
    }),

    // Recent answer attempts (last 20)
    prisma.answerAttempt.findMany({
      where: { gameId },
      orderBy: { attemptedAt: "desc" },
      take: 20,
      include: {
        card: { select: { physicalCardId: true, header: true, cardSetId: true } },
      },
    }),

    // Cards grouped by set (for discovery tracking)
    prisma.card.findMany({
      where: { gameId, deletedAt: null },
      select: {
        id: true,
        physicalCardId: true,
        header: true,
        cardSetId: true,
        cardSet: { select: { id: true, name: true, color: true } },
        isSolved: true,
        _count: { select: { scanEvents: true } },
      },
      orderBy: { sortOrder: "asc" },
    }),

    // Houses
    prisma.house.findMany({
      where: { gameId },
      orderBy: { name: "asc" },
    }),

    // Missions with house info
    prisma.mission.findMany({
      where: { gameId },
      include: {
        missionHouses: {
          include: {
            house: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: [{ act: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const scannedSet = new Set(scannedCardIds.map((s: any) => s.cardId));

  // Build card discovery by set
  const setMap = new Map<string | null, {
    setId: string | null;
    setName: string;
    setColor: string;
    total: number;
    scanned: number;
    solved: number;
  }>();

  for (const card of cardsBySet) {
    const key = card.cardSetId;
    if (!setMap.has(key)) {
      setMap.set(key, {
        setId: key,
        setName: card.cardSet?.name ?? "(No set)",
        setColor: card.cardSet?.color ?? "#666",
        total: 0,
        scanned: 0,
        solved: 0,
      });
    }
    const entry = setMap.get(key)!;
    entry.total++;
    if (scannedSet.has(card.id)) entry.scanned++;
    if (card.isSolved) entry.solved++;
  }

  // Build mission progress by house
  const missionsByHouse = houses.map((house: any) => {
    const houseMissions = missions.filter((m: any) =>
      m.missionHouses.some((mh: any) => mh.houseId === house.id),
    );
    return {
      house: { id: house.id, name: house.name, color: house.color },
      total: houseMissions.length,
      completed: houseMissions.filter((m: any) => m.isCompleted).length,
      missions: houseMissions.map((m: any) => ({
        id: m.id,
        title: m.title,
        act: m.act,
        isCompleted: m.isCompleted,
      })),
    };
  });

  // Merge and sort recent activity
  const activity = [
    ...recentScans.map((s: any) => ({
      type: "scan" as const,
      at: s.scannedAt.toISOString(),
      cardId: s.card.physicalCardId,
      cardTitle: s.card.header,
    })),
    ...recentAnswers.map((a: any) => ({
      type: "answer" as const,
      at: a.attemptedAt.toISOString(),
      cardId: a.card.physicalCardId,
      cardTitle: a.card.header,
      isCorrect: a.isCorrect,
      attemptNumber: a.attemptNumber,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 30);

  return {
    overview: {
      totalCards,
      cardsScanned: scannedSet.size,
      totalScans,
      totalAttempts,
      correctAttempts,
    },
    cardDiscovery: [...setMap.values()],
    activity,
    missionProgress: missionsByHouse,
  };
}
