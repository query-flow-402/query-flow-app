<p align="center">
  <img src="/assets/query-flow-logo.png" alt="Query Flow Logo" width="180"/>
</p>

<h1 align="center">Query Flow</h1>

<p align="center">
  <strong>Pay-Per-Query Data Insights for AI Agents</strong><br/>
  <sub>No subscriptions. No signups. Just pay for what you use.</sub>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version"></a>
  <a href="#"><img src="https://img.shields.io/badge/x402-enabled-purple" alt="x402"></a>
  <a href="#"><img src="https://img.shields.io/badge/Avalanche-Fuji-red" alt="Avalanche"></a>
  <a href="#license"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
</p>

<p align="center">
  <a href="#how-it-works">How it Works</a> •
  <a href="#features">Features</a> •
  <a href="#pricing">Pricing</a> •
  <a href="#get-started">Get Started</a> •
  <a href="#api-docs">API</a>
</p>

---

## The Problem

Your AI agent needs data—market prices, sentiment analysis, risk scores. But data providers want **$99/month subscriptions**, even if you only make 50 API calls.

> _"Why pay $99/month when I only need $1 worth of data?"_

## The Solution

**Query Flow** lets AI agents buy data **per request**. Send a query, pay $0.02 in USDC, get your answer. That's it.

```
Your AI Agent → Query Flow → Pay $0.02 → Get Insights ✓
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
<td><strong>Pay</strong><br/>Pay the quoted price in USDC (2-second settlement)</td>
</tr>
<tr>
<td>3️⃣</td>
<td><strong>Receive</strong><br/>Get AI-processed insights instantly</td>
</tr>
</table>

All transactions are recorded on Avalanche blockchain for full transparency.

---

## Features

🔌 **Instant Payments** — Pay with USDC via x402. No invoices, no waiting.

📊 **Multi-Source Data** — We aggregate from TURF Network, CoinGecko, DeFiLlama, and more.

🤖 **AI-Powered** — Raw data processed into actionable insights by GPT-4 and Claude.

⛓️ **On-Chain Transparency** — Every query is recorded on Avalanche. Fully auditable.

🔗 **Agent-to-Agent** — AI agents can hire other AI agents through our platform.

📡 **Real-Time Streaming** — Get responses as they're generated via SSE.

---

## Pricing

| What You Get         | Price   |
| -------------------- | ------- |
| Market sentiment     | $0.02   |
| Price predictions    | $0.05   |
| Risk analysis        | $0.08   |
| Yield opportunities  | $0.05   |
| Agent-to-agent calls | Dynamic |

**Compare to traditional APIs:**

|                  | Traditional | Query Flow  |
| ---------------- | ----------- | ----------- |
| Monthly cost     | $99+ fixed  | $0 base     |
| Per query        | "Included"  | $0.02-$0.10 |
| 50 queries/month | $99         | **$1-$5**   |
| Signup required  | Yes         | **No**      |
| Payment method   | Credit card | USDC        |

---

## Get Started

### For AI Agent Developers

```javascript
import { QueryFlow } from "@queryflow/sdk";

const qf = new QueryFlow({ wallet: yourWallet });

// Get market sentiment - pays $0.02 automatically
const sentiment = await qf.insights.market({ asset: "AVAX" });

console.log(sentiment.score); // 0.72 (bullish)
```

### Quick Setup

```bash
npm install @queryflow/sdk
```

You'll need:

- A wallet with USDC on Avalanche
- That's it!

---

## API Docs

### Get Market Insights

```http
POST /api/v1/insights/market

{
  "asset": "AVAX",
  "metrics": ["sentiment", "momentum"]
}
```

**Response:**

```json
{
  "data": {
    "sentiment": 0.72,
    "momentum": "bullish",
    "summary": "Strong buying pressure detected..."
  },
  "cost": "$0.02"
}
```

[View Full API Documentation →](docs/api/README.md)

---

## Smart Contracts

Deployed on **Avalanche Fuji Testnet**:

| Contract      | Address                                      |
| ------------- | -------------------------------------------- |
| QueryRegistry | `0x254099809Aa6D702A7dBe17180629d7BBA6548e2` |
| AgentRegistry | `0x5424d6482fA1EF5378b927fC6606ED27318A1F30` |

---

## Built With

<p>
  <img src="https://img.shields.io/badge/Avalanche-E84142?style=flat&logo=avalanche&logoColor=white" alt="Avalanche"/>
  <img src="https://img.shields.io/badge/x402-Payment_Protocol-purple?style=flat" alt="x402"/>
  <img src="https://img.shields.io/badge/TURF-Data_Network-blue?style=flat" alt="TURF"/>
  <img src="https://img.shields.io/badge/Thirdweb-Wallet_SDK-pink?style=flat" alt="Thirdweb"/>
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-green?style=flat" alt="OpenAI"/>
</p>

---

## Hackathon

<p align="center">
  🏆 <strong>Avalanche Hack2Build: Payments x402</strong><br/>
  <sub>Track: Data-Powered AI for Payments</sub>
</p>

---

## Links

📖 [Documentation](https://docs.queryflow.dev) · 💬 [Discord](https://discord.gg/queryflow) · 🐦 [Twitter](https://twitter.com/queryflow)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Stop subscribing. Start querying.</strong><br/>
  <sub>Built for the AI agent economy 🤖</sub>
</p>
