import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import { validateAnswer } from "./answer-validation.js";
import type {
  ShowtimePlayerResponse,
  ShowtimePollResponse,
  ShowtimeSlotView,
  ShowtimeSlotSubmitResponse,
  ShowtimeSyncPressResponse,
  CardDesign,
} from "@cardsight/shared";

// === Helpers ===

function buildSlotView(slot: any, houseId: string, phase: string, showHouseLabels: boolean): ShowtimeSlotView {
  const isMySlot = slot.houseId === houseId;
  const isRevealed = phase === "revealed";
  const showHouse = showHouseLabels || isMySlot || isRevealed;

  return {
    id: slot.id,
    houseId: slot.houseId,
    houseName: showHouse ? slot.house.name : "",
    houseColor: showHouse ? slot.house.color : "#666",
    label: slot.label,
    description: slot.description,
    isFilled: !!slot.filledAt,
    isMySlot,
    // Show input value for own slot always, or for all slots after reveal
    inputValue: isMySlot || isRevealed ? slot.inputValue : null,
    isCorrect: isRevealed ? slot.isCorrect : null,
    syncPressed: !!slot.syncPressedAt,
  };
}

function buildDesign(d: any): CardDesign | null {
  if (!d) return null;
  return {
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
  };
}

const slotInclude = {
  house: { select: { id: true, name: true, color: true } },
};

// === Player-facing ===

export async function getShowtimeForPlayer(
  showtimeId: string,
  houseId: string,
): Promise<ShowtimePlayerResponse> {
  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: {
      design: true,
      slots: { include: slotInclude, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!showtime) throw new AppError(404, "Showtime not found");

  const mySlot = showtime.slots.find((s: any) => s.houseId === houseId);
  if (!mySlot) throw new AppError(403, "Your house is not part of this Showtime");

  return {
    id: showtime.id,
    phase: showtime.phase,
    revealTitle: showtime.revealTitle,
    revealDescription: showtime.phase === "revealed" ? showtime.revealDescription : null,
    design: buildDesign(showtime.design),
    showHouseLabels: showtime.showHouseLabels,
    syncWindowMs: showtime.syncWindowMs,
    slots: showtime.slots.map((s: any) => buildSlotView(s, houseId, showtime.phase, showtime.showHouseLabels)),
    mySlotId: mySlot.id,
    revealedAt: showtime.revealedAt?.toISOString() ?? null,
  };
}

export async function pollShowtime(
  showtimeId: string,
  houseId: string,
): Promise<ShowtimePollResponse> {
  const st = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    select: {
      phase: true,
      revealedAt: true,
      showHouseLabels: true,
      slots: { include: slotInclude, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!st) throw new AppError(404, "Showtime not found");

  return {
    phase: st.phase,
    slots: st.slots.map((s: any) => buildSlotView(s, houseId, st.phase, st.showHouseLabels)),
    revealedAt: st.revealedAt?.toISOString() ?? null,
  };
}

export async function submitSlotValue(
  showtimeId: string,
  slotId: string,
  value: string,
): Promise<ShowtimeSlotSubmitResponse> {
  const showtime = await prisma.showtime.findUnique({
    where: { id: showtimeId },
    include: { slots: true },
  });

  if (!showtime) throw new AppError(404, "Showtime not found");
  if (showtime.phase !== "filling") {
    throw new AppError(400, "Showtime is not accepting submissions");
  }

  const slot = showtime.slots.find((s: any) => s.id === slotId);
  if (!slot) throw new AppError(404, "Slot not found");
  if (slot.filledAt) {
    return { accepted: false, isCorrect: null, message: "This slot is already filled." };
  }

  // Validate answer if template is configured — reject incorrect answers
  if (slot.answerTemplateType && slot.answerId) {
    const isCorrect = await validateAnswer(slot.answerTemplateType, slot.answerId, value);
    if (!isCorrect) {
      return { accepted: false, isCorrect: false, message: "Incorrect data — the system rejected your input." };
    }
  }

  // Answer is correct (or no validation) — fill the slot
  await prisma.showtimeSlot.update({
    where: { id: slot.id },
    data: {
      inputValue: value,
      filledAt: new Date(),
      isCorrect: true,
    },
  });

  // Check if all slots are now filled → transition to syncing
  const allFilled = showtime.slots.every(
    (s: any) => s.id === slot.id || s.filledAt !== null,
  );

  if (allFilled) {
    await prisma.showtime.update({
      where: { id: showtimeId },
      data: { phase: "syncing" },
    });
  }

  return {
    accepted: true,
    isCorrect: true,
    message: "Data received.",
  };
}

export async function recordSyncPress(
  showtimeId: string,
  houseId: string,
): Promise<ShowtimeSyncPressResponse> {
  // Use a transaction for atomicity
  return prisma.$transaction(async (tx: any) => {
    const showtime = await tx.showtime.findUnique({
      where: { id: showtimeId },
      include: { slots: true },
    });

    if (!showtime) throw new AppError(404, "Showtime not found");
    if (showtime.phase !== "syncing") {
      return { accepted: false, phase: showtime.phase, message: "Not in sync phase." };
    }

    const mySlot = showtime.slots.find((s: any) => s.houseId === houseId);
    if (!mySlot) throw new AppError(403, "Your house is not part of this Showtime");

    const now = new Date();

    // Record this press
    await tx.showtimeSlot.update({
      where: { id: mySlot.id },
      data: { syncPressedAt: now },
    });

    // Re-fetch all slots to check sync status
    const slots = await tx.showtimeSlot.findMany({
      where: { showtimeId },
    });

    // Check if all have pressed
    const allPressed = slots.every((s: any) => s.id === mySlot.id || s.syncPressedAt !== null);
    if (!allPressed) {
      return { accepted: true, phase: "syncing" as const, message: "Waiting for other houses..." };
    }

    // All pressed — check if within sync window
    const pressTimestamps = slots.map((s: any) =>
      s.id === mySlot.id ? now.getTime() : new Date(s.syncPressedAt).getTime(),
    );
    const minPress = Math.min(...pressTimestamps);
    const maxPress = Math.max(...pressTimestamps);
    const spread = maxPress - minPress;

    if (spread <= showtime.syncWindowMs) {
      // Success! Reveal!
      await tx.showtime.update({
        where: { id: showtimeId },
        data: { phase: "revealed", revealedAt: now },
      });
      return { accepted: true, phase: "revealed" as const, message: "Analysis complete!" };
    }

    // Spread too wide — reset all presses
    await tx.showtimeSlot.updateMany({
      where: { showtimeId },
      data: { syncPressedAt: null },
    });

    return {
      accepted: true,
      phase: "syncing" as const,
      message: "Synchronization failed — presses were too far apart. Try again!",
    };
  });
}
