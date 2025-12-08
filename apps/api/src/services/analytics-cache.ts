/**
 * Analytics Cache Service
 * In-memory cache for network statistics and query events
 */

import {
  DataProvider,
  DataSourceMetadata,
  NetworkStats,
  ProviderHealth,
  QueryEvent,
} from "../types/analytics.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const MAX_CACHED_QUERIES = 100;
const STATS_TTL_MS = 5 * 60 * 1000; // 5 minutes
const AVAX_USD_PRICE = 13.3; // TODO: Fetch dynamically

// =============================================================================
// IN-MEMORY STORAGE
// =============================================================================

// Recent queries (ring buffer style)
const queryCache: QueryEvent[] = [];

// Aggregated stats
let cachedStats: NetworkStats | null = null;
let statsLastUpdated = 0;

// Provider health tracking
const providerMetrics: Map<
  DataProvider,
  {
    successCount: number;
    failureCount: number;
    totalLatency: number;
    requestCount: number;
    consecutiveFailures: number;
  }
> = new Map();

// Initialize provider metrics
const providers: DataProvider[] = [
  "moralis",
  "binance",
  "cryptocompare",
  "openai",
];
providers.forEach((p) => {
  providerMetrics.set(p, {
    successCount: 0,
    failureCount: 0,
    totalLatency: 0,
    requestCount: 0,
    consecutiveFailures: 0,
  });
});

// =============================================================================
// QUERY EVENT RECORDING
// =============================================================================

/**
 * Record a new query event with data source attribution
 */
export function recordQueryEvent(event: Omit<QueryEvent, "id">): void {
  const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fullEvent: QueryEvent = { id, ...event };

  // Add to cache (ring buffer)
  queryCache.unshift(fullEvent);
  if (queryCache.length > MAX_CACHED_QUERIES) {
    queryCache.pop();
  }

  // Update provider metrics
  const primary = event.dataSource.primary;
  const metrics = providerMetrics.get(primary);
  if (metrics) {
    metrics.successCount++;
    metrics.totalLatency += event.dataSource.latencyMs;
    metrics.requestCount++;
    metrics.consecutiveFailures = 0;
  }

  // Invalidate stats cache
  cachedStats = null;

  console.log(
    `📊 Query recorded: ${event.type} via ${primary} (${event.dataSource.latencyMs}ms)`
  );
}

/**
 * Record a provider failure (for fallback tracking)
 */
export function recordProviderFailure(
  provider: DataProvider,
  latencyMs: number
): void {
  const metrics = providerMetrics.get(provider);
  if (metrics) {
    metrics.failureCount++;
    metrics.totalLatency += latencyMs;
    metrics.requestCount++;
    metrics.consecutiveFailures++;
  }
  console.log(`⚠️ Provider failure: ${provider}`);
}

// =============================================================================
// DATA RETRIEVAL
// =============================================================================

/**
 * Get recent query events for live feed
 */
export function getRecentQueries(limit = 20): QueryEvent[] {
  return queryCache.slice(0, limit);
}

/**
 * Get aggregated network statistics
 */
export function getNetworkStats(): NetworkStats {
  const now = Date.now();

  // Return cached if still valid
  if (cachedStats && now - statsLastUpdated < STATS_TTL_MS) {
    return cachedStats;
  }

  // Calculate fresh stats
  const breakdown = { market: 0, price: 0, risk: 0, social: 0 };
  const providerDist = { moralis: 0, binance: 0, cryptocompare: 0, openai: 0 };
  const wallets = new Set<string>();
  let totalAvax = 0;

  for (const q of queryCache) {
    breakdown[q.type]++;
    providerDist[q.dataSource.primary]++;
    wallets.add(q.wallet);
    totalAvax += parseFloat(q.amount);
  }

  cachedStats = {
    totalQueries: queryCache.length,
    totalVolumeAvax: totalAvax,
    totalVolumeUsd: totalAvax * AVAX_USD_PRICE,
    activeWallets: wallets.size,
    queryBreakdown: breakdown,
    providerDistribution: providerDist,
    lastUpdated: now,
  };

  statsLastUpdated = now;
  return cachedStats;
}

/**
 * Get provider health status
 */
export function getProviderHealth(): ProviderHealth[] {
  return providers.map((provider) => {
    const metrics = providerMetrics.get(provider)!;
    const total = metrics.successCount + metrics.failureCount;
    const successRate = total > 0 ? (metrics.successCount / total) * 100 : 100;
    const avgLatency =
      metrics.requestCount > 0
        ? metrics.totalLatency / metrics.requestCount
        : 0;

    let status: "healthy" | "degraded" | "down" = "healthy";
    if (metrics.consecutiveFailures >= 3) {
      status = "down";
    } else if (successRate < 90 || metrics.consecutiveFailures > 0) {
      status = "degraded";
    }

    return {
      provider,
      status,
      successRate: Math.round(successRate * 100) / 100,
      avgLatencyMs: Math.round(avgLatency),
      lastCheck: Date.now(),
      consecutiveFailures: metrics.consecutiveFailures,
    };
  });
}

/**
 * Get provider distribution as percentages
 */
export function getProviderDistribution(): Record<DataProvider, number> {
  const stats = getNetworkStats();
  const total = stats.totalQueries || 1; // Avoid division by zero

  return {
    moralis: Math.round((stats.providerDistribution.moralis / total) * 100),
    binance: Math.round((stats.providerDistribution.binance / total) * 100),
    cryptocompare: Math.round(
      (stats.providerDistribution.cryptocompare / total) * 100
    ),
    openai: Math.round((stats.providerDistribution.openai / total) * 100),
  };
}
