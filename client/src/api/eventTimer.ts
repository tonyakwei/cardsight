import { adminFetch } from "./admin/common";
import type {
  EventTimerDisplayMode,
  EventTimerDisplayPayload,
  EventTimerState,
} from "@cardsight/shared";

const BASE = "/api/event-timer";
const ADMIN_BASE = "/api/admin/games";

export async function fetchTimerState(gameId: string): Promise<EventTimerState> {
  const res = await fetch(`${BASE}/${gameId}`);
  if (!res.ok) throw new Error("Timer not found");
  return res.json();
}

export async function pollTimerState(gameId: string): Promise<EventTimerState> {
  const res = await fetch(`${BASE}/${gameId}/poll`);
  return res.json();
}

export async function pauseTimer(gameId: string): Promise<EventTimerState> {
  const res = await adminFetch(`${ADMIN_BASE}/${gameId}/event-timer/pause`, {
    method: "POST",
  });
  return res.json();
}

export async function resumeTimer(gameId: string): Promise<EventTimerState> {
  const res = await adminFetch(`${ADMIN_BASE}/${gameId}/event-timer/resume`, {
    method: "POST",
  });
  return res.json();
}

export async function setTimerDay(gameId: string, day: 1 | 2 | 3): Promise<EventTimerState> {
  const res = await adminFetch(`${ADMIN_BASE}/${gameId}/event-timer/day`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day }),
  });
  return res.json();
}

export async function setTimerOverrideTime(
  gameId: string,
  remainingMs: number,
): Promise<EventTimerState> {
  const res = await adminFetch(`${ADMIN_BASE}/${gameId}/event-timer/override-time`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ remainingMs }),
  });
  return res.json();
}

export async function setTimerOverrideText(
  gameId: string,
  text: string | null,
): Promise<EventTimerState> {
  const res = await adminFetch(`${ADMIN_BASE}/${gameId}/event-timer/override-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function setTimerDisplay(
  gameId: string,
  displayMode: EventTimerDisplayMode,
  displayPayload: EventTimerDisplayPayload = null,
  remainingMs?: number,
): Promise<EventTimerState> {
  const res = await adminFetch(`${ADMIN_BASE}/${gameId}/event-timer/display`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayMode, displayPayload, remainingMs }),
  });
  return res.json();
}
