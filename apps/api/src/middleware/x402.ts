/**
 * x402 Payment Middleware
 * Handles payment verification for pay-per-query API
 */

import type { Request, Response, NextFunction } from "express";
import { verifyMessage, type Address, type Hex } from "viem";
import {
  PaymentHeaderSchema,
  type PaymentData,
  type QueryType,
  PAYMENT_TIMESTAMP_TOLERANCE_MS,
} from "../types/payment.js";
import { calculatePrice, usdToUsdc, usdcToUsd } from "../lib/pricing.js";
import { PaymentRequiredError, InvalidSignatureError } from "../lib/errors.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const PAYMENT_RECEIVER_ADDRESS =
  process.env.PAYMENT_RECEIVER_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// In-memory nonce storage (use Redis in production)
const usedNonces = new Set<string>();

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
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique nonce for payment requests
 */
export function generateNonce(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Parse x-402-payment header
 */
function parsePaymentHeader(headerValue: string): PaymentData | null {
  try {
    // Header format: base64 encoded JSON
    const decoded = Buffer.from(headerValue, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    const validated = PaymentHeaderSchema.parse(parsed);

    return {
      ...validated,
      verified: false,
      amountUsd: usdcToUsd(BigInt(validated.amount)),
    };
  } catch {
    return null;
  }
}

/**
 * Create the message that should be signed by the payer
 */
function createPaymentMessage(
  amount: string,
  receiver: string,
  nonce: string,
  timestamp: number
): string {
  return `QueryFlow Payment\nAmount: ${amount}\nTo: ${receiver}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

/**
 * Verify payment signature
 */
async function verifyPaymentSignature(payment: PaymentData): Promise<boolean> {
  try {
    const message = createPaymentMessage(
      payment.amount,
      PAYMENT_RECEIVER_ADDRESS,
      payment.nonce,
      payment.timestamp
    );

    const isValid = await verifyMessage({
      address: payment.payer as Address,
      message,
      signature: payment.signature as Hex,
    });

    return isValid;
  } catch {
    return false;
  }
}

/**
 * Validate payment timestamp (within tolerance)
 */
function validateTimestamp(timestamp: number): boolean {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  return diff <= PAYMENT_TIMESTAMP_TOLERANCE_MS;
}

/**
 * Validate payment amount matches expected price
 */
function validateAmount(payment: PaymentData, expectedPrice: number): boolean {
  const expectedUsdc = usdToUsdc(expectedPrice);
  const paidUsdc = BigInt(payment.amount);

  // Allow 1% tolerance for rounding
  const tolerance = expectedUsdc / 100n;
  return paidUsdc >= expectedUsdc - tolerance;
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * x402 Payment Middleware
 *
 * Flow:
 * 1. Check for x-402-payment header
 * 2. If missing, return 402 with payment requirements
 * 3. If present, verify signature and amount
 * 4. If valid, attach payment to request and continue
 */
export function x402Middleware(queryType: QueryType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentHeader = req.headers["x-402-payment"] as string | undefined;

    // Store query type on request for later use
    req.queryType = queryType;

    // Calculate expected price
    const price = calculatePrice(queryType);

    // No payment header - return 402 Payment Required
    if (!paymentHeader) {
      const nonce = generateNonce();

      return res.status(402).json({
        success: false,
        error: "Payment Required",
        payment: {
          price,
          priceUsdc: usdToUsdc(price).toString(),
          paymentAddress: PAYMENT_RECEIVER_ADDRESS,
          nonce,
          expiresAt: Date.now() + PAYMENT_TIMESTAMP_TOLERANCE_MS,
        },
        instructions: {
          message: "Sign the payment message with your wallet",
          format: "base64 encoded JSON in x-402-payment header",
          fields: ["signature", "timestamp", "amount", "nonce", "payer"],
        },
        timestamp: Date.now(),
      });
    }

    // Parse payment header
    const payment = parsePaymentHeader(paymentHeader);

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

    // Validate timestamp
    if (!validateTimestamp(payment.timestamp)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PAYMENT_EXPIRED",
          message: "Payment timestamp is outside acceptable range",
        },
        timestamp: Date.now(),
      });
    }

    // Check nonce hasn't been used
    if (usedNonces.has(payment.nonce)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NONCE_REUSED",
          message: "Payment nonce has already been used",
        },
        timestamp: Date.now(),
      });
    }

    // Validate amount
    if (!validateAmount(payment, price)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PAYMENT",
          message: `Payment amount insufficient. Expected at least $${price.toFixed(4)}`,
          expected: price,
          received: payment.amountUsd,
        },
        timestamp: Date.now(),
      });
    }

    // Verify signature
    const isValid = await verifyPaymentSignature(payment);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_SIGNATURE",
          message: "Payment signature verification failed",
        },
        timestamp: Date.now(),
      });
    }

    // Mark nonce as used
    usedNonces.add(payment.nonce);

    // Attach verified payment to request
    payment.verified = true;
    req.payment = payment;

    next();
  };
}

/**
 * Factory to create middleware for specific query type
 */
export const paymentRequired = {
  market: () => x402Middleware("market"),
  price: () => x402Middleware("price"),
  news: () => x402Middleware("news"),
  portfolio: () => x402Middleware("portfolio"),
  social: () => x402Middleware("social"),
};
