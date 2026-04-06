import { Router, type Router as RouterType } from "express";
import * as adminService from "../services/admin.service.js";
import * as qrService from "../services/qr.service.js";

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

// === Cards ===

router.get("/games/:gameId/cards", async (req, res) => {
  const filters: any = {};
  if (req.query.cardSetId) filters.cardSetId = req.query.cardSetId;
  if (req.query.act) filters.act = Number(req.query.act);
  if (req.query.isFinished !== undefined) filters.isFinished = req.query.isFinished === "true";
  if (req.query.showDeleted === "true") filters.showDeleted = true;

  const cards = await adminService.listCards(req.params.gameId, filters);
  res.json(cards);
});

router.get("/games/:gameId/cards/:cardId", async (req, res) => {
  const card = await adminService.getCard(req.params.gameId, req.params.cardId);
  res.json(card);
});

router.put("/games/:gameId/cards/:cardId", async (req, res) => {
  const card = await adminService.updateCard(
    req.params.gameId,
    req.params.cardId,
    req.body,
  );
  res.json(card);
});

router.post("/games/:gameId/cards", async (req, res) => {
  const card = await adminService.createCard(req.params.gameId, req.body);
  res.status(201).json(card);
});

// Reset all cards in a game
router.post("/games/:gameId/reset", async (req, res) => {
  const cards = await adminService.resetAllCards(req.params.gameId);
  res.json(cards);
});

// Reset a single card
router.post("/games/:gameId/cards/:cardId/reset", async (req, res) => {
  const card = await adminService.resetCard(req.params.gameId, req.params.cardId);
  res.json(card);
});

// Soft delete a card
router.delete("/games/:gameId/cards/:cardId", async (req, res) => {
  const card = await adminService.softDeleteCard(req.params.gameId, req.params.cardId);
  res.json(card);
});

// Restore a soft-deleted card
router.post("/games/:gameId/cards/:cardId/restore", async (req, res) => {
  const card = await adminService.restoreCard(req.params.gameId, req.params.cardId);
  res.json(card);
});

// Reorder cards
router.put("/games/:gameId/cards/reorder", async (req, res) => {
  const cards = await adminService.reorderCards(req.params.gameId, req.body.cardIds);
  res.json(cards);
});

// Bulk operations
router.post("/games/:gameId/cards/bulk", async (req, res) => {
  const { cardIds, action, value } = req.body;
  const cards = await adminService.bulkOperation(req.params.gameId, cardIds, action, value);
  res.json(cards);
});

// === Card Sets ===

router.get("/games/:gameId/card-sets", async (req, res) => {
  const sets = await adminService.listCardSets(req.params.gameId);
  res.json(sets);
});

router.post("/games/:gameId/card-sets", async (req, res) => {
  const set = await adminService.createCardSet(req.params.gameId, req.body);
  res.status(201).json(set);
});

router.put("/games/:gameId/card-sets/:id", async (req, res) => {
  const set = await adminService.updateCardSet(
    req.params.gameId,
    req.params.id,
    req.body,
  );
  res.json(set);
});

router.post("/games/:gameId/card-sets/:id/review", async (req, res) => {
  const review = await adminService.reviewCardSet(
    req.params.gameId,
    req.params.id,
  );
  res.json(review);
});

// === Houses ===

router.get("/games/:gameId/houses", async (req, res) => {
  const houses = await adminService.listHouses(req.params.gameId);
  res.json(houses);
});

router.post("/games/:gameId/houses", async (req, res) => {
  const house = await adminService.createHouse(req.params.gameId, req.body);
  res.status(201).json(house);
});

router.put("/games/:gameId/houses/:id", async (req, res) => {
  const house = await adminService.updateHouse(
    req.params.gameId,
    req.params.id,
    req.body,
  );
  res.json(house);
});

// === Simulator ===

router.get("/games/:gameId/simulator", async (req, res) => {
  const data = await adminService.getSimulatorData(req.params.gameId);
  res.json(data);
});

router.put("/games/:gameId/simulator", async (req, res) => {
  await adminService.saveTableAssignments(req.params.gameId, req.body.assignments);
  res.json({ ok: true });
});

router.post("/games/:gameId/simulator/auto-distribute", async (req, res) => {
  const assignments = await adminService.autoDistribute(req.params.gameId, req.body.act);
  res.json(assignments);
});

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

router.get("/games/:gameId/act-break/:act", async (req, res) => {
  const summary = await adminService.getActBreakSummary(
    req.params.gameId,
    Number(req.params.act),
  );
  res.json(summary);
});

// === Showtimes ===

router.get("/games/:gameId/showtimes", async (req, res) => {
  const showtimes = await adminService.listShowtimes(req.params.gameId);
  res.json(showtimes);
});

router.get("/games/:gameId/showtimes/:showtimeId", async (req, res) => {
  const showtime = await adminService.getShowtime(req.params.gameId, req.params.showtimeId);
  res.json(showtime);
});

router.post("/games/:gameId/showtimes", async (req, res) => {
  const showtime = await adminService.createShowtime(req.params.gameId, req.body);
  res.status(201).json(showtime);
});

router.put("/games/:gameId/showtimes/:showtimeId", async (req, res) => {
  const showtime = await adminService.updateShowtime(
    req.params.gameId,
    req.params.showtimeId,
    req.body,
  );
  res.json(showtime);
});

router.delete("/games/:gameId/showtimes/:showtimeId", async (req, res) => {
  await adminService.deleteShowtime(req.params.gameId, req.params.showtimeId);
  res.json({ ok: true });
});

router.post("/games/:gameId/showtimes/:showtimeId/trigger", async (req, res) => {
  const showtime = await adminService.triggerShowtime(req.params.gameId, req.params.showtimeId);
  res.json(showtime);
});

router.post("/games/:gameId/showtimes/:showtimeId/reset", async (req, res) => {
  const showtime = await adminService.resetShowtime(req.params.gameId, req.params.showtimeId);
  res.json(showtime);
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

// === QR Code ===

router.get("/games/:gameId/cards/:cardId/qr", async (req, res) => {
  await adminService.getCard(req.params.gameId, req.params.cardId);
  const buffer = await qrService.generateQRCode(req.params.cardId);
  res.set("Content-Type", "image/png");
  res.set("Content-Disposition", `attachment; filename="card-${req.params.cardId}.png"`);
  res.send(buffer);
});

// === Designs (read-only) ===

router.get("/games/:gameId/designs", async (req, res) => {
  const designs = await adminService.listDesigns(req.params.gameId);
  res.json(designs);
});

// === Answer Templates (read-only) ===

router.get("/games/:gameId/answers/:type", async (req, res) => {
  const templates = await adminService.listAnswerTemplates(
    req.params.gameId,
    req.params.type,
  );
  res.json(templates);
});

export default router;
