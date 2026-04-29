import { Router, type Router as RouterType } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/error-handler.js";
import { HOUSE_COOKIE_NAME } from "../middleware/house-cookie.js";

const router: RouterType = Router();

// POST /api/house-claim/:slug — Tap an NFC house card; sets cs_house cookie.
// Resolved against the currently-active game.
router.post("/:slug", async (req, res) => {
  const slug = req.params.slug.toLowerCase();

  const activeGame = await prisma.game.findFirst({
    where: { status: "active" },
    select: { id: true, houseAttributionEpoch: true },
  });
  if (!activeGame) {
    throw new AppError(404, "No active game");
  }

  const house = await prisma.house.findFirst({
    where: { gameId: activeGame.id, slug },
    select: { id: true, name: true, color: true, slug: true },
  });
  if (!house) {
    throw new AppError(404, "Unknown house");
  }

  const oneYear = 60 * 60 * 24 * 365;
  const cookieValue = `${house.id}:${activeGame.houseAttributionEpoch}`;
  res.setHeader(
    "Set-Cookie",
    `${HOUSE_COOKIE_NAME}=${cookieValue}; Path=/; Max-Age=${oneYear}; HttpOnly; SameSite=Lax`,
  );

  res.json({ id: house.id, name: house.name, color: house.color, slug: house.slug });
});

export default router;
