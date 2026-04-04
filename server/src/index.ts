import express from "express";
import cors from "cors";
import cardRoutes from "./routes/cards.js";
import adminRoutes from "./routes/admin.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/cards", cardRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CardSight server running on port ${PORT}`);
});
