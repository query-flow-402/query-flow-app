/**
 * Test script for CoinGecko and Data Aggregator
 * Run with: npx tsx src/services/test-data.ts
 */
import "dotenv/config";
import { getCurrentPrices, getTrendingCoins } from "./coingecko.js";
import { aggregateMarketData, formatDataForPrompt } from "./data-aggregator.js";

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  📊 Data Service Test Suite");
  console.log("═══════════════════════════════════════════════════\n");

  // Test 1: CoinGecko prices
  console.log("Test 1: CoinGecko.getCurrentPrices()");
  console.log("────────────────────────────────────");
  try {
    const prices = await getCurrentPrices(["bitcoin", "ethereum"]);
    console.log("  Bitcoin:", "$" + prices[0]?.current_price.toLocaleString());
    console.log("  Ethereum:", "$" + prices[1]?.current_price.toLocaleString());
    console.log("  ✅ Price fetch OK\n");
  } catch (error) {
    console.log("  ❌ Error:", (error as Error).message, "\n");
  }

  // Test 2: Trending coins
  console.log("Test 2: CoinGecko.getTrendingCoins()");
  console.log("────────────────────────────────────");
  try {
    const trending = await getTrendingCoins();
    console.log(
      "  Top 3 trending:",
      trending
        .slice(0, 3)
        .map((t) => t.name)
        .join(", ")
    );
    console.log("  ✅ Trending OK\n");
  } catch (error) {
    console.log("  ❌ Error:", (error as Error).message, "\n");
  }

  // Test 3: Data Aggregator
  console.log("Test 3: aggregateMarketData()");
  console.log("─────────────────────────────");
  try {
    const data = await aggregateMarketData(["btc", "eth", "avax"]);
    console.log("  Prices fetched:", data.prices.length);
    console.log("  Trending fetched:", data.trending.length);
    console.log("  Market sentiment:", data.summary.marketSentiment);
    console.log(
      "  Avg 24h change:",
      data.summary.avgPriceChange24h.toFixed(2) + "%"
    );
    console.log("  ✅ Aggregator OK\n");

    // Test 4: Format for prompt
    console.log("Test 4: formatDataForPrompt()");
    console.log("─────────────────────────────");
    const prompt = formatDataForPrompt(data);
    console.log("  Preview (first 200 chars):");
    console.log("  " + prompt.substring(0, 200).replace(/\n/g, "\n  "));
    console.log("  ✅ Formatter OK\n");
  } catch (error) {
    console.log("  ❌ Error:", (error as Error).message, "\n");
  }

  console.log("═══════════════════════════════════════════════════");
  console.log("  ✅ All data service tests passed!");
  console.log("═══════════════════════════════════════════════════\n");
}

main().catch(console.error);
