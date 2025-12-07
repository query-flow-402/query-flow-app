"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { type BlockchainQueryItem } from "@/lib/blockchain-history";
import { useQueryData } from "../_context/QueryDataContext";

const typeColors: Record<string, string> = {
  market: "#3B82F6",
  price: "#8B5CF6",
  risk: "#EF4444",
  social: "#10B981",
};

const typeLabels: Record<string, string> = {
  market: "Market",
  price: "Price",
  risk: "Risk",
  social: "Social",
};

export function OverviewTab() {
  const account = useActiveAccount();
  const { queries, loading, refresh } = useQueryData();

  // Calculate stats from blockchain data
  const totalQueries = queries.length;
  const totalSpentAvax = queries.reduce(
    (sum, q) => sum + parseFloat(q.amount),
    0
  );
  const totalSpentUsd = queries.reduce((sum, q) => sum + q.amountUsd, 0);
  const avgCost = totalQueries > 0 ? totalSpentUsd / totalQueries : 0;
  const recentQueries = queries.slice(0, 5);

  // Build chart data
  const byType = queries.reduce(
    (acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const queryActivityData = buildActivityData(queries);
  const queryTypeData = buildTypeData(byType);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!account) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-12">
        <div className="text-center text-[#6A6A6A]">
          Connect your wallet to view overview statistics.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Refresh */}
      <div className="flex justify-end">
        <button
          onClick={refresh}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Total Queries"
          value={loading ? "..." : totalQueries.toString()}
          color="#3B82F6"
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={loading ? "..." : `${totalSpentAvax.toFixed(4)} AVAX`}
          subValue={loading ? "" : `~$${totalSpentUsd.toFixed(2)}`}
          color="#10B981"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Cost"
          value={loading ? "..." : `$${avgCost.toFixed(2)}`}
          color="#8B5CF6"
        />
        <StatCard
          icon={Clock}
          label="Last Query"
          value={
            loading
              ? "..."
              : queries[0]
                ? formatTime(queries[0].timestamp)
                : "Never"
          }
          color="#F59E0B"
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left: Charts */}
        <div className="space-y-8">
          {/* Line Chart: Query Activity */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#0A0A0A] mb-6">
              Query Activity
            </h3>
            {queryActivityData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={queryActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#6A6A6A" }}
                      axisLine={{ stroke: "#E5E5E5" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6A6A6A" }}
                      axisLine={{ stroke: "#E5E5E5" }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #E5E5E5",
                        borderRadius: "8px",
                        fontSize: "14px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="queries"
                      stroke="#14B8A6"
                      strokeWidth={3}
                      dot={{ fill: "#14B8A6", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#14B8A6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[#6A6A6A]">
                {loading
                  ? "Loading..."
                  : "No query data yet. Make some queries to see activity!"}
              </div>
            )}
          </div>

          {/* Pie Chart: Query Types */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#0A0A0A] mb-6">
              Query Types
            </h3>
            {queryTypeData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={queryTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent = 0 }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {queryTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[#6A6A6A]">
                {loading
                  ? "Loading..."
                  : "No query data yet. Make some queries to see distribution!"}
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary Cards */}
        <div className="space-y-6">
          {/* Recent Queries */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#0A0A0A] mb-4">
              Recent Queries
            </h3>
            {recentQueries.length > 0 ? (
              <div className="space-y-3">
                {recentQueries.map((query) => (
                  <div
                    key={query.id}
                    className="flex items-center justify-between py-2 border-b border-[#F5F5F5] last:border-0"
                  >
                    <div>
                      <span className="text-sm font-medium text-[#0A0A0A]">
                        {typeLabels[query.type] || query.type}
                      </span>
                      <span className="text-xs text-[#6A6A6A] ml-2">
                        {formatTime(query.timestamp)}
                      </span>
                    </div>
                    <span className="font-mono text-sm text-[#14B8A6]">
                      {query.amount} AVAX
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6A6A6A] text-sm">
                {loading
                  ? "Loading..."
                  : "No queries yet. Make your first query!"}
              </p>
            )}
          </div>

          {/* Spending Breakdown */}
          <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#0A0A0A] mb-4">
              Spending by Type
            </h3>
            {queryTypeData.length > 0 ? (
              <div className="space-y-3">
                {queryTypeData.map((type, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#4A4A4A]">{type.name}</span>
                      <span className="font-mono text-[#0A0A0A]">
                        {type.value} {type.value === 1 ? "query" : "queries"}
                      </span>
                    </div>
                    <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(type.value / totalQueries) * 100}%`,
                          background: type.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#6A6A6A] text-sm">
                {loading ? "Loading..." : "No spending data yet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: StatCardProps) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p className="text-sm text-[#6A6A6A]">{label}</p>
      <p className="text-xl font-semibold text-[#0A0A0A]">{value}</p>
      {subValue && <p className="text-xs text-[#6A6A6A]">{subValue}</p>}
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildActivityData(
  history: BlockchainQueryItem[]
): { date: string; queries: number }[] {
  if (history.length === 0) return [];

  const countByDate: Record<string, number> = {};

  history.forEach((q) => {
    const dateStr = q.timestamp.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    countByDate[dateStr] = (countByDate[dateStr] || 0) + 1;
  });

  return Object.entries(countByDate)
    .map(([date, queries]) => ({ date, queries }))
    .reverse()
    .slice(-7);
}

function buildTypeData(
  byType: Record<string, number>
): { name: string; value: number; color: string }[] {
  return Object.entries(byType).map(([type, count]) => ({
    name: typeLabels[type] || type,
    value: count,
    color: typeColors[type] || "#6B7280",
  }));
}
