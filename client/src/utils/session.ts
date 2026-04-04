const SESSION_KEY = "cardsight_session";

export function getSessionHash(): string {
  let hash = sessionStorage.getItem(SESSION_KEY);
  if (!hash) {
    hash = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, hash);
  }
  return hash;
}
