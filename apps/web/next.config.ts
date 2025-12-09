import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for containerized deployments
  output: "standalone",
  // Exclude problematic server-side packages from bundling
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
};

export default nextConfig;
