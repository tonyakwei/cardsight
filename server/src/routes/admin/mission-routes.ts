import { Router, type Router as RouterType } from "express";
import * as adminService from "../../services/admin.service.js";
import { generateMissionQRCode } from "../../services/qr.service.js";

const router: RouterType = Router();

// === Missions ===

router.get("/games/:gameId/missions", async (req, res) => {
  const filters: any = {};
  if (req.query.houseId) filters.houseId = req.query.houseId;
  if (req.query.act) filters.act = Number(req.query.act);
  const missions = await adminService.listMissions(req.params.gameId, filters);
  res.json(missions);
});

router.get("/games/:gameId/missions/:missionId", async (req, res) => {
  const mission = await adminService.getMission(req.params.gameId, req.params.missionId);
  res.json(mission);
});

router.post("/games/:gameId/missions", async (req, res) => {
  const mission = await adminService.createMission(req.params.gameId, req.body);
  res.status(201).json(mission);
});

router.put("/games/:gameId/missions/:missionId", async (req, res) => {
  const mission = await adminService.updateMission(
    req.params.gameId,
    req.params.missionId,
    req.body,
  );
  res.json(mission);
});

router.delete("/games/:gameId/missions/:missionId", async (req, res) => {
  await adminService.deleteMission(req.params.gameId, req.params.missionId);
  res.json({ ok: true });
});

// === Mission Consequences ===

router.get("/games/:gameId/missions/:missionId/consequences", async (req, res) => {
  await adminService.getMission(req.params.gameId, req.params.missionId);
  const consequences = await adminService.listConsequences(req.params.missionId);
  res.json(consequences);
});

router.post("/games/:gameId/missions/:missionId/consequences", async (req, res) => {
  await adminService.getMission(req.params.gameId, req.params.missionId);
  const consequence = await adminService.createConsequence(req.params.missionId, req.body);
  res.status(201).json(consequence);
});

router.put("/games/:gameId/consequences/:consequenceId", async (req, res) => {
  const consequence = await adminService.updateConsequence(req.params.consequenceId, req.body);
  res.json(consequence);
});

router.delete("/games/:gameId/consequences/:consequenceId", async (req, res) => {
  await adminService.deleteConsequence(req.params.consequenceId);
  res.json({ ok: true });
});

// === Mission QR ===

router.get("/games/:gameId/missions/:missionId/qr", async (req, res) => {
  // Verify mission belongs to game
  await adminService.getMission(req.params.gameId, req.params.missionId);
  const buffer = await generateMissionQRCode(req.params.missionId);
  res.set("Content-Type", "image/png");
  res.send(buffer);
});

// === Act Breaks ===

router.get("/games/:gameId/act-break/:act", async (req, res) => {
  const summary = await adminService.getActBreakSummary(
    req.params.gameId,
    Number(req.params.act),
  );
  res.json(summary);
});

export default router;
