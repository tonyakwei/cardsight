import type { SingleAnswerTemplate } from "@cardsight/shared";
import { BASE } from "./common.js";

export type { SingleAnswerTemplate };

export async function fetchAnswerTemplate(
  gameId: string,
  type: string,
  id: string,
): Promise<SingleAnswerTemplate> {
  const res = await fetch(`${BASE}/games/${gameId}/answers/${type}/${id}`);
  return res.json();
}

export async function createAnswerTemplate(
  gameId: string,
  type: string,
  data: Record<string, any>,
): Promise<SingleAnswerTemplate> {
  const res = await fetch(`${BASE}/games/${gameId}/answers/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateAnswerTemplate(
  gameId: string,
  type: string,
  id: string,
  data: Record<string, any>,
): Promise<SingleAnswerTemplate> {
  const res = await fetch(`${BASE}/games/${gameId}/answers/${type}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
