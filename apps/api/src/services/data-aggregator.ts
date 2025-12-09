/**
 * Data Aggregator
 * Combine data from multiple sources for AI analysis
 *
 * Architecture:
 * - Moralis: Real-time prices (40k queries/day)
 * - CryptoCompare: Trending coins (250k calls/month)
 */

import * as moralis from "./moralis.js";
import * as cryptocompare from "./cryptocompare.js";
import { DataFetchError } from "../lib/errors.js";

// =============================================================================
// CACHING
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const priceCache = new Map<string, CacheEntry<PriceData[]>>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCached<T>(
  key: string,
  cache: Map<string, CacheEntry<T>>
): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    console.log(`[Cache] Hit for ${key}`);
    return entry.data;
  }
  return null;
}

function setCache<T>(
  key: string,
  data: T,
  cache: Map<string, CacheEntry<T>>
): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// =============================================================================
// TYPES
// =============================================================================

export interface PriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  score: number;
}

export interface AggregatedMarketData {
  prices: PriceData[];
  trending: TrendingCoin[];
  summary: {
    totalMarketCap: number;
    avgPriceChange24h: number;
    marketSentiment: "bullish" | "bearish" | "neutral";
  };
  timestamp: number;
  dataSource: "moralis" | "cache";
}

// =============================================================================
// ASSET MAPPING
// =============================================================================

/**
 * Map common asset names to normalized IDs
 */
export function normalizeAssetId(asset: string): string {
  const mapping: Record<string, string> = {
    btc: "bitcoin",
    eth: "ethereum",
    ethereum: "ethereum",
    avax: "avalanche-2",
    avalanche: "avalanche-2",
    usdc: "usd-coin",
    usdt: "tether",
    sol: "solana",
    bnb: "binancecoin",
    xrp: "ripple",
    ada: "cardano",
    doge: "dogecoin",
  };

  const lower = asset.toLowerCase();
  return mapping[lower] || lower;
}

// =============================================================================
// AGGREGATION FUNCTIONS
// =============================================================================

/**
 * Aggregate market data from multiple sources
 * - Moralis: Real-time prices
 * - CryptoCompare: Trending coins
 * @param assets - Array of asset names/symbols
 */
export async function aggregateMarketData(
  assets: string[]
): Promise<AggregatedMarketData> {
  const coinIds = assets.map(normalizeAssetId);
  const cacheKey = coinIds.sort().join(",");

  // 1. Check cache first
  const cached = getCached(cacheKey, priceCache);
  if (cached) {
    return buildResponse(cached, [], "cache");
  }

  // 2. Fetch prices from Moralis + trending from CryptoCompare in parallel
  try {
    console.log("[DataAggregator] Fetching from Moralis + CryptoCompare...");

    const [moralisPrices, trending] = await Promise.all([
      moralis.getPricesByIds(coinIds),
      cryptocompare.getTrendingCoins(5).catch(() => []), // Non-critical
    ]);

    if (Object.keys(moralisPrices).length === 0) {
      throw new DataFetchError("No price data returned from Moralis");
    }

    // Convert Moralis response to PriceData format
    const prices: PriceData[] = coinIds.map((id) => ({
      id,
      symbol: id.substring(0, 3).toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
      current_price: moralisPrices[id] || 0,
      price_change_24h: 0,
      price_change_percentage_24h: 0,
      market_cap: 0,
      total_volume: 0,
    }));

    console.log("[DataAggregator] Moralis + CryptoCompare success");

    // Cache the response
    setCache(cacheKey, prices, priceCache);

    return buildResponse(prices, trending, "moralis");
  } catch (error) {
    console.error("[DataAggregator] Error:", (error as Error).message);
    throw new DataFetchError("Failed to fetch market data", {
      originalError: (error as Error).message,
    });
  }
}

function buildResponse(
  prices: PriceData[],
  trending: TrendingCoin[],
  dataSource: "moralis" | "cache"
): AggregatedMarketData {
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

  // Default to neutral since Moralis doesn't provide 24h change in free tier
  const marketSentiment: "bullish" | "bearish" | "neutral" = "neutral";

  return {
    prices,
    trending: trending.slice(0, 5),
    summary: {
      totalMarketCap,
      avgPriceChange24h: avgPriceChange,
      marketSentiment,
    },
    timestamp: Date.now(),
    dataSource,
  };
}

/**
 * Format market data for AI prompt
 */
export function formatDataForPrompt(data: AggregatedMarketData): string {
  const priceInfo = data.prices
    .map(
      (p) =>
        `${p.name} (${p.symbol.toUpperCase()}): $${p.current_price.toLocaleString()}`
    )
    .join("\n");

  const trendingInfo =
    data.trending.length > 0
      ? `\n\nTrending: ${data.trending.map((t) => t.name).join(", ")}`
      : "";

  return `${priceInfo}${trendingInfo}\n\nData source: Moralis Web3 API`;
}
