"use client";

import { Globe, Users, Activity, TrendingUp } from "lucide-react";

// Mock network stats
const networkStats = {
  totalQueries: 12847,
  totalVolume: { avax: 34.2, usd: 456 },
  activeWallets: 234,
};

const queryBreakdown = [
  { type: "Market", count: 5781, percent: 45, color: "#3B82F6" },
  { type: "Price", count: 3854, percent: 30, color: "#8B5CF6" },
  { type: "Risk", count: 1927, percent: 15, color: "#EF4444" },
  { type: "Social", count: 1285, percent: 10, color: "#10B981" },
];

const recentActivity = [
  { wallet: "0x773d...1D92", type: "Market", time: "2m ago", amount: "0.003" },
  { wallet: "0xa1b2...c3d4", type: "Price", time: "5m ago", amount: "0.005" },
  { wallet: "0xe5f6...7890", type: "Market", time: "8m ago", amount: "0.003" },
  { wallet: "0xabcd...ef12", type: "Risk", time: "12m ago", amount: "0.008" },
  { wallet: "0x9876...5432", type: "Social", time: "15m ago", amount: "0.003" },
  { wallet: "0x1234...5678", type: "Market", time: "18m ago", amount: "0.003" },
  { wallet: "0xfedc...ba98", type: "Price", time: "22m ago", amount: "0.005" },
];

const typeColors: Record<string, string> = {
  Market: "bg-blue-100 text-blue-700",
  Price: "bg-purple-100 text-purple-700",
  Risk: "bg-red-100 text-red-700",
  Social: "bg-green-100 text-green-700",
};

export function NetworkTab() {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Left: Platform Stats */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-[#0A0A0A]">
          Network Statistics
        </h3>

        {/* Total Queries */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[rgba(20,184,166,0.1)] flex items-center justify-center">
              <Globe size={24} className="text-[#14B8A6]" />
            </div>
            <div>
              <p className="text-4xl font-bold text-[#14B8A6]">
                {networkStats.totalQueries.toLocaleString()}
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
                {networkStats.totalVolume.avax} AVAX
              </p>
              <p className="text-sm text-[#6A6A6A]">
                ~${networkStats.totalVolume.usd} • Total Volume Processed
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
                {networkStats.activeWallets}
              </p>
              <p className="text-sm text-[#6A6A6A]">
                Unique Wallets (Last 30 days)
              </p>
            </div>
          </div>
        </div>

        {/* Query Type Breakdown */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <h4 className="font-semibold text-[#0A0A0A] mb-4">
            Query Type Breakdown
          </h4>
          <div className="space-y-3">
            {queryBreakdown.map((item) => (
              <div key={item.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#4A4A4A]">{item.type}</span>
                  <span className="font-mono text-[#0A0A0A]">
                    {item.percent}% ({item.count.toLocaleString()})
                  </span>
                </div>
                <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percent}%`,
                      background: item.color,
                    }}
                  />
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

        <div className="space-y-0">
          {recentActivity.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-4 border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] -mx-2 px-2 rounded transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{
                    background: `linear-gradient(135deg, #14B8A6, #0D9488)`,
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
                  </div>
                  <p className="text-xs text-[#6A6A6A]">{item.time}</p>
                </div>
              </div>
              <span className="font-mono text-sm text-[#14B8A6]">
                {item.amount} AVAX
              </span>
            </div>
          ))}
        </div>

        <button className="w-full mt-4 py-3 text-sm text-[#6A6A6A] border border-[#E5E5E5] rounded-lg hover:bg-[#F5F5F5] transition-colors">
          Load More Activity
        </button>
      </div>
    </div>
  );
}
