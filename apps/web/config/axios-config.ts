/**
 * Axios Configuration
 * Centralized axios instance with base URL and interceptors
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

// Base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds (AI queries can be slow)
  headers: {
    "Content-Type": "application/json",
  },
});

// =============================================================================
// REQUEST INTERCEPTOR
// =============================================================================

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log requests in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
    }
    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Request Error:", error.message);
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR
// =============================================================================

apiClient.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle specific error codes
    if (error.response) {
      const status = error.response.status;

      // 402 Payment Required - Let the caller handle this
      if (status === 402) {
        return Promise.reject(error);
      }

      // Log other errors
      console.error(`❌ API Error ${status}:`, error.response.data);
    } else if (error.request) {
      console.error("❌ Network Error: No response received");
    } else {
      console.error("❌ Request Setup Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
