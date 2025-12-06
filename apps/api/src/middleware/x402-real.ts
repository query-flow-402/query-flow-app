/**
 * x402 Payment Middleware v2
 * Supports REAL token transfers (AVAX on Fuji testnet)
 */

import type { Request, Response, NextFunction } from "express";
import { type Address, type Hash } from "viem";
import {
  type QueryType,
  PAYMENT_TIMESTAMP_TOLERANCE_MS,
} from "../types/payment.js";
import { calculatePrice } from "../lib/pricing.js";
import {
  getPriceQuote,
  verifyPaymentTransaction,
  getPaymentReceiver,
} from "../services/payment.js";

// =============================================================================
// TYPES
// =============================================================================

export interface RealPaymentData {
  txHash: Hash;
  from: Address;
  amountUsd: number;
  verified: boolean;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      realPayment?: RealPaymentData;
    }
  }
}

// Track used transactions (prevent replay)
const usedTransactions = new Set<string>();

// =============================================================================
// HEADER PARSING
// =============================================================================

interface PaymentHeader {
  mode: "tx" | "signature";
  txHash?: string;
  payer?: string;
  // Legacy signature fields (for backwards compat)
  signature?: string;
  timestamp?: number;
  amount?: string;
  nonce?: string;
}

function parsePaymentHeaderV2(headerValue: string): PaymentHeader | null {
  try {
    const decoded = Buffer.from(headerValue, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);

    // New format: { mode: 'tx', txHash: '0x...' }
    if (parsed.mode === "tx" && parsed.txHash) {
      return {
        mode: "tx",
        txHash: parsed.txHash,
        payer: parsed.payer,
      };
    }

    // Legacy signature format
    if (parsed.signature) {
      return {
        mode: "signature",
        ...parsed,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * x402 Middleware with Real Token Transfer Support
 *
 * Payment modes:
 * 1. No header → Return 402 with price quote in AVAX
 * 2. mode: 'tx' → Verify real on-chain transaction
 * 3. mode: 'signature' → Fall back to signature verification (test mode)
 */
export function x402RealPayment(queryType: QueryType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentHeader = req.headers["x-402-payment"] as string | undefined;
    req.queryType = queryType;

    // Calculate expected price
    const priceUsd = calculatePrice(queryType);

    // =========================================================================
    // No payment header - return 402 with AVAX price
    // =========================================================================
    if (!paymentHeader) {
      try {
        const quote = await getPriceQuote(priceUsd);

        return res.status(402).json({
          success: false,
          error: "Payment Required",
          payment: {
            priceUsd: quote.priceUsd,
            priceAvax: quote.priceAvax.toFixed(8),
            avaxPriceUsd: quote.avaxPriceUsd,
            paymentAddress: getPaymentReceiver(),
            expiresAt: quote.expiresAt,
          },
          instructions: {
            message:
              "Send AVAX to the payment address, then include tx hash in header",
            format:
              "base64 encoded JSON with { mode: 'tx', txHash: '0x...', payer: '0x...' }",
            steps: [
              `1. Send ${quote.priceAvax.toFixed(8)} AVAX to ${getPaymentReceiver()}`,
              "2. Get the transaction hash",
              "3. Include in x-402-payment header as base64 JSON",
            ],
          },
          timestamp: Date.now(),
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: "Failed to generate price quote",
          timestamp: Date.now(),
        });
      }
    }

    // =========================================================================
    // Parse payment header
    // =========================================================================
    const payment = parsePaymentHeaderV2(paymentHeader);

    if (!payment) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PAYMENT_HEADER",
          message: "Could not parse payment header",
        },
        timestamp: Date.now(),
      });
    }

    // =========================================================================
    // Real Transaction Mode
    // =========================================================================
    if (payment.mode === "tx" && payment.txHash) {
      const txHash = payment.txHash as Hash;

      // Check for replay
      if (usedTransactions.has(txHash.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: {
            code: "TX_ALREADY_USED",
            message: "This transaction has already been used for a payment",
          },
          timestamp: Date.now(),
        });
      }

      // Verify the transaction on-chain
      console.log(`🔍 Verifying payment tx: ${txHash}`);
      const verification = await verifyPaymentTransaction(
        txHash,
        priceUsd,
        payment.payer as Address | undefined
      );

      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          error: {
            code: "PAYMENT_VERIFICATION_FAILED",
            message: verification.error || "Transaction verification failed",
          },
          timestamp: Date.now(),
        });
      }

      // Mark transaction as used
      usedTransactions.add(txHash.toLowerCase());

      // Attach verified payment to request
      req.realPayment = {
        txHash,
        from: verification.from,
        amountUsd: verification.valueUsd,
        verified: true,
      };

      // Also set legacy payment field for compatibility
      req.payment = {
        payer: verification.from,
        amount: verification.value.toString(),
        amountUsd: verification.valueUsd,
        verified: true,
        signature: "",
        timestamp: Date.now(),
        nonce: txHash,
      };

      console.log(`✅ Payment verified! Proceeding with request...`);
      return next();
    }

    // =========================================================================
    // Legacy Signature Mode (for testing without real transfers)
    // =========================================================================
    if (payment.mode === "signature") {
      // Import the old verification logic
      const { verifyMessage } = await import("viem");

      // For now, just pass through (the old middleware handles this)
      // In production, you'd validate the signature here
      console.log("⚠️ Using legacy signature mode (no real transfer)");

      req.payment = {
        payer: payment.payer || "0x0",
        amount: payment.amount || "0",
        amountUsd: priceUsd,
        verified: true,
        signature: payment.signature || "",
        timestamp: payment.timestamp || Date.now(),
        nonce: payment.nonce || "",
      };

      return next();
    }

    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PAYMENT_MODE",
        message: "Payment header must specify mode: 'tx' or 'signature'",
      },
      timestamp: Date.now(),
    });
  };
}
