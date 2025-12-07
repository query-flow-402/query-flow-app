"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  History as HistoryIcon,
  X,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { type BlockchainQueryItem } from "@/lib/blockchain-history";
import { useQueryData } from "../_context/QueryDataContext";
import {
  getCachedResult,
  type CachedQueryResult,
} from "@/lib/query-result-cache";
import { QueryResultDisplay } from "./QueryResultDisplay";

const typeColors: Record<string, string> = {
  market: "bg-blue-100 text-blue-700",
  price: "bg-purple-100 text-purple-700",
  risk: "bg-red-100 text-red-700",
  social: "bg-green-100 text-green-700",
};

const typeLabels: Record<string, string> = {
  market: "Market",
  price: "Price",
  risk: "Risk",
  social: "Social",
};

// =============================================================================
// DETAIL MODAL COMPONENT
// =============================================================================

function QueryDetailModal({
  query,
  onClose,
}: {
  query: BlockchainQueryItem;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [cachedResult, setCachedResult] = useState<CachedQueryResult | null>(
    null
  );

  // Load cached result on mount
  useEffect(() => {
    if (query.txHash) {
      const cached = getCachedResult(query.txHash);
      setCachedResult(cached);
    }
  }, [query.txHash]);

  const copyTxHash = () => {
    navigator.clipboard.writeText(query.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe timestamp formatting
  const formatTimestamp = () => {
    try {
      const date =
        query.timestamp instanceof Date
          ? query.timestamp
          : new Date(query.timestamp);
      return date.toLocaleString();
    } catch {
      return "Unknown";
    }
  };

  // Safe txHash formatting
  const formatTxHash = () => {
    if (!query.txHash || query.txHash === "0x0" || query.txHash === "0x") {
      return "N/A";
    }
    return `${query.txHash.slice(0, 16)}...${query.txHash.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 w-full z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
          <div>
            <h2 className="text-xl font-semibold text-[#0A0A0A]">
              Query #{query.id}
            </h2>
            <p className="text-sm text-[#6A6A6A]">{formatTimestamp()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-[#6A6A6A]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Query Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#F8F8F8] rounded-lg">
              <p className="text-xs text-[#6A6A6A] uppercase mb-1">Type</p>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${typeColors[query.type] || "bg-gray-100 text-gray-700"}`}
              >
                {typeLabels[query.type] || query.type}
              </span>
            </div>
            <div className="p-4 bg-[#F8F8F8] rounded-lg">
              <p className="text-xs text-[#6A6A6A] uppercase mb-1">
                Amount Paid
              </p>
              <p className="font-semibold text-[#0A0A0A]">
                {query.amount} AVAX
              </p>
              <p className="text-xs text-[#6A6A6A]">
                ≈ ${query.amountUsd.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Transaction */}
          <div className="p-4 bg-[#F8F8F8] rounded-lg">
            <p className="text-xs text-[#6A6A6A] uppercase mb-2">Transaction</p>
            <div className="flex items-center justify-between">
              <code className="text-sm text-[#0A0A0A] font-mono">
                {formatTxHash()}
              </code>
              <div className="flex items-center gap-2">
                {query.txHash && query.txHash !== "0x0" && (
                  <>
                    <button
                      onClick={copyTxHash}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copied ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} className="text-[#6A6A6A]" />
                      )}
                    </button>
                    <a
                      href={`https://testnet.snowtrace.io/tx/${query.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-[#14B8A6] hover:underline"
                    >
                      Snowtrace <ExternalLink size={14} />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Result Hash */}
          {query.resultHash && query.resultHash !== "0x" && (
            <div className="p-4 bg-[#F8F8F8] rounded-lg">
              <p className="text-xs text-[#6A6A6A] uppercase mb-2">
                Result Hash
              </p>
              <code className="text-xs text-[#0A0A0A] font-mono break-all">
                {query.resultHash}
              </code>
            </div>
          )}

          {/* Cached Insight Result */}
          {cachedResult && (
            <div className="bg-[#F8F8F8] rounded-lg overflow-hidden">
              <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
                <p className="text-xs text-[#6A6A6A] uppercase">
                  Cached Insight
                </p>
                <span className="text-xs text-[#6A6A6A]">Saved locally</span>
              </div>
              <div className="p-4 space-y-4">
                <QueryResultDisplay
                  type={cachedResult.queryType as any}
                  result={cachedResult.result as any}
                />
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Confirmed on Blockchain
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E5E5E5]">
          <button onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
      <div className="grid grid-cols-[60px_100px_80px_120px_1fr_80px] gap-4 px-6 py-4 bg-[#F8F8F8] border-b border-[#E5E5E5]">
        {["#", "Time", "Type", "Amount", "Transaction", ""].map((h, i) => (
          <span
            key={i}
            className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider"
          >
            {h}
          </span>
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[60px_100px_80px_120px_1fr_80px] gap-4 px-6 py-4 border-b border-[#F5F5F5]"
        >
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function HistoryTab() {
  const account = useActiveAccount();
  const { queries, loading, error, refresh } = useQueryData();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] =
    useState<BlockchainQueryItem | null>(null);

  const copyTxHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  const truncateTxHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-4)}`;
  };

  // No wallet connected
  if (!account) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
            <HistoryIcon size={32} className="text-[#9A9A9A]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2">
            Connect Wallet
          </h3>
          <p className="text-[#6A6A6A]">
            Connect your wallet to view your query history from the blockchain.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <X size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2">
            Failed to Load History
          </h3>
          <p className="text-[#6A6A6A] mb-4">{error}</p>
          <button onClick={refresh} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (queries.length === 0) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
            <HistoryIcon size={32} className="text-[#9A9A9A]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-2">
            No Query History
          </h3>
          <p className="text-[#6A6A6A] mb-4">
            No queries found on the blockchain for this wallet. Make a query in
            the Explorer tab to get started!
          </p>
          <button
            onClick={refresh}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Detail Modal */}
      {selectedQuery && (
        <QueryDetailModal
          query={selectedQuery}
          onClose={() => setSelectedQuery(null)}
        />
      )}

      <div className="space-y-4">
        {/* Refresh Button */}
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

        {/* Table */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_100px_80px_120px_1fr_80px] gap-4 px-6 py-4 bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider">
              #
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
              Transaction
            </span>
            <span className="text-xs font-medium text-[#6A6A6A] uppercase tracking-wider text-right">
              Action
            </span>
          </div>

          {/* Table Rows */}
          {queries.map((query, index) => (
            <div
              key={query.id}
              className="grid grid-cols-[60px_100px_80px_120px_1fr_80px] gap-4 px-6 py-4 border-b border-[#F5F5F5] hover:bg-[#FAFAFA] transition-colors items-center"
            >
              {/* Index */}
              <span className="font-mono text-sm text-[#0A0A0A]">
                #{query.id}
              </span>

              {/* Time */}
              <span className="text-sm text-[#4A4A4A]">
                {formatTime(query.timestamp)}
              </span>

              {/* Type */}
              <span
                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${typeColors[query.type] || "bg-gray-100 text-gray-700"}`}
              >
                {typeLabels[query.type] || query.type}
              </span>

              {/* Amount */}
              <div>
                <span className="font-mono text-sm text-[#0A0A0A]">
                  {query.amount} AVAX
                </span>
              </div>

              {/* Transaction */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#6A6A6A]">
                  {truncateTxHash(query.txHash)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyTxHash(query.id, query.txHash);
                  }}
                  className="p-1 hover:bg-[#F5F5F5] rounded"
                >
                  {copiedId === query.id ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} className="text-[#9A9A9A]" />
                  )}
                </button>
                <a
                  href={`https://testnet.snowtrace.io/tx/${query.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-[#F5F5F5] rounded"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} className="text-[#9A9A9A]" />
                </a>
              </div>

              {/* View Details Button */}
              <div className="text-right">
                <button
                  onClick={() => setSelectedQuery(query)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#14B8A6] hover:bg-[#14B8A6]/10 rounded-lg transition-colors"
                >
                  <Eye size={14} />
                  View
                </button>
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#FAFAFA]">
            <span className="text-sm text-[#6A6A6A]">
              {queries.length} {queries.length === 1 ? "query" : "queries"} on
              blockchain
            </span>
            <span className="text-xs text-[#9A9A9A]">
              Data from Avalanche Fuji Testnet
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
