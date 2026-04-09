import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error-handler.js";

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

  return prisma.$transaction(async (tx: any) => {
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
          complexity: c.complexity,
          title: c.title,
          description: c.description,
          clueContent: c.clueContent,
          answerTemplateType: c.answerTemplateType,
          answerId: c.answerId ? answerMap.get(c.answerId) ?? null : null,
          isAnswerable: c.isAnswerable,
          lockedOut: c.lockedOut,
          lockedOutReason: c.lockedOutReason,
          selfDestructTimer: c.selfDestructTimer,
          selfDestructedAt: null,
          selfDestructText: c.selfDestructText,
          designId: c.designId ? designMap.get(c.designId) ?? null : null,
          examineText: c.examineText,
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
      where: { cardId: { in: oldCards.map((c: any) => c.id) } },
    });
    if (oldCardHouses.length > 0) {
      await tx.cardHouse.createMany({
        data: oldCardHouses
          .filter((ch: any) => cardMap.has(ch.cardId) && houseMap.has(ch.houseId))
          .map((ch: any) => ({
            cardId: cardMap.get(ch.cardId)!,
            houseId: houseMap.get(ch.houseId)!,
          })),
      });
    }

    // 8. Duplicate Missions
    const oldMissions = await tx.mission.findMany({
      where: { gameId },
      include: { missionHouses: true },
    });
    for (const m of oldMissions) {
      const newMission = await tx.mission.create({
        data: {
          gameId: newGame.id,
          act: m.act,
          missionCardId: m.missionCardId ? cardMap.get(m.missionCardId) ?? null : null,
          title: m.title,
          description: m.description,
          puzzleDescription: m.puzzleDescription,
          requiredClueSets: m.requiredClueSets ?? [],
          answerTemplateType: m.answerTemplateType,
          answerId: m.answerId ? answerMap.get(m.answerId) ?? null : null,
          designId: m.designId ? designMap.get(m.designId) ?? null : null,
          isCompleted: false,
          completedAt: null,
          consequenceCompleted: m.consequenceCompleted,
          consequenceNotCompleted: m.consequenceNotCompleted,
          consequenceImageCompleted: m.consequenceImageCompleted,
          consequenceImageNotCompleted: m.consequenceImageNotCompleted,
          mechanicalEffectCompleted: m.mechanicalEffectCompleted ?? undefined,
          mechanicalEffectNotCompleted: m.mechanicalEffectNotCompleted ?? undefined,
          sortOrder: m.sortOrder,
          notes: m.notes,
        },
      });
      if (m.missionHouses.length > 0) {
        await tx.missionHouse.createMany({
          data: m.missionHouses
            .filter((mh: any) => houseMap.has(mh.houseId))
            .map((mh: any) => ({
              missionId: newMission.id,
              houseId: houseMap.get(mh.houseId)!,
            })),
        });
      }
    }

    // 9. Duplicate Showtimes
    const oldShowtimes = await tx.showtime.findMany({
      where: { gameId },
      include: { slots: true },
    });
    for (const st of oldShowtimes) {
      const newSt = await tx.showtime.create({
        data: {
          gameId: newGame.id,
          act: st.act,
          title: st.title,
          revealTitle: st.revealTitle,
          revealDescription: st.revealDescription,
          designId: st.designId ? designMap.get(st.designId) ?? null : null,
          phase: "filling",
          syncWindowMs: st.syncWindowMs,
          revealedAt: null,
          sortOrder: st.sortOrder,
          notes: st.notes,
        },
      });
      for (const slot of st.slots) {
        if (!houseMap.has(slot.houseId)) continue;
        await tx.showtimeSlot.create({
          data: {
            showtimeId: newSt.id,
            houseId: houseMap.get(slot.houseId)!,
            label: slot.label,
            description: slot.description,
            sortOrder: slot.sortOrder,
            answerTemplateType: slot.answerTemplateType,
            answerId: slot.answerId ? answerMap.get(slot.answerId) ?? null : null,
          },
        });
      }
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

// === Act Transitions ===

export async function transitionAct(gameId: string, fromAct: number) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  const toAct = fromAct + 1;

  await prisma.$transaction([
    // Lock all cards in the current act
    prisma.card.updateMany({
      where: { gameId, act: fromAct, deletedAt: null },
      data: { lockedOut: true, lockedOutReason: `Act ${fromAct} has ended.` },
    }),
    // Unlock cards in the next act
    prisma.card.updateMany({
      where: { gameId, act: toAct, deletedAt: null },
      data: { lockedOut: false, lockedOutReason: null },
    }),
  ]);

  // Count affected cards
  const [locked, unlocked] = await Promise.all([
    prisma.card.count({ where: { gameId, act: fromAct, lockedOut: true, deletedAt: null } }),
    prisma.card.count({ where: { gameId, act: toAct, lockedOut: false, deletedAt: null } }),
  ]);

  return { fromAct, toAct, cardsLocked: locked, cardsUnlocked: unlocked };
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

  throw new AppError(400, `Unknown answer template type: ${type}`);
}

export async function updateAnswerTemplate(gameId: string, type: string, id: string, data: Record<string, any>) {
  if (type === "single_answer") {
    const template = await prisma.singleAnswer.findUnique({ where: { id } });
    if (!template || template.gameId !== gameId) {
      throw new AppError(404, "Answer template not found");
    }

    const allowed = [
      "correctAnswer", "caseSensitive", "trimWhitespace",
      "acceptAlternatives", "hint", "hintAfterAttempts", "maxAttempts",
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowed) {
      if (key in data) updateData[key] = data[key];
    }

    return prisma.singleAnswer.update({ where: { id }, data: updateData });
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
  return [];
}
