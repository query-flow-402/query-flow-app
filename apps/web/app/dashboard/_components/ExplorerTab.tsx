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
  },
  {
    id: "price",
    name: "Price Prediction",
    description: "ML-powered price forecasting",
    price: 0.03,
    icon: DollarSign,
    color: "#8B5CF6",
  },
  {
    id: "risk",
    name: "Risk Assessment",
    description: "Wallet and transaction risk analysis",
    price: 0.05,
    icon: Shield,
    color: "#EF4444",
  },
  {
    id: "social",
    name: "Social Sentiment",
    description: "Social media sentiment aggregation",
    price: 0.02,
    icon: MessageCircle,
    color: "#10B981",
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
    <div className="grid lg:grid-cols-[400px_1fr] gap-8">
      {/* Left: Query Builder */}
      <div className="space-y-6">
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#0A0A0A] mb-4">
            Select Query Type
          </h3>

          {/* Query Type Cards */}
          <div className="space-y-3">
            {queryTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedType === type.id
                    ? "border-[#14B8A6] bg-[rgba(20,184,166,0.05)]"
                    : "border-[#E5E5E5] hover:border-[#9A9A9A]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `${type.color}20` }}
                  >
                    <type.icon size={20} style={{ color: type.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-[#0A0A0A]">
                        {type.name}
                      </span>
                      <span className="font-mono text-sm text-[#14B8A6]">
                        ${type.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-[#6A6A6A] mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-6">
          <h3 className="text-sm font-medium text-[#6A6A6A] uppercase tracking-wider mb-4">
            Parameters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0A0A0A] mb-2">
                Assets
              </label>
              <select
                value={assets}
                onChange={(e) => setAssets(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm text-[#0A0A0A] bg-white"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0A0A] mb-2">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm text-[#0A0A0A] bg-white"
              >
                <option value="1h">1 hour</option>
                <option value="4h">4 hours</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Price Display */}
        <div className="bg-[#F8F8F8] border border-[#E5E5E5] rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-[#14B8A6]">
            ${selectedQuery.price.toFixed(2)}
          </p>
          <p className="text-sm text-[#6A6A6A] mt-1">
            ~{(selectedQuery.price / 35).toFixed(6)} AVAX (approx)
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={status === "loading"}
          className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Processing...
            </>
          ) : (
            "Make Query & Pay"
          )}
        </button>
      </div>

      {/* Right: Results */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-8">
        {status === "idle" && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-4">
              <TrendingUp size={32} className="text-[#9A9A9A]" />
            </div>
            <p className="text-[#6A6A6A]">
              Select a query type and submit to see results
            </p>
          </div>
        )}

        {status === "loading" && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            {/* Show appropriate icon based on stage */}
            {paymentStatus?.stage === "sending" ? (
              <div className="w-16 h-16 rounded-full bg-[rgba(20,184,166,0.1)] flex items-center justify-center mb-4">
                <Wallet size={32} className="text-[#14B8A6]" />
              </div>
            ) : (
              <Loader2 size={48} className="text-[#14B8A6] animate-spin mb-4" />
            )}

            {/* Payment stage message */}
            <p className="text-[#0A0A0A] font-medium mb-2">
              {paymentStatus?.stage === "requesting" && "Getting price..."}
              {paymentStatus?.stage === "sending" && "Confirm in Wallet"}
              {paymentStatus?.stage === "confirming" &&
                "Confirming Transaction..."}
              {paymentStatus?.stage === "submitting" && "Payment Verified!"}
              {!paymentStatus && "Processing..."}
            </p>

            {/* Show AVAX amount when available */}
            {paymentStatus?.priceAvax && (
              <p className="text-[#14B8A6] font-mono text-lg mb-2">
                {paymentStatus.priceAvax} AVAX
              </p>
            )}

            <p className="text-[#6A6A6A] text-sm">
              {paymentStatus?.message || "Processing your request..."}
            </p>

            {/* Show transaction hash if available */}
            {paymentStatus?.txHash && (
              <a
                href={`https://testnet.snowtrace.io/tx/${paymentStatus.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-xs text-[#14B8A6] hover:underline flex items-center gap-1"
              >
                View on Snowtrace <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <p className="text-red-600 font-medium mb-2">Query Failed</p>
            <p className="text-[#6A6A6A]">{error}</p>
            <button
              onClick={() => {
                setStatus("idle");
                setError(null);
              }}
              className="mt-4 btn-secondary"
            >
              Try Again
            </button>
          </div>
        )}

        {status === "success" && result && (
          <div className="space-y-6">
            {/* Query-type specific display */}
            <QueryResultDisplay
              type={selectedType as "market" | "price" | "risk" | "social"}
              result={result}
            />

            {/* Metadata */}
            <div className="pt-6 border-t border-[#E5E5E5] flex flex-wrap gap-4 text-sm text-[#6A6A6A]">
              <span>Type: {selectedQuery.name}</span>
              <span>•</span>
              <span>Paid: ${selectedQuery.price.toFixed(2)}</span>
              {txHash && (
                <>
                  <span>•</span>
                  <a
                    href={`https://testnet.snowtrace.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#14B8A6] hover:underline flex items-center gap-1"
                  >
                    View Tx <ExternalLink size={12} />
                  </a>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={copyResult} className="btn-secondary flex-1">
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied!" : "Copy Result"}
              </button>
              <button
                onClick={() => {
                  setStatus("idle");
                  setResult(null);
                }}
                className="btn-secondary flex-1"
              >
                New Query
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
