import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import type { Prisma } from "@prisma/client";
import type {
  EventTimerDisplayMode,
  EventTimerDisplayPayload,
  EventTimerState,
} from "@cardsight/shared";

const DAY_DURATION_MS: Record<number, number> = {
  1: 35 * 60 * 1000,
  2: 35 * 60 * 1000,
  3: 35 * 60 * 1000,
};

function computeRemainingMs(
  timer: { status: string; remainingMs: number; statusChangedAt: Date },
  now: Date,
): number {
  if (timer.status === "paused") return timer.remainingMs;
  const elapsed = now.getTime() - timer.statusChangedAt.getTime();
  return Math.max(0, timer.remainingMs - elapsed);
}

function toState(timer: {
  day: number;
  status: string;
  remainingMs: number;
  statusChangedAt: Date;
  overrideText: string | null;
  displayMode: string;
  displayPayload: unknown;
}): EventTimerState {
  const now = new Date();
  return {
    day: timer.day as 1 | 2 | 3,
    status: timer.status as EventTimerState["status"],
    remainingMs: computeRemainingMs(timer, now),
    overrideText: timer.overrideText,
    displayMode: normalizeDisplayMode(timer.displayMode),
    displayPayload: normalizeDisplayPayload(timer.displayPayload),
    serverNow: now.toISOString(),
  };
}

function normalizeDisplayMode(mode: string): EventTimerDisplayMode {
  if (mode === "tribunal" || mode === "artifact" || mode === "ending") return mode;
  return "timer";
}

function normalizeDisplayPayload(payload: unknown): EventTimerDisplayPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
}

async function getOrCreateTimer(gameId: string) {
  const existing = await prisma.eventTimer.findUnique({ where: { gameId } });
  if (existing) return existing;

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new AppError(404, "Game not found");

  return prisma.eventTimer.create({
    data: {
      gameId,
      day: 1,
      status: "running",
      remainingMs: DAY_DURATION_MS[1],
      statusChangedAt: new Date(),
      displayMode: "timer",
      displayPayload: {},
    },
  });
}

export async function getTimerState(gameId: string): Promise<EventTimerState> {
  const timer = await getOrCreateTimer(gameId);
  return toState(timer);
}

export async function pollTimerState(gameId: string): Promise<EventTimerState> {
  return getTimerState(gameId);
}

export async function pauseTimer(gameId: string): Promise<EventTimerState> {
  const timer = await getOrCreateTimer(gameId);
  const now = new Date();
  const updated = await prisma.eventTimer.update({
    where: { gameId },
    data: {
      remainingMs: computeRemainingMs(timer, now),
      statusChangedAt: now,
      status: "paused",
    },
  });
  return toState(updated);
}

export async function resumeTimer(gameId: string): Promise<EventTimerState> {
  await getOrCreateTimer(gameId);
  const updated = await prisma.eventTimer.update({
    where: { gameId },
    data: {
      statusChangedAt: new Date(),
      status: "running",
    },
  });
  return toState(updated);
}

export async function setDay(gameId: string, day: 1 | 2 | 3): Promise<EventTimerState> {
  await getOrCreateTimer(gameId);
  const updated = await prisma.eventTimer.update({
    where: { gameId },
    data: {
      day,
      remainingMs: DAY_DURATION_MS[day],
      statusChangedAt: new Date(),
      status: "running",
      overrideText: null,
      displayMode: "timer",
      displayPayload: {},
    },
  });
  return toState(updated);
}

export async function setOverrideTime(
  gameId: string,
  remainingMs: number,
): Promise<EventTimerState> {
  await getOrCreateTimer(gameId);
  const updated = await prisma.eventTimer.update({
    where: { gameId },
    data: {
      remainingMs,
      statusChangedAt: new Date(),
      overrideText: null,
      displayMode: "timer",
      displayPayload: {},
    },
  });
  return toState(updated);
}

export async function setOverrideText(
  gameId: string,
  text: string | null,
): Promise<EventTimerState> {
  await getOrCreateTimer(gameId);
  const updated = await prisma.eventTimer.update({
    where: { gameId },
    data: { overrideText: text },
  });
  return toState(updated);
}

export async function setDisplay(
  gameId: string,
  displayMode: EventTimerDisplayMode,
  displayPayload: EventTimerDisplayPayload,
  remainingMs?: number,
): Promise<EventTimerState> {
  await getOrCreateTimer(gameId);
  const data: {
    displayMode: EventTimerDisplayMode;
    displayPayload: Prisma.InputJsonValue;
    remainingMs?: number;
    status?: "running";
    statusChangedAt?: Date;
    overrideText?: null;
  } = {
    displayMode,
    displayPayload: (displayPayload ?? {}) as Prisma.InputJsonValue,
  };

  if (remainingMs != null) {
    data.remainingMs = remainingMs;
    data.status = "running";
    data.statusChangedAt = new Date();
    data.overrideText = null;
  }

  const updated = await prisma.eventTimer.update({
    where: { gameId },
    data,
  });
  return toState(updated);
}
