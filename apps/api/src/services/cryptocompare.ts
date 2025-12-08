/**
 * CryptoCompare Service
 * FREE public API for trending coins and market data
 * 250k calls/month on free tier
 */

import { DataFetchError } from "../lib/errors.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const CRYPTOCOMPARE_API_URL = "https://min-api.cryptocompare.com/data";

// =============================================================================
// TYPES
// =============================================================================

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  score: number;
}

interface CryptoCompareTopCoin {
  CoinInfo: {
    Id: string;
    Name: string;
    FullName: string;
  };
  RAW?: {
    USD?: {
      MKTCAP: number;
      CHANGEPCT24HOUR: number;
    };
  };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get top coins by volume (trending equivalent)
 */
export async function getTrendingCoins(
  limit: number = 10
): Promise<TrendingCoin[]> {
  const url = `${CRYPTOCOMPARE_API_URL}/top/totalvolfull?limit=${limit}&tsym=USD`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.Data || !Array.isArray(data.Data)) {
      return [];
    }

    return data.Data.map((coin: CryptoCompareTopCoin, index: number) => ({
      id: coin.CoinInfo.Name.toLowerCase(),
      name: coin.CoinInfo.FullName,
      symbol: coin.CoinInfo.Name,
      market_cap_rank: index + 1,
      score: 10 - index, // Higher score for higher volume
    }));
  } catch (error) {
    console.warn("CryptoCompare trending failed:", (error as Error).message);
    return []; // Return empty array on error (non-critical feature)
  }
}

/**
 * Get top coins by market cap
 */
export async function getTopByMarketCap(
  limit: number = 10
): Promise<TrendingCoin[]> {
  const url = `${CRYPTOCOMPARE_API_URL}/top/mktcapfull?limit=${limit}&tsym=USD`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.Data || !Array.isArray(data.Data)) {
      return [];
    }

    return data.Data.map((coin: CryptoCompareTopCoin, index: number) => ({
      id: coin.CoinInfo.Name.toLowerCase(),
      name: coin.CoinInfo.FullName,
      symbol: coin.CoinInfo.Name,
      market_cap_rank: index + 1,
      score: 10 - index,
    }));
  } catch (error) {
    console.warn("CryptoCompare market cap failed:", (error as Error).message);
    return [];
  }
}

/**
 * Get simple price for a coin
 */
export async function getPrice(symbol: string): Promise<number | null> {
  const url = `${CRYPTOCOMPARE_API_URL}/price?fsym=${symbol.toUpperCase()}&tsyms=USD`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.USD || null;
  } catch {
    return null;
  }
}
