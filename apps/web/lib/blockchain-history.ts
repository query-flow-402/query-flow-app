/**
 * Blockchain History Client
 * Fetches query history from backend API (which caches blockchain data)
 */

// =============================================================================
// TYPES
// =============================================================================

export interface BlockchainQueryItem {
  id: string;
  type: "market" | "price" | "risk" | "social";
  amount: string; // AVAX formatted
  amountUsd: number;
  timestamp: Date;
  txHash: string;
  status: "confirmed";
  resultHash: string;
}

interface APIHistoryResponse {
  success: boolean;
  data?: {
    queries: Array<{
      id: string;
      type: string;
      amount: string;
      amountUsd: number;
      timestamp: number;
      txHash: string;
      status: string;
      resultHash: string;
    }>;
    cached: boolean;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const TYPE_MAP: Record<string, "market" | "price" | "risk" | "social"> = {
  market: "market",
  price: "price",
  risk: "risk",
  social: "social",
};

// =============================================================================
// FETCH USER QUERY HISTORY
// =============================================================================

/**
 * Fetches query history from backend API (single request, cached)
 * @param userAddress - The user's wallet address
 * @returns Array of query history items sorted by timestamp (newest first)
 */
export async function fetchUserQueryHistory(
  userAddress: string
): Promise<BlockchainQueryItem[]> {
  if (!userAddress) {
    return [];
  }

  try {
    console.log(`📜 Fetching query history for: ${userAddress}`);

    const response = await fetch(`${API_URL}/api/v1/history/${userAddress}`);
    const data: APIHistoryResponse = await response.json();

    if (!data.success || !data.data) {
      console.warn("⚠️ History API returned error:", data.error);
      return [];
    }

    console.log(
      `📊 Received ${data.data.queries.length} queries (cached: ${data.data.cached})`
    );

    // Transform API response to frontend format
    const queries: BlockchainQueryItem[] = data.data.queries.map((q) => ({
      id: q.id,
      type: TYPE_MAP[q.type.toLowerCase()] || "market",
      amount: q.amount,
      amountUsd: q.amountUsd,
      timestamp: new Date(q.timestamp),
      txHash: q.txHash,
      status: "confirmed" as const,
      resultHash: q.resultHash,
    }));

    return queries;
  } catch (error) {
    console.error("❌ Failed to fetch query history:", error);
    return [];
  }
}

// =============================================================================
// REFRESH HISTORY (Force Cache Refresh)
// =============================================================================

/**
 * Force refresh history cache from blockchain
 * @param userAddress - The user's wallet address
 */
export async function refreshUserQueryHistory(
  userAddress: string
): Promise<BlockchainQueryItem[]> {
  if (!userAddress) {
    return [];
  }

  try {
    console.log(`🔄 Refreshing query history for: ${userAddress}`);

    const response = await fetch(
      `${API_URL}/api/v1/history/refresh/${userAddress}`,
      {
        method: "POST",
      }
    );
    const data: APIHistoryResponse = await response.json();

    if (!data.success || !data.data) {
      console.warn("⚠️ History refresh API returned error:", data.error);
      return [];
    }

    console.log(`📊 Refreshed ${data.data.queries.length} queries`);

    const queries: BlockchainQueryItem[] = data.data.queries.map((q) => ({
      id: q.id,
      type: TYPE_MAP[q.type.toLowerCase()] || "market",
      amount: q.amount,
      amountUsd: q.amountUsd,
      timestamp: new Date(q.timestamp),
      txHash: q.txHash,
      status: "confirmed" as const,
      resultHash: q.resultHash,
    }));

    return queries;
  } catch (error) {
    console.error("❌ Failed to refresh query history:", error);
    return [];
  }
}
