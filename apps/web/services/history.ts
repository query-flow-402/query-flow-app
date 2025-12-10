/**
 * History API Service
 * Handles query history endpoints
 */

import apiClient from "@/config/axios-config";

// =============================================================================
// TYPES
// =============================================================================

export interface QueryHistoryItem {
  queryId: string;
  queryType: string;
  payer: string;
  paymentAmount: bigint | string;
  timestamp: number;
  resultHash: string;
  txHash?: string;
}

export interface HistoryResponse {
  success: boolean;
  data?: QueryHistoryItem[];
  error?: {
    code: string;
    message: string;
  };
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get query history for a specific wallet address
 */
export async function getQueryHistory(
  address: string
): Promise<HistoryResponse> {
  try {
    const response = await apiClient.get<HistoryResponse>(
      `/api/v1/history/${address}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch query history:", error);
    return {
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch query history",
      },
    };
  }
}

/**
 * Get a single query by ID
 */
export async function getQueryById(
  queryId: string
): Promise<QueryHistoryItem | null> {
  try {
    const response = await apiClient.get<{ data: QueryHistoryItem }>(
      `/api/v1/history/query/${queryId}`
    );
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch query:", error);
    return null;
  }
}
