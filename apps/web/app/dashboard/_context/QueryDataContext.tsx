"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useActiveAccount } from "thirdweb/react";
import {
  fetchUserQueryHistory,
  refreshUserQueryHistory,
  type BlockchainQueryItem,
} from "@/lib/blockchain-history";

// =============================================================================
// TYPES
// =============================================================================

interface QueryDataContextType {
  queries: BlockchainQueryItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastRefresh: number | null;
}

// =============================================================================
// CONTEXT
// =============================================================================

const QueryDataContext = createContext<QueryDataContextType | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export function QueryDataProvider({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const [queries, setQueries] = useState<BlockchainQueryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      if (!account?.address) {
        setQueries([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`📊 Fetching query data (forceRefresh=${forceRefresh})...`);
        const history = forceRefresh
          ? await refreshUserQueryHistory(account.address)
          : await fetchUserQueryHistory(account.address);

        setQueries(history);
        setLastRefresh(Date.now());
      } catch (err) {
        console.error("Failed to load query data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [account?.address]
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for query completion events
  useEffect(() => {
    const handleQueryCompleted = () => {
      console.log("📊 Query completed - refreshing data in 2s...");
      // Small delay to allow blockchain indexing
      setTimeout(() => {
        loadData(true); // Force refresh
      }, 2000);
    };

    window.addEventListener("queryflow:query-completed", handleQueryCompleted);
    return () => {
      window.removeEventListener(
        "queryflow:query-completed",
        handleQueryCompleted
      );
    };
  }, [loadData]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  return (
    <QueryDataContext.Provider
      value={{
        queries,
        loading,
        error,
        refresh,
        lastRefresh,
      }}
    >
      {children}
    </QueryDataContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useQueryData() {
  const context = useContext(QueryDataContext);
  if (!context) {
    throw new Error("useQueryData must be used within QueryDataProvider");
  }
  return context;
}
