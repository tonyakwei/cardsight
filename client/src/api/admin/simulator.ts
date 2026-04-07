import type { SimulatorCard, SimulatorData } from "@cardsight/shared";
import { BASE, adminFetch } from "./common.js";

export type { SimulatorCard, SimulatorData };

export async function fetchSimulator(gameId: string): Promise<SimulatorData> {
  const res = await adminFetch(`${BASE}/games/${gameId}/simulator`);
  return res.json();
}

export async function saveSimulator(
  gameId: string,
  assignments: { cardId: string; tableHouseId: string | null }[],
): Promise<void> {
  await adminFetch(`${BASE}/games/${gameId}/simulator`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignments }),
  });
}

export async function autoDistribute(
  gameId: string,
  act: number,
): Promise<{ cardId: string; tableHouseId: string }[]> {
  const res = await adminFetch(`${BASE}/games/${gameId}/simulator/auto-distribute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ act }),
  });
  return res.json();
}
