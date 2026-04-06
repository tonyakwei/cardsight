import type { AdminMission, ActBreakHouse } from "@cardsight/shared";
import { BASE } from "./common.js";

export type { AdminMission, ActBreakHouse };

export async function fetchMissions(
  gameId: string,
  filters?: { houseId?: string; act?: number },
): Promise<AdminMission[]> {
  const params = new URLSearchParams();
  if (filters?.houseId) params.set("houseId", filters.houseId);
  if (filters?.act) params.set("act", String(filters.act));
  const qs = params.toString();
  const res = await fetch(`${BASE}/games/${gameId}/missions${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createMission(
  gameId: string,
  data: Record<string, any>,
): Promise<AdminMission> {
  const res = await fetch(`${BASE}/games/${gameId}/missions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMission(
  gameId: string,
  missionId: string,
  data: Record<string, any>,
): Promise<AdminMission> {
  const res = await fetch(`${BASE}/games/${gameId}/missions/${missionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteMission(
  gameId: string,
  missionId: string,
): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/missions/${missionId}`, {
    method: "DELETE",
  });
}

export async function fetchActBreak(
  gameId: string,
  act: number,
): Promise<ActBreakHouse[]> {
  const res = await fetch(`${BASE}/games/${gameId}/act-break/${act}`);
  return res.json();
}
