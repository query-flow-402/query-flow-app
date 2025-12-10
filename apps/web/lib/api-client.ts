/**
 * API Client with x402 Real AVAX Payment Protocol
 * Handles pay-per-query requests with actual AVAX transfers
 */

import type { Account } from "thirdweb/wallets";
import { prepareTransaction, sendTransaction, waitForReceipt } from "thirdweb";
import { client, defaultChain } from "./thirdweb";
import { parseEther } from "viem";
import apiClient from "@/config/axios-config";
import { AxiosError } from "axios";

// =============================================================================
// TYPES
// =============================================================================

export interface RealPaymentRequirement {
  priceUsd: number;
  priceAvax: string;
  avaxPriceUsd: number;
  paymentAddress: string;
  expiresAt: number;
}

export interface PaymentHeader {
  mode: "tx";
  txHash: string;
  payer: string;
}

// Result Types matching the API response structure's "data" field

export interface MarketResult {
  tokensUsed: number;
  sentiment: {
    score: number;
    trend: "bullish" | "bearish" | "neutral";
    summary: string;
  };
  factors: string[];
}

export interface PriceResult {
  prediction: {
    targetPrice: number;
    direction: "bullish" | "bearish" | "neutral";
    confidence: number;
    timeframe: string;
  };
  signals: Array<{
    indicator: string;
    value: string;
    impact: "positive" | "negative" | "neutral";
  }>;
  technicalAnalysis?: {
    rsi: number;
    support: number;
    resistance: number;
    trend: string;
  };
  context: string;
}

// =============================================================================
// TYPES
// =============================================================================

export interface RealPaymentRequirement {
  priceUsd: number;
  priceAvax: string;
  avaxPriceUsd: number;
  paymentAddress: string;
  expiresAt: number;
}

export interface PaymentHeader {
  mode: "tx";
  txHash: string;
  payer: string;
}

export interface QueryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    tokensUsed: number;
    timestamp: number;
    queryType: string;
  };
}

// Callback for payment status updates
export type PaymentStatusCallback = (status: PaymentStatus) => void;

export interface PaymentStatus {
  stage:
    | "requesting"
    | "awaiting_payment"
    | "sending"
    | "confirming"
    | "submitting"
    | "complete"
    | "error";
  message: string;
  priceAvax?: string;
  priceUsd?: number;
  paymentAddress?: string;
  txHash?: string;
  error?: string;
}

// =============================================================================
// PAYMENT HEADER ENCODING
// =============================================================================

function encodePaymentHeader(payment: PaymentHeader): string {
  return btoa(JSON.stringify(payment));
}

// =============================================================================
// CORE FETCH WITH REAL AVAX PAYMENT
// =============================================================================

/**
 * Make a request to the API with real AVAX payment flow
 *
 * Flow:
 * 1. Make initial request → Get 402 with AVAX price
 * 2. Send AVAX transaction to payment address
 * 3. Wait for confirmation
 * 4. Retry request with txHash in header
 */
export async function fetchWithPayment<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  account: Account,
  onStatus?: PaymentStatusCallback
): Promise<QueryResult<T>> {
  try {
    // Step 1: Initial request to get payment requirements
    onStatus?.({ stage: "requesting", message: "Getting price quote..." });

    let paymentRequired: { payment: RealPaymentRequirement } | null = null;

    try {
      const { data } = await apiClient.post<QueryResult<T>>(endpoint, payload);
      // If no 402 error, return the response directly
      if (data.success) {
        onStatus?.({ stage: "complete", message: "Query complete!" });
      }
      return data;
    } catch (err) {
      const axiosError = err as AxiosError<{ payment: RealPaymentRequirement }>;
      if (axiosError.response?.status !== 402) {
        throw err;
      }
      paymentRequired = axiosError.response.data;
    }

    // Step 2: Extract payment requirements
    console.log("402 Response:", paymentRequired);

    const payment = paymentRequired?.payment;

    if (!payment || !payment.priceAvax || !payment.paymentAddress) {
      const errorMsg = "Server returned invalid payment requirements";
      onStatus?.({ stage: "error", message: errorMsg, error: errorMsg });
      return {
        success: false,
        error: { code: "INVALID_402_RESPONSE", message: errorMsg },
      };
    }

    const { priceAvax, priceUsd, paymentAddress } = payment;

    onStatus?.({
      stage: "awaiting_payment",
      message: `Send ${priceAvax} AVAX ($${priceUsd.toFixed(2)})`,
      priceAvax,
      priceUsd,
      paymentAddress,
    });

    // Step 3: Send AVAX transaction
    onStatus?.({
      stage: "sending",
      message: "Approve transaction in wallet...",
      priceAvax,
      priceUsd,
    });

    const priceWei = parseEther(priceAvax);

    const transaction = prepareTransaction({
      client,
      chain: defaultChain,
      to: paymentAddress as `0x${string}`,
      value: priceWei,
    });

    const result = await sendTransaction({
      transaction,
      account,
    });

    const txHash = result.transactionHash;
    console.log("Transaction sent:", txHash);

    onStatus?.({
      stage: "confirming",
      message: "Confirming transaction...",
      txHash,
    });

    // Step 4: Wait for confirmation
    const receipt = await waitForReceipt({
      client,
      chain: defaultChain,
      transactionHash: txHash,
    });

    console.log("Transaction confirmed in block:", receipt.blockNumber);

    onStatus?.({
      stage: "submitting",
      message: "Payment confirmed! Getting results...",
      txHash,
    });

    // Step 5: Retry with payment header
    const paymentHeader: PaymentHeader = {
      mode: "tx",
      txHash,
      payer: account.address,
    };

    const { data: finalResult } = await apiClient.post<QueryResult<T>>(
      endpoint,
      payload,
      {
        headers: {
          "x-402-payment": encodePaymentHeader(paymentHeader),
        },
      }
    );

    if (finalResult.success) {
      onStatus?.({ stage: "complete", message: "Query complete!", txHash });
    } else {
      onStatus?.({
        stage: "error",
        message: finalResult.error?.message || "Query failed after payment",
        error: finalResult.error?.message,
        txHash,
      });
    }

    return finalResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    console.error("Payment error:", error);
    onStatus?.({ stage: "error", message, error: message });
    return {
      success: false,
      error: { code: "PAYMENT_ERROR", message },
    };
  }
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

export async function queryMarket(
  assets: string[],
  timeframe: string,
  account: Account,
  onStatus?: PaymentStatusCallback
): Promise<QueryResult> {
  return fetchWithPayment(
    "/api/v1/insights/market",
    { assets, timeframe },
    account,
    onStatus
  );
}

export async function queryPrice(
  asset: string,
  timeframe: string,
  account: Account,
  onStatus?: PaymentStatusCallback
): Promise<QueryResult> {
  return fetchWithPayment(
    "/api/v1/insights/price",
    { asset, timeframe },
    account,
    onStatus
  );
}

export async function queryRisk(
  address: string,
  account: Account,
  onStatus?: PaymentStatusCallback
): Promise<QueryResult> {
  return fetchWithPayment(
    "/api/v1/insights/risk",
    { address },
    account,
    onStatus
  );
}

export async function querySocial(
  asset: string,
  account: Account,
  onStatus?: PaymentStatusCallback
): Promise<QueryResult> {
  return fetchWithPayment(
    "/api/v1/insights/social",
    { asset },
    account,
    onStatus
  );
}
