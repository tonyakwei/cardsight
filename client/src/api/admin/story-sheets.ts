import type { AdminStorySheet } from "@cardsight/shared";
import { BASE, adminFetch } from "./common.js";

export type { AdminStorySheet };

export async function fetchStorySheets(
  gameId: string,
  filters?: { houseId?: string; act?: number },
): Promise<AdminStorySheet[]> {
  const params = new URLSearchParams();
  if (filters?.houseId) params.set("houseId", filters.houseId);
  if (filters?.act) params.set("act", String(filters.act));
  const qs = params.toString();
  const res = await adminFetch(`${BASE}/games/${gameId}/story-sheets${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createStorySheet(
  gameId: string,
  data: Record<string, any>,
): Promise<AdminStorySheet> {
  const res = await adminFetch(`${BASE}/games/${gameId}/story-sheets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateStorySheet(
  gameId: string,
  id: string,
  data: Record<string, any>,
): Promise<AdminStorySheet> {
  const res = await adminFetch(`${BASE}/games/${gameId}/story-sheets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteStorySheet(
  gameId: string,
  id: string,
): Promise<void> {
  await adminFetch(`${BASE}/games/${gameId}/story-sheets/${id}`, {
    method: "DELETE",
  });
}

export async function fetchStorySheetPrintData(
  gameId: string,
  act: number,
): Promise<any[]> {
  const res = await adminFetch(`${BASE}/games/${gameId}/story-sheets/print/${act}`);
  return res.json();
}
