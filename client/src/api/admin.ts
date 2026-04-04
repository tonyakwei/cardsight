const BASE = "/api/admin";

// === Games ===

export interface GameSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameDetail extends GameSummary {
  designCount: number;
  finishedCount: number;
}

export async function fetchGames(): Promise<GameSummary[]> {
  const res = await fetch(`${BASE}/games`);
  return res.json();
}

export async function fetchGame(gameId: string): Promise<GameDetail> {
  const res = await fetch(`${BASE}/games/${gameId}`);
  return res.json();
}

// === Cards ===

export interface AdminCard {
  id: string;
  gameId: string;
  humanCardId: string;
  title: string;
  description: string | null;
  act: number | null;
  cardSetId: string | null;
  cardSet: { id: string; name: string; color: string } | null;
  cardHouses: { id: string; house: { id: string; name: string; color: string } }[];
  clueVisibleCategory: string | null;
  notes: string | null;
  designId: string | null;
  design: { id: string; name: string } | null;
  answerTemplateType: string | null;
  answerId: string | null;
  isAnswerable: boolean;
  lockedOut: boolean;
  lockedOutReason: string | null;
  selfDestructTimer: number | null;
  selfDestructedAt: string | null;
  selfDestructText: string | null;
  hasEntryGate: boolean;
  entryGateText: string | null;
  answerVisibleAfterDestruct: boolean;
  isFinished: boolean;
  isSolved: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchCards(
  gameId: string,
  filters?: { cardSetId?: string; act?: number; isFinished?: boolean; showDeleted?: boolean },
): Promise<AdminCard[]> {
  const params = new URLSearchParams();
  if (filters?.cardSetId) params.set("cardSetId", filters.cardSetId);
  if (filters?.act) params.set("act", String(filters.act));
  if (filters?.isFinished !== undefined) params.set("isFinished", String(filters.isFinished));
  if (filters?.showDeleted !== undefined) params.set("showDeleted", String(filters.showDeleted));

  const qs = params.toString();
  const res = await fetch(`${BASE}/games/${gameId}/cards${qs ? `?${qs}` : ""}`);
  return res.json();
}

export async function updateCard(
  gameId: string,
  cardId: string,
  data: Record<string, any>,
): Promise<AdminCard> {
  const res = await fetch(`${BASE}/games/${gameId}/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createCard(
  gameId: string,
  data: Record<string, any>,
): Promise<AdminCard> {
  const res = await fetch(`${BASE}/games/${gameId}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// === Card Sets ===

export interface AdminCardSet {
  id: string;
  name: string;
  color: string;
  notes: string | null;
  cardCount: number;
  reviewedAt: string | null;
  modifiedSinceReview: number;
}

export async function fetchCardSets(gameId: string): Promise<AdminCardSet[]> {
  const res = await fetch(`${BASE}/games/${gameId}/card-sets`);
  return res.json();
}

export async function createCardSet(
  gameId: string,
  data: { name: string; color?: string; notes?: string },
): Promise<AdminCardSet> {
  const res = await fetch(`${BASE}/games/${gameId}/card-sets`, {
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
  const res = await fetch(`${BASE}/games/${gameId}/card-sets/${cardSetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function reviewCardSet(gameId: string, cardSetId: string): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/card-sets/${cardSetId}/review`, {
    method: "POST",
  });
}

// === Houses ===

export interface AdminHouse {
  id: string;
  name: string;
  color: string;
  _count?: { cards: number };
}

export async function fetchHouses(gameId: string): Promise<AdminHouse[]> {
  const res = await fetch(`${BASE}/games/${gameId}/houses`);
  return res.json();
}

export async function createHouse(
  gameId: string,
  data: { name: string; color?: string },
): Promise<AdminHouse> {
  const res = await fetch(`${BASE}/games/${gameId}/houses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// === QR ===

export function getQRUrl(gameId: string, cardId: string): string {
  return `${BASE}/games/${gameId}/cards/${cardId}/qr`;
}

// === Designs ===

export interface AdminDesign {
  id: string;
  name: string;
  bgColor: string;
  accentColor: string;
  cardStyle: string;
}

export async function fetchDesigns(gameId: string): Promise<AdminDesign[]> {
  const res = await fetch(`${BASE}/games/${gameId}/designs`);
  return res.json();
}

// === Game Operations ===

// Create game
export async function createGame(data: { name: string; description?: string }): Promise<GameSummary> {
  const res = await fetch(`${BASE}/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Duplicate game
export async function duplicateGame(gameId: string): Promise<GameSummary> {
  const res = await fetch(`${BASE}/games/${gameId}/duplicate`, { method: "POST" });
  return res.json();
}

// === Card Operations ===

// Reset card runtime (self-destruct, solved, scans, answers)
export async function resetCard(gameId: string, cardId: string): Promise<AdminCard> {
  const res = await fetch(`${BASE}/games/${gameId}/cards/${cardId}/reset`, { method: "POST" });
  return res.json();
}

// Reset all cards in a game
export async function resetAllCards(gameId: string): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/reset`, { method: "POST" });
}

// Soft delete a card
export async function deleteCard(gameId: string, cardId: string): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/cards/${cardId}`, { method: "DELETE" });
}

// Restore a soft-deleted card
export async function restoreCard(gameId: string, cardId: string): Promise<AdminCard> {
  const res = await fetch(`${BASE}/games/${gameId}/cards/${cardId}/restore`, { method: "POST" });
  return res.json();
}

// Reorder cards
export async function reorderCards(gameId: string, cardIds: string[]): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/cards/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardIds }),
  });
}

// Bulk operations
export async function bulkOperation(
  gameId: string,
  cardIds: string[],
  action: string,
  value?: any,
): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/cards/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardIds, action, value }),
  });
}

// === Simulator ===

export interface SimulatorCard {
  id: string;
  humanCardId: string;
  title: string;
  act: number | null;
  tableHouseId: string | null;
  cardSet: { id: string; name: string; color: string } | null;
  cardHouses: { house: { id: string; name: string; color: string } }[];
}

export interface SimulatorData {
  houses: AdminHouse[];
  cards: SimulatorCard[];
}

export async function fetchSimulator(gameId: string): Promise<SimulatorData> {
  const res = await fetch(`${BASE}/games/${gameId}/simulator`);
  return res.json();
}

export async function saveSimulator(
  gameId: string,
  assignments: { cardId: string; tableHouseId: string | null }[],
): Promise<void> {
  await fetch(`${BASE}/games/${gameId}/simulator`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignments }),
  });
}

export async function autoDistribute(
  gameId: string,
  act: number,
): Promise<{ cardId: string; tableHouseId: string }[]> {
  const res = await fetch(`${BASE}/games/${gameId}/simulator/auto-distribute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ act }),
  });
  return res.json();
}
