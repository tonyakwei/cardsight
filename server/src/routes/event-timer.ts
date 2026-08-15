import { Router, type Router as RouterType } from "express";
import * as eventTimerService from "../services/event-timer.service.js";

const router: RouterType = Router();

// GET /api/event-timer/:gameId — Full state
router.get("/:gameId", async (req, res) => {
  const data = await eventTimerService.getTimerState(req.params.gameId);
  res.json(data);
});

// GET /api/event-timer/:gameId/poll — Poll (same payload, small enough)
router.get("/:gameId/poll", async (req, res) => {
  const data = await eventTimerService.pollTimerState(req.params.gameId);
  res.json(data);
});

export default router;
