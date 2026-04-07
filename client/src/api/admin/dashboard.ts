import type { DashboardData, ActTransitionResult } from "@cardsight/shared";
import { BASE, adminFetch } from "./common.js";

export type { DashboardData, ActTransitionResult };

export async function fetchDashboard(gameId: string): Promise<DashboardData> {
  const res = await adminFetch(`${BASE}/games/${gameId}/dashboard`);
  return res.json();
}

export async function transitionAct(
  gameId: string,
  fromAct: number,
): Promise<ActTransitionResult> {
  const res = await adminFetch(`${BASE}/games/${gameId}/transition-act`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromAct }),
  });
  return res.json();
}
