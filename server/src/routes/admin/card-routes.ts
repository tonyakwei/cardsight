import { Router, type Router as RouterType } from "express";
import * as adminService from "../../services/admin.service.js";
import * as qrService from "../../services/qr.service.js";

const router: RouterType = Router();

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

// Randomize physical card assignments
router.post("/games/:gameId/cards/randomize-physical", async (req, res) => {
  const cards = await adminService.randomizePhysicalCards(req.params.gameId);
  res.json(cards);
});

// === QR Code ===

router.get("/games/:gameId/cards/:cardId/qr", async (req, res) => {
  await adminService.getCard(req.params.gameId, req.params.cardId);
  const buffer = await qrService.generateQRCode(req.params.cardId);
  res.set("Content-Type", "image/png");
  res.set("Content-Disposition", `attachment; filename="card-${req.params.cardId}.png"`);
  res.send(buffer);
});

export default router;
