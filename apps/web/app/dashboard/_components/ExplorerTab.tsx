"use client";

import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Shield,
  MessageCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

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

interface QueryResult {
  sentiment: number;
  label: string;
  summary: string;
  factors: string[];
  queryId: number;
  txHash: string;
}

export function ExplorerTab() {
  const [selectedType, setSelectedType] = useState("market");
  const [assets, setAssets] = useState("BTC, ETH");
  const [status, setStatus] = useState<QueryStatus>("idle");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedQuery = queryTypes.find((q) => q.id === selectedType)!;

  const handleSubmit = async () => {
    setStatus("loading");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setResult({
      sentiment: 78,
      label: "Bullish",
      summary:
        "Based on analysis of recent market data, BTC and ETH are showing strong bullish momentum. Trading volume has increased 23% over the past 24 hours, with positive sentiment across major trading platforms.",
      factors: [
        "Increased institutional buying pressure",
        "Positive regulatory news from SEC",
        "Technical breakout above key resistance levels",
        "Growing on-chain accumulation from whales",
      ],
      queryId: 25,
      txHash: "0xabc123...def456",
    });
    setStatus("success");
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
              <input
                type="text"
                value={assets}
                onChange={(e) => setAssets(e.target.value)}
                placeholder="e.g., BTC, ETH, AVAX"
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#14B8A6] font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0A0A0A] mb-2">
                Timeframe
              </label>
              <select className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm">
                <option>24 hours</option>
                <option>7 days</option>
                <option>30 days</option>
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
            Will be charged from your wallet
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
            <Loader2 size={48} className="text-[#14B8A6] animate-spin mb-4" />
            <p className="text-[#6A6A6A]">
              Fetching data from multiple sources...
            </p>
          </div>
        )}

        {status === "success" && result && (
          <div className="space-y-6">
            {/* Sentiment Score */}
            <div className="text-center pb-6 border-b border-[#E5E5E5]">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-[#14B8A6] mb-4">
                <div>
                  <p className="text-4xl font-bold text-[#0A0A0A]">
                    {result.sentiment}
                  </p>
                  <p className="text-sm text-[#6A6A6A]">/100</p>
                </div>
              </div>
              <p className="text-xl font-semibold text-green-600">
                {result.label}
              </p>
            </div>

            {/* Summary */}
            <div>
              <h4 className="font-semibold text-[#0A0A0A] mb-2">
                Market Summary
              </h4>
              <p className="text-[#4A4A4A] leading-relaxed">{result.summary}</p>
            </div>

            {/* Key Factors */}
            <div>
              <h4 className="font-semibold text-[#0A0A0A] mb-2">Key Factors</h4>
              <ul className="space-y-2">
                {result.factors.map((factor, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-[#4A4A4A]"
                  >
                    <span className="text-[#14B8A6]">✓</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* Metadata */}
            <div className="pt-6 border-t border-[#E5E5E5] flex flex-wrap gap-4 text-sm text-[#6A6A6A]">
              <span>Query ID: #{result.queryId}</span>
              <span>•</span>
              <span>Paid: ${selectedQuery.price.toFixed(2)}</span>
              <span>•</span>
              <a
                href="#"
                className="text-[#14B8A6] hover:underline inline-flex items-center gap-1"
              >
                View on Snowtrace <ExternalLink size={14} />
              </a>
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
