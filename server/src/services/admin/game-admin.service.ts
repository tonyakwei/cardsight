import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";
import { pickAllowedFields } from "../../utils/pick-fields.js";
import {
  evaluateFinaleSelection,
  type FinaleClauseId,
  type FinaleOutcomeId,
} from "@cardsight/shared";

function buildFinaleState(game: {
  finaleOutcome: string | null;
  finaleClauseIds: string[];
}) {
  const outcomeId = (game.finaleOutcome as FinaleOutcomeId | null) ?? null;
  const clauseIds = (game.finaleClauseIds ?? []) as FinaleClauseId[];

  return {
    outcomeId,
    clauseIds,
    evaluation: evaluateFinaleSelection({ outcomeId, clauseIds }),
  };
}

// === Games ===

export async function listGames() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { cards: true } },
    },
  });

  return games.map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    status: g.status,
    currentAct: g.currentAct,
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

  const historyTimelineCardCount = await prisma.card.count({
    where: {
      gameId,
      subtype: "history",
      historyTimelineOrder: { not: null },
      deletedAt: null,
    },
  });

  return {
    id: game.id,
    name: game.name,
    description: game.description,
    status: game.status,
    currentAct: game.currentAct,
    cardCount: game._count.cards,
    designCount: game._count.designs,
    finishedCount,
    blurNudgeEnabled: game.blurNudgeEnabled,
    historyTimelineArmed: game.historyTimelineArmed,
    historyTimelineAttemptIndex: game.historyTimelineAttemptIndex,
    historyTimelineSolvedAt: game.historyTimelineSolvedAt?.toISOString() ?? null,
    historyTimelineCardCount,
    finale: buildFinaleState(game),
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
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

export async function updateFinaleSelection(
  gameId: string,
  data: { outcomeId?: FinaleOutcomeId | null; clauseIds?: FinaleClauseId[] },
) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const outcomeId =
    data.outcomeId !== undefined
      ? data.outcomeId
      : (game.finaleOutcome as FinaleOutcomeId | null) ?? null;
  const clauseIds =
    data.clauseIds !== undefined
      ? data.clauseIds
      : (game.finaleClauseIds as FinaleClauseId[]);

  const evaluation = evaluateFinaleSelection({ outcomeId, clauseIds });

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: {
      finaleOutcome: outcomeId,
      finaleClauseIds: clauseIds,
    },
  });

  return {
    outcomeId: (updated.finaleOutcome as FinaleOutcomeId | null) ?? null,
    clauseIds: updated.finaleClauseIds as FinaleClauseId[],
    evaluation,
  };
}

// === Duplicate Game ===

export async function duplicateGame(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  return prisma.$transaction(async (tx: any) => {
    const newGame = await tx.game.create({
      data: {
        name: game.name + " (Copy)",
        description: game.description,
        status: "draft",
        currentAct: 1,
        historyTimelineArmed: false,
        historyTimelineAttemptIndex: 0,
        historyTimelineSolvedAt: null,
        finaleOutcome: game.finaleOutcome,
        finaleClauseIds: game.finaleClauseIds,
        duplicatedFromId: game.id,
      },
    });

    const cardSetMap = await dupCardSets(tx, gameId, newGame.id);
    const houseMap = await dupHouses(tx, gameId, newGame.id);
    const designMap = await dupDesigns(tx, gameId, newGame.id);
    const answerMap = await dupAnswers(tx, gameId, newGame.id);
    const cardMap = await dupCards(tx, gameId, newGame.id, { cardSetMap, designMap, answerMap });
    await dupCardHouses(tx, gameId, cardMap, houseMap);
    await dupMissions(tx, gameId, newGame.id, { cardMap, houseMap, designMap, answerMap });
    await dupShowtimes(tx, gameId, newGame.id, { houseMap, designMap, answerMap });
    await dupStorySheets(tx, gameId, newGame.id, houseMap);

    return tx.game.findUnique({
      where: { id: newGame.id },
      include: { _count: { select: { cards: true, designs: true } } },
    });
  });
}

type IdMap = Map<string, string>;

function remapId(map: IdMap, id: string | null): string | null {
  return id ? map.get(id) ?? null : null;
}

async function dupCardSets(tx: any, gameId: string, newGameId: string): Promise<IdMap> {
  const old = await tx.cardSet.findMany({ where: { gameId } });
  const map = new Map<string, string>();
  for (const cs of old) {
    const n = await tx.cardSet.create({
      data: { gameId: newGameId, name: cs.name, color: cs.color, notes: cs.notes },
    });
    map.set(cs.id, n.id);
  }
  return map;
}

async function dupHouses(tx: any, gameId: string, newGameId: string): Promise<IdMap> {
  const old = await tx.house.findMany({ where: { gameId } });
  const map = new Map<string, string>();
  for (const h of old) {
    const n = await tx.house.create({
      data: { gameId: newGameId, name: h.name, slug: h.slug, color: h.color },
    });
    map.set(h.id, n.id);
  }
  return map;
}

async function dupDesigns(tx: any, gameId: string, newGameId: string): Promise<IdMap> {
  const old = await tx.design.findMany({ where: { gameId } });
  const map = new Map<string, string>();
  for (const d of old) {
    const n = await tx.design.create({
      data: {
        gameId: newGameId, name: d.name,
        bgColor: d.bgColor, bgGradient: d.bgGradient, bgImageUrl: d.bgImageUrl,
        textColor: d.textColor, accentColor: d.accentColor, secondaryColor: d.secondaryColor,
        fontFamily: d.fontFamily, cardStyle: d.cardStyle, animationIn: d.animationIn,
        borderStyle: d.borderStyle, overlayEffect: d.overlayEffect, customCss: d.customCss,
      },
    });
    map.set(d.id, n.id);
  }
  return map;
}

async function dupAnswers(tx: any, gameId: string, newGameId: string): Promise<IdMap> {
  const old = await tx.singleAnswer.findMany({ where: { gameId } });
  const map = new Map<string, string>();
  for (const a of old) {
    const n = await tx.singleAnswer.create({
      data: {
        gameId: newGameId, correctAnswer: a.correctAnswer,
        caseSensitive: a.caseSensitive, trimWhitespace: a.trimWhitespace,
        acceptAlternatives: a.acceptAlternatives,
        hint: a.hint, hintAfterAttempts: a.hintAfterAttempts,
      },
    });
    map.set(a.id, n.id);
  }
  return map;
}

async function dupCards(
  tx: any, gameId: string, newGameId: string,
  maps: { cardSetMap: IdMap; designMap: IdMap; answerMap: IdMap },
): Promise<IdMap> {
  const old = await tx.card.findMany({ where: { gameId } });
  const map = new Map<string, string>();
  for (const c of old) {
    const n = await tx.card.create({
      data: {
        gameId: newGameId, physicalCardId: c.physicalCardId, act: c.act,
        subtype: c.subtype,
        cardSetId: remapId(maps.cardSetMap, c.cardSetId),
        clueVisibleCategory: c.clueVisibleCategory, complexity: c.complexity,
        header: c.header, description: c.description, clueContent: c.clueContent,
        answerTemplateType: c.answerTemplateType,
        answerId: remapId(maps.answerMap, c.answerId),
        isAnswerable: c.isAnswerable, lockedOut: c.lockedOut, lockedOutReason: c.lockedOutReason,
        selfDestructTimer: c.selfDestructTimer, selfDestructedAt: null,
        selfDestructText: c.selfDestructText,
        designId: remapId(maps.designMap, c.designId),
        examineText: c.examineText, answerVisibleAfterDestruct: c.answerVisibleAfterDestruct,
        historyTimelineOrder: c.historyTimelineOrder,
        sortOrder: c.sortOrder, notes: c.notes, isFinished: c.isFinished,
        isSolved: false, deletedAt: null,
      },
    });
    map.set(c.id, n.id);
  }
  return map;
}

async function dupCardHouses(tx: any, gameId: string, cardMap: IdMap, houseMap: IdMap) {
  const old = await tx.cardHouse.findMany({
    where: { card: { gameId } },
  });
  const rows = old
    .filter((ch: any) => cardMap.has(ch.cardId) && houseMap.has(ch.houseId))
    .map((ch: any) => ({ cardId: cardMap.get(ch.cardId)!, houseId: houseMap.get(ch.houseId)! }));
  if (rows.length > 0) {
    await tx.cardHouse.createMany({ data: rows });
  }
}

async function dupMissions(
  tx: any, gameId: string, newGameId: string,
  maps: { cardMap: IdMap; houseMap: IdMap; designMap: IdMap; answerMap: IdMap },
) {
  const old = await tx.mission.findMany({ where: { gameId }, include: { missionHouses: true } });
  for (const m of old) {
    const n = await tx.mission.create({
      data: {
        gameId: newGameId, act: m.act,
        missionCardId: remapId(maps.cardMap, m.missionCardId),
        title: m.title,
        description: m.description, puzzleDescription: m.puzzleDescription,
        storySheetBlurb: m.storySheetBlurb,
        requiredClueSets: m.requiredClueSets ?? [],
        answerTemplateType: m.answerTemplateType,
        answerId: remapId(maps.answerMap, m.answerId),
        designId: remapId(maps.designMap, m.designId),
        isCompleted: false, completedAt: null,
        consequenceCompleted: m.consequenceCompleted,
        consequenceNotCompleted: m.consequenceNotCompleted,
        consequenceImageCompleted: m.consequenceImageCompleted,
        consequenceImageNotCompleted: m.consequenceImageNotCompleted,
        sortOrder: m.sortOrder, notes: m.notes,
      },
    });
    const houseRows = m.missionHouses
      .filter((mh: any) => maps.houseMap.has(mh.houseId))
      .map((mh: any) => ({ missionId: n.id, houseId: maps.houseMap.get(mh.houseId)! }));
    if (houseRows.length > 0) {
      await tx.missionHouse.createMany({ data: houseRows });
    }
  }
}

async function dupShowtimes(
  tx: any, gameId: string, newGameId: string,
  maps: { houseMap: IdMap; designMap: IdMap; answerMap: IdMap },
) {
  const old = await tx.showtime.findMany({ where: { gameId }, include: { slots: true } });
  for (const st of old) {
    const n = await tx.showtime.create({
      data: {
        gameId: newGameId, act: st.act, title: st.title,
        revealTitle: st.revealTitle, revealDescription: st.revealDescription,
        designId: remapId(maps.designMap, st.designId),
        phase: "filling", syncWindowMs: st.syncWindowMs, revealedAt: null,
        sortOrder: st.sortOrder, notes: st.notes,
      },
    });
    for (const slot of st.slots) {
      if (!maps.houseMap.has(slot.houseId)) continue;
      await tx.showtimeSlot.create({
        data: {
          showtimeId: n.id, houseId: maps.houseMap.get(slot.houseId)!,
          label: slot.label, description: slot.description, sortOrder: slot.sortOrder,
          answerTemplateType: slot.answerTemplateType,
          answerId: remapId(maps.answerMap, slot.answerId),
        },
      });
    }
  }
}

async function dupStorySheets(tx: any, gameId: string, newGameId: string, houseMap: IdMap) {
  const old = await tx.storySheet.findMany({ where: { gameId } });
  for (const ss of old) {
    if (!houseMap.has(ss.houseId)) continue;
    await tx.storySheet.create({
      data: {
        gameId: newGameId, houseId: houseMap.get(ss.houseId)!,
        act: ss.act, title: ss.title, content: ss.content,
        notes: ss.notes, sortOrder: ss.sortOrder,
      },
    });
  }
}

// === Game Settings ===

export async function updateGameSettings(
  gameId: string,
  data: { blurNudgeEnabled?: boolean },
) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const updateData = pickAllowedFields(data, ["blurNudgeEnabled"]);

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: updateData,
  });

  return { blurNudgeEnabled: updated.blurNudgeEnabled };
}

// Activate one game and demote any other active game to "completed".
// Enforces the one-active-at-a-time invariant the QR scan resolver relies on.
export async function setGameActive(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  await prisma.$transaction([
    prisma.game.updateMany({
      where: { status: "active", id: { not: gameId } },
      data: { status: "completed" },
    }),
    prisma.game.update({
      where: { id: gameId },
      data: { status: "active" },
    }),
  ]);

  return { id: gameId, status: "active" as const };
}

async function getConfiguredHistoryTimelineCards(gameId: string) {
  return prisma.card.findMany({
    where: {
      gameId,
      subtype: "history",
      historyTimelineOrder: { not: null },
      deletedAt: null,
    },
    select: {
      id: true,
      historyTimelineOrder: true,
    },
    orderBy: [
      { historyTimelineOrder: "asc" },
      { sortOrder: "asc" },
    ],
  });
}

function assertHistoryTimelineIsValid(cards: { id: string; historyTimelineOrder: number | null }[]) {
  if (cards.length === 0) {
    throw new AppError(400, "Configure at least one history card before arming the timeline check");
  }

  const seen = new Set<number>();
  for (const card of cards) {
    if (card.historyTimelineOrder === null) continue;
    if (seen.has(card.historyTimelineOrder)) {
      throw new AppError(400, `Duplicate history timeline order: ${card.historyTimelineOrder}`);
    }
    seen.add(card.historyTimelineOrder);
  }
}

export async function armHistoryTimeline(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");
  if (game.historyTimelineSolvedAt) {
    throw new AppError(409, "History timeline already solved. Reset it before arming again.");
  }

  const cards = await getConfiguredHistoryTimelineCards(gameId);
  assertHistoryTimelineIsValid(cards);

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: {
      historyTimelineArmed: true,
      historyTimelineAttemptIndex: 0,
    },
  });

  return {
    armed: updated.historyTimelineArmed,
    attemptIndex: updated.historyTimelineAttemptIndex,
    solvedAt: updated.historyTimelineSolvedAt?.toISOString() ?? null,
    cardCount: cards.length,
  };
}

export async function resetHistoryTimeline(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: {
      historyTimelineArmed: false,
      historyTimelineAttemptIndex: 0,
      historyTimelineSolvedAt: null,
    },
  });

  const cards = await getConfiguredHistoryTimelineCards(gameId);

  return {
    armed: updated.historyTimelineArmed,
    attemptIndex: updated.historyTimelineAttemptIndex,
    solvedAt: updated.historyTimelineSolvedAt?.toISOString() ?? null,
    cardCount: cards.length,
  };
}

// === Act Transitions ===

export async function transitionAct(gameId: string, fromAct: number) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const toAct = fromAct + 1;

  // 1. Lock/unlock cards
  await prisma.$transaction([
    prisma.card.updateMany({
      where: { gameId, act: fromAct, deletedAt: null },
      data: { lockedOut: true, lockedOutReason: `Act ${fromAct} has ended.` },
    }),
    prisma.card.updateMany({
      where: { gameId, act: toAct, deletedAt: null },
      data: { lockedOut: false, lockedOutReason: null },
    }),
  ]);

  // 2. Evaluate consequences for ending act missions
  const missions = await prisma.mission.findMany({
    where: { gameId, act: fromAct },
    include: {
      missionHouses: true,
      consequencesAsSource: {
        include: {
          targetMission: { select: { id: true, title: true } },
        },
      },
    },
  });

  const triggeredRecords: any[] = [];

  for (const mission of missions) {
    for (const mh of mission.missionHouses) {
      const completed = mission.isCompleted;
      for (const consequence of mission.consequencesAsSource) {
        const shouldTrigger =
          (completed && consequence.triggerOnSuccess) ||
          (!completed && consequence.triggerOnFailure);

        if (!shouldTrigger) continue;

        // Create the triggered consequence record
        const triggered = await prisma.triggeredConsequence.create({
          data: {
            gameId,
            consequenceId: consequence.id,
            houseId: mh.houseId,
            triggeredAtAct: fromAct,
          },
          include: {
            consequence: {
              include: {
                sourceMission: { select: { id: true, title: true } },
                targetMission: { select: { id: true, title: true } },
              },
            },
            house: { select: { id: true, name: true, color: true } },
          },
        });

        // Apply lock consequences immediately
        if (consequence.type === "lock" && consequence.targetMissionId) {
          await prisma.mission.update({
            where: { id: consequence.targetMissionId },
            data: {
              lockedOut: true,
              lockedOutReason: consequence.message,
            },
          });
        }

        triggeredRecords.push({
          id: triggered.id,
          consequenceId: triggered.consequenceId,
          consequence: {
            type: triggered.consequence.type,
            message: triggered.consequence.message,
            sourceMission: triggered.consequence.sourceMission,
            targetMission: triggered.consequence.targetMission,
          },
          house: triggered.house,
          triggeredAtAct: triggered.triggeredAtAct,
          triggeredAt: triggered.triggeredAt.toISOString(),
        });
      }
    }
  }

  // 3. Update game's current act
  await prisma.game.update({
    where: { id: gameId },
    data: { currentAct: toAct },
  });

  // 4. Count affected cards
  const [locked, unlocked] = await Promise.all([
    prisma.card.count({ where: { gameId, act: fromAct, lockedOut: true, deletedAt: null } }),
    prisma.card.count({ where: { gameId, act: toAct, lockedOut: false, deletedAt: null } }),
  ]);

  return {
    fromAct,
    toAct,
    cardsLocked: locked,
    cardsUnlocked: unlocked,
    triggeredConsequences: triggeredRecords,
  };
}

// === Answer Templates ===

export async function createAnswerTemplate(gameId: string, type: string, data: Record<string, any>) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  if (type === "single_answer") {
    return prisma.singleAnswer.create({
      data: {
        gameId,
        correctAnswer: data.correctAnswer ?? "",
        caseSensitive: data.caseSensitive ?? false,
        trimWhitespace: data.trimWhitespace ?? true,
        acceptAlternatives: data.acceptAlternatives ?? [],
        hint: data.hint ?? null,
        hintAfterAttempts: data.hintAfterAttempts ?? 3,
        maxAttempts: data.maxAttempts ?? null,
      },
    });
  }

  if (type === "multiple_text") {
    return prisma.multipleAnswer.create({
      data: {
        gameId,
        fields: data.fields ?? [],
        hint: data.hint ?? null,
        hintAfterAttempts: data.hintAfterAttempts ?? 3,
        maxAttempts: data.maxAttempts ?? null,
      },
    });
  }

  throw new AppError(400, `Unknown answer template type: ${type}`);
}

export async function updateAnswerTemplate(gameId: string, type: string, id: string, data: Record<string, any>) {
  if (type === "single_answer") {
    const template = await prisma.singleAnswer.findUnique({ where: { id } });
    if (!template || template.gameId !== gameId) {
      throw new AppError(404, "Answer template not found");
    }

    const updateData = pickAllowedFields(data, [
      "correctAnswer", "caseSensitive", "trimWhitespace",
      "acceptAlternatives", "hint", "hintAfterAttempts", "maxAttempts",
    ]);

    return prisma.singleAnswer.update({ where: { id }, data: updateData });
  }

  if (type === "multiple_text") {
    const template = await prisma.multipleAnswer.findUnique({ where: { id } });
    if (!template || template.gameId !== gameId) {
      throw new AppError(404, "Answer template not found");
    }

    const updateData = pickAllowedFields(data, [
      "fields", "hint", "hintAfterAttempts", "maxAttempts",
    ]);

    return prisma.multipleAnswer.update({ where: { id }, data: updateData });
  }

  throw new AppError(400, `Unknown answer template type: ${type}`);
}

export async function getAnswerTemplate(gameId: string, type: string, id: string) {
  if (type === "single_answer") {
    const template = await prisma.singleAnswer.findUnique({ where: { id } });
    if (!template || template.gameId !== gameId) {
      throw new AppError(404, "Answer template not found");
    }
    return template;
  }

  if (type === "multiple_text") {
    const template = await prisma.multipleAnswer.findUnique({ where: { id } });
    if (!template || template.gameId !== gameId) {
      throw new AppError(404, "Answer template not found");
    }
    return template;
  }

  throw new AppError(400, `Unknown answer template type: ${type}`);
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
  if (type === "multiple_text") {
    return prisma.multipleAnswer.findMany({
      where: { gameId },
      orderBy: { createdAt: "desc" },
    });
  }
  return [];
}
