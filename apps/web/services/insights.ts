/**
 * Insights API Service
 * Handles all insight-related API calls (market, price, risk, social)
 */

import apiClient from "@/config/axios-config";
import type { AxiosError } from "axios";

// =============================================================================
// TYPES
// =============================================================================

export interface InsightResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    tokensUsed: number;
    timestamp: number;
    queryType: string;
  };
}

export interface MarketInsight {
  tokensUsed: number;
  sentiment: {
    score: number;
    trend: "bullish" | "bearish" | "neutral";
    summary: string;
  };
  factors: string[];
}

export interface PriceInsight {
  prediction: {
    targetPrice: number;
    direction: "bullish" | "bearish" | "neutral";
    confidence: number;
    timeframe: string;
  };
  signals: Array<{
    indicator: string;
    value: string;
    impact: "positive" | "negative" | "neutral";
  }>;
  technicalAnalysis?: {
    rsi: number;
    support: number;
    resistance: number;
    trend: string;
  };
  context: string;
}

export interface RiskInsight {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  factors: string[];
}

export interface SocialInsight {
  sentiment: number;
  trend: "bullish" | "bearish" | "neutral";
  summary: string;
  topics: string[];
}

// =============================================================================
// PAYMENT REQUIREMENT (402 Response)
// =============================================================================

export interface PaymentRequirement {
  priceUsd: number;
  priceAvax: string;
  avaxPriceUsd: number;
  paymentAddress: string;
  expiresAt: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get payment requirements for an insight query
 * Makes initial request to get 402 response with pricing
 */
export async function getPaymentRequirements(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<PaymentRequirement | null> {
  try {
    await apiClient.post(endpoint, payload);
    // If we get here without 402, payment not required
    return null;
  } catch (error) {
    const axiosError = error as AxiosError<{ payment: PaymentRequirement }>;
    if (axiosError.response?.status === 402) {
      return axiosError.response.data.payment;
    }
    throw error;
  }
}

/**
 * Fetch insight with payment header
 * Called after payment has been made
 */
export async function fetchInsightWithPayment<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  paymentHeader: string
): Promise<InsightResponse<T>> {
  const response = await apiClient.post<InsightResponse<T>>(endpoint, payload, {
    headers: {
      "x-402-payment": paymentHeader,
    },
  });
  return response.data;
}

// =============================================================================
// CONVENIENCE FUNCTIONS (For non-payment flows like testing)
// =============================================================================

export async function getMarketInsight(
  assets: string[],
  timeframe: string = "24h",
  paymentHeader?: string
): Promise<InsightResponse<MarketInsight>> {
  const response = await apiClient.post<InsightResponse<MarketInsight>>(
    "/api/v1/insights/market",
    { assets, timeframe },
    paymentHeader ? { headers: { "x-402-payment": paymentHeader } } : {}
  );
  return response.data;
}

export async function getPriceInsight(
  asset: string,
  timeframe: string = "24h",
  paymentHeader?: string
): Promise<InsightResponse<PriceInsight>> {
  const response = await apiClient.post<InsightResponse<PriceInsight>>(
    "/api/v1/insights/price",
    { asset, timeframe },
    paymentHeader ? { headers: { "x-402-payment": paymentHeader } } : {}
  );
  return response.data;
}

export async function getRiskInsight(
  address: string,
  paymentHeader?: string
): Promise<InsightResponse<RiskInsight>> {
  const response = await apiClient.post<InsightResponse<RiskInsight>>(
    "/api/v1/insights/risk",
    { address },
    paymentHeader ? { headers: { "x-402-payment": paymentHeader } } : {}
  );
  return response.data;
}

export async function getSocialInsight(
  asset: string,
  paymentHeader?: string
): Promise<InsightResponse<SocialInsight>> {
  const response = await apiClient.post<InsightResponse<SocialInsight>>(
    "/api/v1/insights/social",
    { asset },
    paymentHeader ? { headers: { "x-402-payment": paymentHeader } } : {}
  );
  return response.data;
}
