# PRD: Insights Feature Expansion - Backend Implementation

## 🎯 Goal

Build 3 additional insight endpoints (`/price`, `/risk`, `/social`) to demonstrate QueryFlow's versatility as a multi-domain pay-per-query platform for AI agents, proving the x402 payment infrastructure scales beyond single use case.

---

## 📊 Success Metrics

**By End of Day 2:**

- ✅ 4 total working endpoints (market, price, risk, social)
- ✅ Each endpoint tested with x402 payment flow
- ✅ At least 10 total queries recorded on-chain
- ✅ Tiered pricing implemented ($0.01-$0.10 range)
- ✅ Multi-source data aggregation working (CoinGecko + on-chain + social)

**Demo-Ready Criteria:**

- Agent can query any endpoint and receive relevant insights
- Different query types show different pricing
- On-chain QueryRegistry shows variety of query types
- Response times under 5 seconds for all endpoints

---

## 📅 Timeline

**Total Duration:** 6-8 hours (spread across Day 2)

| Phase                     | Duration  | Focus                               |
| ------------------------- | --------- | ----------------------------------- |
| Phase 1: Price Prediction | 1.5 hours | Historical data + AI prediction     |
| Phase 2: Risk Scoring     | 2 hours   | On-chain analysis + fraud detection |
| Phase 3: Social Sentiment | 1.5 hours | Twitter/social aggregation          |
| Phase 4: Testing & Polish | 1 hour    | Full validation + demo prep         |

---

## 🏗️ Phase 1: Price Prediction Endpoint

**Endpoint:** `POST /api/v1/insights/price`

### Objective

Provide AI-powered price predictions based on historical data and market indicators, targeting AI trading bots who need actionable forecasts.

### Required Outcomes

**Data Layer:**

- Fetch historical price data from CoinGecko (7d, 30d, 90d options)
- Calculate technical indicators (MA, RSI, volume trends)
- Aggregate multi-timeframe data into structured format

**AI Processing:**

- Prompt template for price prediction analysis
- Generate: price target, confidence score, timeframe, key signals
- Token estimation for pricing calculation

**Pricing Strategy:**

- Base price: $0.03 (higher than market sentiment due to historical data)
- Token multiplier for extended analysis
- Max price cap: $0.15

**Response Schema:**

```
{
  "prediction": {
    "targetPrice": number,
    "direction": "bullish" | "bearish" | "neutral",
    "confidence": number (0-100),
    "timeframe": "24h" | "7d" | "30d"
  },
  "signals": [
    { "indicator": string, "value": string, "impact": "positive" | "negative" }
  ],
  "context": string (2-3 sentence summary)
}
```

### Validation Checklist

- [ ] Returns 402 with $0.03 price quote
- [ ] Accepts x402 payment and processes request
- [ ] CoinGecko historical data fetched successfully
- [ ] AI generates coherent prediction with confidence score
- [ ] Query recorded on-chain with "price" type
- [ ] Response time under 5 seconds

---

## 🏗️ Phase 2: Risk Scoring Endpoint

**Endpoint:** `POST /api/v1/insights/risk`

### Objective

Analyze wallet addresses or transaction hashes for suspicious patterns, serving Risk/Fraud Detection Agents who need instant risk assessments.

### Required Outcomes

**Data Layer:**

- Wallet age calculation (using first transaction timestamp)
- Transaction volume and frequency analysis
- Interaction with known protocols (DEXs, bridges, mixers)
- Balance history and holding patterns
- Use Avalanche Fuji explorer API or Snowtrace API

**AI Processing:**

- Risk assessment prompt with pattern recognition
- Generate: risk score (0-100, where 100 = highest risk)
- Identify specific red flags (mixer usage, rapid movements, new wallet)
- Provide actionable recommendation

**Pricing Strategy:**

- Base price: $0.05 (higher due to on-chain data fetching)
- Premium tier for deep analysis (multiple addresses)
- Max price cap: $0.20

**Response Schema:**

```
{
  "risk": {
    "score": number (0-100),
    "level": "low" | "medium" | "high" | "critical",
    "confidence": number
  },
  "factors": [
    { "type": string, "severity": string, "description": string }
  ],
  "recommendation": string,
  "metadata": {
    "walletAge": string,
    "txCount": number,
    "totalVolume": string
  }
}
```

### Validation Checklist

- [ ] Returns 402 with $0.05 price quote
- [ ] Accepts wallet address or tx hash as input
- [ ] Fetches on-chain data from Avalanche
- [ ] AI generates risk score with reasoning
- [ ] Identifies at least 3 risk factors (or lack thereof)
- [ ] Query recorded with "risk" type
- [ ] Handles invalid addresses gracefully

---

## 🏗️ Phase 3: Social Sentiment Endpoint

**Endpoint:** `POST /api/v1/insights/social`

### Objective

Aggregate social media sentiment around crypto assets, targeting Research/Recommender Agents who need community pulse checks.

### Required Outcomes

**Data Layer:**

- Integrate Twitter/X API (or free alternative like Reddit API)
- Fetch recent mentions, hashtags, influencer posts
- Alternative: Use pre-aggregated sentiment data from LunarCrush or Santiment (if API available)
- Fallback: Mock social data for demo purposes with realistic patterns

**AI Processing:**

- Social sentiment analysis prompt
- Generate: sentiment score, trending topics, key narratives
- Identify manipulation signals (bot activity, coordinated pumps)

**Pricing Strategy:**

- Base price: $0.02 (lightweight, similar to market sentiment)
- Volume-based: more assets = higher price
- Max price cap: $0.08

**Response Schema:**

```
{
  "sentiment": {
    "score": number (0-100),
    "trend": "bullish" | "bearish" | "neutral",
    "volume": "low" | "medium" | "high"
  },
  "trending": [
    { "topic": string, "mentions": number, "sentiment": string }
  ],
  "summary": string,
  "warnings": string[] (e.g., "High bot activity detected")
}
```

### Validation Checklist

- [ ] Returns 402 with $0.02 price quote
- [ ] Social data source connected (or mock data ready)
- [ ] AI processes social signals into sentiment
- [ ] Detects trending narratives
- [ ] Query recorded with "social" type
- [ ] Handles rate limits from social APIs

---

## 🏗️ Phase 4: Integration & Polish

### Objective

Ensure all endpoints work consistently with x402 flow, have proper error handling, and are demo-ready.

### Required Outcomes

**Pricing Engine Updates:**

- Update `lib/pricing.ts` with all 4 query types
- Implement tiered pricing logic
- Add pricing documentation (for pitch deck)

**Endpoint Consistency:**

- All endpoints use same x402 middleware
- Consistent error response format
- Uniform logging structure
- Similar response schemas (success, data, metadata pattern)

**Testing Suite:**

- Create `test-all-endpoints.ts` script
- Test each endpoint with x402 payment
- Verify on-chain recording for all types
- Check pricing calculations

**Documentation:**

- Update API documentation with all endpoints
- Create example requests/responses for each
- Document pricing tiers
- List data sources per endpoint

### Validation Checklist

- [ ] All 4 endpoints return 402 correctly
- [ ] All accept x402 payment and process
- [ ] Pricing varies by query type as expected
- [ ] At least 2 queries per type recorded on-chain
- [ ] Error messages are helpful and consistent
- [ ] Demo script ready (curl or agent test)

---

## 📦 Deliverables

### New Files

```
apps/api/src/routes/v1/insights/
├── price.ts          (NEW)
├── risk.ts           (NEW)
├── social.ts         (NEW)
└── market.ts         (EXISTING)

apps/api/src/services/
├── on-chain.ts       (NEW - Avalanche explorer API)
├── social.ts         (NEW - Twitter/social APIs)
└── test-all.ts       (NEW - comprehensive test)

apps/api/src/lib/
└── pricing.ts        (UPDATED - add new query types)
```

### Updated Files

- `lib/pricing.ts` - Add price/risk/social tiers
- `types/payment.ts` - Add new query type enums
- `services/data-aggregator.ts` - Support new data sources
- `index.ts` - Register new routes

---

## 🚨 Risk Mitigation

### Potential Blockers

**Social API Rate Limits:**

- **Risk:** Twitter API expensive/restricted
- **Mitigation:** Use mock data for demo, mention "production uses premium feeds" in pitch
- **Fallback:** Reddit API (more permissive) or CryptoPanic news API

**On-Chain Data Availability:**

- **Risk:** Fuji testnet has limited transaction history
- **Mitigation:** Test with known active addresses, have fallback mock data
- **Alternative:** Use mainnet explorer APIs (read-only, free)

**AI Response Quality:**

- **Risk:** DeepSeek might struggle with technical analysis
- **Mitigation:** Provide detailed prompts with examples, test multiple prompt variations
- **Fallback:** Switch to OpenAI for price/risk endpoints if needed

**Development Time:**

- **Risk:** Each endpoint takes longer than estimated
- **Mitigation:** Build price first (highest priority), others can use simpler logic for demo
- **Strategy:** Perfect one, make others "good enough" for hackathon

---

## 💡 Demo Strategy

### What to Show Judges

**Variety Demo:**

1. Agent requests market sentiment → pays $0.02 → gets bearish signal
2. Agent requests price prediction → pays $0.03 → gets forecast
3. Agent requests risk check → pays $0.05 → gets address analysis
4. Show QueryRegistry on Snowtrace with 3 different query types recorded

**Pitch Points:**

- "One x402 payment infrastructure, unlimited use cases"
- "Tiered pricing based on data complexity"
- "AI agents pay only for what they use, no subscriptions"
- "Every query verifiable on-chain"

### What to Mention (Not Build)

- Social endpoint can be "coming soon" if time runs short
- Agent marketplace (future feature)
- TURF integration (partnership in progress)
- Enterprise tier (roadmap item)

---

## 📝 Notes for Implementation

**Code Reuse Strategy:**

- Copy `market.ts` structure for each new endpoint
- Same x402 middleware (no changes needed)
- Same blockchain recording logic
- Only change: data source + AI prompt + pricing

**Testing Priority:**

1. Price endpoint (most important for variety)
2. Risk endpoint (shows serious use case)
3. Social endpoint (nice-to-have)

**Time Management:**

- If running behind, make social endpoint return mock data
- Focus on making price + risk production-quality
- Polish beats quantity for demo

---

## ✅ Definition of Done

**Backend is demo-ready when:**

- [ ] 3-4 endpoints working with x402 payment
- [ ] Tiered pricing implemented and tested
- [ ] At least 10 total queries on-chain across different types
- [ ] Test script demonstrates full flow for each endpoint
- [ ] Error handling works (invalid addresses, API failures)
- [ ] Response times acceptable (under 5s)
- [ ] Can demo live during pitch without breaking

**Stretch Goals (if time permits):**

- [ ] Redis caching for repeated queries
- [ ] Rate limiting per wallet address
- [ ] Webhook for payment notifications
- [ ] Agent SDK/client library

---

**Next Action:** Start with Phase 1 (Price Prediction) - copy `market.ts`, update data source to historical prices, modify AI prompt for prediction. Test with x402 payment before moving to Phase 2.
