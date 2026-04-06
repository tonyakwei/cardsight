import type { AdminCard } from "@cardsight/shared";
import { BASE } from "./common.js";

export type { AdminCard };

export async function fetchCards(
  gameId: string,
  filters?: { cardSetId?: string; act?: number; isFinished?: boolean; showDeleted?: boolean },
): Promise<AdminCard[]> {
  const params = new URLSearchParams();
  if (filters?.cardSetId) params.set("cardSetId", filters.cardSetId);
  if (filters?.act) params.set("act", String(filters.act));
  if (filters?.isFinished !== undefined) params.set("isFinished", String(filters.isFinished));
  if (filters?.showDeleted !== undefined) params.set("showDeleted", String(filters.showDeleted));

  const qs = params.toString();
  const res = await fetch(`${BASE}/games/${gameId}/cards${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function updateCard(
  gameId: string,
  cardId: string,
  data: Record<string, any>,
): Promise<AdminCard> {
  const res = await fetch(`${BASE}/games/${gameId}/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createCard(
  gameId: string,
  data: Record<string, any>,
): Promise<AdminCard> {
  const res = await fetch(`${BASE}/games/${gameId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function resetCard(gameId: string, cardId: string): Promise<AdminCard> {
  const res = await fetch(`${BASE}/games/${gameId}/cards/${cardId}/reset`, { method: "POST" });
  return res.json();
}

export async function resetAllCards(gameId: string): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/reset`, { method: "POST" });
}

export async function deleteCard(gameId: string, cardId: string): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/cards/${cardId}`, { method: "DELETE" });
}

export async function restoreCard(gameId: string, cardId: string): Promise<AdminCard> {
  const res = await fetch(`${BASE}/games/${gameId}/cards/${cardId}/restore`, { method: "POST" });
  return res.json();
}

export async function reorderCards(gameId: string, cardIds: string[]): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/cards/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardIds }),
  });
}

export async function bulkOperation(
  gameId: string,
  cardIds: string[],
  action: string,
  value?: any,
): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/cards/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardIds, action, value }),
  });
}

export function getQRUrl(gameId: string, cardId: string): string {
  return `${BASE}/games/${gameId}/cards/${cardId}/qr`;
}
