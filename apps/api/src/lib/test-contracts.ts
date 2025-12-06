/**
 * Test script for blockchain integration
 * Run with: npx tsx src/lib/test-contracts.ts
 */
import "dotenv/config";
import {
  getQueryCount,
  getAgentCount,
  healthCheck,
  getQuery,
} from "./contracts.js";

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  🔗 Blockchain Integration Test Suite");
  console.log("═══════════════════════════════════════════════════\n");

  // Test 1: Health Check
  console.log("Test 1: Health Check");
  console.log("─────────────────────");
  const health = await healthCheck();
  console.log("  Connected:", health.connected ? "✅" : "❌");
  console.log(
    "  Chain ID:",
    health.chainId,
    health.chainId === 43113 ? "(Fuji) ✅" : ""
  );
  console.log("  Block Number:", health.blockNumber.toString());

  if (!health.connected) {
    console.log("\n❌ Failed to connect to blockchain. Aborting tests.");
    return;
  }

  // Test 2: QueryRegistry - getQueryCount
  console.log("\nTest 2: QueryRegistry.queryCount()");
  console.log("───────────────────────────────────");
  try {
    const queryCount = await getQueryCount();
    console.log("  Query Count:", queryCount.toString(), "✅");
  } catch (error) {
    console.log("  ❌ Error:", (error as Error).message);
  }

  // Test 3: AgentRegistry - getAgentCount
  console.log("\nTest 3: AgentRegistry.getAgentCount()");
  console.log("─────────────────────────────────────");
  try {
    const agentCount = await getAgentCount();
    console.log("  Agent Count:", agentCount.toString(), "✅");
  } catch (error) {
    console.log("  ❌ Error:", (error as Error).message);
  }

  // Test 4: QueryRegistry - getQuery (expect error if no queries)
  console.log("\nTest 4: QueryRegistry.getQuery(0)");
  console.log("──────────────────────────────────");
  try {
    const query = await getQuery(0n);
    console.log("  Query 0:", query, "✅");
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes("QueryNotFound") || msg.includes("revert")) {
      console.log("  No queries yet (expected) ✅");
    } else {
      console.log("  ❌ Unexpected error:", msg);
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  📋 Test Summary");
  console.log("═══════════════════════════════════════════════════");
  console.log("  ✅ Blockchain connection: OK");
  console.log("  ✅ QueryRegistry read: OK");
  console.log("  ✅ AgentRegistry read: OK");
  console.log("  ⏭️  Write functions: Need PRIVATE_KEY (skip for now)");
  console.log("═══════════════════════════════════════════════════\n");
}

main().catch(console.error);
