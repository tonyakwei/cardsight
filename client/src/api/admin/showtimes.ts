import type { AdminShowtime, AdminShowtimeSlot } from "@cardsight/shared";
import { BASE, adminFetch } from "./common.js";

export type { AdminShowtime, AdminShowtimeSlot };

export async function fetchShowtimes(gameId: string): Promise<AdminShowtime[]> {
  const res = await adminFetch(`${BASE}/games/${gameId}/showtimes`);
  return res.json();
}

export async function createShowtime(
  gameId: string,
  data: Record<string, any>,
): Promise<AdminShowtime> {
  const res = await adminFetch(`${BASE}/games/${gameId}/showtimes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateShowtime(
  gameId: string,
  showtimeId: string,
  data: Record<string, any>,
): Promise<AdminShowtime> {
  const res = await adminFetch(`${BASE}/games/${gameId}/showtimes/${showtimeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteShowtime(gameId: string, showtimeId: string): Promise<void> {
  await adminFetch(`${BASE}/games/${gameId}/showtimes/${showtimeId}`, { method: "DELETE" });
}

export async function triggerShowtime(gameId: string, showtimeId: string): Promise<AdminShowtime> {
  const res = await adminFetch(`${BASE}/games/${gameId}/showtimes/${showtimeId}/trigger`, {
    method: "POST",
  });
  return res.json();
}

export async function resetShowtime(gameId: string, showtimeId: string): Promise<AdminShowtime> {
  const res = await adminFetch(`${BASE}/games/${gameId}/showtimes/${showtimeId}/reset`, {
    method: "POST",
  });
  return res.json();
}
