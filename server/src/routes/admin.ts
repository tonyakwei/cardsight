import { Router, type Router as RouterType } from "express";
import cardRoutes from "./admin/card-routes.js";
import missionRoutes from "./admin/mission-routes.js";
import showtimeRoutes from "./admin/showtime-routes.js";
import gameRoutes from "./admin/game-routes.js";

const router: RouterType = Router();

router.get("/verify", (_req, res) => {
  res.json({ authenticated: true });
});

router.use("/", gameRoutes);
router.use("/", cardRoutes);
router.use("/", missionRoutes);
router.use("/", showtimeRoutes);

export default router;
