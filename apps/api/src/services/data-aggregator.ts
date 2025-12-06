/**
 * Data Aggregator
 * Combine data from multiple sources for AI analysis
 */

import {
  getCurrentPrices,
  getTrendingCoins,
  getSimplePrices,
  normalizeAssetId,
  type PriceData,
  type TrendingCoin,
} from "./coingecko.js";
import { DataFetchError } from "../lib/errors.js";

// =============================================================================
// TYPES
// =============================================================================

export interface AggregatedMarketData {
  prices: PriceData[];
  trending: TrendingCoin[];
  summary: {
    totalMarketCap: number;
    avgPriceChange24h: number;
    marketSentiment: "bullish" | "bearish" | "neutral";
  };
  timestamp: number;
}

// =============================================================================
// AGGREGATION FUNCTIONS
// =============================================================================

/**
 * Aggregate market data from multiple sources
 * @param assets - Array of asset names/symbols
 */
export async function aggregateMarketData(
  assets: string[]
): Promise<AggregatedMarketData> {
  // Normalize asset IDs
  const coinIds = assets.map(normalizeAssetId);

  try {
    // Fetch data in parallel
    const [prices, trending] = await Promise.all([
      getCurrentPrices(coinIds),
      getTrendingCoins().catch(() => []), // Non-critical, continue if fails
    ]);

    // Calculate summary
    const totalMarketCap = prices.reduce(
      (sum, p) => sum + (p.market_cap || 0),
      0
    );
    const avgPriceChange =
      prices.length > 0
        ? prices.reduce(
            (sum, p) => sum + (p.price_change_percentage_24h || 0),
            0
          ) / prices.length
        : 0;

    // Determine market sentiment
    let marketSentiment: "bullish" | "bearish" | "neutral";
    if (avgPriceChange > 3) {
      marketSentiment = "bullish";
    } else if (avgPriceChange < -3) {
      marketSentiment = "bearish";
    } else {
      marketSentiment = "neutral";
    }

    return {
      prices,
      trending: trending.slice(0, 5), // Top 5 trending
      summary: {
        totalMarketCap,
        avgPriceChange24h: avgPriceChange,
        marketSentiment,
      },
      timestamp: Date.now(),
    };
  } catch (error) {
    if (error instanceof DataFetchError) throw error;
    throw new DataFetchError("Failed to aggregate market data", {
      originalError: (error as Error).message,
    });
  }
}

/**
 * Format market data for AI prompt
 */
export function formatDataForPrompt(data: AggregatedMarketData): string {
  const priceInfo = data.prices
    .map(
      (p) =>
        `${p.name} (${p.symbol.toUpperCase()}): $${p.current_price.toLocaleString()} (${p.price_change_percentage_24h >= 0 ? "+" : ""}${p.price_change_percentage_24h.toFixed(2)}% 24h)`
    )
    .join("\n");

  const trendingInfo =
    data.trending.length > 0
      ? `\n\nTrending: ${data.trending.map((t) => t.name).join(", ")}`
      : "";

  return `${priceInfo}${trendingInfo}\n\nOverall 24h change: ${data.summary.avgPriceChange24h >= 0 ? "+" : ""}${data.summary.avgPriceChange24h.toFixed(2)}%`;
}
