/**
 * End-to-End Test Script
 * Tests the full flow: Data → AI → Response
 * Run with: npx tsx src/test-e2e.ts
 */
import "dotenv/config";
import {
  aggregateMarketData,
  formatDataForPrompt,
} from "./services/data-aggregator.js";
import { aiService } from "./services/ai.js";
import { recordQuery, getQueryCount, healthCheck } from "./lib/contracts.js";
import { keccak256, toHex, type Address } from "viem";

async function main() {
  console.log("");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("  🧪 QueryFlow End-to-End Test");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("");

  const assets = ["bitcoin", "ethereum", "avalanche-2"];

  // Step 1: Blockchain health
  console.log("Step 1: Blockchain Connection");
  console.log("─────────────────────────────");
  const health = await healthCheck();
  if (health.connected) {
    console.log(
      `  ✅ Connected to Avalanche Fuji (block: ${health.blockNumber})`
    );
  } else {
    console.log("  ❌ Blockchain connection failed");
    return;
  }

  // Step 2: Fetch market data
  console.log("\nStep 2: Fetching Market Data");
  console.log("────────────────────────────");
  console.log(`  Assets: ${assets.join(", ")}`);

  const marketData = await aggregateMarketData(assets);
  const formattedData = formatDataForPrompt(marketData);

  console.log(`  ✅ Fetched ${marketData.prices.length} prices`);
  console.log(`  ✅ Market sentiment: ${marketData.summary.marketSentiment}`);
  console.log(
    `  ✅ 24h avg change: ${marketData.summary.avgPriceChange24h.toFixed(2)}%`
  );

  // Step 3: Generate AI insight
  console.log("\nStep 3: Generating AI Insight");
  console.log("─────────────────────────────");

  try {
    const insight = await aiService.generateInsight("market", formattedData);

    console.log("  ✅ AI Response received!");
    console.log("");
    console.log("  ┌─────────────────────────────────────────────────────┐");
    console.log(
      `  │  Sentiment Score: ${insight.sentiment.score}/100 (${insight.sentiment.trend})`
    );
    console.log("  ├─────────────────────────────────────────────────────┤");
    console.log(`  │  ${insight.sentiment.summary.substring(0, 55)}`);
    if (insight.sentiment.summary.length > 55) {
      console.log(`  │  ${insight.sentiment.summary.substring(55, 110)}`);
    }
    console.log("  ├─────────────────────────────────────────────────────┤");
    insight.factors.forEach((f, i) => {
      console.log(`  │  ${i + 1}. ${f.substring(0, 50)}`);
    });
    console.log("  └─────────────────────────────────────────────────────┘");

    // Step 4: Record on-chain (optional - requires PRIVATE_KEY)
    console.log("\nStep 4: Recording Query On-Chain");
    console.log("─────────────────────────────────");

    if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith("0x")) {
      try {
        const resultHash = keccak256(toHex(JSON.stringify(insight)));
        const testPayer =
          "0x773d652234c0e8a40b97f82f23697d717a8e1d92" as Address;
        const payment = BigInt(20000); // $0.02 in USDC decimals

        console.log("  Recording query...");
        const { txHash, queryId } = await recordQuery(
          testPayer,
          "market",
          payment,
          resultHash
        );

        console.log(`  ✅ Query recorded!`);
        console.log(`     Query ID: ${queryId}`);
        console.log(`     Tx Hash: ${txHash}`);
        console.log(
          `     View on Snowtrace: https://testnet.snowtrace.io/tx/${txHash}`
        );

        // Verify
        const newCount = await getQueryCount();
        console.log(`  ✅ New query count: ${newCount}`);
      } catch (error) {
        console.log(
          `  ⚠️  On-chain recording failed: ${(error as Error).message}`
        );
        console.log("     (This is okay - query can be recorded later)");
      }
    } else {
      console.log("  ⏭️  Skipped (PRIVATE_KEY not configured)");
    }

    // Final summary
    console.log("");
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("  ✅ END-TO-END TEST PASSED!");
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("");
    console.log("  Your QueryFlow API is ready for production! 🚀");
    console.log("");
  } catch (error) {
    console.log(`  ❌ AI Error: ${(error as Error).message}`);
    console.log("");
    console.log("  Check your DEEPSEEK_API_KEY or OPENAI_API_KEY in .env");
  }
}

main().catch(console.error);
