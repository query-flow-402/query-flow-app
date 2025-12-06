/**
 * OpenAI Service
 * AI-powered insight generation
 */

import OpenAI from "openai";
import { type QueryType, type MarketSentiment } from "../types/payment.js";
import { AIServiceError } from "../lib/errors.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

type AIProvider = "openai" | "deepseek";

interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
}

const PROVIDER_CONFIGS: Record<AIProvider, () => ProviderConfig | null> = {
  openai: () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return {
      apiKey,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  },
  deepseek: () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return null;
    return {
      apiKey,
      baseURL: "https://api.deepseek.com",
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  },
};

// Determine which provider to use (priority: explicit env var > available key)
function getProvider(): AIProvider {
  const explicit = process.env.AI_PROVIDER as AIProvider | undefined;
  if (explicit && PROVIDER_CONFIGS[explicit]?.()) {
    return explicit;
  }
  // Auto-detect: prefer DeepSeek if available, then OpenAI
  if (PROVIDER_CONFIGS.deepseek()) return "deepseek";
  if (PROVIDER_CONFIGS.openai()) return "openai";
  return "openai"; // Default, will error on use
}

let openaiClient: OpenAI | null = null;
let currentProvider: AIProvider | null = null;
let currentModel: string = "";

function getOpenAI(): OpenAI {
  const provider = getProvider();
  const config = PROVIDER_CONFIGS[provider]();

  if (!config) {
    throw new AIServiceError(
      `No API key found. Set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env`
    );
  }

  // Reinitialize if provider changed
  if (!openaiClient || currentProvider !== provider) {
    openaiClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    currentProvider = provider;
    currentModel = config.model;
    console.log(`🤖 AI Provider: ${provider} (model: ${currentModel})`);
  }

  return openaiClient;
}

function getModel(): string {
  return currentModel || "gpt-4o-mini";
}

const MAX_TOKENS = 500;

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const PROMPTS: Record<QueryType, string> = {
  market: `You are a crypto market analyst. Analyze this market data and provide:
1. Sentiment score (0-100, where 100 is extremely bullish)
2. Trend direction (bullish/bearish/neutral)
3. Brief 2-sentence summary
4. Key factors (max 3 bullet points)

Respond ONLY with valid JSON in this exact format:
{
  "sentiment": {"score": number, "trend": "bullish"|"bearish"|"neutral", "summary": "string"},
  "factors": ["string", "string", "string"]
}

Market Data:
{data}`,

  price: `You are a crypto price prediction analyst. Based on this historical price data and technical indicators, provide:
1. Price target for the specified timeframe
2. Direction (bullish/bearish/neutral)
3. Confidence score (0-100)
4. Key signals influencing the prediction

Respond ONLY with valid JSON:
{
  "prediction": {
    "targetPrice": number,
    "direction": "bullish"|"bearish"|"neutral",
    "confidence": number,
    "timeframe": "24h"|"7d"|"30d"
  },
  "signals": [
    {"indicator": "string", "value": "string", "impact": "positive"|"negative"}
  ],
  "context": "string (2-3 sentence summary)"
}

Historical Data:
{data}`,

  news: `You are a crypto news analyst. Summarize the sentiment from these news items.

Respond ONLY with valid JSON:
{
  "sentiment": {"score": number, "trend": "bullish"|"bearish"|"neutral", "summary": "string"},
  "factors": ["string", "string"]
}

News Data:
{data}`,

  portfolio: `You are a portfolio analyst. Analyze this portfolio and provide insights.

Respond ONLY with valid JSON:
{
  "sentiment": {"score": number, "trend": "bullish"|"bearish"|"neutral", "summary": "string"},
  "factors": ["string", "string"]
}

Portfolio Data:
{data}`,

  social: `You are a crypto social sentiment analyst. Analyze social media data and provide:
1. Sentiment score (0-100)
2. Trend direction
3. Volume level (low/medium/high)
4. Trending topics and any warnings

Respond ONLY with valid JSON:
{
  "sentiment": {"score": number, "trend": "bullish"|"bearish"|"neutral", "volume": "low"|"medium"|"high"},
  "trending": [{"topic": "string", "mentions": number, "sentiment": "string"}],
  "summary": "string",
  "warnings": ["string"]
}

Social Data:
{data}`,

  risk: `You are a blockchain risk analyst. Analyze this wallet/transaction data for suspicious patterns and provide:
1. Risk score (0-100, where 100 is highest risk)
2. Risk level (low/medium/high/critical)
3. Specific risk factors identified
4. Recommendation for the user

Respond ONLY with valid JSON:
{
  "risk": {
    "score": number,
    "level": "low"|"medium"|"high"|"critical",
    "confidence": number
  },
  "factors": [
    {"type": "string", "severity": "low"|"medium"|"high", "description": "string"}
  ],
  "recommendation": "string",
  "metadata": {
    "walletAge": "string",
    "txCount": number,
    "totalVolume": "string"
  }
}

Wallet/Transaction Data:
{data}`,
};

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class AIService {
  /**
   * Generate insight from market data
   */
  async generateInsight(
    type: QueryType,
    data: unknown
  ): Promise<MarketSentiment> {
    const prompt = this.buildPrompt(type, data);

    try {
      const response = await this.callOpenAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError("Failed to generate AI insight", {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Build prompt from template
   */
  private buildPrompt(type: QueryType, data: unknown): string {
    const template = PROMPTS[type];
    const dataStr =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return template.replace("{data}", dataStr);
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: getModel(),
        messages: [
          {
            role: "system",
            content:
              "You are a crypto market analyst. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceError("Empty response from OpenAI");
      }

      return content;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new AIServiceError(`OpenAI API error: ${error.message}`, {
          status: error.status,
          code: error.code,
        });
      }
      throw error;
    }
  }

  /**
   * Parse JSON response from AI - returns raw parsed JSON with tokensUsed
   */
  private parseResponse(response: string): MarketSentiment {
    try {
      // Extract JSON from response (in case of extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Add tokensUsed to the response
      parsed.tokensUsed = 0;

      // For market/sentiment format, validate and normalize
      if (parsed.sentiment && typeof parsed.sentiment.score === "number") {
        return {
          sentiment: {
            score: Math.min(100, Math.max(0, parsed.sentiment.score)),
            trend: parsed.sentiment.trend || "neutral",
            summary: parsed.sentiment.summary || "",
          },
          factors: Array.isArray(parsed.factors)
            ? parsed.factors.slice(0, 3)
            : [],
          tokensUsed: 0,
        };
      }

      // For other types (price, risk, social), return parsed JSON directly
      return parsed as MarketSentiment;
    } catch (error) {
      throw new AIServiceError("Failed to parse AI response", {
        response,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Estimate tokens for a prompt
   */
  estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

// Export singleton instance
export const aiService = new AIService();
