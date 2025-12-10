/**
 * Analytics API Service
 * Handles network statistics and analytics endpoints
 */

import apiClient from "@/config/axios-config";

// =============================================================================
// TYPES
// =============================================================================

export interface NetworkStats {
  totalQueries: number;
  totalVolume: number;
  activeWallets: number;
  avgQueryCost: number;
  queriesByType: {
    market: number;
    price: number;
    risk: number;
    social: number;
  };
}

export interface QueryEvent {
  id: string;
  type: "market" | "price" | "risk" | "social";
  wallet: string;
  cost: number;
  timestamp: number;
  dataSource: {
    primary: string;
    latency: number;
  };
}

export interface DataSourceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency: number;
  lastCheck: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get network-wide statistics
 */
export async function getNetworkStats(): Promise<NetworkStats> {
  const response = await apiClient.get<NetworkStats>(
    "/api/v1/analytics/network/stats"
  );
  return response.data;
}

/**
 * Get recent query events for the network feed
 */
export async function getRecentQueries(
  limit: number = 10
): Promise<QueryEvent[]> {
  const response = await apiClient.get<QueryEvent[]>(
    "/api/v1/analytics/network/queries",
    {
      params: { limit },
    }
  );
  return response.data;
}

/**
 * Get data source health status
 */
export async function getDataSources(): Promise<DataSourceHealth[]> {
  const response = await apiClient.get<DataSourceHealth[]>(
    "/api/v1/analytics/network/sources"
  );
  return response.data;
}

/**
 * Get combined network data (stats + queries + sources)
 */
export async function getNetworkData() {
  const [stats, queries, sources] = await Promise.all([
    getNetworkStats(),
    getRecentQueries(20),
    getDataSources(),
  ]);

  return { stats, queries, sources };
}
