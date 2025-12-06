/**
 * Social Data Service
 * Aggregates social media sentiment data
 * Uses mock data for demo (production would use Twitter/Reddit APIs)
 */

import { DataFetchError } from "../lib/errors.js";

// =============================================================================
// TYPES
// =============================================================================

export interface SocialMention {
  platform: "twitter" | "reddit" | "discord";
  author: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  engagement: number;
  timestamp: number;
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  sentiment: "bullish" | "bearish" | "neutral";
  change24h: number;
}

export interface SocialData {
  asset: string;
  mentions: SocialMention[];
  trending: TrendingTopic[];
  summary: {
    totalMentions: number;
    sentimentScore: number;
    volumeLevel: "low" | "medium" | "high";
    dominantPlatform: string;
  };
  warnings: string[];
}

// =============================================================================
// MOCK DATA GENERATOR
// =============================================================================

/**
 * Generate realistic mock social data for demo
 * In production, this would call Twitter/Reddit APIs
 */
export async function getSocialData(asset: string): Promise<SocialData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const assetLower = asset.toLowerCase();

  // Generate mock mentions based on asset
  const mentions = generateMockMentions(assetLower);
  const trending = generateMockTrending(assetLower);

  // Calculate summary
  const totalMentions = mentions.length * 100; // Simulate larger dataset
  const positiveCount = mentions.filter(
    (m) => m.sentiment === "positive"
  ).length;
  const sentimentScore = Math.round((positiveCount / mentions.length) * 100);

  const volumeLevel =
    totalMentions > 5000 ? "high" : totalMentions > 1000 ? "medium" : "low";

  // Detect potential warnings
  const warnings: string[] = [];
  if (trending.some((t) => t.change24h > 500)) {
    warnings.push(
      "Unusual spike in mentions detected - possible coordinated activity"
    );
  }
  if (mentions.filter((m) => m.engagement > 10000).length > 3) {
    warnings.push("High engagement from few accounts - verify authenticity");
  }

  return {
    asset,
    mentions,
    trending,
    summary: {
      totalMentions,
      sentimentScore,
      volumeLevel,
      dominantPlatform: "twitter",
    },
    warnings,
  };
}

function generateMockMentions(asset: string): SocialMention[] {
  const sentiments: Array<"positive" | "negative" | "neutral"> = [
    "positive",
    "negative",
    "neutral",
  ];
  const platforms: Array<"twitter" | "reddit" | "discord"> = [
    "twitter",
    "reddit",
    "discord",
  ];

  const templates = {
    positive: [
      `${asset.toUpperCase()} looking strong! 🚀`,
      `Bullish on ${asset}, great fundamentals`,
      `Just bought more ${asset}, feeling good about this`,
      `${asset.toUpperCase()} to the moon! 📈`,
    ],
    negative: [
      `${asset.toUpperCase()} looking weak, be careful`,
      `Sold my ${asset}, not feeling confident`,
      `${asset} might drop further, watch out`,
      `Bearish on ${asset} short term`,
    ],
    neutral: [
      `What do you think about ${asset}?`,
      `${asset.toUpperCase()} consolidating, waiting for direction`,
      `Interesting price action on ${asset}`,
      `Watching ${asset} closely`,
    ],
  };

  const mentions: SocialMention[] = [];
  const now = Date.now();

  for (let i = 0; i < 10; i++) {
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const contentList = templates[sentiment];

    mentions.push({
      platform,
      author: `user_${Math.random().toString(36).substring(7)}`,
      content: contentList[Math.floor(Math.random() * contentList.length)],
      sentiment,
      engagement: Math.floor(Math.random() * 5000) + 100,
      timestamp: now - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
    });
  }

  return mentions;
}

function generateMockTrending(asset: string): TrendingTopic[] {
  const topics = [
    { topic: `#${asset.toUpperCase()}`, base: 5000 },
    { topic: `$${asset.toUpperCase()}`, base: 3000 },
    { topic: `${asset} price`, base: 2000 },
    { topic: `${asset} prediction`, base: 1500 },
    { topic: `buy ${asset}`, base: 1000 },
  ];

  return topics.map((t) => ({
    topic: t.topic,
    mentions: t.base + Math.floor(Math.random() * t.base),
    sentiment:
      Math.random() > 0.3
        ? "bullish"
        : Math.random() > 0.5
          ? "bearish"
          : "neutral",
    change24h: Math.floor(Math.random() * 200) - 50,
  }));
}

/**
 * Format social data for AI prompt
 */
export function formatSocialDataForPrompt(data: SocialData): string {
  const topMentions = data.mentions
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5)
    .map(
      (m) =>
        `- [${m.platform}] "${m.content}" (${m.engagement} engagements, ${m.sentiment})`
    )
    .join("\n");

  const trendingList = data.trending
    .map(
      (t) =>
        `- ${t.topic}: ${t.mentions} mentions (${t.sentiment}, ${t.change24h >= 0 ? "+" : ""}${t.change24h}% 24h)`
    )
    .join("\n");

  return `Social Media Analysis for: ${data.asset.toUpperCase()}

Summary:
- Total Mentions (24h): ${data.summary.totalMentions}
- Sentiment Score: ${data.summary.sentimentScore}/100
- Volume Level: ${data.summary.volumeLevel}
- Dominant Platform: ${data.summary.dominantPlatform}

Top Mentions:
${topMentions}

Trending Topics:
${trendingList}

${data.warnings.length > 0 ? `\nWarnings:\n${data.warnings.map((w) => `⚠️ ${w}`).join("\n")}` : ""}

Please analyze this social data and provide sentiment insights.`;
}
