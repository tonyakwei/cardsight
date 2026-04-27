import type { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  if (process.env.ADMIN_AUTH_DISABLED === "true") {
    return next();
  }
  if (process.env.ENV_LEVEL !== "production") {
    return next();
  }

  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  let encoded: string | undefined;
  if (authHeader?.startsWith("Basic ")) {
    encoded = authHeader.split(" ")[1];
  } else if (queryToken) {
    encoded = queryToken;
  }

  if (!encoded) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const [username, ...rest] = decoded.split(":");
  const password = rest.join(":");

  const validUser = process.env.ADMIN_USER || "anthony";
  const validPass = process.env.ADMIN_PASS || "niceday100";

  if (username === validUser && password === validPass) {
    return next();
  }

  res.status(401).json({ error: "Invalid credentials" });
}
