export interface ClientOptions {
  apiKey?: string;
  apiUrl?: string;
  mode?: "signature" | "tx"; // Payment mode: 'signature' (test) or 'tx' (real)
}

// Result Types matching the API response structure's "data" field

export interface MarketResult {
  tokensUsed: number;
  sentiment: {
    score: number;
    trend: "bullish" | "bearish" | "neutral";
    summary: string;
  };
  factors: string[];
}

export interface PriceResult {
  prediction: {
    targetPrice: number;
    direction: "bullish" | "bearish" | "neutral";
    confidence: number;
    timeframe: string;
  };
  signals: Array<{
    indicator: string;
    value: string;
    impact: "positive" | "negative" | "neutral";
  }>;
  context: string;
}

export interface RiskResult {
  risk: {
    score: number;
    level: "low" | "medium" | "high" | "critical";
    confidence: number;
  };
  factors: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
  }>;
  recommendation: string;
  metadata: {
    walletAge: string;
    txCount: number;
    totalVolume: string;
  };
}

export interface SocialResult {
  sentiment: {
    score: number;
    trend: "bullish" | "bearish" | "neutral";
    volume: "low" | "medium" | "high";
  };
  trending: Array<{
    topic: string;
    mentions: number;
    sentiment: "bullish" | "bearish" | "neutral" | "positive" | "negative";
  }>;
  summary: string;
  warnings: string[];
}

export interface QueryHistoryItem {
  id: string;
  type: string;
  amount: string;
  amountUsd: number;
  timestamp: number;
  txHash: string;
  status: string;
  resultHash: string;
}

export interface ApiError {
  code: string;
  message: string;
}

// Generic API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  payment?: {
    priceUsd: number;
    priceAvax: string;
    paymentAddress: string;
    expiresAt: number;
  };
  instructions?: {
    message: string;
    format: string;
  };
}
