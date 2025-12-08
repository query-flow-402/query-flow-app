/**
 * Moralis Web3 Service
 * Primary data source for crypto prices with higher rate limits than CoinGecko
 * Free tier: 40,000 compute units/day (~10k price queries)
 */

import Moralis from "moralis";
import { EvmChain } from "@moralisweb3/common-evm-utils";
import { DataFetchError } from "../lib/errors.js";

// =============================================================================
// INITIALIZATION
// =============================================================================

let isInitialized = false;

async function initMoralis(): Promise<void> {
  if (isInitialized) return;

  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) {
    throw new DataFetchError("MORALIS_API_KEY not configured in environment");
  }

  await Moralis.start({ apiKey });
  isInitialized = true;
}

// =============================================================================
// TOKEN ADDRESS MAPPING
// =============================================================================

// Common tokens with their Ethereum mainnet addresses
const TOKEN_ADDRESSES: Record<string, string> = {
  bitcoin: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
  ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
  "avalanche-2": "0x85f138bfEE4ef8e540890CFb48F620571d67Eda3", // WAVAX on ETH
  "usd-coin": "0xA0b86a33E6441B8b8C8d4B8cE8bF7a7b6D8b1A0d", // USDC
  tether: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
  solana: "0xD31a59c85aE9D8edEFeC411D448f90841571b89c", // SOL (wrapped)
  binancecoin: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", // BNB
  ripple: "0x1D2D542E6D9d85A712deB4D1a7D96a16CE7AF8f1", // XRP (wrapped)
  cardano: "0x3EE2200Efb3400faBB9AacF31297cBdD1d435D47", // ADA (wrapped)
  dogecoin: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", // DOGE (wrapped)
};

// =============================================================================
// PRICE FETCHING
// =============================================================================

export interface MoralisPriceData {
  tokenAddress: string;
  usdPrice: number;
  usdPriceFormatted: string;
  exchangeName?: string;
  exchangeAddress?: string;
}

/**
 * Get token price from Moralis
 * @param tokenAddress - Ethereum token address
 * @param chain - EVM chain (default: Ethereum)
 */
export async function getTokenPrice(
  tokenAddress: string,
  chain: typeof EvmChain.ETHEREUM = EvmChain.ETHEREUM
): Promise<number> {
  await initMoralis();

  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      address: tokenAddress,
      chain,
    });

    return response.toJSON().usdPrice;
  } catch (error) {
    throw new DataFetchError(
      `Moralis price fetch failed: ${(error as Error).message}`
    );
  }
}

/**
 * Get prices for multiple tokens by their CoinGecko-style IDs
 * Maps IDs to addresses and fetches prices
 */
export async function getPricesByIds(
  coinIds: string[]
): Promise<Record<string, number>> {
  await initMoralis();

  const results: Record<string, number> = {};

  for (const id of coinIds) {
    const address = TOKEN_ADDRESSES[id.toLowerCase()];
    if (!address) {
      console.warn(`Moralis: No address mapping for ${id}, skipping`);
      continue;
    }

    try {
      const price = await getTokenPrice(address);
      results[id] = price;
    } catch (error) {
      console.warn(
        `Moralis: Failed to get price for ${id}:`,
        (error as Error).message
      );
    }
  }

  return results;
}

/**
 * Check if Moralis is available and configured
 */
export function isConfigured(): boolean {
  return !!process.env.MORALIS_API_KEY;
}
