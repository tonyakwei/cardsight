import type { AdminMission, AdminMissionConsequence, ActBreakHouse } from "@cardsight/shared";
import { BASE, adminFetch, getAdminToken } from "./common.js";

export type { AdminMission, AdminMissionConsequence, ActBreakHouse };

export async function fetchMissions(
  gameId: string,
  filters?: { houseId?: string; act?: number },
): Promise<AdminMission[]> {
  const params = new URLSearchParams();
  if (filters?.houseId) params.set("houseId", filters.houseId);
  if (filters?.act) params.set("act", String(filters.act));
  const qs = params.toString();
  const res = await adminFetch(`${BASE}/games/${gameId}/missions${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function createMission(
  gameId: string,
  data: Record<string, any>,
): Promise<AdminMission> {
  const res = await adminFetch(`${BASE}/games/${gameId}/missions`, {
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
  const res = await adminFetch(`${BASE}/games/${gameId}/missions/${missionId}`, {
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
  await adminFetch(`${BASE}/games/${gameId}/missions/${missionId}`, {
    method: "DELETE",
  });
}

export function getMissionQRUrl(gameId: string, missionId: string): string {
  const token = getAdminToken();
  const url = `${BASE}/games/${gameId}/missions/${missionId}/qr`;
  return token ? `${url}?token=${token}` : url;
}

// === Consequences ===

export async function fetchConsequences(
  gameId: string,
  missionId: string,
): Promise<AdminMissionConsequence[]> {
  const res = await adminFetch(`${BASE}/games/${gameId}/missions/${missionId}/consequences`);
  return res.json();
}

export async function createConsequence(
  gameId: string,
  missionId: string,
  data: Record<string, any>,
): Promise<AdminMissionConsequence> {
  const res = await adminFetch(`${BASE}/games/${gameId}/missions/${missionId}/consequences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateConsequence(
  gameId: string,
  consequenceId: string,
  data: Record<string, any>,
): Promise<AdminMissionConsequence> {
  const res = await adminFetch(`${BASE}/games/${gameId}/consequences/${consequenceId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteConsequence(
  gameId: string,
  consequenceId: string,
): Promise<void> {
  await adminFetch(`${BASE}/games/${gameId}/consequences/${consequenceId}`, {
    method: "DELETE",
  });
}

export async function fetchActBreak(
  gameId: string,
  act: number,
): Promise<ActBreakHouse[]> {
  const res = await adminFetch(`${BASE}/games/${gameId}/act-break/${act}`);
  return res.json();
}
