/**
 * Market Insights Streaming Endpoint (SSE)
 * POST /api/v1/insights/market/stream
 *
 * Returns Server-Sent Events for real-time AI insight delivery
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { keccak256, toHex, type Address } from "viem";
import { x402Middleware } from "../../../middleware/x402.js";
import { x402RealPayment } from "../../../middleware/x402-real.js";
import { thirdwebX402Middleware } from "../../../middleware/thirdweb-x402.js";
import { dualModeX402Middleware } from "../../../middleware/dual-mode-x402.js";
import { aiService } from "../../../services/ai.js";
import {
  aggregateMarketData,
  formatDataForPrompt,
} from "../../../services/data-aggregator.js";
import { recordQuery } from "../../../lib/contracts.js";
import { recordQueryEvent } from "../../../services/analytics-cache.js";

// =============================================================================
// VALIDATION
// =============================================================================

const MarketStreamRequestSchema = z.object({
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

/**
 * Dynamic middleware selector based on PAYMENT_MODE env
 * Options: "signature" (dev), "real" (custom tx), "thirdweb" (standard), "dual" (both)
 */
function getPaymentMiddleware() {
  const mode = process.env.PAYMENT_MODE || "signature";
  if (mode === "dual") {
    return dualModeX402Middleware("market");
  } else if (mode === "thirdweb") {
    return thirdwebX402Middleware("market");
  } else if (mode === "real") {
    return x402RealPayment("market");
  }
  return x402Middleware("market");
}

/**
 * POST /market/stream
 * Stream AI-powered market sentiment analysis via SSE
 */
router.post(
  "/market/stream",
  (req, res, next) => getPaymentMiddleware()(req, res, next),
  async (req: Request, res: Response) => {
    const startTime = Date.now();

    // 1. Validate request body
    const validation = MarketStreamRequestSchema.safeParse(req.body);

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

    // 2. Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Send initial connection event
    res.write(
      `event: connected\ndata: {"status": "connected", "assets": ${JSON.stringify(assets)}}\n\n`
    );

    try {
      // 3. Fetch market data
      console.log(`📊 [STREAM] Fetching market data for: ${assets.join(", ")}`);
      const dataFetchStart = Date.now();
      const marketData = await aggregateMarketData(assets);
      const dataFetchLatency = Date.now() - dataFetchStart;
      const formattedData = formatDataForPrompt(marketData);

      // Send data_ready event
      res.write(
        `event: data_ready\ndata: {"latencyMs": ${dataFetchLatency}, "source": "cryptocompare"}\n\n`
      );

      // 4. Stream AI insight
      console.log("🤖 [STREAM] Generating AI insight...");
      let fullContent = "";
      let tokensUsed = 0;

      for await (const event of aiService.generateInsightStream(
        "market",
        formattedData
      )) {
        if (event.type === "chunk") {
          fullContent += event.content;
          // Send each chunk as SSE event
          const chunkData = JSON.stringify({ text: event.content });
          res.write(`event: chunk\ndata: ${chunkData}\n\n`);
        } else if (event.type === "done") {
          tokensUsed = event.tokensUsed || 0;
        }
      }

      // 5. Parse completed response for on-chain recording
      let parsedInsight;
      try {
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedInsight = JSON.parse(jsonMatch[0]);
        }
      } catch {
        console.warn("⚠️ Could not parse streaming response as JSON");
      }

      // 6. Record query on-chain (async)
      if (req.payment) {
        const resultHash = keccak256(toHex(fullContent));
        const payerAddress = req.payment.payer as Address;
        const paymentAmount = BigInt(req.payment.amount);
        const truncatedWallet = `${payerAddress.slice(0, 6)}...${payerAddress.slice(-4)}`;
        const amountAvax = Number(paymentAmount) / 1e18;

        // Record query event for analytics
        recordQueryEvent({
          type: "market",
          wallet: truncatedWallet,
          amount: amountAvax.toFixed(6),
          amountUsd: amountAvax * 35, // Approximate AVAX price
          timestamp: Date.now(),
          txHash: req.payment.txHash || "0x0",
          dataSource: {
            primary: "cryptocompare",
            latencyMs: dataFetchLatency,
            timestamp: Date.now(),
          },
        });

        recordQuery(payerAddress, "market", paymentAmount, resultHash)
          .then(({ txHash, queryId }) => {
            console.log(
              `✅ [STREAM] Query recorded: queryId=${queryId}, tx=${txHash}`
            );
          })
          .catch((err) => {
            console.error("❌ Failed to record query:", err.message);
          });
      }

      // 7. Send done event with summary
      const totalLatency = Date.now() - startTime;
      const doneData = JSON.stringify({
        complete: true,
        tokensUsed,
        totalLatencyMs: totalLatency,
        dataLatencyMs: dataFetchLatency,
        parsed: parsedInsight ? true : false,
      });
      res.write(`event: done\ndata: ${doneData}\n\n`);

      // Close the stream
      res.end();
    } catch (error) {
      console.error("❌ [STREAM] Error:", error);

      // Send error event
      const errorData = JSON.stringify({
        error: true,
        message: (error as Error).message,
      });
      res.write(`event: error\ndata: ${errorData}\n\n`);
      res.end();
    }
  }
);

export default router;
