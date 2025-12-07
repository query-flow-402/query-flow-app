import { createThirdwebClient } from "thirdweb";
import { avalancheFuji, avalanche } from "thirdweb/chains";

// Thirdweb client for wallet interactions
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Supported chains
export const supportedChains = [avalancheFuji, avalanche];

// Default chain for development
export const defaultChain = avalancheFuji;

// QueryRegistry contract address (newly deployed - API wallet is owner)
if (!process.env.NEXT_PUBLIC_QUERY_REGISTRY_ADDRESS) {
  throw new Error("NEXT_PUBLIC_QUERY_REGISTRY_ADDRESS is not set");
}

export const QUERY_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_QUERY_REGISTRY_ADDRESS;
