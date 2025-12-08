/**
 * Dual-Mode x402 Payment Middleware
 *
 * Accepts BOTH payment types:
 * - x-402-payment: Custom AVAX flow (for SDK/Agents)
 * - x-payment: Thirdweb USDC flow (for Dashboard)
 *
 * This allows the same endpoint to accept either payment method.
 */

import type { Request, Response, NextFunction } from "express";
import { createThirdwebClient } from "thirdweb";
import { settlePayment, facilitator } from "thirdweb/x402";
import { avalancheFuji } from "thirdweb/chains";
import { createPublicClient, http, parseEther, formatEther } from "viem";
import { avalancheFuji as viemFuji } from "viem/chains";
import { calculatePrice } from "../lib/pricing.js";
import type { QueryType, PaymentData } from "../types/payment.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

// Thirdweb client (server-side)
const thirdwebClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

// Viem client for AVAX verification
const publicClient = createPublicClient({
  chain: viemFuji,
  transport: http(),
});

// Payment receiver
const PAYMENT_RECEIVER_ADDRESS = process.env.PAYMENT_RECEIVER_ADDRESS!;

// Fuji USDC token address
const FUJI_USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";

// Thirdweb facilitator
const thirdwebFacilitator = facilitator({
  client: thirdwebClient,
  serverWalletAddress: PAYMENT_RECEIVER_ADDRESS,
});

// Pricing
const QUERY_PRICES_USD: Record<QueryType, number> = {
  market: 0.02,
  price: 0.03,
  news: 0.02,
  portfolio: 0.05,
  social: 0.02,
  risk: 0.05,
};

// =============================================================================
// DUAL-MODE MIDDLEWARE
// =============================================================================

/**
 * Dual-mode payment middleware
 *
 * Flow:
 * 1. Check for x-payment header → Thirdweb USDC flow
 * 2. Check for x-402-payment header → Custom AVAX flow
 * 3. Neither present → Return 402 with both options
 */
export function dualModeX402Middleware(queryType: QueryType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    req.queryType = queryType;

    const priceUsd = QUERY_PRICES_USD[queryType] || 0.02;

    // Check which header is present
    const thirdwebHeader = req.headers["x-payment"] as string | undefined;
    const customHeader = req.headers["x-402-payment"] as string | undefined;

    console.log(`💳 [DualMode] Checking payment for ${queryType}...`);
    console.log(`   x-payment: ${thirdwebHeader ? "present" : "missing"}`);
    console.log(`   x-402-payment: ${customHeader ? "present" : "missing"}`);

    // ==== THIRDWEB USDC FLOW ====
    if (thirdwebHeader) {
      console.log("💸 Using Thirdweb USDC flow");
      try {
        const protocol = req.protocol;
        const host = req.get("host");
        const resourceUrl = `${protocol}://${host}${req.originalUrl}`;

        const result = await settlePayment({
          resourceUrl,
          method: req.method.toUpperCase(),
          paymentData: thirdwebHeader,
          payTo: PAYMENT_RECEIVER_ADDRESS,
          network: avalancheFuji,
          price: `$${priceUsd.toFixed(2)}`,
          routeConfig: {
            description: `QueryFlow ${queryType} insight`,
            mimeType: "application/json",
            maxTimeoutSeconds: 60,
          },
          facilitator: thirdwebFacilitator,
          waitUntil: "submitted",
        });

        if (result.status === 200) {
          // Payment successful
          for (const [key, value] of Object.entries(result.responseHeaders)) {
            res.setHeader(key, value);
          }

          req.payment = {
            verified: true,
            payer: result.paymentReceipt?.payer || "unknown",
            amount: "0",
            signature: "",
            timestamp: Date.now(),
            nonce: "",
            amountUsd: priceUsd,
            txHash: result.paymentReceipt?.transaction,
            mode: "usdc",
          };

          return next();
        }

        return res.status(result.status).json(result.responseBody);
      } catch (error) {
        console.error("❌ Thirdweb payment error:", error);
        return res.status(500).json({
          success: false,
          error: {
            code: "THIRDWEB_PAYMENT_ERROR",
            message: "Failed to settle USDC payment",
            details: (error as Error).message,
          },
        });
      }
    }

    // ==== CUSTOM AVAX FLOW ====
    if (customHeader) {
      console.log("💸 Using custom AVAX flow");
      try {
        const decoded = JSON.parse(
          Buffer.from(customHeader, "base64").toString()
        );
        const { payer, amount, txHash, mode, signature } = decoded;

        // Signature bypass mode (dev)
        if (mode === "signature" || !txHash) {
          console.log("🔐 Signature bypass mode");
          req.payment = {
            verified: true,
            payer: payer || "dev",
            amount: "0",
            signature: signature || "",
            timestamp: Date.now(),
            nonce: decoded.nonce || "",
            amountUsd: 0,
            mode: "signature",
          };
          return next();
        }

        // Real tx mode - verify on-chain
        if (txHash) {
          console.log(`🔍 Verifying tx: ${txHash}`);
          const receipt = await publicClient.getTransactionReceipt({
            hash: txHash as `0x${string}`,
          });

          if (receipt && receipt.status === "success") {
            const tx = await publicClient.getTransaction({
              hash: txHash as `0x${string}`,
            });

            req.payment = {
              verified: true,
              payer: payer || tx.from,
              amount: tx.value.toString(),
              signature: "",
              timestamp: Date.now(),
              nonce: "",
              amountUsd: priceUsd,
              txHash,
              mode: "avax",
            };

            console.log(
              `✅ AVAX payment verified: ${formatEther(tx.value)} AVAX`
            );
            return next();
          }
        }

        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PAYMENT",
            message: "Transaction not confirmed",
          },
        });
      } catch (error) {
        console.error("❌ AVAX payment verification error:", error);
        return res.status(400).json({
          success: false,
          error: {
            code: "PAYMENT_VERIFICATION_ERROR",
            message: (error as Error).message,
          },
        });
      }
    }

    // ==== NO PAYMENT - RETURN 402 ====
    console.log("📝 Returning 402 Payment Required");

    // Calculate AVAX price (assume $35/AVAX for testnet)
    const avaxPrice = 35;
    const priceAvax = (priceUsd / avaxPrice).toFixed(8);
    const priceUsdcWei = Math.ceil(priceUsd * 1e6); // USDC has 6 decimals

    // x402 response format expected by wrapFetchWithPayment:
    // { x402Version, accepts, error }
    return res.status(402).json({
      // x402 standard fields
      x402Version: 1,
      error: `Payment required: $${priceUsd.toFixed(2)}`,
      // Thirdweb expects "accepts" array with payment options
      accepts: [
        {
          scheme: "exact",
          network: `eip155:${avalancheFuji.id}`,
          payTo: PAYMENT_RECEIVER_ADDRESS,
          maxAmountRequired: String(priceUsdcWei),
          resource: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          description: `QueryFlow ${queryType} insight`,
          asset: FUJI_USDC_ADDRESS, // "asset" not "token"
          mimeType: "application/json",
          maxTimeoutSeconds: 60,
        },
      ],
      // Custom fields for AVAX payment option (backwards compatible)
      payment: {
        priceUsd,
        priceAvax,
        avaxPriceUsd: avaxPrice,
        paymentAddress: PAYMENT_RECEIVER_ADDRESS,
        expiresAt: Date.now() + 300000, // 5 minutes
      },
      instructions: {
        message: "Choose payment method:",
        avax: `Send ${priceAvax} AVAX to ${PAYMENT_RECEIVER_ADDRESS}, include txHash in x-402-payment header`,
        usdc: "Sign payment with Thirdweb SDK, include in x-payment header",
      },
      timestamp: Date.now(),
    });
  };
}

// Factory functions
export const dualModePayment = {
  market: () => dualModeX402Middleware("market"),
  price: () => dualModeX402Middleware("price"),
  news: () => dualModeX402Middleware("news"),
  portfolio: () => dualModeX402Middleware("portfolio"),
  social: () => dualModeX402Middleware("social"),
  risk: () => dualModeX402Middleware("risk"),
};
