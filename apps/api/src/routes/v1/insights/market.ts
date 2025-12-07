/**
 * Market Insights Endpoint
 * POST /api/v1/insights/market
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { keccak256, toHex, type Address } from "viem";
import { x402Middleware } from "../../../middleware/x402.js";
import { x402RealPayment } from "../../../middleware/x402-real.js";
import { aiService } from "../../../services/ai.js";
import {
  aggregateMarketData,
  formatDataForPrompt,
} from "../../../services/data-aggregator.js";
import { recordQuery } from "../../../lib/contracts.js";
import type {
  MarketSentiment,
  InsightResponse,
} from "../../../types/payment.js";

// =============================================================================
// VALIDATION
// =============================================================================

const MarketRequestSchema = z.object({
  assets: z
    .array(z.string())
    .min(1, "At least one asset required")
    .max(5, "Maximum 5 assets"),
  timeframe: z.enum(["1h", "4h", "24h", "7d"]).default("24h"),
});

// =============================================================================
// ROUTER
// =============================================================================

const router = Router();

// Dynamic middleware selection based on PAYMENT_MODE (checked at runtime)
function getPaymentMiddleware() {
  const mode = process.env.PAYMENT_MODE || "signature";
  console.log(`💳 Payment mode: ${mode}`);
  return mode === "real" ? x402RealPayment("market") : x402Middleware("market");
}

/**
 * POST /market
 * Get AI-powered market sentiment analysis
 */
router.post(
  "/market",
  (req, res, next) => getPaymentMiddleware()(req, res, next),
  async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const validation = MarketRequestSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: validation.error.flatten(),
          },
          timestamp: Date.now(),
        });
      }

      const { assets, timeframe } = validation.data;

      // 2. Fetch market data
      console.log(`📊 Fetching market data for: ${assets.join(", ")}`);
      const marketData = await aggregateMarketData(assets);
      const formattedData = formatDataForPrompt(marketData);

      // 3. Generate AI insight
      console.log("🤖 Generating AI insight...");
      const insight = await aiService.generateInsight("market", formattedData);

      // 4. Record query on-chain (async, don't block response)
      if (req.payment) {
        const resultHash = keccak256(toHex(JSON.stringify(insight)));
        const payerAddress = req.payment.payer as Address;
        const paymentAmount = BigInt(req.payment.amount);

        console.log("📝 Recording query on-chain...");
        console.log(`   Payer: ${payerAddress}`);
        console.log(`   Amount: ${paymentAmount}`);
        console.log(`   ResultHash: ${resultHash}`);

        recordQuery(payerAddress, "market", paymentAmount, resultHash)
          .then(({ txHash, queryId }) => {
            console.log(
              `✅ Query recorded on-chain: queryId=${queryId}, tx=${txHash}`
            );
          })
          .catch((err) => {
            console.error("❌ Failed to record query on-chain:", err.message);
            console.error("   Full error:", err);
          });
      } else {
        console.log("⚠️ No payment info - skipping recordQuery");
      }

      // 5. Return response
      const response: InsightResponse<MarketSentiment> = {
        success: true,
        data: insight,
        metadata: {
          tokensUsed: insight.tokensUsed,
          timestamp: Date.now(),
          queryType: "market",
          cached: false,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("❌ Market endpoint error:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process market insight request",
          details:
            process.env.NODE_ENV === "development"
              ? (error as Error).message
              : undefined,
        },
        timestamp: Date.now(),
      });
    }
  }
);

export default router;
