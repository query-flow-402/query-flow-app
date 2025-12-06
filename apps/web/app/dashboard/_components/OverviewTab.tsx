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

// Mock data for charts
const queryActivityData = [
  { date: "Dec 1", queries: 3 },
  { date: "Dec 2", queries: 5 },
  { date: "Dec 3", queries: 2 },
  { date: "Dec 4", queries: 8 },
  { date: "Dec 5", queries: 4 },
  { date: "Dec 6", queries: 6 },
];

const queryTypeData = [
  { name: "Market", value: 12, color: "#3B82F6" },
  { name: "Price", value: 5, color: "#8B5CF6" },
  { name: "Risk", value: 4, color: "#EF4444" },
  { name: "Social", value: 3, color: "#10B981" },
];

const recentQueries = [
  { type: "Market", time: "2h ago", amount: "0.003 AVAX" },
  { type: "Price", time: "5h ago", amount: "0.005 AVAX" },
  { type: "Market", time: "1d ago", amount: "0.003 AVAX" },
  { type: "Risk", time: "1d ago", amount: "0.008 AVAX" },
  { type: "Social", time: "2d ago", amount: "0.003 AVAX" },
];

export function OverviewTab() {
  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8">
      {/* Left: Charts */}
      <div className="space-y-8">
        {/* Line Chart: Query Activity */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-6">
            Query Activity
          </h3>
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
        </div>

        {/* Pie Chart: Query Types */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-6">
            Query Types
          </h3>
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
        </div>
      </div>

      {/* Right: Summary Cards */}
      <div className="space-y-6">
        {/* Recent Queries */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-4">
            Recent Queries
          </h3>
          <div className="space-y-3">
            {recentQueries.map((query, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-[#F5F5F5] last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-[#0A0A0A]">
                    {query.type}
                  </span>
                  <span className="text-xs text-[#6A6A6A] ml-2">
                    {query.time}
                  </span>
                </div>
                <span className="font-mono text-sm text-[#14B8A6]">
                  {query.amount}
                </span>
              </div>
            ))}
          </div>
          <button className="text-sm text-[#14B8A6] hover:underline mt-4">
            View All →
          </button>
        </div>

        {/* Spending Breakdown */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-4">
            Spending by Type
          </h3>
          <div className="space-y-3">
            {queryTypeData.map((type, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#4A4A4A]">{type.name}</span>
                  <span className="font-mono text-[#0A0A0A]">
                    ${(type.value * 0.02).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(type.value / 24) * 100}%`,
                      background: type.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
