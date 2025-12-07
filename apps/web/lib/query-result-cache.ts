/**
 * Query Result Cache
 * Stores query results in localStorage keyed by transaction hash
 * This allows the history modal to display the actual insight data
 */

const CACHE_KEY = "queryflow:results";
const MAX_CACHE_SIZE = 50; // Keep last 50 results

export interface CachedQueryResult {
  txHash: string;
  queryType: string;
  result: unknown;
  timestamp: number;
}

/**
 * Get all cached results
 */
function getCache(): CachedQueryResult[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

/**
 * Save cache to localStorage
 */
function saveCache(cache: CachedQueryResult[]): void {
  if (typeof window === "undefined") return;
  try {
    // Keep only most recent entries
    const trimmed = cache.slice(-MAX_CACHE_SIZE);
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Failed to save query cache:", err);
  }
}

/**
 * Store a query result
 */
/**
 * Store a query result
 */
export function cacheQueryResult(
  txHash: string,
  queryType: string,
  result: unknown
): void {
  const cache = getCache();
  const normalizedTxHash = txHash.toLowerCase();

  // Remove existing entry for this txHash if exists
  const filtered = cache.filter((c) => c.txHash !== normalizedTxHash);

  // Add new entry
  filtered.push({
    txHash: normalizedTxHash,
    queryType,
    result,
    timestamp: Date.now(),
  });

  saveCache(filtered);
}

/**
 * Get a cached result by transaction hash
 */
export function getCachedResult(txHash: string): CachedQueryResult | null {
  const cache = getCache();
  const normalizedTxHash = txHash.toLowerCase();
  return cache.find((c) => c.txHash.toLowerCase() === normalizedTxHash) || null;
}

/**
 * Clear all cached results
 */
export function clearCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}
