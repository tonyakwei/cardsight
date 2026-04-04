import type {
  CardViewerResponse,
  ScanResponse,
  EnterResponse,
  AnswerResponse,
} from "@cardsight/shared";

const BASE = "/api/cards";

export async function fetchCard(cardId: string): Promise<CardViewerResponse> {
  const res = await fetch(`${BASE}/${cardId}`);
  if (!res.ok) {
    if (res.status === 404) throw new CardNotFoundError();
    throw new Error(`Failed to fetch card: ${res.status}`);
  }
  return res.json();
}

export async function postScan(
  cardId: string,
  sessionHash: string,
): Promise<ScanResponse> {
  const res = await fetch(`${BASE}/${cardId}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionHash }),
  });
  if (!res.ok) throw new Error(`Failed to post scan: ${res.status}`);
  return res.json();
}

export async function postEnter(
  cardId: string,
): Promise<EnterResponse> {
  const res = await fetch(`${BASE}/${cardId}/enter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Failed to enter card: ${res.status}`);
  return res.json();
}

export async function postAnswer(
  cardId: string,
  answer: string | string[] | Record<string, string>,
  sessionHash: string,
): Promise<AnswerResponse> {
  const res = await fetch(`${BASE}/${cardId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer, sessionHash }),
  });
  if (!res.ok) throw new Error(`Failed to post answer: ${res.status}`);
  return res.json();
}

export class CardNotFoundError extends Error {
  constructor() {
    super("Card not found");
    this.name = "CardNotFoundError";
  }
}
