import type {
  FinaleAdminState,
  FinaleClauseId,
  FinaleOutcomeId,
  GameSummary,
  GameDetail,
} from "@cardsight/shared";
import { BASE, adminFetch } from "./common.js";

export type { GameSummary, GameDetail };

export interface HistoryTimelineState {
  armed: boolean;
  attemptIndex: number;
  solvedAt: string | null;
  cardCount: number;
}

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

export async function activateGame(
  gameId: string,
): Promise<{ id: string; status: "active" }> {
  const res = await adminFetch(`${BASE}/games/${gameId}/activate`, { method: "POST" });
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

export async function armHistoryTimeline(
  gameId: string,
): Promise<HistoryTimelineState> {
  const res = await adminFetch(`${BASE}/games/${gameId}/history-timeline/arm`, {
    method: "POST",
  });
  return res.json();
}

export async function resetHistoryTimeline(
  gameId: string,
): Promise<HistoryTimelineState> {
  const res = await adminFetch(`${BASE}/games/${gameId}/history-timeline/reset`, {
    method: "POST",
  });
  return res.json();
}

export async function updateFinaleSelection(
  gameId: string,
  data: {
    outcomeId?: FinaleOutcomeId | null;
    clauseIds?: FinaleClauseId[];
  },
): Promise<FinaleAdminState> {
  const res = await adminFetch(`${BASE}/games/${gameId}/finale`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
