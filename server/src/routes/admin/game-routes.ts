import { Router, type Router as RouterType } from "express";
import * as adminService from "../../services/admin.service.js";

const router: RouterType = Router();

// === Games ===

router.get("/games", async (_req, res) => {
  const games = await adminService.listGames();
  res.json(games);
});

router.get("/games/:gameId", async (req, res) => {
  const game = await adminService.getGame(req.params.gameId);
  res.json(game);
});

router.post("/games", async (req, res) => {
  const game = await adminService.createGame(req.body);
  res.status(201).json(game);
});

router.post("/games/:gameId/duplicate", async (req, res) => {
  const game = await adminService.duplicateGame(req.params.gameId);
  res.status(201).json(game);
});

// === Game Settings ===

router.patch("/games/:gameId/settings", async (req, res) => {
  const result = await adminService.updateGameSettings(
    req.params.gameId,
    req.body,
  );
  res.json(result);
});

// === Act Transitions ===

router.post("/games/:gameId/transition-act", async (req, res) => {
  const result = await adminService.transitionAct(
    req.params.gameId,
    req.body.fromAct,
  );
  res.json(result);
});

// === Live Dashboard ===

router.get("/games/:gameId/dashboard", async (req, res) => {
  const data = await adminService.getDashboard(req.params.gameId);
  res.json(data);
});

// === Designs (read-only) ===

router.get("/games/:gameId/designs", async (req, res) => {
  const designs = await adminService.listDesigns(req.params.gameId);
  res.json(designs);
});

// === Answer Templates ===

router.get("/games/:gameId/answers/:type", async (req, res) => {
  const templates = await adminService.listAnswerTemplates(
    req.params.gameId,
    req.params.type,
  );
  res.json(templates);
});

router.get("/games/:gameId/answers/:type/:id", async (req, res) => {
  const template = await adminService.getAnswerTemplate(
    req.params.gameId,
    req.params.type,
    req.params.id,
  );
  res.json(template);
});

router.post("/games/:gameId/answers/:type", async (req, res) => {
  const template = await adminService.createAnswerTemplate(
    req.params.gameId,
    req.params.type,
    req.body,
  );
  res.status(201).json(template);
});

router.put("/games/:gameId/answers/:type/:id", async (req, res) => {
  const template = await adminService.updateAnswerTemplate(
    req.params.gameId,
    req.params.type,
    req.params.id,
    req.body,
  );
  res.json(template);
});

export default router;
