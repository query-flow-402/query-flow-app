Backend Development: Step-by-Step Implementation Guide
Goal: Working POST /api/v1/insights/market endpoint dengan x402 payment flow
Timeline: Day 1 (Today, ~4-5 hours)
Success Metric: AI agent bisa bayar $0.02 → dapet market sentiment

Phase 1: Foundation Setup (45 minutes)
Step 1.1: Project Structure Validation
Verify existing structure:

text
apps/api/
├── src/
│ ├── index.ts # Express server entry
│ ├── routes/ # API endpoints
│ ├── middleware/ # x402, auth, etc
│ ├── services/ # AI, data, blockchain
│ ├── lib/ # utilities
│ └── types/ # TypeScript types
├── .env # Environment variables
├── package.json
└── tsconfig.json
Action Items:

Confirm folder structure exists

Check package.json has required deps

Verify TypeScript config valid

Step 1.2: Install Dependencies
Required packages:

json
{
"dependencies": {
"express": "^5.0.0",
"dotenv": "^16.4.5",
"viem": "^2.21.0",
"openai": "^4.73.0",
"zod": "^3.23.8",
"@thirdweb-dev/sdk": "^4.0.0",
"cors": "^2.8.5",
"helmet": "^8.0.0"
},
"devDependencies": {
"@types/express": "^5.0.0",
"@types/cors": "^2.8.17",
"tsx": "^4.19.2",
"typescript": "^5.7.2"
}
}
Action Items:

Install packages via pnpm install

Verify no version conflicts

Step 1.3: Environment Variables Setup
File: apps/api/.env

Required variables:

text

# Server

NODE_ENV=development
PORT=3001

# Avalanche

AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
PRIVATE_KEY=<your_backend_wallet_private_key>

# Contracts (already deployed)

QUERY_REGISTRY_ADDRESS=0x254099809Aa6D702A7dBe17180629d7BBA6548e2
AGENT_REGISTRY_ADDRESS=0x5424d6482fA1EF5378b927fC6606ED27318A1F30

# AI Services

OPENAI_API_KEY=<get_from_openai_dashboard>

# Data Sources

COINGECKO_API_URL=https://api.coingecko.com/api/v3

# x402 (Thirdweb)

THIRDWEB_SECRET_KEY=<get_from_thirdweb_dashboard>
THIRDWEB_CLIENT_ID=<get_from_thirdweb_dashboard>

# Payment

USDC_CONTRACT_ADDRESS=<fuji_testnet_usdc_address>
PAYMENT_RECEIVER_ADDRESS=<your_wallet_to_receive_payments>
Action Items:

Create .env file

Get Thirdweb credentials from https://thirdweb.com/dashboard

Get OpenAI API key from https://platform.openai.com/api-keys

Find Fuji USDC contract address (check Avalanche docs)

Add .env to .gitignore

Phase 2: Blockchain Integration (1 hour)
Step 2.1: Contract ABIs Setup
File: apps/api/src/lib/contracts.ts

What to do:

Import ABI dari contracts package

Setup Viem clients (public + wallet)

Create contract instances

Key functions needed:

typescript
// Read-only operations
export async function getQueryCount(): Promise<bigint>
export async function getQuery(queryId: bigint): Promise<QueryData>
export async function getAgent(address: Address): Promise<AgentData>

// Write operations
export async function recordQuery(
user: Address,
queryType: string,
payment: bigint,
resultHash: Hash
): Promise<{ txHash: Hash; queryId: bigint }>

export async function updateAgentReputation(
agent: Address,
success: boolean
): Promise<Hash>
Action Items:

Import ABIs from @repo/contracts

Setup Viem publicClient for reads

Setup Viem walletClient for writes

Test getQueryCount() returns current count

Test recordQuery() works (write test query)

Validation:

bash

# Should see query on Snowtrace

https://testnet.snowtrace.io/address/0x254099809Aa6D702A7dBe17180629d7BBA6548e2
Step 2.2: Error Handling for Blockchain
File: apps/api/src/lib/errors.ts

Custom error classes needed:

typescript
class BlockchainError extends Error
class ContractCallError extends BlockchainError
class TransactionFailedError extends BlockchainError
class InsufficientGasError extends BlockchainError
Action Items:

Create error classes

Add error codes for logging

Implement retry logic for RPC calls (3 retries)

Phase 3: x402 Payment Middleware (1.5 hours)
Step 3.1: Payment Types & Schemas
File: apps/api/src/types/payment.ts

Zod schemas needed:

typescript
export const PaymentHeaderSchema = z.object({
signature: z.string(),
timestamp: z.number(),
amount: z.string(), // USDC amount in wei
nonce: z.string(),
payer: z.string().regex(/^0x[a-fA-F0-9]{40}$/) // Ethereum address
});

export const PricingSchema = z.object({
queryType: z.enum(['market', 'price', 'news', 'portfolio', 'social']),
basePrice: z.number().min(0.01).max(0.50), // USD
estimatedTokens: z.number().optional(),
finalPrice: z.number()
});
Action Items:

Define all payment-related types

Create Zod validation schemas

Export types for use across app

Step 3.2: Pricing Engine
File: apps/api/src/lib/pricing.ts

Pricing logic:

typescript
type QueryType = 'market' | 'price' | 'news' | 'portfolio' | 'social';

interface PriceConfig {
basePrice: number; // Base USD price
tokenMultiplier: number; // Cost per 1K tokens
maxPrice: number; // Price ceiling
}

const PRICING: Record<QueryType, PriceConfig> = {
market: {
basePrice: 0.02,
tokenMultiplier: 0.00001,
maxPrice: 0.10
},
// ... other types
};
Functions needed:

typescript
export function calculatePrice(
queryType: QueryType,
estimatedTokens?: number
): number

export function usdToUsdc(usd: number): bigint // Convert to wei

export function validatePrice(price: number): boolean
Action Items:

Implement pricing logic

Add token estimation (based on prompt length)

USD to USDC conversion (6 decimals for USDC)

Unit tests for edge cases

Step 3.3: x402 Middleware Implementation
File: apps/api/src/middleware/x402.ts

Core middleware flow:

typescript
export async function x402Middleware(
req: Request,
res: Response,
next: NextFunction
) {
// 1. Check for payment header
const paymentHeader = req.headers['x-402-payment'];

if (!paymentHeader) {
// Return 402 with payment requirements
return res.status(402).json({
error: 'Payment Required',
price: calculatePrice(req.body.queryType),
paymentAddress: PAYMENT_RECEIVER_ADDRESS,
nonce: generateNonce(),
instructions: 'Sign payment with your wallet'
});
}

// 2. Verify payment signature
const payment = parsePaymentHeader(paymentHeader);
const isValid = await verifyPaymentSignature(payment);

if (!isValid) {
return res.status(401).json({
error: 'Invalid payment signature'
});
}

// 3. Store payment info for later settlement
req.payment = payment;
next();
}
Helper functions needed:

typescript
function generateNonce(): string
function parsePaymentHeader(header: string): PaymentData
async function verifyPaymentSignature(payment: PaymentData): Promise<boolean>
async function settlePayment(payment: PaymentData): Promise<Hash>
Action Items:

Implement middleware function

Add signature verification (ECDSA recovery)

Generate unique nonces (prevent replay attacks)

Create payment settlement function (async)

Add logging for all payment events

Security checklist:

Nonce uniqueness (store in Redis/memory)

Timestamp validation (±5 min tolerance)

Amount validation (matches calculated price)

Signature recovery matches payer address

Phase 4: AI Service Integration (1 hour)
Step 4.1: OpenAI Service Wrapper
File: apps/api/src/services/ai.ts

Service class structure:

typescript
export class AIService {
private openai: OpenAI;

constructor(apiKey: string) {
this.openai = new OpenAI({ apiKey });
}

async generateInsight(
type: QueryType,
data: unknown
): Promise<AIInsight> {
const prompt = this.buildPrompt(type, data);
const response = await this.callOpenAI(prompt);
return this.parseResponse(response);
}

private buildPrompt(type: QueryType, data: unknown): string
private async callOpenAI(prompt: string): Promise<string>
private parseResponse(response: string): AIInsight
async estimateTokens(prompt: string): Promise<number>
}
Prompt templates:

typescript
const PROMPTS = {
market: `You are a crypto market analyst. Analyze this data and provide:

1. Sentiment score (0-100, where 100 is extremely bullish)
2. Trend direction (bullish/bearish/neutral)
3. Brief 2-sentence summary
4. Key factors (max 3 bullet points)

Data: {data}

Respond in JSON format:
{
"sentiment": {"score": number, "trend": string, "summary": string},
"factors": string[]
}`,

// ... other prompts
};
Action Items:

Initialize OpenAI client

Create prompt templates for each query type

Implement token counting (using tiktoken)

Add error handling (rate limits, timeouts)

Add retry logic (max 3 attempts)

Parse JSON responses from AI

Error scenarios to handle:

Rate limit exceeded → return cached response or error

Timeout (>30s) → abort and refund

Invalid JSON response → retry with stricter prompt

Step 4.2: Response Caching (Optional but Recommended)
File: apps/api/src/lib/cache.ts

Simple in-memory cache:

typescript
const cache = new Map<string, CacheEntry>();

export function getCached(key: string): CacheEntry | null
export function setCache(key: string, value: unknown, ttl: number): void
export function generateCacheKey(queryType: string, params: unknown): string
Cache strategy:

Market sentiment: 5 min TTL

Price prediction: 15 min TTL

News summary: 10 min TTL

Action Items:

Implement simple Map-based cache

Add TTL expiration logic

Generate deterministic cache keys

(Future) Replace with Redis for production

Phase 5: Data Source Integration (45 minutes)
Step 5.1: CoinGecko Service
File: apps/api/src/services/coingecko.ts

Functions needed:

typescript
export async function getCurrentPrices(
coinIds: string[]
): Promise<PriceData[]>

export async function getMarketData(
coinId: string,
days: number
): Promise<MarketData>

export async function getTrendingCoins(): Promise<TrendingCoin[]>
CoinGecko API endpoints:

/simple/price - Current prices

/coins/{id}/market_chart - Historical data

/search/trending - Trending coins

Action Items:

Create HTTP client (use fetch atau axios)

Implement rate limiting (50 calls/min on free tier)

Add error handling for API failures

Mock responses for testing

Step 5.2: Data Aggregator
File: apps/api/src/services/data-aggregator.ts

Combine multiple sources:

typescript
export async function aggregateMarketData(
assets: string[]
): Promise<AggregatedData> {
const [prices, trends] = await Promise.all([
getCurrentPrices(assets),
getTrendingCoins()
]);

return {
prices,
trends,
timestamp: Date.now()
};
}
Action Items:

Implement parallel data fetching

Handle partial failures gracefully

Normalize data formats across sources

Phase 6: First Endpoint Implementation (1 hour)
Step 6.1: Market Sentiment Endpoint
File: apps/api/src/routes/v1/insights/market.ts

Complete flow implementation:

typescript
router.post('/market',
x402Middleware,
async (req: Request, res: Response) => {
try {
// 1. Validate request body
const { assets, timeframe } = MarketRequestSchema.parse(req.body);

      // 2. Fetch market data
      const marketData = await aggregateMarketData(assets);

      // 3. Generate AI insight
      const insight = await aiService.generateInsight('market', marketData);

      // 4. Record query on-chain (async, don't block response)
      const resultHash = hashObject(insight);
      recordQuery(
        req.payment.payer,
        'market',
        req.payment.amount,
        resultHash
      ).catch(err => logger.error('Failed to record query', err));

      // 5. Return response
      res.json({
        success: true,
        data: insight,
        metadata: {
          tokensUsed: insight.tokensUsed,
          timestamp: Date.now(),
          queryType: 'market'
        }
      });

    } catch (error) {
      // Error handling
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request' });
      }
      logger.error('Market endpoint error', error);
      res.status(500).json({ error: 'Internal server error' });
    }

}
);
Request validation schema:

typescript
const MarketRequestSchema = z.object({
assets: z.array(z.string()).min(1).max(5),
timeframe: z.enum(['1h', '4h', '24h', '7d']).default('24h')
});
Response format:

json
{
"success": true,
"data": {
"sentiment": {
"score": 78,
"trend": "bullish",
"summary": "Strong buying pressure with increasing volume..."
},
"factors": [
"BTC breaking resistance at $44K",
"ETH showing strength vs BTC",
"Increasing on-chain activity"
],
"tokensUsed": 245
},
"metadata": {
"tokensUsed": 245,
"timestamp": 1701878400000,
"queryType": "market"
}
}
Action Items:

Create route handler

Add request validation

Implement complete flow

Add error handling for each step

Test with mock payment header

Step 6.2: Server Entry Point
File: apps/api/src/index.ts

Express server setup:

typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import marketRouter from './routes/v1/insights/market';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/insights', marketRouter);

// Health check
app.get('/health', (req, res) => {
res.json({ status: 'ok', timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
console.log(`🚀 QueryFlow API running on http://localhost:${PORT}`);
});
Action Items:

Setup Express app

Add security middleware (helmet, cors)

Register routes

Add health check endpoint

Start server and verify it runs

Phase 7: Testing & Validation (30 minutes)
Step 7.1: Manual Testing with cURL
Test 1: Endpoint without payment (should return 402)

bash
curl -X POST http://localhost:3001/api/v1/insights/market \
 -H "Content-Type: application/json" \
 -d '{"assets": ["bitcoin"], "timeframe": "24h"}'
Expected response:

json
{
"error": "Payment Required",
"price": 0.02,
"paymentAddress": "0x...",
"nonce": "abc123...",
"instructions": "Sign payment with your wallet"
}
Test 2: With valid payment (need to generate signature)

bash

# You'll need to implement signature generation

# Or use Thirdweb SDK to create valid payment header

Action Items:

Test 402 response works

Verify pricing calculation correct

Test with mock valid signature

Check query recorded on-chain (Snowtrace)

Step 7.2: Integration Test Checklist
End-to-end validation:

Server starts without errors

Health check returns 200

Market endpoint returns 402 without payment

Invalid signature returns 401

Valid payment processes successfully

AI generates coherent response

Query recorded on blockchain

Response time < 5 seconds

Day 1 Success Criteria
By end of today, you should have:

✅ Infrastructure:

Backend server running on localhost:3001

All dependencies installed

Environment variables configured

✅ Core Features:

x402 middleware working (402 response)

Blockchain integration (can read/write contracts)

OpenAI service functional

CoinGecko data fetching works

✅ Endpoint:

POST /api/v1/insights/market fully implemented

Returns market sentiment with AI analysis

Accepts payment and records on-chain

✅ Testing:

Manual curl tests passing

At least 1 successful end-to-end test

Query visible on Snowtrace
