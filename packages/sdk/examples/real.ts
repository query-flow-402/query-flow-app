/**
 * Real Payment Example
 *
 * This example performs a query using REAL AVAX tokens on the Fuji testnet.
 * Requirements:
 * 1. PRIVATE_KEY env var set to a wallet with AVAX (Fuji).
 * 2. Backend running with PAYMENT_RECEIVER_ADDRESS configured.
 */

import { QueryFlowClient } from "../src/index";
import * as fs from "fs";
import * as path from "path";

// Try to load PRIVATE_KEY from process.env OR apps/api/.env
let PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  try {
    // Try to find apps/api/.env from project root
    const envPath = path.resolve(process.cwd(), "apps/api/.env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      // Simple regex to find PRIVATE_KEY (handles potential quotes)
      const match = content.match(/^PRIVATE_KEY=["']?(0x[a-fA-F0-9]+)["']?/m);
      if (match) {
        PRIVATE_KEY = match[1];
        console.log("ℹ️  Loaded PRIVATE_KEY from apps/api/.env");
      }
    }
  } catch (err) {
    // Ignore errors, fall through to check checks
  }
}

if (!PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not found in environment or apps/api/.env");
  console.error(
    "   Run with: PRIVATE_KEY=0x... pnpm exec tsx packages/sdk/examples/real.ts"
  );
  process.exit(1);
}

// Explicitly cast to string because we've verified it's defined above
const validPrivateKey: string = PRIVATE_KEY;

async function main() {
  console.log("🚀 Initializing QueryFlow Client (REAL PAYMENT MODE)...");

  const client = new QueryFlowClient(validPrivateKey, {
    apiUrl: "http://localhost:3001",
    mode: "tx", // <--- Enable Real Payment Mode
  });

  try {
    console.log("\n📈 Querying Market Insights (Requires AVAX)...");

    // This call will:
    // 1. Get 402 with price (~0.1 AVAX usually, or whatever backend sets)
    // 2. Send Transaction from your wallet
    // 3. Wait for confirmation
    // 4. Resend request with proof
    const market = await client.market({
      assets: ["BTC"],
      timeframe: "24h",
    });

    console.log("✅ Query Successful!");
    console.log(`   Tokens Used: ${market.tokensUsed}`);
    console.log(
      `   Sentiment: ${market.sentiment.score}/100 (${market.sentiment.trend})`
    );
  } catch (error) {
    console.error("❌ Query Failed:", error);
  }
}

main();
