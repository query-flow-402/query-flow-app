/**
 * Risk Scoring Endpoint
 * POST /api/v1/insights/risk
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { keccak256, toHex, type Address } from "viem";
import { x402Middleware } from "../../../middleware/x402.js";
import { x402RealPayment } from "../../../middleware/x402-real.js";
import { dualModeX402Middleware } from "../../../middleware/dual-mode-x402.js";
import { aiService } from "../../../services/ai.js";
import {
  getWalletData,
  analyzeRiskFactors,
  calculateRiskScore,
  formatWalletDataForPrompt,
  isValidAddress,
} from "../../../services/on-chain.js";
import { recordQuery } from "../../../lib/contracts.js";
import { recordQueryEvent } from "../../../services/analytics-cache.js";

// =============================================================================
// TYPES
// =============================================================================

interface RiskAssessment {
  risk: {
    score: number;
    level: "low" | "medium" | "high" | "critical";
    confidence: number;
  };
  factors: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
  }>;
  recommendation: string;
  metadata: {
    walletAge: string;
    txCount: number;
    totalVolume: string;
  };
  tokensUsed: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

const RiskRequestSchema = z.object({
  address: z.string().min(1, "Address is required"),
});

// =============================================================================
// ROUTER
// =============================================================================

const router = Router();

// Dynamic middleware selection based on PAYMENT_MODE
// Options: "signature" (dev), "real" (custom tx), "dual" (both AVAX and USDC)
function getPaymentMiddleware() {
  const mode = process.env.PAYMENT_MODE || "signature";
  if (mode === "dual") {
    return dualModeX402Middleware("risk");
  }
  return mode === "real" ? x402RealPayment("risk") : x402Middleware("risk");
}

/**
 * POST /risk
 * Get AI-powered wallet risk assessment
 */
router.post(
  "/risk",
  (req, res, next) => getPaymentMiddleware()(req, res, next),
  async (req: Request, res: Response) => {
    try {
      // 1. Validate request body
      const validation = RiskRequestSchema.safeParse(req.body);

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

      const { address } = validation.data;

      // Validate address format
      if (!isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ADDRESS",
            message: "Invalid Ethereum address format",
          },
          timestamp: Date.now(),
        });
      }

      // 2. Fetch on-chain data
      console.log(`🔍 Analyzing wallet: ${address}`);

      const walletData = await getWalletData(address as Address);
      const riskFactors = analyzeRiskFactors(walletData);
      const { score: baseScore, level: baseLevel } =
        calculateRiskScore(riskFactors);

      // 3. Format for AI and generate insight
      console.log("🤖 Generating risk assessment...");
      const formattedData = formatWalletDataForPrompt(walletData, riskFactors);
      const rawInsight = await aiService.generateInsight("risk", formattedData);

      // 4. Parse AI response
      const aiRisk = (
        rawInsight as unknown as {
          risk?: { score?: number; level?: string; confidence?: number };
        }
      ).risk;
      const aiFactors = (
        rawInsight as unknown as {
          factors?: Array<{
            type: string;
            severity: string;
            description: string;
          }>;
        }
      ).factors;
      const aiRecommendation = (
        rawInsight as unknown as { recommendation?: string }
      ).recommendation;

      const assessment: RiskAssessment = {
        risk: {
          score: aiRisk?.score || baseScore,
          level: (aiRisk?.level || baseLevel) as
            | "low"
            | "medium"
            | "high"
            | "critical",
          confidence: aiRisk?.confidence || 75,
        },
        factors: aiFactors?.map((f) => ({
          type: f.type,
          severity: f.severity as "low" | "medium" | "high",
          description: f.description,
        })) || [
          {
            type: "wallet_age",
            severity: riskFactors.isNewWallet ? "medium" : "low",
            description: `Wallet is ${walletData.walletAge}`,
          },
        ],
        recommendation:
          aiRecommendation ||
          `Risk level is ${baseLevel}. Exercise ${baseLevel === "low" ? "normal" : "increased"} caution.`,
        metadata: {
          walletAge: walletData.walletAge,
          txCount: walletData.txCount,
          totalVolume: walletData.balance,
        },
        tokensUsed: rawInsight.tokensUsed || 0,
      };

      // 5. Record query on-chain (async) + analytics cache
      if (req.payment) {
        const resultHash = keccak256(toHex(JSON.stringify(assessment)));
        const payerAddress = req.payment.payer as Address;
        const paymentAmount = BigInt(req.payment.amount);
        const truncatedWallet = `${payerAddress.slice(0, 6)}...${payerAddress.slice(-4)}`;

        // Record to analytics cache (immediate) - for Network tab
        recordQueryEvent({
          type: "risk",
          wallet: truncatedWallet,
          amount: (Number(paymentAmount) / 1e18).toFixed(6),
          amountUsd: (Number(paymentAmount) / 1e18) * 35,
          timestamp: Date.now(),
          txHash: req.payment.txHash || "0x0",
          dataSource: {
            primary: "openai",
            latencyMs: 0,
            timestamp: Date.now(),
          },
        });

        recordQuery(payerAddress, "risk", paymentAmount, resultHash)
          .then(({ txHash, queryId }) => {
            console.log(
              `✅ Risk query recorded: queryId=${queryId}, tx=${txHash}`
            );
          })
          .catch((err) => {
            console.error("❌ Failed to record risk query:", err.message);
          });
      }

      // 6. Return response
      res.json({
        success: true,
        data: assessment,
        metadata: {
          tokensUsed: assessment.tokensUsed,
          timestamp: Date.now(),
          queryType: "risk",
          cached: false,
          address,
        },
      });
    } catch (error) {
      console.error("❌ Risk endpoint error:", error);

      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process risk assessment request",
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
