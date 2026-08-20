import { Router, type Router as RouterType } from "express";
import * as eventTimerService from "../../services/event-timer.service.js";
import { AppError } from "../../middleware/error-handler.js";
import {
  setDaySchema,
  overrideTimeSchema,
  overrideTextSchema,
  setDisplaySchema,
} from "../../validation/event-timer.js";

const router: RouterType = Router();

router.post("/games/:gameId/event-timer/pause", async (req, res) => {
  const data = await eventTimerService.pauseTimer(req.params.gameId);
  res.json(data);
});

router.post("/games/:gameId/event-timer/resume", async (req, res) => {
  const data = await eventTimerService.resumeTimer(req.params.gameId);
  res.json(data);
});

router.post("/games/:gameId/event-timer/day", async (req, res) => {
  const parsed = setDaySchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Invalid request body");
  const data = await eventTimerService.setDay(req.params.gameId, parsed.data.day);
  res.json(data);
});

router.post("/games/:gameId/event-timer/override-time", async (req, res) => {
  const parsed = overrideTimeSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Invalid request body");
  const data = await eventTimerService.setOverrideTime(
    req.params.gameId,
    parsed.data.remainingMs,
  );
  res.json(data);
});

router.post("/games/:gameId/event-timer/override-text", async (req, res) => {
  const parsed = overrideTextSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Invalid request body");
  const data = await eventTimerService.setOverrideText(req.params.gameId, parsed.data.text);
  res.json(data);
});

router.post("/games/:gameId/event-timer/display", async (req, res) => {
  const parsed = setDisplaySchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Invalid request body");
  const data = await eventTimerService.setDisplay(
    req.params.gameId,
    parsed.data.displayMode,
    parsed.data.displayPayload ?? null,
    parsed.data.remainingMs,
  );
  res.json(data);
});

export default router;
