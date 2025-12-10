/**
 * Services Index
 * Re-exports all API services for convenient imports
 */

// Axios instance
export { default as apiClient, API_BASE_URL } from "@/config/axios-config";

// Insights API
export * from "./insights";

// Analytics API
export * from "./analytics";

// History API
export * from "./history";
