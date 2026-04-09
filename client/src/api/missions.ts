import type {
  MissionViewerResponse,
  MissionScanResponse,
  MissionAnswerResponse,
} from "@cardsight/shared";

const BASE = "/api/missions";

export async function fetchMission(missionId: string): Promise<MissionViewerResponse> {
  const res = await fetch(`${BASE}/${missionId}`);
  if (!res.ok) {
    if (res.status === 404) throw new MissionNotFoundError();
    throw new Error(`Failed to fetch mission: ${res.status}`);
  }
  return res.json();
}

export async function postMissionScan(
  missionId: string,
  houseId?: string,
  sessionHash?: string,
): Promise<MissionScanResponse> {
  const res = await fetch(`${BASE}/${missionId}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ houseId, sessionHash }),
  });
  if (!res.ok) throw new Error(`Failed to post mission scan: ${res.status}`);
  return res.json();
}

export async function postMissionAnswer(
  missionId: string,
  answer: string | string[] | Record<string, string>,
  houseId?: string,
  sessionHash?: string,
): Promise<MissionAnswerResponse> {
  const res = await fetch(`${BASE}/${missionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer, houseId, sessionHash }),
  });
  if (!res.ok) throw new Error(`Failed to post mission answer: ${res.status}`);
  return res.json();
}

export class MissionNotFoundError extends Error {
  constructor() {
    super("Mission not found");
    this.name = "MissionNotFoundError";
  }
}
