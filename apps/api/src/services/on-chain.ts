/**
 * On-Chain Data Service
 * Fetches wallet and transaction data from blockchain explorers
 */

import axios from "axios";
import { type Address } from "viem";
import { DataFetchError } from "../lib/errors.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

// Avalanche Fuji / Mainnet explorer APIs
const SNOWTRACE_API_URL =
  "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api";
const AVALANCHE_RPC =
  process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

// =============================================================================
// TYPES
// =============================================================================

export interface WalletData {
  address: string;
  balance: string;
  txCount: number;
  firstTxTimestamp: number | null;
  lastTxTimestamp: number | null;
  walletAge: string;
  isContract: boolean;
}

export interface TransactionSummary {
  totalTxCount: number;
  incomingTxCount: number;
  outgoingTxCount: number;
  uniqueInteractions: number;
  totalValueReceived: string;
  totalValueSent: string;
  avgTxValue: string;
  largestTx: string;
}

export interface RiskFactors {
  isNewWallet: boolean;
  hasHighVolume: boolean;
  hasRapidTransactions: boolean;
  interactsWithBridges: boolean;
  interactsWithDexs: boolean;
  lowDiversity: boolean;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get wallet balance and basic info
 */
export async function getWalletData(address: Address): Promise<WalletData> {
  try {
    // Get balance via RPC
    const balanceResponse = await axios.post(AVALANCHE_RPC, {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    });

    const balanceWei = balanceResponse.data.result || "0x0";
    const balanceAvax = (parseInt(balanceWei, 16) / 1e18).toFixed(4);

    // Get transaction count
    const txCountResponse = await axios.post(AVALANCHE_RPC, {
      jsonrpc: "2.0",
      id: 2,
      method: "eth_getTransactionCount",
      params: [address, "latest"],
    });

    const txCount = parseInt(txCountResponse.data.result || "0x0", 16);

    // Check if contract
    const codeResponse = await axios.post(AVALANCHE_RPC, {
      jsonrpc: "2.0",
      id: 3,
      method: "eth_getCode",
      params: [address, "latest"],
    });

    const isContract = codeResponse.data.result !== "0x";

    // Estimate wallet age (simplified - would need indexer for real data)
    const walletAge =
      txCount > 100
        ? "mature"
        : txCount > 10
          ? "active"
          : txCount > 0
            ? "new"
            : "unused";

    return {
      address,
      balance: `${balanceAvax} AVAX`,
      txCount,
      firstTxTimestamp: null, // Would need indexer
      lastTxTimestamp: null,
      walletAge,
      isContract,
    };
  } catch (error) {
    throw new DataFetchError("Failed to fetch wallet data", {
      address,
      error: (error as Error).message,
    });
  }
}

/**
 * Analyze risk factors for a wallet
 */
export function analyzeRiskFactors(walletData: WalletData): RiskFactors {
  return {
    isNewWallet:
      walletData.walletAge === "new" || walletData.walletAge === "unused",
    hasHighVolume: walletData.txCount > 1000,
    hasRapidTransactions: false, // Would need timestamp analysis
    interactsWithBridges: false, // Would need tx trace analysis
    interactsWithDexs: walletData.txCount > 50, // Rough heuristic
    lowDiversity: walletData.txCount < 5,
  };
}

/**
 * Calculate risk score based on factors
 */
export function calculateRiskScore(factors: RiskFactors): {
  score: number;
  level: string;
} {
  let score = 20; // Base score (low risk)

  if (factors.isNewWallet) score += 25;
  if (factors.hasHighVolume) score += 15;
  if (factors.hasRapidTransactions) score += 20;
  if (factors.interactsWithBridges) score += 10;
  if (factors.lowDiversity) score += 10;

  // Cap at 100
  score = Math.min(100, score);

  // Determine level
  let level: string;
  if (score >= 75) level = "critical";
  else if (score >= 50) level = "high";
  else if (score >= 30) level = "medium";
  else level = "low";

  return { score, level };
}

/**
 * Format wallet data for AI analysis
 */
export function formatWalletDataForPrompt(
  walletData: WalletData,
  factors: RiskFactors
): string {
  const factorsList = [];
  if (factors.isNewWallet)
    factorsList.push("- Wallet appears to be new or unused");
  if (factors.hasHighVolume)
    factorsList.push("- High transaction volume detected");
  if (factors.lowDiversity) factorsList.push("- Low transaction diversity");
  if (factors.interactsWithDexs)
    factorsList.push("- Interacts with DEX protocols");

  return `Wallet Analysis Request:

Address: ${walletData.address}
Balance: ${walletData.balance}
Transaction Count: ${walletData.txCount}
Wallet Age Category: ${walletData.walletAge}
Is Smart Contract: ${walletData.isContract ? "Yes" : "No"}

Observed Patterns:
${factorsList.length > 0 ? factorsList.join("\n") : "- No significant patterns detected"}

Please provide a comprehensive risk assessment for this wallet.`;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
