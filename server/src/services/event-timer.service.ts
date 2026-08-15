import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import type { EventTimerState } from "@cardsight/shared";

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
}): EventTimerState {
  const now = new Date();
  return {
    day: timer.day as 1 | 2 | 3,
    status: timer.status as EventTimerState["status"],
    remainingMs: computeRemainingMs(timer, now),
    overrideText: timer.overrideText,
    serverNow: now.toISOString(),
  };
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
