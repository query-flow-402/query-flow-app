/**
 * Query History API Route
 * Returns query history for a user from blockchain with caching
 * Uses chunked fetching to respect RPC block limits
 */

import express, { Request, Response } from "express";
import { Address, formatEther } from "viem";
import {
  publicClient,
  QueryRegistryABI,
  QUERY_REGISTRY_ADDRESS,
  getQueryCount,
  getQuery,
} from "../../lib/contracts.js";

const router = express.Router();

// =============================================================================
// TYPES
// =============================================================================

interface QueryHistoryItem {
  id: string;
  type: string;
  amount: string;
  amountUsd: number;
  timestamp: number;
  txHash: string;
  status: string;
  resultHash: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const AVAX_USD_PRICE = 13.3;
const CACHE_TTL_MS = 30000; // 30 seconds cache
const BLOCKS_PER_QUERY = 2000; // RPC limit is 2048, stay under
const MAX_BLOCKS_TO_SCAN = 50000; // ~14 hours of blocks on Fuji

// In-memory cache
const historyCache = new Map<
  string,
  { data: QueryHistoryItem[]; timestamp: number }
>();

// Log on module load for debugging
console.log("📜 History Route Loaded:");
console.log("  Using QueryRegistry:", QUERY_REGISTRY_ADDRESS);

// Get the event ABI from QueryRegistryABI
const QueryRecordedEvent = QueryRegistryABI.find(
  (item) => item.type === "event" && item.name === "QueryRecorded"
)!;

console.log("  Event ABI:", JSON.stringify(QueryRecordedEvent));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Fetch history from blockchain in chunks to respect RPC limits
 */
async function fetchHistoryFromChain(
  userAddress: string
): Promise<QueryHistoryItem[]> {
  const currentBlock = await publicClient.getBlockNumber();
  const startBlock =
    currentBlock > BigInt(MAX_BLOCKS_TO_SCAN)
      ? currentBlock - BigInt(MAX_BLOCKS_TO_SCAN)
      : BigInt(0);

  console.log("📜 ========================================");
  console.log(`📜 Fetching history for: ${userAddress}`);
  console.log(`📜 Contract address: ${QUERY_REGISTRY_ADDRESS}`);
  console.log(`📜 Block range: ${startBlock} to ${currentBlock}`);
  console.log("📜 ========================================");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allLogs: any[] = [];

  // Fetch in chunks
  const start = Number(startBlock);
  const end = Number(currentBlock);
  const totalChunks = Math.ceil((end - start) / BLOCKS_PER_QUERY);

  console.log(
    `📊 Fetching ${totalChunks} chunks of ${BLOCKS_PER_QUERY} blocks each`
  );

  for (let i = 0; i < totalChunks; i++) {
    const fromBlock = BigInt(start + i * BLOCKS_PER_QUERY);
    const toBlock = BigInt(
      Math.min(start + (i + 1) * BLOCKS_PER_QUERY - 1, end)
    );

    try {
      const logs = await publicClient.getLogs({
        address: QUERY_REGISTRY_ADDRESS,
        event: QueryRecordedEvent,
        args: {
          user: userAddress as Address,
        },
        fromBlock,
        toBlock,
      });

      if (logs.length > 0) {
        console.log(
          `✅ Chunk ${i + 1}/${totalChunks}: Found ${logs.length} events`
        );
      }

      allLogs.push(...logs);
    } catch (chunkError) {
      console.warn(
        `⚠️ Failed chunk ${i + 1}/${totalChunks} (blocks ${fromBlock}-${toBlock}):`,
        chunkError instanceof Error ? chunkError.message : chunkError
      );
      // Continue with next chunk
    }
  }

  console.log(`📊 Total events found: ${allLogs.length}`);

  // Transform logs to response format
  const queries: QueryHistoryItem[] = allLogs.map((log) => {
    const args = log.args;
    const avaxAmount = formatEther(args.payment);
    const avaxNum = parseFloat(avaxAmount);

    console.log(
      `📝 Event: queryId=${args.queryId}, user=${args.user}, type=${args.queryType}`
    );

    return {
      id: String(args.queryId),
      type: String(args.queryType),
      amount: avaxNum.toFixed(6),
      amountUsd: avaxNum * AVAX_USD_PRICE,
      timestamp: Date.now(), // Contract doesn't emit timestamp in event
      txHash: log.transactionHash || "0x0",
      status: "confirmed",
      resultHash: "0x", // Not in event, stored in Query struct
    };
  });

  // Sort by queryId descending (newest first)
  queries.sort((a, b) => Number(b.id) - Number(a.id));

  return queries;
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /history/:address
 * Returns query history for a user address
 */
router.get("/:address", async (req: Request, res: Response) => {
  const { address } = req.params;

  console.log(`\n🔍 GET /history/${address}`);

  if (!address || !address.startsWith("0x")) {
    console.log("❌ Invalid address");
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ADDRESS", message: "Invalid wallet address" },
    });
  }

  try {
    const cacheKey = address.toLowerCase();
    const cached = historyCache.get(cacheKey);

    // Return cached if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(
        `📦 Returning cached history (${cached.data.length} queries)`
      );
      return res.json({
        success: true,
        data: {
          queries: cached.data,
          cached: true,
          cacheAge: Date.now() - cached.timestamp,
        },
      });
    }

    // Fetch from blockchain
    const queries = await fetchHistoryFromChain(address);

    console.log(`✅ Returning ${queries.length} queries`);

    // Update cache
    historyCache.set(cacheKey, {
      data: queries,
      timestamp: Date.now(),
    });

    return res.json({
      success: true,
      data: {
        queries,
        cached: false,
        total: queries.length,
      },
    });
  } catch (error) {
    console.error("❌ History fetch error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to fetch history",
      },
    });
  }
});

/**
 * POST /history/refresh/:address
 * Force refresh cache for a user
 */
router.post("/refresh/:address", async (req: Request, res: Response) => {
  const { address } = req.params;

  console.log(`\n🔄 POST /history/refresh/${address}`);

  if (!address || !address.startsWith("0x")) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_ADDRESS", message: "Invalid wallet address" },
    });
  }

  try {
    const cacheKey = address.toLowerCase();

    // Clear cache
    historyCache.delete(cacheKey);

    // Fetch fresh from blockchain
    const queries = await fetchHistoryFromChain(address);

    // Update cache
    historyCache.set(cacheKey, {
      data: queries,
      timestamp: Date.now(),
    });

    return res.json({
      success: true,
      data: {
        queries,
        refreshed: true,
        total: queries.length,
      },
    });
  } catch (error) {
    console.error("❌ History refresh error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "REFRESH_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to refresh history",
      },
    });
  }
});

/**
 * GET /history/debug/check
 * Debug endpoint to check if recording is working
 */
router.get("/debug/check", async (req: Request, res: Response) => {
  console.log("\n🔧 GET /history/debug/check");

  try {
    const currentBlock = await publicClient.getBlockNumber();
    console.log(`  Current block: ${currentBlock}`);

    // Check query count on contract
    const queryCount = await getQueryCount();
    console.log(`  Query count on contract: ${queryCount}`);

    // Try to get the first query details if exists
    let firstQuery = null;
    if (queryCount > 0n) {
      try {
        firstQuery = await getQuery(0n);
        console.log(
          `  First query: user=${firstQuery.user}, type=${firstQuery.queryType}`
        );
      } catch (e) {
        console.log(`  Could not get first query: ${e}`);
      }
    }

    // Try to fetch ALL events (no user filter) from last 1000 blocks
    let allEventsCount = 0;
    let allEventsError: string | null = null;
    try {
      const fromBlock = currentBlock - BigInt(1000);
      console.log(
        `  Fetching events from block ${fromBlock} to ${currentBlock}...`
      );

      const logs = await publicClient.getLogs({
        address: QUERY_REGISTRY_ADDRESS,
        event: QueryRecordedEvent,
        fromBlock,
        toBlock: currentBlock,
      });
      allEventsCount = logs.length;
      console.log(`  Found ${allEventsCount} events (no user filter)`);
    } catch (e) {
      allEventsError = e instanceof Error ? e.message : String(e);
      console.log(`  Error fetching events: ${allEventsError}`);
    }

    return res.json({
      success: true,
      debug: {
        currentBlock: Number(currentBlock),
        contractAddress: QUERY_REGISTRY_ADDRESS,
        totalQueriesRecorded: Number(queryCount),
        allEventsInLast1000Blocks: allEventsCount,
        allEventsError,
        firstQueryOnChain: firstQuery
          ? {
              user: firstQuery.user,
              queryType: firstQuery.queryType,
              payment: firstQuery.payment.toString(),
              timestamp: Number(firstQuery.timestamp),
            }
          : null,
        eventAbi: QueryRecordedEvent,
        message:
          queryCount === 0n
            ? "No queries recorded on contract."
            : allEventsCount === 0
              ? `Contract has ${queryCount} queries but getLogs returns 0. Check event signature.`
              : `Found ${allEventsCount} events in last 1000 blocks.`,
      },
    });
  } catch (error) {
    console.error("❌ Debug check error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Debug check failed",
    });
  }
});

export default router;
