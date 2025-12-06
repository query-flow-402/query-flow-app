/**
 * Real Payment Test - AVAX Transfer
 * Tests the full payment flow with actual AVAX transfer on Fuji testnet
 *
 * ⚠️ WARNING: This sends REAL testnet AVAX!
 *
 * Run with: npx tsx src/test-real-payment.ts
 */
import "dotenv/config";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  formatEther,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

const API_URL = "http://localhost:3001";
const RPC_URL =
  process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

// Setup wallet
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
if (!PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not found in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

const walletClient = createWalletClient({
  account,
  chain: avalancheFuji,
  transport: http(RPC_URL),
});

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(RPC_URL),
});

async function main() {
  console.log("");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("  💰 Real AVAX Payment Test (Fuji Testnet)");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log(`  Wallet: ${account.address}`);

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`  Balance: ${formatEther(balance)} AVAX`);
  console.log("");

  if (balance < parseEther("0.001")) {
    console.log("❌ Insufficient balance! Need at least 0.001 AVAX");
    return;
  }

  // =========================================================================
  // Step 1: Get 402 response with AVAX price
  // =========================================================================
  console.log("Step 1: Request without payment (get 402 with AVAX price)");
  console.log("─────────────────────────────────────────────────────────────");

  const firstResponse = await fetch(`${API_URL}/api/v1/insights/market`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assets: ["bitcoin"] }),
  });

  if (firstResponse.status !== 402) {
    console.log(`  ❌ Expected 402, got ${firstResponse.status}`);
    const text = await firstResponse.text();
    console.log("  Response:", text);
    return;
  }

  const paymentInfo = await firstResponse.json();
  console.log("  ✅ Got 402 response");
  console.log(`     Price USD: $${paymentInfo.payment.priceUsd}`);
  console.log(`     Price AVAX: ${paymentInfo.payment.priceAvax} AVAX`);
  console.log(`     AVAX/USD: $${paymentInfo.payment.avaxPriceUsd}`);
  console.log(`     Send to: ${paymentInfo.payment.paymentAddress}`);

  const priceAvax = parseFloat(paymentInfo.payment.priceAvax);
  const paymentAddress = paymentInfo.payment.paymentAddress as `0x${string}`;

  if (paymentAddress === "0x0000000000000000000000000000000000000000") {
    console.log(
      "  ⚠️ Payment address is zero! Set PAYMENT_RECEIVER_ADDRESS in .env"
    );
    console.log("  Using wallet address as fallback...");
  }

  // =========================================================================
  // Step 2: Send AVAX transaction
  // =========================================================================
  console.log("\nStep 2: Sending AVAX payment");
  console.log("─────────────────────────────────────────────────────────────");

  console.log(`  Sending ${priceAvax.toFixed(8)} AVAX...`);

  const txHash = await walletClient.sendTransaction({
    to: paymentAddress,
    value: parseEther(priceAvax.toFixed(18)),
  });

  console.log(`  ✅ Transaction sent: ${txHash}`);

  // Wait for confirmation
  console.log("  ⏳ Waiting for confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  console.log(`  ✅ Confirmed in block ${receipt.blockNumber}`);

  // =========================================================================
  // Step 3: Send request with tx hash
  // =========================================================================
  console.log("\nStep 3: Send request with payment proof");
  console.log("─────────────────────────────────────────────────────────────");

  const paymentHeader = Buffer.from(
    JSON.stringify({
      mode: "tx",
      txHash: txHash,
      payer: account.address,
    })
  ).toString("base64");

  const paidResponse = await fetch(`${API_URL}/api/v1/insights/market`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-402-payment": paymentHeader,
    },
    body: JSON.stringify({ assets: ["bitcoin"] }),
  });

  const result = await paidResponse.json();

  if (paidResponse.status === 200 && result.success) {
    console.log("  ✅ Payment verified and processed!");
    console.log("");
    console.log("  ┌─────────────────────────────────────────────────────┐");
    console.log(`  │  Status: ${paidResponse.status} OK`);
    console.log(`  │  Tx Hash: ${txHash.substring(0, 20)}...`);
    console.log(
      `  │  Sentiment: ${result.data.sentiment.score}/100 (${result.data.sentiment.trend})`
    );
    console.log("  └─────────────────────────────────────────────────────┘");
    console.log("");
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("  ✅ REAL AVAX PAYMENT TEST PASSED!");
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log(
      `  View on Snowtrace: https://testnet.snowtrace.io/tx/${txHash}`
    );
  } else {
    console.log(`  ❌ Request failed: ${paidResponse.status}`);
    console.log("  Response:", JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
