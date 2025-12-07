/**
 * QueryFlow AI Agent Example
 *
 * This scripts simulates an autonomous DeFi agent that:
 * 1. Checks overall market sentiment
 * 2. Decides whether to explore active trades
 * 3. Requests specific price predictions if market is bullish
 * 4. Checks its own query history for accounting
 */

import { QueryFlowClient } from "../src/index";
import { generatePrivateKey } from "viem/accounts";

const PRIVATE_KEY = process.env.PRIVATE_KEY || generatePrivateKey();

async function runAgent() {
  console.log("🤖 Starting QuantAgent-X1...");
  const client = new QueryFlowClient(PRIVATE_KEY, {
    apiUrl: "http://localhost:3001",
  });

  // 1. Analyze Macro Environment
  console.log("📊 Analyzing Market Sentiment...");
  const market = await client.market({
    assets: ["BTC", "ETH", "SOL"],
    timeframe: "24h",
  });

  const score = market.sentiment.score;
  console.log(`   Market Score: ${score}/100 (${market.sentiment.trend})`);

  // 2. Decision Logic
  if (score > 60) {
    console.log("✅ Market is BULLISH. Searching for opportunities...");

    // Add delay to avoid CoinGecko rate limits on free tier
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Deep Dive on Asset
    const targetAsset = "BTC";
    console.log(`🔎 Requesting Price Prediction for ${targetAsset}...`);

    try {
      const price = await client.price({
        asset: targetAsset,
        timeframe: "24h",
      });
      console.log(`   Target: $${price.prediction.targetPrice}`);
      console.log(`   Confidence: ${price.prediction.confidence}%`);

      if (
        price.prediction.direction === "bullish" &&
        price.prediction.confidence > 80
      ) {
        console.log("🚀 EXECUTE BUY SIGNAL [SIMULATED]");
      } else {
        console.log("⏸️  Signal weak. Holding.");
      }
    } catch (err) {
      console.error("   Failed to get price:", err);
    }
  } else if (score < 40) {
    console.log("⚠️ Market is BEARISH. Entering defensive mode.");

    // Check Risk
    console.log("🛡️ Running Portfolio Risk Scan...");
    const risk = await client.risk({ address: "0x123...abc" }); // Self-scan
    console.log(`   Risk Level: ${risk.risk.level}`);
  } else {
    console.log("💤 Market is NEUTRAL. Standing by.");
  }

  // 4. Accounting
  console.log("\n📒 Updating Accounting Ledger...");
  const history = await client.getHistory();
  console.log(`   Agent has performed ${history.length} queries today.`);
}

runAgent().catch(console.error);
