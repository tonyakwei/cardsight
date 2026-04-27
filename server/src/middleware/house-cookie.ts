import type { Request, Response, NextFunction } from "express";

export const HOUSE_COOKIE_NAME = "cs_house";

declare global {
  namespace Express {
    interface Request {
      houseId?: string;
    }
  }
}

export function houseCookie(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.cookie;
  if (!header) return next();

  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === HOUSE_COOKIE_NAME) {
      const value = decodeURIComponent(rest.join("="));
      if (/^[0-9a-f-]{36}$/i.test(value)) {
        req.houseId = value;
      }
      break;
    }
  }
  next();
}
