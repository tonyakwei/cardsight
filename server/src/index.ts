import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cardRoutes from "./routes/cards.js";
import adminRoutes from "./routes/admin.js";
import showtimeRoutes from "./routes/showtime.js";
import { errorHandler } from "./middleware/error-handler.js";
import { adminAuth } from "./middleware/admin-auth.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/cards", cardRoutes);
app.use("/api/admin", adminAuth, adminRoutes);
app.use("/api/showtime", showtimeRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// In production, serve the built client
// __dirname in compiled output is server/dist/server/src, so we go up to project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../../../../client/dist");

app.use(express.static(clientDist, { index: false }));

// Landing page: serve ATN static site at root
app.get("/", (_req, res, next) => {
  res.sendFile(path.join(clientDist, "landing.html"), (err) => {
    if (err) next();
  });
});

// Client-side routing: serve index.html for any non-API route
app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next(); // File doesn't exist (dev mode), skip
  });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CardSight server running on port ${PORT}`);
});
