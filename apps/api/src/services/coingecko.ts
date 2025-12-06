/**
 * CoinGecko Service
 * Fetch crypto market data from CoinGecko API
 */

import axios from "axios";
import { DataFetchError, RateLimitError } from "../lib/errors.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const COINGECKO_API_URL =
  process.env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3";

// Simple rate limiting (50 calls/min for free tier)
let lastCallTime = 0;
const MIN_CALL_INTERVAL_MS = 1200; // ~50 calls per minute

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

export interface MarketChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function rateLimitedFetch<T>(url: string): Promise<T> {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;

  if (timeSinceLastCall < MIN_CALL_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_CALL_INTERVAL_MS - timeSinceLastCall)
    );
  }

  lastCallTime = Date.now();

  try {
    const response = await axios.get<T>(url, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new RateLimitError("CoinGecko rate limit exceeded", 60);
      }
      throw new DataFetchError(`CoinGecko API error: ${error.message}`, {
        status: error.response?.status,
      });
    }
    throw new DataFetchError("Failed to fetch data from CoinGecko");
  }
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get current prices for multiple coins
 * @param coinIds - Array of CoinGecko coin IDs (e.g., ['bitcoin', 'ethereum'])
 */
export async function getCurrentPrices(
  coinIds: string[]
): Promise<PriceData[]> {
  const ids = coinIds.join(",");
  const url = `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`;

  return rateLimitedFetch<PriceData[]>(url);
}

/**
 * Get market chart data for a coin
 * @param coinId - CoinGecko coin ID
 * @param days - Number of days of data
 */
export async function getMarketChart(
  coinId: string,
  days: number = 7
): Promise<MarketChartData> {
  const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

  return rateLimitedFetch<MarketChartData>(url);
}

/**
 * Get trending coins
 */
export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  const url = `${COINGECKO_API_URL}/search/trending`;

  const data = await rateLimitedFetch<{ coins: Array<{ item: TrendingCoin }> }>(
    url
  );

  return data.coins.map((c) => c.item);
}

/**
 * Simple price lookup (faster, less data)
 */
export async function getSimplePrices(
  coinIds: string[]
): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
  const ids = coinIds.join(",");
  const url = `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  return rateLimitedFetch<
    Record<string, { usd: number; usd_24h_change: number }>
  >(url);
}

/**
 * Map common asset names to CoinGecko IDs
 */
export function normalizeAssetId(asset: string): string {
  const mapping: Record<string, string> = {
    btc: "bitcoin",
    eth: "ethereum",
    avax: "avalanche-2",
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
