import type { GameSummary, GameDetail } from "@cardsight/shared";
import { BASE, adminFetch } from "./common.js";

export type { GameSummary, GameDetail };

export async function fetchGames(): Promise<GameSummary[]> {
  const res = await adminFetch(`${BASE}/games`);
  return res.json();
}

export async function fetchGame(gameId: string): Promise<GameDetail> {
  const res = await adminFetch(`${BASE}/games/${gameId}`);
  return res.json();
}

export async function createGame(data: { name: string; description?: string }): Promise<GameSummary> {
  const res = await adminFetch(`${BASE}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function duplicateGame(gameId: string): Promise<GameSummary> {
  const res = await adminFetch(`${BASE}/games/${gameId}/duplicate`, { method: "POST" });
  return res.json();
}

export async function updateGameSettings(
  gameId: string,
  data: { blurNudgeEnabled?: boolean },
): Promise<{ blurNudgeEnabled: boolean }> {
  const res = await adminFetch(`${BASE}/games/${gameId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
