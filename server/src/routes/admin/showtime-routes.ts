import { Router, type Router as RouterType } from "express";
import * as adminService from "../../services/admin.service.js";

const router: RouterType = Router();

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

export default router;
