<p align="center">
  <img src="assets/queryflow-logotext.png" alt="QueryFlow Logo" width="280"/>
</p>

<h1 align="center">Query Flow</h1>

<p align="center">
  <strong>Pay-Per-Query Data Insights for AI Agents</strong><br/>
  <sub>No subscriptions. No signups. Just pay for what you use in AVAX.</sub>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@queryflow-402/sdk"><img src="https://img.shields.io/npm/v/@queryflow-402/sdk?color=blue&label=sdk" alt="NPM Version"></a>
  <a href="#"><img src="https://img.shields.io/badge/x402-enabled-purple" alt="x402"></a>
  <a href="#"><img src="https://img.shields.io/badge/Avalanche-Fuji-red" alt="Avalanche"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
</p>

<p align="center">
  <a href="#how-it-works">How it Works</a> •
  <a href="#features">Features</a> •
  <a href="#sdk">SDK</a> •
  <a href="#pricing">Pricing</a> •
  <a href="#get-started">Get Started</a>
</p>

---

## The Problem

Your AI agent needs data—market prices, sentiment analysis, risk scores. But data providers want **$99/month subscriptions**, even if you only make 50 API calls.

> _"Why pay $99/month when I only need $1 worth of data?"_

## The Solution

**Query Flow** lets AI agents buy data **per request**. Send a query, pay a tiny amount of AVAX, get your answer. That's it.

```
Your AI Agent → Query Flow → Pay AVAX ($0.02 value) → Get Insights ✓
```

No accounts. No API keys. No monthly bills. Just instant, pay-as-you-go data.

---

## How it Works

<table>
<tr>
<td width="60">1️⃣</td>
<td><strong>Request</strong><br/>Your agent calls our API endpoint</td>
</tr>
<tr>
<td>2️⃣</td>
<td><strong>Pay</strong><br/>Pay the quoted price in AVAX (Instant settlement)</td>
</tr>
<tr>
<td>3️⃣</td>
<td><strong>Receive</strong><br/>Get AI-processed insights instantly via JSON or SSE Stream</td>
</tr>
</table>

All transactions are recorded on **Avalanche Fuji** for full transparency and on-chain reputation.

---

## Features

🔌 **Instant Payments** — Pay with **AVAX** via x402. No invoices, no waiting.

📊 **Hybrid Data Architecture** — Zero-cost multi-provider setup aggregating **Moralis**, **Binance**, and **CryptoCompare**.

🤖 **AI-Powered** — Raw data processed into actionable insights by **DeepSeek V3** (OpenAI-compatible).

⛓️ **On-Chain Transparency** — Every query is recorded on `QueryRegistry` contract. Fully auditable history.

📡 **Real-Time Streaming** — Get AI responses as they're generated via **SSE (Server-Sent Events)**.

🔗 **Agent-to-Agent** — AI agents can hire other AI agents through our platform.

---

## SDK

The official SDK makes it easy to integrate QueryFlow into your agents.

[![NPM](https://nodei.co/npm/@queryflow-402/sdk.png?mini=true)](https://www.npmjs.com/package/@queryflow-402/sdk)

### Installation

```bash
npm install @queryflow-402/sdk
```

### Usage (Real Payments)

```typescript
import { QueryFlowClient } from "@queryflow-402/sdk";

// Initialize with your wallet private key
const client = new QueryFlowClient(process.env.PRIVATE_KEY, {
  mode: "tx", // Enable Real AVAX Transactions
});

// Get market sentiment (pays ~$0.02 in AVAX automatically)
const sentiment = await client.market({
  assets: ["BTC", "AVAX"],
  timeframe: "24h",
});

console.log(sentiment.sentiment.score); // 85 (bullish)
console.log(sentiment.txHash); // 0x... (Proof of Payment)
```

---

## Pricing

| What You Get         | Price (AVAX) |
| -------------------- | ------------ |
| Market sentiment     | ~$0.02       |
| Price predictions    | ~$0.05       |
| Risk analysis        | ~$0.05       |
| Social sentiment     | ~$0.02       |
| Agent-to-agent calls | Dynamic      |

**Compare to traditional APIs:**

|                  | Traditional | Query Flow |
| ---------------- | ----------- | ---------- |
| Monthly cost     | $99+ fixed  | $0 base    |
| Per query        | "Included"  | ~$0.02     |
| 50 queries/month | $99         | **$1.00**  |
| Signup required  | Yes         | **No**     |
| Payment method   | Credit card | **AVAX**   |

---

## Smart Contracts

### Smart Contracts (Fuji Testnet)

| Contract          | Address                                      |
| ----------------- | -------------------------------------------- |
| **QueryRegistry** | `0x254099809Aa6D702A7dBe17180629d7BBA6548e2` |
| **AgentRegistry** | `0x5424d6482fA1EF5378b927fC6606ED27318A1F30` |

---

## Built With

<p>
  <img src="https://img.shields.io/badge/Avalanche-E84142?style=flat&logo=avalanche&logoColor=white" alt="Avalanche"/>
  <img src="https://img.shields.io/badge/x402-Payment_Protocol-purple?style=flat" alt="x402"/>
  <img src="https://img.shields.io/badge/DeepSeek-AI_Intelligence-blue?style=flat" alt="DeepSeek"/>
  <img src="https://img.shields.io/badge/Moralis-Web3_Data-black?style=flat" alt="Moralis"/>
  <img src="https://img.shields.io/badge/Thirdweb-Wallet_SDK-pink?style=flat" alt="Thirdweb"/>
</p>

---

## Hackathon

<p align="center">
  🏆 <strong>Avalanche Hack2Build: Payments x402</strong><br/>
  <sub>Track: Data-Powered AI for Payments</sub>
</p>

---

## Links

📖 [NPM Package](https://www.npmjs.com/package/@queryflow-402/sdk) · 💬 [Discord](https://discord.gg/queryflow) · 🐦 [Twitter](https://twitter.com/queryflow)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Stop subscribing. Start querying.</strong><br/>
  <sub>Built for the AI agent economy 🤖</sub>
</p>
