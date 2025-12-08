"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Globe,
  Users,
  TrendingUp,
  Database,
  Zap,
  RefreshCw,
} from "lucide-react";

// =============================================================================
// TYPES (matching backend analytics types)
// =============================================================================

interface DataSourceMetadata {
  primary: "moralis" | "binance" | "cryptocompare" | "openai";
  fallback?: "moralis" | "binance" | "cryptocompare" | "openai";
  latencyMs: number;
  timestamp: number;
}

interface QueryEvent {
  id: string;
  type: "market" | "price" | "risk" | "social";
  wallet: string;
  amount: string;
  amountUsd: number;
  timestamp: number;
  txHash: string;
  dataSource: DataSourceMetadata;
}

interface NetworkStats {
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

interface ProviderHealth {
  provider: "moralis" | "binance" | "cryptocompare" | "openai";
  status: "healthy" | "degraded" | "down";
  successRate: number;
  avgLatencyMs: number;
  consecutiveFailures: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const REFRESH_INTERVAL_MS = 10000; // 10 seconds

const typeColors: Record<string, string> = {
  market: "bg-blue-100 text-blue-700",
  price: "bg-purple-100 text-purple-700",
  risk: "bg-red-100 text-red-700",
  social: "bg-green-100 text-green-700",
};

const providerColors: Record<string, string> = {
  moralis: "#3B82F6",
  binance: "#F3BA2F",
  cryptocompare: "#10B981",
  openai: "#8B5CF6",
};

const providerLabels: Record<string, string> = {
  moralis: "Moralis",
  binance: "Binance",
  cryptocompare: "CryptoCompare",
  openai: "OpenAI",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function NetworkTab() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [feed, setFeed] = useState<QueryEvent[]>([]);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch network stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/analytics/network/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  // Fetch live feed
  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/analytics/network/feed?limit=20`
      );
      const data = await res.json();
      if (data.success) {
        setFeed(data.data.queries);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    }
  }, []);

  // Fetch provider health
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/analytics/network/data-sources`
      );
      const data = await res.json();
      if (data.success) {
        setProviders(data.data.providers);
        setDistribution(data.data.distribution);
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err);
    }
  }, []);

  // Initial load and polling
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchFeed(), fetchProviders()]);
      setLoading(false);
      setLastRefresh(new Date());
    };

    loadAll();

    // Set up polling
    const interval = setInterval(() => {
      fetchStats();
      fetchFeed();
      fetchProviders();
      setLastRefresh(new Date());
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchStats, fetchFeed, fetchProviders]);

  // Format time ago
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Calculate query breakdown from stats
  const queryBreakdown = stats
    ? [
        {
          type: "Market",
          count: stats.queryBreakdown.market,
          color: "#3B82F6",
        },
        { type: "Price", count: stats.queryBreakdown.price, color: "#8B5CF6" },
        { type: "Risk", count: stats.queryBreakdown.risk, color: "#EF4444" },
        {
          type: "Social",
          count: stats.queryBreakdown.social,
          color: "#10B981",
        },
      ]
    : [];

  const totalForPercent = queryBreakdown.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: Platform Stats */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#0A0A0A]">
            Network Statistics
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#6A6A6A]">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>

        {/* Total Queries */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[rgba(20,184,166,0.1)] flex items-center justify-center">
              <Globe size={24} className="text-[#14B8A6]" />
            </div>
            <div>
              <p className="text-4xl font-bold text-[#14B8A6]">
                {loading ? "..." : (stats?.totalQueries || 0).toLocaleString()}
              </p>
              <p className="text-sm text-[#6A6A6A]">
                Total Queries on QueryFlow
              </p>
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[rgba(20,184,166,0.1)] flex items-center justify-center">
              <TrendingUp size={24} className="text-[#14B8A6]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0A0A0A]">
                {loading ? "..." : (stats?.totalVolumeAvax || 0).toFixed(4)}{" "}
                AVAX
              </p>
              <p className="text-sm text-[#6A6A6A]">
                ~${loading ? "..." : (stats?.totalVolumeUsd || 0).toFixed(2)} •
                Total Volume
              </p>
            </div>
          </div>
        </div>

        {/* Active Wallets */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[rgba(20,184,166,0.1)] flex items-center justify-center">
              <Users size={24} className="text-[#14B8A6]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0A0A0A]">
                {loading ? "..." : stats?.activeWallets || 0}
              </p>
              <p className="text-sm text-[#6A6A6A]">Unique Wallets</p>
            </div>
          </div>
        </div>

        {/* Query Type Breakdown */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <h4 className="font-semibold text-[#0A0A0A] mb-4">
            Query Type Breakdown
          </h4>
          <div className="space-y-3">
            {queryBreakdown.map((item) => {
              const percent = Math.round((item.count / totalForPercent) * 100);
              return (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#4A4A4A]">{item.type}</span>
                    <span className="font-mono text-[#0A0A0A]">
                      {percent}% ({item.count.toLocaleString()})
                    </span>
                  </div>
                  <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Provider Health */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-[#14B8A6]" />
            <h4 className="font-semibold text-[#0A0A0A]">Data Providers</h4>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Zero API Cost
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {providers.map((p) => (
              <div
                key={p.provider}
                className="flex items-center gap-2 p-3 bg-[#F8F8F8] rounded-lg"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background:
                      p.status === "healthy"
                        ? "#22C55E"
                        : p.status === "degraded"
                          ? "#F59E0B"
                          : "#EF4444",
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0A0A0A]">
                    {providerLabels[p.provider]}
                  </p>
                  <p className="text-xs text-[#4A4A4A]">
                    {distribution[p.provider] || 0}% • {p.avgLatencyMs}ms
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Live Activity Feed */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-[#0A0A0A]">
            Recent Activity
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-600">Live</span>
          </div>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-12 text-[#6A6A6A]">
            <Zap size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No Activity Yet</p>
            <p className="text-sm">Run SDK queries to see live activity here</p>
          </div>
        ) : (
          <div className="space-y-0">
            {feed.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-4 border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] -mx-2 px-2 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${providerColors[item.dataSource.primary]}, #0D9488)`,
                    }}
                  >
                    {item.wallet.slice(2, 4).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[#0A0A0A]">
                        {item.wallet}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${typeColors[item.type]}`}
                      >
                        {item.type}
                      </span>
                      {/* Data source badge */}
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-mono"
                        style={{
                          background: `${providerColors[item.dataSource.primary]}20`,
                          color: providerColors[item.dataSource.primary],
                        }}
                      >
                        {providerLabels[item.dataSource.primary]}
                      </span>
                    </div>
                    <p className="text-xs text-[#6A6A6A]">
                      {timeAgo(item.timestamp)} • {item.dataSource.latencyMs}ms
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm text-[#14B8A6]">
                    {item.amount} AVAX
                  </span>
                  {item.txHash &&
                    item.txHash.startsWith("0x") &&
                    item.txHash.length === 66 && (
                      <a
                        href={`https://testnet.snowtrace.io/tx/${item.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-500 hover:underline"
                      >
                        View Tx
                      </a>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            fetchFeed();
            setLastRefresh(new Date());
          }}
          className="w-full mt-4 py-3 text-sm text-[#6A6A6A] border border-[#E5E5E5] rounded-lg hover:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} />
          Refresh Activity
        </button>
      </div>
    </div>
  );
}
