# QueryFlow SDK

The official Node.js SDK for QueryFlow - the pay-per-query AI insight platform.

## Features

- 🧠 **AI Insights**: Market, Price, Risk, and Social analysis.
- 💸 **x402 Protocol**: Built-in handling of wallet-based payments.
- 🔒 **Secure**: Verify requests cryptographically.
- ⚡ **Simple**: 3 lines of code to get started.

## Installation

```bash
npm install @queryflow/sdk
# or
pnpm add @queryflow/sdk
```

## Quick Start

```typescript
import { QueryFlowClient } from "@queryflow/sdk";

// Initialize with your wallet private key
const client = new QueryFlowClient("YOUR_PRIVATE_KEY");

// specific query
const result = await client.market({
  assets: ["BTC", "ETH"],
  timeframe: "24h",
});

console.log(result.sentiment);
```

## API Reference

### `market(params)`

Analyze market sentiment and key factors.

- `assets`: string[] (e.g. `['BTC']`)
- `timeframe`: string (e.g. `'24h'`)

### `price(params)`

Get price prediction and technical signals.

- `asset`: string
- `timeframe`: string

### `risk(params)`

Analyze wallet risk profile.

- `address`: string

### `social(params)`

Get social media sentiment and trends.

- `assets`: string[]

### `getHistory()`

Fetch your past query history.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
