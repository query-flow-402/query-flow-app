/**
 * Blockchain Contract Integration
 * Viem clients and contract interactions for QueryRegistry and AgentRegistry
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";

// =============================================================================
// CONFIGURATION
// =============================================================================

const AVALANCHE_RPC_URL =
  process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex | undefined;

const QUERY_REGISTRY_ADDRESS = (process.env.QUERY_REGISTRY_ADDRESS ||
  "0x254099809Aa6D702A7dBe17180629d7BBA6548e2") as Address;
const AGENT_REGISTRY_ADDRESS = (process.env.AGENT_REGISTRY_ADDRESS ||
  "0x5424d6482fA1EF5378b927fC6606ED27318A1F30") as Address;

// Log config on module load (for debugging)
console.log("📋 Contract Config:");
console.log("  QueryRegistry:", QUERY_REGISTRY_ADDRESS);
console.log("  AgentRegistry:", AGENT_REGISTRY_ADDRESS);

// =============================================================================
// ABIs (extracted from Solidity contracts)
// =============================================================================

export const QueryRegistryABI = [
  {
    type: "function",
    name: "queryCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getQuery",
    inputs: [{ name: "queryId", type: "uint256" }],
    outputs: [
      {
        name: "query",
        type: "tuple",
        components: [
          { name: "user", type: "address" },
          { name: "queryType", type: "string" },
          { name: "payment", type: "uint256" },
          { name: "resultHash", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "recordQuery",
    inputs: [
      { name: "user", type: "address" },
      { name: "queryType", type: "string" },
      { name: "payment", type: "uint256" },
      { name: "resultHash", type: "bytes32" },
    ],
    outputs: [{ name: "queryId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "QueryRecorded",
    inputs: [
      { name: "queryId", type: "uint256", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "queryType", type: "string", indexed: false },
      { name: "payment", type: "uint256", indexed: false },
    ],
  },
] as const;

export const AgentRegistryABI = [
  {
    type: "function",
    name: "getAgent",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "owner", type: "address" },
          { name: "reputationScore", type: "uint256" },
          { name: "totalQueries", type: "uint256" },
          { name: "successfulQueries", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgentCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "updateReputation",
    inputs: [
      { name: "agent", type: "address" },
      { name: "success", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "ReputationUpdated",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "newScore", type: "uint256", indexed: false },
    ],
  },
] as const;

// =============================================================================
// TYPES
// =============================================================================

export interface QueryData {
  user: Address;
  queryType: string;
  payment: bigint;
  resultHash: Hash;
  timestamp: bigint;
}

export interface AgentData {
  name: string;
  owner: Address;
  reputationScore: bigint;
  totalQueries: bigint;
  successfulQueries: bigint;
  isActive: boolean;
}

// =============================================================================
// VIEM CLIENTS
// =============================================================================

/** Public client for read-only operations */
export const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(AVALANCHE_RPC_URL),
});

/** Wallet client for write operations (requires PRIVATE_KEY) */
function getWalletClient() {
  if (!PRIVATE_KEY) {
    throw new Error(
      "PRIVATE_KEY environment variable is required for write operations"
    );
  }

  const account = privateKeyToAccount(PRIVATE_KEY);

  return createWalletClient({
    account,
    chain: avalancheFuji,
    transport: http(AVALANCHE_RPC_URL),
  });
}

// =============================================================================
// READ FUNCTIONS
// =============================================================================

/**
 * Get the total number of recorded queries
 */
export async function getQueryCount(): Promise<bigint> {
  const count = await publicClient.readContract({
    address: QUERY_REGISTRY_ADDRESS,
    abi: QueryRegistryABI,
    functionName: "queryCount",
  });
  return count;
}

/**
 * Get a specific query by ID
 */
export async function getQuery(queryId: bigint): Promise<QueryData> {
  const query = await publicClient.readContract({
    address: QUERY_REGISTRY_ADDRESS,
    abi: QueryRegistryABI,
    functionName: "getQuery",
    args: [queryId],
  });
  return query as QueryData;
}

/**
 * Get agent data by address
 */
export async function getAgent(address: Address): Promise<AgentData> {
  const agent = await publicClient.readContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AgentRegistryABI,
    functionName: "getAgent",
    args: [address],
  });
  return agent as AgentData;
}

/**
 * Get total number of registered agents
 */
export async function getAgentCount(): Promise<bigint> {
  const count = await publicClient.readContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AgentRegistryABI,
    functionName: "getAgentCount",
  });
  return count;
}

// =============================================================================
// WRITE FUNCTIONS
// =============================================================================

/**
 * Record a new query on-chain
 * @returns Transaction hash and query ID
 */
export async function recordQuery(
  user: Address,
  queryType: string,
  payment: bigint,
  resultHash: Hash
): Promise<{ txHash: Hash; queryId: bigint }> {
  const walletClient = getWalletClient();

  // Get current query count to determine the new queryId
  const currentCount = await getQueryCount();

  const txHash = await walletClient.writeContract({
    address: QUERY_REGISTRY_ADDRESS,
    abi: QueryRegistryABI,
    functionName: "recordQuery",
    args: [user, queryType, payment, resultHash],
  });

  // Wait for transaction confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    queryId: currentCount, // The new query ID is the previous count
  };
}

/**
 * Update an agent's reputation based on query outcome
 */
export async function updateAgentReputation(
  agent: Address,
  success: boolean
): Promise<Hash> {
  const walletClient = getWalletClient();

  const txHash = await walletClient.writeContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AgentRegistryABI,
    functionName: "updateReputation",
    args: [agent, success],
  });

  // Wait for transaction confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return txHash;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if the blockchain connection is healthy
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  chainId: number;
  blockNumber: bigint;
}> {
  try {
    const [chainId, blockNumber] = await Promise.all([
      publicClient.getChainId(),
      publicClient.getBlockNumber(),
    ]);

    return {
      connected: true,
      chainId,
      blockNumber,
    };
  } catch (error) {
    return {
      connected: false,
      chainId: 0,
      blockNumber: 0n,
    };
  }
}
