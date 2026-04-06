import type {
  ShowtimePlayerResponse,
  ShowtimePollResponse,
  ShowtimeSlotSubmitResponse,
  ShowtimeSyncPressResponse,
} from "@cardsight/shared";

const BASE = "/api/showtime";

export async function fetchShowtime(
  showtimeId: string,
  houseId: string,
): Promise<ShowtimePlayerResponse> {
  const res = await fetch(`${BASE}/${showtimeId}?house=${houseId}`);
  if (!res.ok) throw new Error("Showtime not found");
  return res.json();
}

export async function pollShowtime(
  showtimeId: string,
  houseId: string,
): Promise<ShowtimePollResponse> {
  const res = await fetch(`${BASE}/${showtimeId}/poll?house=${houseId}`);
  return res.json();
}

export async function submitSlot(
  showtimeId: string,
  houseId: string,
  slotId: string,
  value: string,
): Promise<ShowtimeSlotSubmitResponse> {
  const res = await fetch(`${BASE}/${showtimeId}/submit?house=${houseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slotId, value }),
  });
  return res.json();
}

export async function pressSyncButton(
  showtimeId: string,
  houseId: string,
): Promise<ShowtimeSyncPressResponse> {
  const res = await fetch(`${BASE}/${showtimeId}/sync-press?house=${houseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}
