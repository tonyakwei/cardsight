import { Router, type Router as RouterType } from "express";
import { slotSubmitSchema } from "../validation/showtime.js";
import * as showtimeService from "../services/showtime.service.js";
import { AppError } from "../middleware/error-handler.js";

const router: RouterType = Router();

function getHouseId(req: any): string {
  const houseId = req.query.house as string;
  if (!houseId) throw new AppError(400, "Missing house query parameter");
  return houseId;
}

// GET /api/showtime/:showtimeId — Full console view
router.get("/:showtimeId", async (req, res) => {
  const data = await showtimeService.getShowtimeForPlayer(
    req.params.showtimeId,
    getHouseId(req),
  );
  res.json(data);
});

// GET /api/showtime/:showtimeId/poll — Lightweight poll
router.get("/:showtimeId/poll", async (req, res) => {
  const data = await showtimeService.pollShowtime(
    req.params.showtimeId,
    getHouseId(req),
  );
  res.json(data);
});

// POST /api/showtime/:showtimeId/submit — Submit slot value
router.post("/:showtimeId/submit", async (req, res) => {
  const parsed = slotSubmitSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Invalid request body");
  const result = await showtimeService.submitSlotValue(
    req.params.showtimeId,
    parsed.data.slotId,
    parsed.data.value,
  );
  res.json(result);
});

// POST /api/showtime/:showtimeId/sync-press — Record sync button press
router.post("/:showtimeId/sync-press", async (req, res) => {
  const result = await showtimeService.recordSyncPress(
    req.params.showtimeId,
    getHouseId(req),
  );
  res.json(result);
});

export default router;
