import { Router, type Router as RouterType } from "express";
import * as adminService from "../../services/admin.service.js";

const router: RouterType = Router();

// === Story Sheets ===

router.get("/games/:gameId/story-sheets", async (req, res) => {
  const filters: any = {};
  if (req.query.houseId) filters.houseId = req.query.houseId;
  if (req.query.act) filters.act = Number(req.query.act);
  const sheets = await adminService.listStorySheets(req.params.gameId, filters);
  res.json(sheets);
});

router.get("/games/:gameId/story-sheets/print/:act", async (req, res) => {
  const data = await adminService.getStorySheetPrintData(
    req.params.gameId,
    Number(req.params.act),
  );
  res.json(data);
});

router.get("/games/:gameId/story-sheets/:id", async (req, res) => {
  const sheet = await adminService.getStorySheet(req.params.gameId, req.params.id);
  res.json(sheet);
});

router.post("/games/:gameId/story-sheets", async (req, res) => {
  const sheet = await adminService.createStorySheet(req.params.gameId, req.body);
  res.status(201).json(sheet);
});

router.put("/games/:gameId/story-sheets/:id", async (req, res) => {
  const sheet = await adminService.updateStorySheet(
    req.params.gameId,
    req.params.id,
    req.body,
  );
  res.json(sheet);
});

router.delete("/games/:gameId/story-sheets/:id", async (req, res) => {
  await adminService.deleteStorySheet(req.params.gameId, req.params.id);
  res.json({ ok: true });
});

export default router;
