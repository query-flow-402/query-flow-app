"use client";

import React, { useState, useRef } from "react";
import {
  TrendingUp,
  DollarSign,
  Shield,
  MessageCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Wallet,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import {
  queryMarket,
  queryPrice,
  queryRisk,
  querySocial,
  type PaymentStatus,
} from "@/lib/api-client";
import { QueryResultDisplay } from "./QueryResultDisplay";
import { cacheQueryResult } from "@/lib/query-result-cache";

const queryTypes = [
  {
    id: "market",
    name: "Market Sentiment",
    description: "AI analysis of market trends and sentiment",
    price: 0.02,
    icon: TrendingUp,
    color: "#3B82F6",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "price",
    name: "Price Prediction",
    description: "ML-powered price forecasting",
    price: 0.03,
    icon: DollarSign,
    color: "#8B5CF6",
    gradient: "from-violet-500 to-violet-600",
  },
  {
    id: "risk",
    name: "Risk Assessment",
    description: "Wallet and transaction risk analysis",
    price: 0.05,
    icon: Shield,
    color: "#EF4444",
    gradient: "from-red-500 to-red-600",
  },
  {
    id: "social",
    name: "Social Sentiment",
    description: "Social media sentiment aggregation",
    price: 0.02,
    icon: MessageCircle,
    color: "#10B981",
    gradient: "from-emerald-500 to-emerald-600",
  },
];

type QueryStatus = "idle" | "loading" | "success" | "error";

// API returns different structures per query type - this handles market/social
interface QueryResult {
  sentiment?: {
    score: number;
    trend: string;
    summary: string;
  };
  factors?: string[];
  tokensUsed?: number;
  // For raw JSON display
  [key: string]: unknown;
}

export function ExplorerTab() {
  const [selectedType, setSelectedType] = useState("market");
  const [assets, setAssets] = useState("BTC");
  const [timeframe, setTimeframe] = useState("24h");
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState<QueryStatus>("idle");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null
  );
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double-clicks

  const account = useActiveAccount();
  const selectedQuery = queryTypes.find((q) => q.id === selectedType)!;

  // Track txHash with ref for synchronous access in callbacks
  const txHashRef = useRef<string | null>(null);

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    // Reset state to avoid UI crashes due to mismatched result types
    setStatus("idle");
    setResult(null);
    setError(null);
    setPaymentStatus(null);
    setTxHash(null);
    setIsSubmitting(false);
  };

  const handlePaymentStatus = (status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status.txHash) {
      setTxHash(status.txHash);
      txHashRef.current = status.txHash; // Update ref synchronously
    }
    if (status.stage === "error") {
      setError(status.error || status.message);
      setStatus("error");
      setIsSubmitting(false); // Allow retry on error
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) {
      console.log("⚠️ Submit blocked - already submitting");
      return;
    }

    // Check wallet connection
    if (!account) {
      setError("Please connect your wallet first");
      setStatus("error");
      return;
    }

    setIsSubmitting(true); // Block further submissions
    setStatus("loading");
    setError(null);
    setPaymentStatus(null);
    setTxHash(null);
    txHashRef.current = null; // Reset ref for new query

    try {
      // Parse assets into array
      const assetList = assets.split(",").map((a) => a.trim().toUpperCase());

      let response;

      // AVAX payment via custom x402
      switch (selectedType) {
        case "market":
          response = await queryMarket(
            assetList,
            timeframe,
            account,
            handlePaymentStatus
          );
          break;
        case "price":
          response = await queryPrice(
            assetList[0] || "BTC",
            timeframe,
            account,
            handlePaymentStatus
          );
          break;
        case "risk":
          response = await queryRisk(
            walletAddress || account.address,
            account,
            handlePaymentStatus
          );
          break;
        case "social":
          response = await querySocial(
            assetList[0] || "BTC",
            account,
            handlePaymentStatus
          );
          break;
        default:
          throw new Error("Unknown query type");
      }

      if (response.success && response.data) {
        setResult(response.data as unknown as QueryResult);
        setStatus("success");
        setIsSubmitting(false);

        // Cache the result for history modal display
        if (txHashRef.current) {
          cacheQueryResult(txHashRef.current, selectedType, response.data);
        }

        // Dispatch event to refresh stats cards immediately
        window.dispatchEvent(new CustomEvent("queryflow:query-completed"));
      } else {
        const errorMsg = response.error?.message || "Query failed";
        const errorCode = response.error?.code
          ? `[${response.error.code}] `
          : "";
        setError(`${errorCode}${errorMsg}`);
        setStatus("error");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Query error:", err);
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      setStatus("error");
      setIsSubmitting(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-8">
      {/* Left: Query Builder */}
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            Select Query Type
          </h3>

          {/* Query Type Cards */}
          <div className="space-y-3">
            {queryTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={`w-full group relative overflow-hidden p-4 rounded-xl border transition-all duration-200 text-left ${
                  selectedType === type.id
                    ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500"
                    : "border-gray-200 hover:border-teal-200 hover:shadow-md bg-white"
                }`}
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm text-white bg-linear-to-br ${type.gradient}`}
                  >
                    <type.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                        {type.name}
                      </span>
                      <span className="font-mono text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        ${type.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                  {selectedType === type.id && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-teal-500 rounded-l" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields & Price */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Query Parameters
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assets / Target
              </label>
              <div className="relative">
                <select
                  value={assets}
                  onChange={(e) => setAssets(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm text-gray-900 transition-all appearance-none"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="AVAX">Avalanche (AVAX)</option>
                  <option value="SOL">Solana (SOL)</option>
                  <option value="BNB">Binance Coin (BNB)</option>
                  <option value="XRP">Ripple (XRP)</option>
                  <option value="ADA">Cardano (ADA)</option>
                  <option value="DOGE">Dogecoin (DOGE)</option>
                  <option value="DOT">Polkadot (DOT)</option>
                  <option value="MATIC">Polygon (MATIC)</option>
                  <option value="BTC, ETH">BTC + ETH</option>
                  <option value="BTC, ETH, AVAX">BTC + ETH + AVAX</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronRight className="rotate-90 w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe Analysis
              </label>
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm text-gray-900 transition-all appearance-none"
                >
                  <option value="1h">Last 1 hour</option>
                  <option value="4h">Last 4 hours</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronRight className="rotate-90 w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Estimated Cost</span>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                ${selectedQuery.price.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-end text-xs text-gray-500 font-mono mb-6">
              ~{(selectedQuery.price / 35).toFixed(6)} AVAX
            </div>

            <button
              onClick={handleSubmit}
              disabled={status === "loading"}
              className="w-full btn-primary py-4 text-base font-semibold shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing Request...
                </>
              ) : (
                <>
                  Generate Query <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Results Panel */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 min-h-[600px] flex flex-col">
        {status === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-6 relative group">
              <div className="absolute inset-0 bg-blue-100 rounded-full scale-125 opacity-0 group-hover:opacity-50 transition-all duration-700 animate-pulse" />
              <TrendingUp size={40} className="text-blue-500 relative z-10" />
              <Sparkles
                size={20}
                className="text-amber-400 absolute -top-1 -right-1 z-20"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Analyze
            </h3>
            <p className="text-gray-500 leading-relaxed">
              Select a query type from the menu to generate real-time AI
              insights, risks assessments, or price predictions using on-chain
              data.
            </p>
          </div>
        )}

        {status === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full border-4 border-gray-100" />
              <div className="w-20 h-20 rounded-full border-4 border-teal-500 border-t-transparent absolute top-0 left-0 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={24} className="text-teal-600 animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 animate-pulse">
              {paymentStatus?.stage === "requesting" && "Generating Query..."}
              {paymentStatus?.stage === "sending" && "Confirm Transaction"}
              {paymentStatus?.stage === "confirming" && "Verifying Payment..."}
              {paymentStatus?.stage === "submitting" && "Payment Verified!"}
              {!paymentStatus && "Processing..."}
            </h3>

            <p className="text-gray-500 mb-8 h-6">
              {paymentStatus?.message || "Preparing your request..."}
            </p>

            {/* Transaction Status Box */}
            {paymentStatus?.txHash && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <Check size={14} className="text-teal-600" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Transaction Sent
                    </p>
                    <a
                      href={`https://testnet.snowtrace.io/tx/${paymentStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 hover:underline truncate block"
                    >
                      {paymentStatus.txHash}
                    </a>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </div>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Query Failed
            </h3>
            <p className="text-gray-500 max-w-lg mb-6">{error}</p>
            <button
              onClick={() => {
                setStatus("idle");
                setError(null);
              }}
              className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {status === "success" && result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Meta */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white bg-linear-to-br ${selectedQuery.gradient}`}
                >
                  <selectedQuery.icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {selectedQuery.name}
                  </h3>
                  <p className="text-xs text-gray-500">Result Generated</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyResult}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy Result JSON"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Query-type specific display */}
            <div className="min-h-[400px]">
              <QueryResultDisplay
                type={selectedType as "market" | "price" | "risk" | "social"}
                result={result}
              />
            </div>

            {/* Actions Footer */}
            <div className="pt-6 border-t border-gray-100 mt-auto">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {txHash && (
                    <a
                      href={`https://testnet.snowtrace.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-teal-600 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={12} />
                      View On-Chain Proof
                    </a>
                  )}
                </div>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setResult(null);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                >
                  New Query
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
