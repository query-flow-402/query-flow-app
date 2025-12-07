"use client";

import { Activity, DollarSign, TrendingUp, Clock } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { useQueryData } from "../_context/QueryDataContext";

export function StatsCards() {
  const account = useActiveAccount();
  const { queries, loading } = useQueryData();

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

  // Calculate stats from blockchain data
  const totalQueries = queries.length;
  const totalSpentAvax = queries.reduce(
    (sum, q) => sum + parseFloat(q.amount),
    0
  );
  const totalSpentUsd = queries.reduce((sum, q) => sum + q.amountUsd, 0);
  const avgCost = totalQueries > 0 ? totalSpentUsd / totalQueries : 0;
  const lastQuery = queries[0]; // Already sorted newest first

  // Not connected state
  if (!account) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[Activity, DollarSign, TrendingUp, Clock].map((Icon, i) => (
          <div
            key={i}
            className="bg-white border border-[#E5E5E5] rounded-xl p-4 opacity-60"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Icon size={20} className="text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-[#6A6A6A]">--</p>
            <p className="text-xl font-semibold text-[#9A9A9A]">--</p>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      icon: Activity,
      label: "Total Queries",
      value: loading ? "..." : totalQueries.toString(),
      color: "#3B82F6",
    },
    {
      icon: DollarSign,
      label: "Total Spent",
      value: loading ? "..." : `${totalSpentAvax.toFixed(4)} AVAX`,
      subValue: loading ? "" : `~$${totalSpentUsd.toFixed(2)}`,
      color: "#10B981",
    },
    {
      icon: TrendingUp,
      label: "Avg Cost",
      value: loading ? "..." : `$${avgCost.toFixed(2)}`,
      color: "#8B5CF6",
    },
    {
      icon: Clock,
      label: "Last Query",
      value: loading
        ? "..."
        : lastQuery
          ? formatTime(lastQuery.timestamp)
          : "Never",
      color: "#F59E0B",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white border border-[#E5E5E5] rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-sm text-[#6A6A6A]">{stat.label}</p>
            <p className="text-xl font-semibold text-[#0A0A0A]">{stat.value}</p>
            {stat.subValue && (
              <p className="text-xs text-[#6A6A6A]">{stat.subValue}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
