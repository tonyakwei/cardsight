import { Router, type Router as RouterType } from "express";
import { missionScanSchema, missionAnswerSchema } from "../validation/missions.js";
import * as missionService from "../services/mission.service.js";
import { AppError } from "../middleware/error-handler.js";

const router: RouterType = Router();

// GET /api/missions/:missionId — Mission content for viewer
router.get("/:missionId", async (req, res) => {
  const mission = await missionService.getMissionForViewer(req.params.missionId);
  res.json(mission);
});

// POST /api/missions/:missionId/scan — Log a scan event
router.post("/:missionId/scan", async (req, res) => {
  const parsed = missionScanSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Invalid request body");
  }
  const result = await missionService.recordMissionScan(
    req.params.missionId,
    parsed.data.houseId,
    parsed.data.sessionHash,
  );
  res.json(result);
});

// POST /api/missions/:missionId/answer — Submit an answer
router.post("/:missionId/answer", async (req, res) => {
  const parsed = missionAnswerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Invalid request body");
  }
  const result = await missionService.checkMissionAnswer(
    req.params.missionId,
    parsed.data.answer,
    parsed.data.houseId,
    parsed.data.sessionHash,
  );
  res.json(result);
});

export default router;
