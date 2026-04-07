import type {
  AdminCardSet,
  AdminDesign,
  AdminHouse,
} from "@cardsight/shared";

export type { AdminCardSet, AdminDesign, AdminHouse };

export const BASE = "/api/admin";

// === Auth helpers ===

export function getAdminToken(): string | null {
  return sessionStorage.getItem("admin_token");
}

export function setAdminToken(username: string, password: string) {
  sessionStorage.setItem("admin_token", btoa(`${username}:${password}`));
}

export function clearAdminToken() {
  sessionStorage.removeItem("admin_token");
}

export async function adminFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Basic ${token}`);
  }
  return fetch(url, { ...init, headers });
}

// === Card Sets ===

export async function fetchCardSets(gameId: string): Promise<AdminCardSet[]> {
  const res = await adminFetch(`${BASE}/games/${gameId}/card-sets`);
  return res.json();
}

export async function createCardSet(
  gameId: string,
  data: { name: string; color?: string; notes?: string },
): Promise<AdminCardSet> {
  const res = await adminFetch(`${BASE}/games/${gameId}/card-sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCardSet(
  gameId: string,
  cardSetId: string,
  data: { name?: string; color?: string; notes?: string | null },
): Promise<AdminCardSet> {
  const res = await adminFetch(`${BASE}/games/${gameId}/card-sets/${cardSetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function reviewCardSet(gameId: string, cardSetId: string): Promise<void> {
  await adminFetch(`${BASE}/games/${gameId}/card-sets/${cardSetId}/review`, {
    method: "POST",
  });
}

// === Houses ===

export async function fetchHouses(gameId: string): Promise<AdminHouse[]> {
  const res = await adminFetch(`${BASE}/games/${gameId}/houses`);
  return res.json();
}

export async function createHouse(
  gameId: string,
  data: { name: string; color?: string },
): Promise<AdminHouse> {
  const res = await adminFetch(`${BASE}/games/${gameId}/houses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// === Designs ===

export async function fetchDesigns(gameId: string): Promise<AdminDesign[]> {
  const res = await adminFetch(`${BASE}/games/${gameId}/designs`);
  return res.json();
}
