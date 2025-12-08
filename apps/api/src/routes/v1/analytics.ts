/**
 * Analytics API Routes
 * Network statistics, provider health, and live query feed
 */

import express, { Request, Response } from "express";
import {
  getNetworkStats,
  getProviderHealth,
  getProviderDistribution,
  getRecentQueries,
} from "../../services/analytics-cache.js";

const router = express.Router();

// =============================================================================
// GET /analytics/network/stats
// Platform-wide statistics
// =============================================================================

router.get("/network/stats", async (_req: Request, res: Response) => {
  try {
    const stats = getNetworkStats();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Analytics stats error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "STATS_ERROR",
        message: "Failed to fetch network statistics",
      },
    });
  }
});

// =============================================================================
// GET /analytics/network/data-sources
// Provider distribution and health
// =============================================================================

router.get("/network/data-sources", async (_req: Request, res: Response) => {
  try {
    const providers = getProviderHealth();
    const distribution = getProviderDistribution();

    return res.json({
      success: true,
      data: {
        providers,
        distribution,
      },
    });
  } catch (error) {
    console.error("❌ Analytics providers error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "PROVIDERS_ERROR",
        message: "Failed to fetch provider data",
      },
    });
  }
});

// =============================================================================
// GET /analytics/network/feed
// Live query feed with attribution
// =============================================================================

router.get("/network/feed", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const queries = getRecentQueries(limit);

    return res.json({
      success: true,
      data: {
        queries,
        total: queries.length,
      },
    });
  } catch (error) {
    console.error("❌ Analytics feed error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "FEED_ERROR",
        message: "Failed to fetch query feed",
      },
    });
  }
});

export default router;
