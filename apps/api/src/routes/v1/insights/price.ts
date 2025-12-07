/**
 * Price Prediction Endpoint
 * POST /api/v1/insights/price
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { keccak256, toHex, type Address } from "viem";
import { x402Middleware } from "../../../middleware/x402.js";
import { x402RealPayment } from "../../../middleware/x402-real.js";
import { aiService } from "../../../services/ai.js";
import {
  getCurrentPrices,
  getMarketChart,
  normalizeAssetId,
  calculateIndicators,
  formatIndicatorsForPrompt,
} from "../../../services/coingecko.js";
import { recordQuery } from "../../../lib/contracts.js";

// =============================================================================
// TYPES
// =============================================================================

interface PricePrediction {
  prediction: {
    targetPrice: number;
    direction: "bullish" | "bearish" | "neutral";
    confidence: number;
    timeframe: "24h" | "7d" | "30d";
  };
  signals: Array<{
    indicator: string;
    value: string;
    impact: "positive" | "negative";
  }>;
  context: string;
  tokensUsed: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

const PriceRequestSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
  timeframe: z.enum(["24h", "7d", "30d"]).default("7d"),
});

// =============================================================================
// ROUTER
// =============================================================================

const router = Router();

// Dynamic middleware selection based on PAYMENT_MODE
function getPaymentMiddleware() {
  const mode = process.env.PAYMENT_MODE || "signature";
  return mode === "real" ? x402RealPayment("price") : x402Middleware("price");
}

/**
 * POST /price
 * Get AI-powered price prediction with technical analysis
 */
router.post(
  "/price",
  (req, res, next) => getPaymentMiddleware()(req, res, next),
  async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const validation = PriceRequestSchema.safeParse(req.body);

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

      const { asset, timeframe } = validation.data;
      const coinId = normalizeAssetId(asset);

      // 2. Fetch current price and historical data
      console.log(`📈 Fetching price data for: ${coinId}`);

      const days = timeframe === "24h" ? 7 : timeframe === "7d" ? 30 : 90;

      const [priceData, chartData] = await Promise.all([
        getCurrentPrices([coinId]),
        getMarketChart(coinId, days),
      ]);

      if (!priceData.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: "ASSET_NOT_FOUND",
            message: `Asset '${asset}' not found`,
          },
          timestamp: Date.now(),
        });
      }

      const currentPrice = priceData[0].current_price;

      // 3. Calculate technical indicators
      const indicators = calculateIndicators(chartData, currentPrice);
      const formattedData = formatIndicatorsForPrompt(
        coinId,
        indicators,
        timeframe
      );

      // 4. Generate AI prediction
      console.log("🤖 Generating price prediction...");
      const rawInsight = await aiService.generateInsight(
        "price",
        formattedData
      );

      // Parse the prediction response
      const prediction: PricePrediction = {
        prediction: {
          targetPrice:
            (rawInsight as unknown as { prediction?: { targetPrice?: number } })
              .prediction?.targetPrice || currentPrice,
          direction:
            ((rawInsight as unknown as { prediction?: { direction?: string } })
              .prediction?.direction as "bullish" | "bearish" | "neutral") ||
            "neutral",
          confidence:
            (rawInsight as unknown as { prediction?: { confidence?: number } })
              .prediction?.confidence || 50,
          timeframe,
        },
        signals:
          (
            rawInsight as unknown as {
              signals?: Array<{
                indicator: string;
                value: string;
                impact: "positive" | "negative";
              }>;
            }
          ).signals || [],
        context: (rawInsight as unknown as { context?: string }).context || "",
        tokensUsed: rawInsight.tokensUsed || 0,
      };

      // 5. Record query on-chain (async)
      if (req.payment) {
        const resultHash = keccak256(toHex(JSON.stringify(prediction)));
        const payerAddress = req.payment.payer as Address;
        const paymentAmount = BigInt(req.payment.amount);

        recordQuery(payerAddress, "price", paymentAmount, resultHash)
          .then(({ txHash, queryId }) => {
            console.log(
              `✅ Price query recorded: queryId=${queryId}, tx=${txHash}`
            );
          })
          .catch((err) => {
            console.error("❌ Failed to record price query:", err.message);
          });
      }

      // 6. Return response
      res.json({
        success: true,
        data: prediction,
        metadata: {
          tokensUsed: prediction.tokensUsed,
          timestamp: Date.now(),
          queryType: "price",
          cached: false,
          indicators: {
            currentPrice: indicators.currentPrice,
            rsi: indicators.rsi,
            sma7: indicators.sma7,
            sma30: indicators.sma30,
          },
        },
      });
    } catch (error) {
      console.error("❌ Price endpoint error:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process price prediction request",
          details: (error as Error).message,
        },
        timestamp: Date.now(),
      });
    }
  }
);

export default router;
