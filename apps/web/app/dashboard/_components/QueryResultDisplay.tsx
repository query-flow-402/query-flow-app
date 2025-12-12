"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  DollarSign,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface MarketResult {
  sentiment?: { score: number; trend: string; summary: string };
  factors?: string[];
}

interface PriceResult {
  prediction?: {
    targetPrice: number;
    direction: string;
    confidence: number;
    timeframe: string;
  };
  signals?: Array<{ indicator: string; value: string; impact: string }>;
  technicalAnalysis?: {
    rsi: number;
    support: number;
    resistance: number;
    trend: string;
  };
  context?: string;
}

interface RiskResult {
  risk?: {
    score: number;
    level: string;
    confidence: number;
  };
  factors?: Array<{ type: string; severity: string; description: string }>;
  recommendation?: string;
  metadata?: { walletAge: string; txCount: number; totalVolume: string };
}

interface SocialResult {
  sentiment?: { score: number; trend: string; volume: string };
  trending?: Array<{ topic: string; mentions: number; sentiment: string }>;
  summary?: string;
  warnings?: string[];
}

type QueryResultData = MarketResult | PriceResult | RiskResult | SocialResult;

interface QueryResultDisplayProps {
  type: "market" | "price" | "risk" | "social";
  result: QueryResultData;
}

// =============================================================================
// SCORE DISPLAY COMPONENT
// =============================================================================

function ScoreCircle({
  score,
  label,
  trend,
}: {
  score: number | string;
  label: string;
  trend?:
    | "bullish"
    | "bearish"
    | "neutral"
    | "low"
    | "medium"
    | "high"
    | "critical";
}) {
  const getColor = () => {
    if (trend === "bullish" || trend === "low")
      return { border: "border-green-500", text: "text-green-600" };
    if (trend === "bearish" || trend === "high" || trend === "critical")
      return { border: "border-red-500", text: "text-red-600" };
    return { border: "border-amber-500", text: "text-amber-600" };
  };

  const colors = getColor();

  return (
    <div className="text-center pb-6 border-b border-[#E5E5E5]">
      <div
        className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 mb-4 ${colors.border}`}
      >
        <div>
          <p className="text-4xl font-bold text-[#0A0A0A]">{score}</p>
          <p className="text-sm text-[#6A6A6A]">/100</p>
        </div>
      </div>
      <p className={`text-xl font-semibold capitalize ${colors.text}`}>
        {label}
      </p>
    </div>
  );
}

// =============================================================================
// MARKET RESULT DISPLAY
// =============================================================================

function MarketResultDisplay({ result }: { result: MarketResult }) {
  const sentiment = result.sentiment;

  return (
    <>
      <ScoreCircle
        score={sentiment?.score ?? "--"}
        label={sentiment?.trend ?? "N/A"}
        trend={sentiment?.trend as "bullish" | "bearish" | "neutral"}
      />

      {sentiment?.summary && (
        <div>
          <h4 className="font-semibold text-[#0A0A0A] mb-2">
            Analysis Summary
          </h4>
          <p className="text-[#4A4A4A] leading-relaxed">{sentiment.summary}</p>
        </div>
      )}

      {result.factors && result.factors.length > 0 && (
        <div>
          <h4 className="font-semibold text-[#0A0A0A] mb-2">Key Factors</h4>
          <ul className="space-y-2">
            {result.factors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-[#4A4A4A]">
                <span className="text-[#14B8A6]">✓</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// =============================================================================
// PRICE RESULT DISPLAY
// =============================================================================

function PriceResultDisplay({ result }: { result: PriceResult }) {
  const prediction = result.prediction;
  const isPositive = prediction?.direction === "bullish";
  const isNegative = prediction?.direction === "bearish";

  return (
    <>
      {/* Price Prediction Header */}
      <div className="text-center pb-6 border-b border-[#E5E5E5]">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isPositive ? (
            <ArrowUpRight size={32} className="text-green-500" />
          ) : isNegative ? (
            <ArrowDownRight size={32} className="text-red-500" />
          ) : (
            <Minus size={32} className="text-amber-500" />
          )}
          <span
            className={`text-4xl font-bold ${isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-[#0A0A0A]"}`}
          >
            ${prediction?.targetPrice?.toLocaleString() ?? "--"}
          </span>
        </div>
        <p
          className={`text-lg font-medium capitalize ${isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-amber-600"}`}
        >
          {prediction?.direction ?? "Neutral"} • {prediction?.confidence ?? 0}%
          Confidence
        </p>
        <p className="text-sm text-[#6A6A6A] mt-1">
          Timeframe: {prediction?.timeframe ?? "7d"}
        </p>
      </div>

      {/* Technical Signals */}
      {result.technicalAnalysis && (
        <div className="mb-6">
          <h4 className="font-semibold text-[#0A0A0A] mb-3">
            Technical Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* RSI */}
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <p className="text-xs text-[#6A6A6A] uppercase mb-1">RSI (14)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#0A0A0A]">
                  {result.technicalAnalysis.rsi.toFixed(1)}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    result.technicalAnalysis.rsi > 70
                      ? "bg-red-100 text-red-700"
                      : result.technicalAnalysis.rsi < 30
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {result.technicalAnalysis.rsi > 70
                    ? "Overbought"
                    : result.technicalAnalysis.rsi < 30
                      ? "Oversold"
                      : "Neutral"}
                </span>
              </div>
            </div>

            {/* Volume Trend */}
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
              <p className="text-xs text-[#6A6A6A] uppercase mb-1">
                Volume Trend
              </p>
              <div className="flex items-center gap-2">
                {result.technicalAnalysis.trend === "increasing" ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : result.technicalAnalysis.trend === "decreasing" ? (
                  <TrendingDown size={16} className="text-red-500" />
                ) : (
                  <Minus size={16} className="text-gray-400" />
                )}
                <span className="text-sm font-medium capitalize text-[#0A0A0A]">
                  {result.technicalAnalysis.trend}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Support */}
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center">
              <p className="text-xs text-green-700 uppercase mb-1">Support</p>
              <p className="font-mono font-medium text-green-900">
                ${result.technicalAnalysis.support.toLocaleString()}
              </p>
            </div>

            {/* Resistance */}
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center">
              <p className="text-xs text-red-700 uppercase mb-1">Resistance</p>
              <p className="font-mono font-medium text-red-900">
                ${result.technicalAnalysis.resistance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {result.signals && result.signals.length > 0 && (
        <div>
          <h4 className="font-semibold text-[#0A0A0A] mb-3">AI Signals</h4>
          <div className="grid grid-cols-2 gap-3">
            {result.signals.map((signal, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  signal.impact === "positive"
                    ? "border-green-200 bg-green-50"
                    : signal.impact === "negative"
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                <p className="text-xs text-[#6A6A6A] uppercase">
                  {signal.indicator}
                </p>
                <p className="font-medium text-[#0A0A0A]">{signal.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context */}
      {result.context && (
        <div>
          <h4 className="font-semibold text-[#0A0A0A] mb-2">Analysis</h4>
          <p className="text-[#4A4A4A] leading-relaxed">{result.context}</p>
        </div>
      )}
    </>
  );
}

// =============================================================================
// RISK RESULT DISPLAY
// =============================================================================

function RiskResultDisplay({ result }: { result: RiskResult }) {
  const risk = result.risk;

  const getLevelColor = (level?: string) => {
    if (level === "low") return "text-green-600";
    if (level === "medium") return "text-amber-600";
    if (level === "high" || level === "critical") return "text-red-600";
    return "text-gray-600";
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === "low") return "bg-green-100 text-green-700";
    if (severity === "medium") return "bg-amber-100 text-amber-700";
    if (severity === "high") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <>
      {/* Risk Score */}
      <ScoreCircle
        score={risk?.score ?? "--"}
        label={`${risk?.level ?? "Unknown"} Risk`}
        trend={risk?.level as "low" | "medium" | "high" | "critical"}
      />

      {/* Confidence */}
      <div className="text-center -mt-4 pb-4 border-b border-[#E5E5E5]">
        <span className="text-sm text-[#6A6A6A]">
          Confidence:{" "}
          <span className="font-medium">{risk?.confidence ?? 0}%</span>
        </span>
      </div>

      {/* Risk Factors */}
      {result.factors && result.factors.length > 0 && (
        <div>
          <h4 className="font-semibold text-[#0A0A0A] mb-3">Risk Factors</h4>
          <div className="space-y-3">
            {result.factors.map((factor, i) => (
              <div
                key={i}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${getSeverityBadge(factor.severity)}`}
                  >
                    {factor.severity}
                  </span>
                  <span className="text-sm font-medium text-[#0A0A0A]">
                    {factor.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-[#4A4A4A]">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {result.recommendation && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
            <Shield size={16} />
            Recommendation
          </h4>
          <p className="text-sm text-blue-800">{result.recommendation}</p>
        </div>
      )}

      {/* Wallet Metadata */}
      {result.metadata && (
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E5E5E5]">
          <div className="text-center">
            <p className="text-xs text-[#6A6A6A]">Wallet Age</p>
            <p className="font-medium text-[#0A0A0A]">
              {result.metadata.walletAge}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#6A6A6A]">Transactions</p>
            <p className="font-medium text-[#0A0A0A]">
              {result.metadata.txCount}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#6A6A6A]">Volume</p>
            <p className="font-medium text-[#0A0A0A]">
              {result.metadata.totalVolume}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// SOCIAL RESULT DISPLAY
// =============================================================================

function SocialResultDisplay({ result }: { result: SocialResult }) {
  const sentiment = result.sentiment;

  return (
    <>
      <ScoreCircle
        score={sentiment?.score ?? "--"}
        label={sentiment?.trend ?? "N/A"}
        trend={sentiment?.trend as "bullish" | "bearish" | "neutral"}
      />

      {/* Volume Badge */}
      <div className="text-center -mt-4 pb-4 border-b border-[#E5E5E5]">
        <span
          className={`text-sm px-3 py-1 rounded-full ${
            sentiment?.volume === "high"
              ? "bg-green-100 text-green-700"
              : sentiment?.volume === "low"
                ? "bg-gray-100 text-gray-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {sentiment?.volume ?? "Unknown"} Volume
        </span>
      </div>

      {/* Summary */}
      {result.summary && (
        <div>
          <h4 className="font-semibold text-[#0A0A0A] mb-2">Summary</h4>
          <p className="text-[#4A4A4A] leading-relaxed">{result.summary}</p>
        </div>
      )}

      {/* Trending Topics */}
      {result.trending && result.trending.length > 0 && (
        <div>
          <h4 className="font-semibold text-[#0A0A0A] mb-3">Trending Topics</h4>
          <div className="space-y-2">
            {result.trending.map((topic, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-[#6A6A6A]" />
                  <span className="font-medium text-[#0A0A0A]">
                    {topic.topic}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#6A6A6A]">
                    {topic.mentions.toLocaleString()} mentions
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      topic.sentiment === "bullish" ||
                      topic.sentiment === "positive"
                        ? "bg-green-100 text-green-700"
                        : topic.sentiment === "bearish" ||
                            topic.sentiment === "negative"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {topic.sentiment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            Warnings
          </h4>
          <ul className="space-y-1">
            {result.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-amber-800">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function QueryResultDisplay({ type, result }: QueryResultDisplayProps) {
  if (!result) return null;

  switch (type) {
    case "market":
      return <MarketResultDisplay result={result as MarketResult} />;
    case "price":
      return <PriceResultDisplay result={result as PriceResult} />;
    case "risk":
      return <RiskResultDisplay result={result as RiskResult} />;
    case "social":
      return <SocialResultDisplay result={result as SocialResult} />;
    default:
      return <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>;
  }
}
