/**
 * x402 Payment Flow Test
 * Tests the full payment flow with real wallet signature
 * Run with: npx tsx src/test-x402-payment.ts
 */
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { type Hex } from "viem";

const API_URL = "http://localhost:3001";

// Use the private key from env or a test key
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;

if (!PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not found in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

async function main() {
  console.log("");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("  🧪 x402 Payment Flow Test");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("");
  console.log(`  Wallet: ${account.address}`);
  console.log("");

  // Step 1: Get 402 response to get nonce and price
  console.log("Step 1: Request without payment (get 402)");
  console.log("─────────────────────────────────────────");

  const firstResponse = await fetch(`${API_URL}/api/v1/insights/market`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assets: ["bitcoin", "ethereum"] }),
  });

  if (firstResponse.status !== 402) {
    console.log(`  ❌ Expected 402, got ${firstResponse.status}`);
    return;
  }

  const paymentInfo = await firstResponse.json();
  console.log("  ✅ Got 402 response");
  console.log(`     Price: $${paymentInfo.payment.price}`);
  console.log(`     Nonce: ${paymentInfo.payment.nonce}`);
  console.log(`     Receiver: ${paymentInfo.payment.paymentAddress}`);

  // Step 2: Create and sign payment message
  console.log("\nStep 2: Sign payment message");
  console.log("────────────────────────────");

  const timestamp = Date.now();
  const amount = paymentInfo.payment.priceUsdc;
  const nonce = paymentInfo.payment.nonce;
  const receiver = paymentInfo.payment.paymentAddress;

  // Create the exact same message format as the server expects
  const message = `QueryFlow Payment\nAmount: ${amount}\nTo: ${receiver}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

  console.log("  Message to sign:");
  console.log(`    ${message.replace(/\n/g, "\n    ")}`);

  const signature = await account.signMessage({ message });
  console.log(`  ✅ Signature: ${signature.substring(0, 20)}...`);

  // Step 3: Create payment header
  console.log("\nStep 3: Create x-402-payment header");
  console.log("────────────────────────────────────");

  const paymentData = {
    signature,
    timestamp,
    amount,
    nonce,
    payer: account.address,
  };

  const paymentHeader = Buffer.from(JSON.stringify(paymentData)).toString(
    "base64"
  );
  console.log(`  ✅ Header: ${paymentHeader.substring(0, 40)}...`);

  // Step 4: Send request with payment
  console.log("\nStep 4: Send request with payment");
  console.log("──────────────────────────────────");

  const paidResponse = await fetch(`${API_URL}/api/v1/insights/market`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-402-payment": paymentHeader,
    },
    body: JSON.stringify({ assets: ["bitcoin", "ethereum"] }),
  });

  const result = await paidResponse.json();

  if (paidResponse.status === 200 && result.success) {
    console.log("  ✅ Payment accepted!");
    console.log("");
    console.log("  ┌─────────────────────────────────────────────────────┐");
    console.log(`  │  Status: ${paidResponse.status} OK`);
    console.log(
      `  │  Sentiment: ${result.data.sentiment.score}/100 (${result.data.sentiment.trend})`
    );
    console.log(
      `  │  Summary: ${result.data.sentiment.summary.substring(0, 50)}...`
    );
    console.log("  └─────────────────────────────────────────────────────┘");
    console.log("");
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("  ✅ x402 PAYMENT FLOW TEST PASSED!");
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
  } else {
    console.log(`  ❌ Payment failed: ${paidResponse.status}`);
    console.log("  Response:", JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
