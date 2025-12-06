/**
 * Payment Types & Schemas
 * Zod validation schemas for x402 payment flow
 */

import { z } from "zod";

// =============================================================================
// QUERY TYPES
// =============================================================================

export const QueryTypeSchema = z.enum([
  "market",
  "price",
  "news",
  "portfolio",
  "social",
  "risk",
]);
export type QueryType = z.infer<typeof QueryTypeSchema>;

// =============================================================================
// PAYMENT SCHEMAS
// =============================================================================

/** Ethereum address regex */
const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

/** Payment header sent by client */
export const PaymentHeaderSchema = z.object({
  signature: z.string().min(1, "Signature is required"),
  timestamp: z.number().int().positive(),
  amount: z.string().regex(/^\d+$/, "Amount must be a numeric string (wei)"),
  nonce: z.string().min(1, "Nonce is required"),
  payer: z.string().regex(ethAddressRegex, "Invalid payer address"),
});

export type PaymentHeader = z.infer<typeof PaymentHeaderSchema>;

/** Parsed payment data after verification */
export interface PaymentData extends PaymentHeader {
  verified: boolean;
  amountUsd: number;
}

// =============================================================================
// PRICING SCHEMAS
// =============================================================================

export const PricingSchema = z.object({
  queryType: QueryTypeSchema,
  basePrice: z.number().min(0.01).max(0.5),
  estimatedTokens: z.number().optional(),
  finalPrice: z.number(),
});

export type Pricing = z.infer<typeof PricingSchema>;

// =============================================================================
// REQUEST SCHEMAS
// =============================================================================

export const MarketRequestSchema = z.object({
  assets: z
    .array(z.string())
    .min(1, "At least one asset required")
    .max(5, "Maximum 5 assets"),
  timeframe: z.enum(["1h", "4h", "24h", "7d"]).default("24h"),
});

export type MarketRequest = z.infer<typeof MarketRequestSchema>;

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface InsightResponse<T = unknown> {
  success: true;
  data: T;
  metadata: {
    tokensUsed: number;
    timestamp: number;
    queryType: QueryType;
    cached: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: number;
}

export type ApiResponse<T = unknown> = InsightResponse<T> | ErrorResponse;

// =============================================================================
// SENTIMENT TYPES
// =============================================================================

export interface MarketSentiment {
  sentiment: {
    score: number; // 0-100
    trend: "bullish" | "bearish" | "neutral";
    summary: string;
  };
  factors: string[];
  tokensUsed: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** USDC has 6 decimals */
export const USDC_DECIMALS = 6;

/** Payment timestamp tolerance (5 minutes) */
export const PAYMENT_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;
