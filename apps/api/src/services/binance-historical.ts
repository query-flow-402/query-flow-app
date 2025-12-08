/**
 * Binance Historical Data Service
 * FREE public API - NO API KEY REQUIRED
 * Provides historical OHLCV data for technical analysis (RSI, SMA, etc.)
 */

import axios from "axios";
import { DataFetchError } from "../lib/errors.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const BINANCE_API_URL = "https://api.binance.com/api/v3";

// =============================================================================
// TYPES
// =============================================================================

export interface Kline {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// =============================================================================
// SYMBOL MAPPING
// =============================================================================

/**
 * Map common asset names to Binance trading pairs
 */
const SYMBOL_MAP: Record<string, string> = {
  bitcoin: "BTCUSDT",
  btc: "BTCUSDT",
  ethereum: "ETHUSDT",
  eth: "ETHUSDT",
  "avalanche-2": "AVAXUSDT",
  avax: "AVAXUSDT",
  solana: "SOLUSDT",
  sol: "SOLUSDT",
  binancecoin: "BNBUSDT",
  bnb: "BNBUSDT",
  ripple: "XRPUSDT",
  xrp: "XRPUSDT",
  cardano: "ADAUSDT",
  ada: "ADAUSDT",
  dogecoin: "DOGEUSDT",
  doge: "DOGEUSDT",
  polkadot: "DOTUSDT",
  dot: "DOTUSDT",
  polygon: "MATICUSDT",
  matic: "MATICUSDT",
};

export function getSymbol(asset: string): string {
  const lower = asset.toLowerCase();
  return SYMBOL_MAP[lower] || `${asset.toUpperCase()}USDT`;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get historical klines (candlestick) data from Binance
 * @param symbol - Trading pair (e.g., "BTCUSDT")
 * @param interval - Timeframe: "1m", "5m", "1h", "1d", etc.
 * @param limit - Number of candles (max 1000)
 */
export async function getHistoricalKlines(
  symbol: string,
  interval: string = "1d",
  limit: number = 90
): Promise<Kline[]> {
  const url = `${BINANCE_API_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const response = await axios.get(url, { timeout: 10000 });

    // Binance returns: [openTime, open, high, low, close, volume, closeTime, ...]
    return response.data.map((candle: (string | number)[]) => ({
      timestamp: candle[0] as number,
      open: parseFloat(candle[1] as string),
      high: parseFloat(candle[2] as string),
      low: parseFloat(candle[3] as string),
      close: parseFloat(candle[4] as string),
      volume: parseFloat(candle[5] as string),
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new DataFetchError(
        `Binance API error: ${error.response?.status || error.message}`
      );
    }
    throw new DataFetchError(
      `Failed to fetch Binance klines: ${(error as Error).message}`
    );
  }
}

/**
 * Get historical data for a coin (compatible with old coingecko format)
 * @param coinId - Asset ID (e.g., "bitcoin")
 * @param days - Number of days of history
 */
export async function getMarketChart(
  coinId: string,
  days: number = 7
): Promise<MarketChartData> {
  const symbol = getSymbol(coinId);
  const interval = days <= 7 ? "1h" : "1d";
  const limit = days <= 7 ? days * 24 : days;

  const klines = await getHistoricalKlines(
    symbol,
    interval,
    Math.min(limit, 1000)
  );

  // Convert to MarketChartData format (compatible with existing code)
  return {
    prices: klines.map((k) => [k.timestamp, k.close]),
    market_caps: klines.map((k) => [k.timestamp, 0]), // Not available from Binance
    total_volumes: klines.map((k) => [k.timestamp, k.volume]),
  };
}

/**
 * Get current price from Binance (backup method)
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  const url = `${BINANCE_API_URL}/ticker/price?symbol=${symbol}`;

  try {
    const response = await axios.get(url, { timeout: 5000 });
    return parseFloat(response.data.price);
  } catch (error) {
    throw new DataFetchError(
      `Failed to fetch Binance price: ${(error as Error).message}`
    );
  }
}

// =============================================================================
// TECHNICAL INDICATORS
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
 * Calculate technical indicators from kline data
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
  const olderVolume =
    volumes.slice(-14, -7).reduce((a, b) => a + b, 0) / 7 || recentVolume;
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

Requested Timeframe: ${timeframe}
Data Source: Binance`;
}
