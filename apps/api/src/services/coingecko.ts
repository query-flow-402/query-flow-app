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

// =============================================================================
// TECHNICAL ANALYSIS HELPERS
// =============================================================================

export interface TechnicalIndicators {
  currentPrice: number;
  priceChange7d: number;
  priceChange30d: number;
  sma7: number;
  sma30: number;
  rsi: number;
  volumeTrend: "increasing" | "decreasing" | "stable";
  support: number;
  resistance: number;
}

/**
 * Calculate technical indicators from chart data
 */
export function calculateIndicators(
  chartData: MarketChartData,
  currentPrice: number
): TechnicalIndicators {
  const prices = chartData.prices.map((p) => p[1]);
  const volumes = chartData.total_volumes.map((v) => v[1]);

  // Simple Moving Averages
  const sma7 =
    prices.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, prices.length);
  const sma30 =
    prices.slice(-30).reduce((a, b) => a + b, 0) / Math.min(30, prices.length);

  // Price changes
  const price7dAgo = prices[Math.max(0, prices.length - 7)] || currentPrice;
  const price30dAgo = prices[0] || currentPrice;
  const priceChange7d = ((currentPrice - price7dAgo) / price7dAgo) * 100;
  const priceChange30d = ((currentPrice - price30dAgo) / price30dAgo) * 100;

  // RSI (simplified - 14 period)
  const rsi = calculateRSI(prices.slice(-14));

  // Volume trend
  const recentVolume = volumes.slice(-7).reduce((a, b) => a + b, 0) / 7;
  const olderVolume = volumes.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
  const volumeChange = ((recentVolume - olderVolume) / olderVolume) * 100;
  const volumeTrend =
    volumeChange > 10
      ? "increasing"
      : volumeChange < -10
        ? "decreasing"
        : "stable";

  // Support/Resistance (simple min/max of recent data)
  const recentPrices = prices.slice(-14);
  const support = Math.min(...recentPrices);
  const resistance = Math.max(...recentPrices);

  return {
    currentPrice,
    priceChange7d,
    priceChange30d,
    sma7,
    sma30,
    rsi,
    volumeTrend,
    support,
    resistance,
  };
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(prices: number[]): number {
  if (prices.length < 2) return 50; // Neutral

  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / (prices.length - 1);
  const avgLoss = losses / (prices.length - 1);

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Format indicators for AI prompt
 */
export function formatIndicatorsForPrompt(
  asset: string,
  indicators: TechnicalIndicators,
  timeframe: string
): string {
  return `Asset: ${asset.toUpperCase()}
Current Price: $${indicators.currentPrice.toLocaleString()}
7-Day Change: ${indicators.priceChange7d >= 0 ? "+" : ""}${indicators.priceChange7d.toFixed(2)}%
30-Day Change: ${indicators.priceChange30d >= 0 ? "+" : ""}${indicators.priceChange30d.toFixed(2)}%

Technical Indicators:
- SMA(7): $${indicators.sma7.toFixed(2)} (${indicators.currentPrice > indicators.sma7 ? "price above" : "price below"})
- SMA(30): $${indicators.sma30.toFixed(2)} (${indicators.currentPrice > indicators.sma30 ? "price above" : "price below"})
- RSI(14): ${indicators.rsi.toFixed(1)} (${indicators.rsi > 70 ? "overbought" : indicators.rsi < 30 ? "oversold" : "neutral"})
- Volume Trend: ${indicators.volumeTrend}
- Support Level: $${indicators.support.toFixed(2)}
- Resistance Level: $${indicators.resistance.toFixed(2)}

Requested Timeframe: ${timeframe}`;
}
