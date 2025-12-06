"use client";

import { Activity, Wallet, Calculator, Clock } from "lucide-react";

// Mock data - will be replaced with blockchain data
const mockStats = {
  totalQueries: 24,
  totalSpent: { avax: 0.156, usd: 2.08 },
  avgCost: 0.03,
  lastQuery: { time: "2 hours ago", type: "Market Sentiment" },
};

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, subtext, icon }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl p-6 hover:shadow-md hover:border-[#14B8A6] transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">
          {label}
        </span>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(20, 184, 166, 0.1)" }}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
      {subtext && <p className="text-sm text-[#6A6A6A] mt-1">{subtext}</p>}
    </div>
  );
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        label="Total Queries"
        value={mockStats.totalQueries.toString()}
        subtext="+5 this week"
        icon={<Activity size={20} className="text-[#14B8A6]" />}
      />
      <StatCard
        label="Total Spent"
        value={`${mockStats.totalSpent.avax} AVAX`}
        subtext={`~$${mockStats.totalSpent.usd.toFixed(2)}`}
        icon={<Wallet size={20} className="text-[#14B8A6]" />}
      />
      <StatCard
        label="Average Cost"
        value={`$${mockStats.avgCost.toFixed(2)}`}
        subtext="per query"
        icon={<Calculator size={20} className="text-[#14B8A6]" />}
      />
      <StatCard
        label="Last Query"
        value={mockStats.lastQuery.time}
        subtext={mockStats.lastQuery.type}
        icon={<Clock size={20} className="text-[#14B8A6]" />}
      />
    </div>
  );
}
