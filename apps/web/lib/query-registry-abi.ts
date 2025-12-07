/**
 * QueryRegistry ABI - Minimal ABI for reading QueryRecorded events
 */
export const queryRegistryAbi = [
  {
    type: "event",
    name: "QueryRecorded",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "queryId", type: "uint256", indexed: false },
      { name: "queryType", type: "string", indexed: false },
      { name: "payment", type: "uint256", indexed: false },
      { name: "resultHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "queryCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
