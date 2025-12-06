"use client";

import { ExternalLink, Copy, Check, MoreVertical } from "lucide-react";
import { useState } from "react";

// Mock query history data
const mockHistory = [
  {
    id: 24,
    time: "Dec 6, 3:45 PM",
    type: "Market",
    amount: "0.003",
    status: "Confirmed",
    txHash: "0xf94e7d6c8a2b...c45f",
    fullTxHash:
      "0xf94e7d6c8a2b3e1f4d5c6a7b8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8c45f",
  },
  {
    id: 23,
    time: "Dec 6, 10:12 AM",
    type: "Price",
    amount: "0.005",
    status: "Confirmed",
    txHash: "0xa1b2c3d4e5f6...789a",
    fullTxHash:
      "0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d789a",
  },
  {
    id: 22,
    time: "Dec 5, 8:30 PM",
    type: "Risk",
    amount: "0.008",
    status: "Confirmed",
    txHash: "0x9876543210ab...def0",
    fullTxHash:
      "0x9876543210abcdef1234567890abcdef1234567890abcdef1234567890def0",
  },
  {
    id: 21,
    time: "Dec 5, 2:15 PM",
    type: "Social",
    amount: "0.003",
    status: "Confirmed",
    txHash: "0xabcdef123456...7890",
    fullTxHash:
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef12347890",
  },
  {
    id: 20,
    time: "Dec 4, 6:00 PM",
    type: "Market",
    amount: "0.003",
    status: "Confirmed",
    txHash: "0x1234567890ab...cdef",
    fullTxHash:
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890cdef",
  },
];

const typeColors: Record<string, string> = {
  Market: "bg-blue-100 text-blue-700",
  Price: "bg-purple-100 text-purple-700",
  Risk: "bg-red-100 text-red-700",
  Social: "bg-green-100 text-green-700",
};

export function HistoryTab() {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const copyTxHash = (id: number, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[80px_100px_100px_120px_100px_180px_80px] gap-4 px-6 py-4 bg-[#F8F8F8] border-b border-[#E5E5E5]">
        <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">
          ID
        </span>
        <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">
          Time
        </span>
        <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">
          Type
        </span>
        <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">
          Amount
        </span>
        <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">
          Status
        </span>
        <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">
          Transaction
        </span>
        <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider"></span>
      </div>

      {/* Table Rows */}
      {mockHistory.map((query) => (
        <div
          key={query.id}
          className="grid grid-cols-[80px_100px_100px_120px_100px_180px_80px] gap-4 px-6 py-4 border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors items-center"
        >
          {/* ID */}
          <span className="font-mono text-sm text-[#0A0A0A]">
            #{query.id.toString().padStart(4, "0")}
          </span>

          {/* Time */}
          <span className="text-sm text-[#4A4A4A]">{query.time}</span>

          {/* Type */}
          <span
            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${typeColors[query.type]}`}
          >
            {query.type}
          </span>

          {/* Amount */}
          <div>
            <span className="font-mono text-sm text-[#0A0A0A]">
              {query.amount} AVAX
            </span>
            <span className="text-xs text-[#6A6A6A] block">
              ~${(parseFloat(query.amount) * 13.33).toFixed(2)}
            </span>
          </div>

          {/* Status */}
          <span className="inline-flex items-center gap-1 text-sm text-green-600">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {query.status}
          </span>

          {/* Transaction */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#6A6A6A]">
              {query.txHash}
            </span>
            <button
              onClick={() => copyTxHash(query.id, query.fullTxHash)}
              className="p-1 hover:bg-[#F5F5F5] rounded"
            >
              {copiedId === query.id ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-[#9A9A9A]" />
              )}
            </button>
            <a
              href={`https://testnet.snowtrace.io/tx/${query.fullTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-[#F5F5F5] rounded"
            >
              <ExternalLink size={14} className="text-[#9A9A9A]" />
            </a>
          </div>

          {/* Actions */}
          <button className="p-2 hover:bg-[#F5F5F5] rounded">
            <MoreVertical size={16} className="text-[#9A9A9A]" />
          </button>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 px-6 py-4 bg-[#FAFAFA]">
        <span className="text-sm text-[#6A6A6A]">1-5 of 24</span>
        <button className="px-3 py-1 text-sm text-[#6A6A6A] hover:bg-[#E5E5E5] rounded">
          Previous
        </button>
        <button className="px-3 py-1 text-sm bg-[#14B8A6] text-white rounded">
          1
        </button>
        <button className="px-3 py-1 text-sm text-[#6A6A6A] hover:bg-[#E5E5E5] rounded">
          2
        </button>
        <button className="px-3 py-1 text-sm text-[#6A6A6A] hover:bg-[#E5E5E5] rounded">
          3
        </button>
        <button className="px-3 py-1 text-sm text-[#6A6A6A] hover:bg-[#E5E5E5] rounded">
          Next
        </button>
      </div>
    </div>
  );
}
