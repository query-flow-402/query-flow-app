/**
 * Multi-Endpoint x402 Payment Test
 * Tests all insight endpoints with real wallet signatures
 * Run with: npx tsx src/test-all-endpoints.ts
 */
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { type Hex } from "viem";

const API_URL = "http://localhost:3001";
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;

if (!PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not found in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

interface EndpointConfig {
  name: string;
  path: string;
  body: Record<string, unknown>;
  expectedPrice: number;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: "Market Sentiment",
    path: "/api/v1/insights/market",
    body: { assets: ["bitcoin", "ethereum"] },
    expectedPrice: 0.02,
  },
  {
    name: "Price Prediction",
    path: "/api/v1/insights/price",
    body: { asset: "bitcoin", timeframe: "7d" },
    expectedPrice: 0.03,
  },
  {
    name: "Risk Assessment",
    path: "/api/v1/insights/risk",
    body: { address: "0x773d652234C0E8A40b97f82f23697d717A8E1D92" },
    expectedPrice: 0.05,
  },
  {
    name: "Social Sentiment",
    path: "/api/v1/insights/social",
    body: { asset: "bitcoin" },
    expectedPrice: 0.02,
  },
];

async function testEndpoint(config: EndpointConfig): Promise<boolean> {
  console.log(`\n📊 Testing: ${config.name}`);
  console.log("─".repeat(50));

  try {
    // Step 1: Get 402 response
    const firstResponse = await fetch(`${API_URL}${config.path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config.body),
    });

    if (firstResponse.status !== 402) {
      console.log(`  ❌ Expected 402, got ${firstResponse.status}`);
      return false;
    }

    const paymentInfo = await firstResponse.json();
    console.log(`  ✅ Got 402 response`);
    console.log(
      `     Price: $${paymentInfo.payment.price} (expected: $${config.expectedPrice})`
    );

    if (paymentInfo.payment.price !== config.expectedPrice) {
      console.log(`  ⚠️  Price mismatch!`);
    }

    // Step 2: Sign payment
    const timestamp = Date.now();
    const {
      priceUsdc: amount,
      nonce,
      paymentAddress: receiver,
    } = paymentInfo.payment;

    const message = `QueryFlow Payment\nAmount: ${amount}\nTo: ${receiver}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
    const signature = await account.signMessage({ message });

    // Step 3: Create payment header
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

    // Step 4: Send paid request
    const paidResponse = await fetch(`${API_URL}${config.path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-402-payment": paymentHeader,
      },
      body: JSON.stringify(config.body),
    });

    const result = await paidResponse.json();

    if (paidResponse.status === 200 && result.success) {
      console.log(`  ✅ Payment accepted! Status: 200`);
      console.log(`     Query type: ${result.metadata?.queryType}`);
      return true;
    } else {
      console.log(`  ❌ Payment failed: ${paidResponse.status}`);
      console.log(`     Error: ${JSON.stringify(result.error)}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${(error as Error).message}`);
    return false;
  }
}

async function main() {
  console.log("");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("  🧪 QueryFlow Multi-Endpoint Test");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log(`  Wallet: ${account.address}`);

  const results: { name: string; passed: boolean }[] = [];

  for (const endpoint of ENDPOINTS) {
    const passed = await testEndpoint(endpoint);
    results.push({ name: endpoint.name, passed });
  }

  // Summary
  console.log("\n");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("  📋 Test Summary");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );

  for (const result of results) {
    console.log(`  ${result.passed ? "✅" : "❌"} ${result.name}`);
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log("");
  console.log(`  Total: ${passed}/${total} passed`);
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
}

main().catch(console.error);
