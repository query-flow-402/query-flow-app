/**
 * Thirdweb x402 Payment Middleware
 *
 * Standard x402 protocol implementation using Thirdweb's settlePayment()
 * Replaces custom x402 middleware for ecosystem compatibility.
 */

import type { Request, Response, NextFunction } from "express";
import { createThirdwebClient } from "thirdweb";
import { settlePayment, facilitator } from "thirdweb/x402";
import { avalancheFuji } from "thirdweb/chains";
import { calculatePrice } from "../lib/pricing.js";
import type { QueryType, PaymentData } from "../types/payment.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

// Thirdweb client with secret key (server-side)
const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

// Server wallet address that receives payments
const PAYMENT_RECEIVER_ADDRESS = process.env.PAYMENT_RECEIVER_ADDRESS!;

// Thirdweb facilitator for payment verification and settlement
const thirdwebFacilitator = facilitator({
  client,
  serverWalletAddress: PAYMENT_RECEIVER_ADDRESS,
});

// =============================================================================
// TYPES
// =============================================================================

// Extend Express Request to include payment info
declare global {
  namespace Express {
    interface Request {
      payment?: PaymentData;
      queryType?: QueryType;
    }
  }
}

// =============================================================================
// PRICING
// =============================================================================

const QUERY_PRICES: Record<QueryType, string> = {
  market: "$0.02",
  price: "$0.03",
  news: "$0.02",
  portfolio: "$0.05",
  social: "$0.02",
  risk: "$0.05",
};

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Thirdweb x402 Payment Middleware
 *
 * Flow:
 * 1. Check for x-payment header (Thirdweb standard)
 * 2. If missing, return 402 with payment requirements
 * 3. If present, use settlePayment() to verify and settle
 * 4. If valid, attach payment info and continue
 */
export function thirdwebX402Middleware(queryType: QueryType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store query type on request
    req.queryType = queryType;

    // Get price for this query type
    const priceUsd = QUERY_PRICES[queryType] || "$0.02";

    // Build resource URL
    const protocol = req.protocol;
    const host = req.get("host");
    const resourceUrl = `${protocol}://${host}${req.originalUrl}`;

    // Get payment header (Thirdweb standard: x-payment)
    const paymentData = req.headers["x-payment"] as string | undefined;

    try {
      // Use Thirdweb's settlePayment to handle everything
      const result = await settlePayment({
        resourceUrl,
        method: req.method.toUpperCase(),
        paymentData: paymentData || null,
        payTo: PAYMENT_RECEIVER_ADDRESS,
        network: avalancheFuji,
        price: priceUsd,
        routeConfig: {
          description: `QueryFlow ${queryType} insight`,
          mimeType: "application/json",
          maxTimeoutSeconds: 60,
        },
        facilitator: thirdwebFacilitator,
        waitUntil: "submitted", // Fast settlement
      });

      if (result.status === 200) {
        // Payment successful!
        // Set payment receipt headers
        for (const [key, value] of Object.entries(result.responseHeaders)) {
          res.setHeader(key, value);
        }

        // Attach payment info to request for downstream use
        req.payment = {
          verified: true,
          payer: result.paymentReceipt?.payer || "unknown",
          amount: "0", // Amount is in the receipt
          signature: "",
          timestamp: Date.now(),
          nonce: "",
          amountUsd: parseFloat(priceUsd.replace("$", "")),
          txHash: result.paymentReceipt?.transaction,
        };

        return next();
      }

      // Payment required (402) or error
      return res.status(result.status).json(result.responseBody);
    } catch (error) {
      console.error("❌ x402 payment error:", error);

      return res.status(500).json({
        success: false,
        error: {
          code: "PAYMENT_ERROR",
          message: "Failed to process payment",
          details: (error as Error).message,
        },
        timestamp: Date.now(),
      });
    }
  };
}

/**
 * Factory to create middleware for specific query type
 */
export const thirdwebPaymentRequired = {
  market: () => thirdwebX402Middleware("market"),
  price: () => thirdwebX402Middleware("price"),
  news: () => thirdwebX402Middleware("news"),
  portfolio: () => thirdwebX402Middleware("portfolio"),
  social: () => thirdwebX402Middleware("social"),
  risk: () => thirdwebX402Middleware("risk"),
};
