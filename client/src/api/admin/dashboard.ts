import type { DashboardData, ActTransitionResult } from "@cardsight/shared";
import { BASE, adminFetch } from "./common.js";

export type { DashboardData, ActTransitionResult };

export async function fetchDashboard(gameId: string): Promise<DashboardData> {
  const res = await adminFetch(`${BASE}/games/${gameId}/dashboard`);
  return res.json();
}

export type AudioFeedEvent = {
  id: string;
  type: "card_correct" | "card_incorrect" | "mission_correct" | "mission_incorrect";
  at: string;
  house: { id: string; name: string; color: string } | null;
};

export type AudioFeedResponse = {
  cursor: string;
  events: AudioFeedEvent[];
};

export async function fetchAudioFeed(
  gameId: string,
  since: string | null,
): Promise<AudioFeedResponse> {
  const qs = since ? `?since=${encodeURIComponent(since)}` : "";
  const res = await adminFetch(`${BASE}/games/${gameId}/audio-feed${qs}`);
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
