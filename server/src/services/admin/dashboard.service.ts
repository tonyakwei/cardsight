import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

// === Live Dashboard ===

export async function getDashboard(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const currentAct = game.currentAct;

  // Run all queries in parallel — overview/discovery scoped to current act
  const [
    totalCards,
    historyTimelineCardCount,
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
    // Total non-deleted cards in current act
    prisma.card.count({ where: { gameId, act: currentAct, deletedAt: null } }),

    prisma.card.count({
      where: {
        gameId,
        subtype: "history",
        historyTimelineOrder: { not: null },
        deletedAt: null,
      },
    }),

    // Distinct cards in current act that have been scanned
    prisma.scanEvent.findMany({
      where: { gameId, card: { act: currentAct } },
      distinct: ["cardId"],
      select: { cardId: true },
    }),

    // Total scan count for current act
    prisma.scanEvent.count({ where: { gameId, card: { act: currentAct } } }),

    // Total answer attempts for current act
    prisma.answerAttempt.count({ where: { gameId, card: { act: currentAct } } }),

    // Correct answer attempts for current act
    prisma.answerAttempt.count({ where: { gameId, card: { act: currentAct }, isCorrect: true } }),

    // Recent scans (last 20, all acts for activity feed)
    prisma.scanEvent.findMany({
      where: { gameId },
      orderBy: { scannedAt: "desc" },
      take: 20,
      include: {
        card: { select: { physicalCardId: true, header: true, cardSetId: true, act: true } },
        house: { select: { id: true, name: true, color: true } },
      },
    }),

    // Recent answer attempts (last 20, all acts for activity feed)
    prisma.answerAttempt.findMany({
      where: { gameId },
      orderBy: { attemptedAt: "desc" },
      take: 20,
      include: {
        card: { select: { physicalCardId: true, header: true, cardSetId: true, act: true } },
        house: { select: { id: true, name: true, color: true } },
      },
    }),

    // Cards grouped by set (for discovery tracking, current act only)
    prisma.card.findMany({
      where: { gameId, act: currentAct, deletedAt: null },
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

    // Missions with house info (all acts for big-picture view)
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
      act: s.card.act,
      house: s.house ? { id: s.house.id, name: s.house.name, color: s.house.color } : null,
    })),
    ...recentAnswers.map((a: any) => ({
      type: "answer" as const,
      at: a.attemptedAt.toISOString(),
      cardId: a.card.physicalCardId,
      cardTitle: a.card.header,
      isCorrect: a.isCorrect,
      attemptNumber: a.attemptNumber,
      act: a.card.act,
      house: a.house ? { id: a.house.id, name: a.house.name, color: a.house.color } : null,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 30);

  // Per-house scan + answer aggregates (current act)
  const [houseScanGroups, houseAnswerGroups] = await Promise.all([
    prisma.scanEvent.groupBy({
      by: ["houseId"],
      where: { gameId, card: { act: currentAct }, houseId: { not: null } },
      _count: { _all: true },
    }),
    prisma.answerAttempt.groupBy({
      by: ["houseId"],
      where: { gameId, card: { act: currentAct }, isCorrect: true, houseId: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const scanByHouse = new Map(
    houseScanGroups.map((g: any) => [g.houseId as string, g._count._all as number]),
  );
  const correctByHouse = new Map(
    houseAnswerGroups.map((g: any) => [g.houseId as string, g._count._all as number]),
  );
  const houseScans = houses.map((h: any) => ({
    house: { id: h.id, name: h.name, color: h.color },
    scans: scanByHouse.get(h.id) ?? 0,
    correctAnswers: correctByHouse.get(h.id) ?? 0,
  }));

  return {
    currentAct,
    historyTimeline: {
      cardCount: historyTimelineCardCount,
      armed: game.historyTimelineArmed,
      attemptIndex: game.historyTimelineAttemptIndex,
      solvedAt: game.historyTimelineSolvedAt?.toISOString() ?? null,
    },
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
    houseScans,
  };
}

// === Audio Feed ===
//
// Returns answer events newer than the given cursor, used by the ambient
// audio page to play sounds when houses succeed or fail at puzzles. Skips
// scan events (too dense for ambient sonification).

export type AudioFeedEvent = {
  id: string;
  type: "card_correct" | "card_incorrect" | "mission_correct" | "mission_incorrect";
  at: string;
  house: { id: string; name: string; color: string } | null;
};

export async function getAudioFeed(gameId: string, since: Date | null) {
  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });
  if (!game) throw new AppError(404, "Game not found");

  const whereTime = since ? { gt: since } : undefined;

  const [cardAttempts, missionAttempts, gameHouses] = await Promise.all([
    prisma.answerAttempt.findMany({
      where: { gameId, ...(whereTime ? { attemptedAt: whereTime } : {}) },
      orderBy: { attemptedAt: "asc" },
      take: 50,
      include: { house: { select: { id: true, name: true, color: true } } },
    }),
    prisma.missionAnswerAttempt.findMany({
      where: { gameId, ...(whereTime ? { attemptedAt: whereTime } : {}) },
      orderBy: { attemptedAt: "asc" },
      take: 50,
    }),
    prisma.house.findMany({
      where: { gameId },
      select: { id: true, name: true, color: true },
    }),
  ]);

  const houseById = new Map(gameHouses.map((h: any) => [h.id, h]));

  const events: AudioFeedEvent[] = [
    ...cardAttempts.map((a: any) => ({
      id: a.id as string,
      type: (a.isCorrect ? "card_correct" : "card_incorrect") as AudioFeedEvent["type"],
      at: a.attemptedAt.toISOString(),
      house: a.house ? { id: a.house.id, name: a.house.name, color: a.house.color } : null,
    })),
    ...missionAttempts.map((a: any) => {
      const h = a.houseId ? houseById.get(a.houseId) : null;
      return {
        id: a.id as string,
        type: (a.isCorrect ? "mission_correct" : "mission_incorrect") as AudioFeedEvent["type"],
        at: a.attemptedAt.toISOString(),
        house: h ? { id: h.id, name: h.name, color: h.color } : null,
      };
    }),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const cursor =
    events.length > 0
      ? events[events.length - 1].at
      : since?.toISOString() ?? new Date().toISOString();

  return { cursor, events };
}
