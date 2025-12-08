/**
 * Analytics Types
 * Types for data source attribution and network statistics
 */

// =============================================================================
// DATA SOURCE ATTRIBUTION
// =============================================================================

export type DataProvider = "moralis" | "binance" | "cryptocompare" | "openai";

export interface DataSourceMetadata {
  primary: DataProvider;
  fallback?: DataProvider;
  latencyMs: number;
  timestamp: number;
}

export interface ProviderHealth {
  provider: DataProvider;
  status: "healthy" | "degraded" | "down";
  successRate: number; // 0-100
  avgLatencyMs: number;
  lastCheck: number;
  consecutiveFailures: number;
}

// =============================================================================
// QUERY EVENTS (for Live Feed)
// =============================================================================

export interface QueryEvent {
  id: string;
  type: "market" | "price" | "risk" | "social";
  wallet: string; // Truncated address
  amount: string; // AVAX
  amountUsd: number;
  timestamp: number;
  txHash: string;
  dataSource: DataSourceMetadata;
}

// =============================================================================
// NETWORK STATISTICS
// =============================================================================

export interface NetworkStats {
  totalQueries: number;
  totalVolumeAvax: number;
  totalVolumeUsd: number;
  activeWallets: number;
  queryBreakdown: {
    market: number;
    price: number;
    risk: number;
    social: number;
  };
  providerDistribution: {
    moralis: number;
    binance: number;
    cryptocompare: number;
    openai: number;
  };
  lastUpdated: number;
}

// =============================================================================
// API RESPONSES
// =============================================================================

export interface AnalyticsStatsResponse {
  success: boolean;
  data: NetworkStats;
}

export interface AnalyticsFeedResponse {
  success: boolean;
  data: {
    queries: QueryEvent[];
    total: number;
  };
}

export interface AnalyticsProvidersResponse {
  success: boolean;
  data: {
    providers: ProviderHealth[];
    distribution: Record<DataProvider, number>;
  };
}
