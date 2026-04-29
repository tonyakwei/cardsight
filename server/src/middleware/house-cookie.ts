import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export const HOUSE_COOKIE_NAME = "cs_house";

declare global {
  namespace Express {
    interface Request {
      houseId?: string;
    }
  }
}

const UUID_RE = /^[0-9a-f-]{36}$/i;

/**
 * Reads the cs_house cookie and validates it against the active game's
 * houseAttributionEpoch. Cookie value format is "<uuid>:<epoch>". A cookie
 * whose epoch doesn't match the active game's current epoch is silently
 * ignored — that's how the host's "Reset house attributions" button
 * invalidates every phone without having to touch them.
 */
export async function houseCookie(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.cookie;
  if (!header) return next();

  let rawValue: string | null = null;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === HOUSE_COOKIE_NAME) {
      rawValue = decodeURIComponent(rest.join("="));
      break;
    }
  }
  if (!rawValue) return next();

  const [houseId, epochStr] = rawValue.split(":");
  if (!houseId || !UUID_RE.test(houseId)) return next();

  try {
    const activeGame = await prisma.game.findFirst({
      where: { status: "active" },
      select: { houseAttributionEpoch: true },
    });
    if (!activeGame) return next();

    const cookieEpoch = epochStr === undefined ? 0 : Number(epochStr);
    if (Number.isNaN(cookieEpoch)) return next();
    if (cookieEpoch !== activeGame.houseAttributionEpoch) return next();

    req.houseId = houseId;
    return next();
  } catch {
    return next();
  }
}
