/**
 * Payment Verification Service
 * Verifies real token transfers on-chain
 */

import {
  createPublicClient,
  http,
  formatEther,
  parseEther,
  type Hash,
  type Address,
} from "viem";
import { avalancheFuji } from "viem/chains";
import { getSimplePrices } from "./coingecko.js";
import { PaymentError } from "../lib/errors.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const AVALANCHE_RPC =
  process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(AVALANCHE_RPC),
});

// Payment receiver wallet (from env)
const PAYMENT_RECEIVER = (process.env.PAYMENT_RECEIVER_ADDRESS ||
  process.env.WALLET_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as Address;

// Allow 5% slippage for price fluctuations
const PRICE_SLIPPAGE_TOLERANCE = 0.05;

// =============================================================================
// TYPES
// =============================================================================

export interface PaymentVerification {
  verified: boolean;
  txHash: Hash;
  from: Address;
  to: Address;
  value: bigint;
  valueUsd: number;
  blockNumber: bigint;
  error?: string;
}

export interface PriceQuote {
  priceUsd: number;
  priceAvax: number;
  avaxPriceUsd: number;
  expiresAt: number;
}

// =============================================================================
// PRICE CONVERSION
// =============================================================================

/**
 * Get current AVAX price in USD
 */
export async function getAvaxPriceUsd(): Promise<number> {
  try {
    const prices = await getSimplePrices(["avalanche-2"]);
    return prices["avalanche-2"]?.usd || 35; // Fallback to ~$35
  } catch {
    console.warn("Failed to fetch AVAX price, using fallback");
    return 35;
  }
}

/**
 * Convert USD to AVAX
 */
export async function usdToAvax(
  usd: number
): Promise<{ avax: number; avaxWei: bigint; avaxPriceUsd: number }> {
  const avaxPriceUsd = await getAvaxPriceUsd();
  const avax = usd / avaxPriceUsd;
  const avaxWei = parseEther(avax.toFixed(18));

  return { avax, avaxWei, avaxPriceUsd };
}

/**
 * Get a price quote for a query
 */
export async function getPriceQuote(priceUsd: number): Promise<PriceQuote> {
  const { avax, avaxPriceUsd } = await usdToAvax(priceUsd);

  return {
    priceUsd,
    priceAvax: avax,
    avaxPriceUsd,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
  };
}

// =============================================================================
// TRANSACTION VERIFICATION
// =============================================================================

/**
 * Verify a payment transaction on-chain
 */
export async function verifyPaymentTransaction(
  txHash: Hash,
  expectedAmountUsd: number,
  expectedFrom?: Address
): Promise<PaymentVerification> {
  try {
    // 1. Get transaction
    const tx = await publicClient.getTransaction({ hash: txHash });

    if (!tx) {
      return {
        verified: false,
        txHash,
        from: "0x0" as Address,
        to: "0x0" as Address,
        value: 0n,
        valueUsd: 0,
        blockNumber: 0n,
        error: "Transaction not found",
      };
    }

    // 2. Wait for confirmation (at least 1 block)
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    if (receipt.status !== "success") {
      return {
        verified: false,
        txHash,
        from: tx.from,
        to: tx.to || ("0x0" as Address),
        value: tx.value,
        valueUsd: 0,
        blockNumber: receipt.blockNumber,
        error: "Transaction failed",
      };
    }

    // 3. Verify recipient
    const expectedReceiver = getPaymentReceiver();
    if (tx.to?.toLowerCase() !== expectedReceiver.toLowerCase()) {
      return {
        verified: false,
        txHash,
        from: tx.from,
        to: tx.to || ("0x0" as Address),
        value: tx.value,
        valueUsd: 0,
        blockNumber: receipt.blockNumber,
        error: `Incorrect recipient. Expected ${expectedReceiver}, got ${tx.to}`,
      };
    }

    // 4. Verify sender (if specified)
    if (expectedFrom && tx.from.toLowerCase() !== expectedFrom.toLowerCase()) {
      return {
        verified: false,
        txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        valueUsd: 0,
        blockNumber: receipt.blockNumber,
        error: `Incorrect sender. Expected ${expectedFrom}, got ${tx.from}`,
      };
    }

    // 5. Verify amount
    const avaxPriceUsd = await getAvaxPriceUsd();
    const valueAvax = Number(formatEther(tx.value));
    const valueUsd = valueAvax * avaxPriceUsd;

    const minRequired = expectedAmountUsd * (1 - PRICE_SLIPPAGE_TOLERANCE);

    if (valueUsd < minRequired) {
      return {
        verified: false,
        txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        valueUsd,
        blockNumber: receipt.blockNumber,
        error: `Insufficient payment. Expected ~$${expectedAmountUsd.toFixed(4)}, got $${valueUsd.toFixed(4)}`,
      };
    }

    // 6. All checks passed!
    console.log(`✅ Payment verified: ${txHash}`);
    console.log(`   From: ${tx.from}`);
    console.log(
      `   Amount: ${valueAvax.toFixed(6)} AVAX (~$${valueUsd.toFixed(4)})`
    );

    return {
      verified: true,
      txHash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      valueUsd,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    return {
      verified: false,
      txHash,
      from: "0x0" as Address,
      to: "0x0" as Address,
      value: 0n,
      valueUsd: 0,
      blockNumber: 0n,
      error: `Verification failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Get payment receiver address (reads from env at runtime)
 */
export function getPaymentReceiver(): Address {
  const receiver =
    process.env.PAYMENT_RECEIVER_ADDRESS ||
    process.env.WALLET_ADDRESS ||
    "0x0000000000000000000000000000000000000000";
  return receiver as Address;
}
