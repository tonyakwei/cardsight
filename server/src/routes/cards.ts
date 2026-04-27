import { Router, type Router as RouterType } from "express";
import { scanSchema, examineSchema, answerSchema } from "../validation/cards.js";
import * as cardService from "../services/card.service.js";
import { AppError } from "../middleware/error-handler.js";

const router: RouterType = Router();

// GET /api/cards/:cardId — Card content for viewer
router.get("/:cardId", async (req, res) => {
  const card = await cardService.getCardForViewer(req.params.cardId);
  res.json(card);
});

// POST /api/cards/:cardId/scan — Log a scan event
router.post("/:cardId/scan", async (req, res) => {
  const parsed = scanSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Invalid request body");
  }
  const result = await cardService.recordScan(
    req.params.cardId,
    parsed.data.sessionHash,
    parsed.data.userAgent ?? req.headers["user-agent"],
    req.houseId,
  );
  res.json(result);
});

// POST /api/cards/:cardId/examine — Player examines the card (starts self-destruct timer)
router.post("/:cardId/examine", async (req, res) => {
  const result = await cardService.examineCard(req.params.cardId);
  res.json(result);
});

// POST /api/cards/:cardId/answer — Submit an answer
router.post("/:cardId/answer", async (req, res) => {
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Invalid request body");
  }
  const result = await cardService.checkAnswer(
    req.params.cardId,
    parsed.data.answer,
    parsed.data.sessionHash,
    req.houseId,
  );
  res.json(result);
});

export default router;
