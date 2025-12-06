/**
 * Social Sentiment Endpoint
 * POST /api/v1/insights/social
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { keccak256, toHex, type Address } from "viem";
import { x402Middleware } from "../../../middleware/x402.js";
import { aiService } from "../../../services/ai.js";
import {
  getSocialData,
  formatSocialDataForPrompt,
} from "../../../services/social.js";
import { recordQuery } from "../../../lib/contracts.js";

// =============================================================================
// TYPES
// =============================================================================

interface SocialSentiment {
  sentiment: {
    score: number;
    trend: "bullish" | "bearish" | "neutral";
    volume: "low" | "medium" | "high";
  };
  trending: Array<{
    topic: string;
    mentions: number;
    sentiment: string;
  }>;
  summary: string;
  warnings: string[];
  tokensUsed: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

const SocialRequestSchema = z.object({
  asset: z.string().min(1, "Asset is required"),
});

// =============================================================================
// ROUTER
// =============================================================================

const router = Router();

/**
 * POST /social
 * Get AI-powered social media sentiment analysis
 */
router.post(
  "/social",
  x402Middleware("social"),
  async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const validation = SocialRequestSchema.safeParse(req.body);

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

      const { asset } = validation.data;

      // 2. Fetch social data
      console.log(`📱 Fetching social data for: ${asset}`);

      const socialData = await getSocialData(asset);
      const formattedData = formatSocialDataForPrompt(socialData);

      // 3. Generate AI insight
      console.log("🤖 Generating social sentiment analysis...");
      const rawInsight = await aiService.generateInsight(
        "social",
        formattedData
      );

      // 4. Parse AI response
      const aiSentiment = (
        rawInsight as unknown as {
          sentiment?: { score?: number; trend?: string; volume?: string };
        }
      ).sentiment;
      const aiTrending = (
        rawInsight as unknown as {
          trending?: Array<{
            topic: string;
            mentions: number;
            sentiment: string;
          }>;
        }
      ).trending;
      const aiSummary = (rawInsight as unknown as { summary?: string }).summary;
      const aiWarnings = (rawInsight as unknown as { warnings?: string[] })
        .warnings;

      const socialSentiment: SocialSentiment = {
        sentiment: {
          score: aiSentiment?.score || socialData.summary.sentimentScore,
          trend: (aiSentiment?.trend || "neutral") as
            | "bullish"
            | "bearish"
            | "neutral",
          volume: (aiSentiment?.volume || socialData.summary.volumeLevel) as
            | "low"
            | "medium"
            | "high",
        },
        trending:
          aiTrending ||
          socialData.trending.slice(0, 3).map((t) => ({
            topic: t.topic,
            mentions: t.mentions,
            sentiment: t.sentiment,
          })),
        summary:
          aiSummary ||
          `Social sentiment for ${asset} is ${socialData.summary.sentimentScore > 60 ? "positive" : socialData.summary.sentimentScore < 40 ? "negative" : "neutral"}.`,
        warnings: aiWarnings || socialData.warnings,
        tokensUsed: rawInsight.tokensUsed || 0,
      };

      // 5. Record query on-chain (async)
      if (req.payment) {
        const resultHash = keccak256(toHex(JSON.stringify(socialSentiment)));
        const payerAddress = req.payment.payer as Address;
        const paymentAmount = BigInt(req.payment.amount);

        recordQuery(payerAddress, "social", paymentAmount, resultHash)
          .then(({ txHash, queryId }) => {
            console.log(
              `✅ Social query recorded: queryId=${queryId}, tx=${txHash}`
            );
          })
          .catch((err) => {
            console.error("❌ Failed to record social query:", err.message);
          });
      }

      // 6. Return response
      res.json({
        success: true,
        data: socialSentiment,
        metadata: {
          tokensUsed: socialSentiment.tokensUsed,
          timestamp: Date.now(),
          queryType: "social",
          cached: false,
          dataSource: "mock", // In production: 'twitter', 'reddit', etc.
        },
      });
    } catch (error) {
      console.error("❌ Social endpoint error:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process social sentiment request",
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
