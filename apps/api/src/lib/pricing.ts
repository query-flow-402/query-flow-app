/**
 * Pricing Engine
 * Calculate query prices based on type and estimated token usage
 */

import { type QueryType, USDC_DECIMALS } from "../types/payment.js";

// =============================================================================
// PRICING CONFIGURATION
// =============================================================================

interface PriceConfig {
  basePrice: number; // Base USD price
  tokenMultiplier: number; // Additional cost per 1K tokens
  maxPrice: number; // Price ceiling in USD
}

const PRICING: Record<QueryType, PriceConfig> = {
  market: {
    basePrice: 0.02,
    tokenMultiplier: 0.00001,
    maxPrice: 0.1,
  },
  price: {
    basePrice: 0.01,
    tokenMultiplier: 0.000005,
    maxPrice: 0.05,
  },
  news: {
    basePrice: 0.03,
    tokenMultiplier: 0.00002,
    maxPrice: 0.15,
  },
  portfolio: {
    basePrice: 0.05,
    tokenMultiplier: 0.00003,
    maxPrice: 0.2,
  },
  social: {
    basePrice: 0.02,
    tokenMultiplier: 0.00001,
    maxPrice: 0.08,
  },
};

// =============================================================================
// PRICING FUNCTIONS
// =============================================================================

/**
 * Calculate the price for a query
 * @param queryType - Type of query
 * @param estimatedTokens - Estimated token usage (optional)
 * @returns Price in USD
 */
export function calculatePrice(
  queryType: QueryType,
  estimatedTokens?: number
): number {
  const config = PRICING[queryType];

  let price = config.basePrice;

  if (estimatedTokens) {
    const tokenCost = (estimatedTokens / 1000) * config.tokenMultiplier;
    price += tokenCost;
  }

  // Apply ceiling
  return Math.min(price, config.maxPrice);
}

/**
 * Convert USD amount to USDC in wei (6 decimals)
 * @param usd - Amount in USD
 * @returns Amount in USDC wei (bigint)
 */
export function usdToUsdc(usd: number): bigint {
  // USDC has 6 decimals
  const usdcAmount = Math.round(usd * Math.pow(10, USDC_DECIMALS));
  return BigInt(usdcAmount);
}

/**
 * Convert USDC wei to USD
 * @param usdc - Amount in USDC wei
 * @returns Amount in USD
 */
export function usdcToUsd(usdc: bigint): number {
  return Number(usdc) / Math.pow(10, USDC_DECIMALS);
}

/**
 * Validate that a price is within acceptable bounds
 */
export function validatePrice(price: number): boolean {
  return price >= 0.01 && price <= 0.5;
}

/**
 * Get pricing info for a query type
 */
export function getPricingInfo(queryType: QueryType): PriceConfig {
  return PRICING[queryType];
}

/**
 * Estimate tokens based on prompt length
 * Rough estimate: 1 token ≈ 4 characters
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Format price for display
 */
export function formatPrice(usd: number): string {
  return `$${usd.toFixed(4)}`;
}
