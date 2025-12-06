/**
 * QueryFlow API Server
 * Pay-per-query data insights for AI agents using x402 payments
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import marketRouter from "./routes/v1/insights/market.js";

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    version: "0.1.0",
    timestamp: Date.now(),
  });
});

// API info
app.get("/", (req, res) => {
  res.json({
    name: "QueryFlow API",
    version: "0.1.0",
    description: "Pay-per-query data insights for AI agents",
    endpoints: {
      health: "GET /health",
      market: "POST /api/v1/insights/market",
    },
  });
});

// Insights API
app.use("/api/v1/insights", marketRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: Date.now(),
  });
});

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);

    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      timestamp: Date.now(),
    });
  }
);

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log("");
  console.log("═══════════════════════════════════════════════════");
  console.log("  🚀 QueryFlow API Server");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  URL:     http://localhost:${PORT}`);
  console.log(`  Env:     ${process.env.NODE_ENV || "development"}`);
  console.log("  Routes:");
  console.log("    - GET  /health");
  console.log("    - POST /api/v1/insights/market");
  console.log("═══════════════════════════════════════════════════");
  console.log("");
});
