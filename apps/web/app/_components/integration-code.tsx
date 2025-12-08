import { Copy, Check } from "lucide-react";
import { useState } from "react";

const codeExample = `import { QueryFlowClient } from "@queryflow/sdk";

// Initialize with your private key (no API Key needed!)
const client = new QueryFlowClient(process.env.PRIVATE_KEY);

// Get AI-powered market insights
const result = await client.market({
  assets: ["BTC", "ETH"],
  timeframe: "24h"
});

console.log(result.sentiment);
// Output: { score: 72, trend: "bullish", summary: "..." }`;

export function IntegrationCode() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="section-alt py-32">
      <div className="mx-auto px-6 md:px-8" style={{ maxWidth: "1280px" }}>
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-[#0A0A0A] mb-4"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Simple Integration
          </h2>
          <p
            className="text-[#4A4A4A] mx-auto"
            style={{ maxWidth: "600px", fontSize: "1.125rem", lineHeight: 1.6 }}
          >
            Add pay-per-query data to your AI agent in minutes. Use our official
            SDK or raw HTTP requests.
          </p>
        </div>

        {/* Code Block */}
        <div
          className="relative rounded-2xl overflow-hidden mx-auto"
          style={{ maxWidth: "800px", background: "#1A1A1A" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
            </div>
            <span className="text-xs text-[#6A6A6A] font-mono">agent.ts</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-[#6A6A6A] hover:text-white transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Code Content */}
          <pre className="p-6 overflow-x-auto">
            <code className="text-sm font-mono leading-relaxed text-[#E5E5E5]">
              {codeExample}
            </code>
          </pre>
        </div>

        {/* Features below code */}
        <div
          className="grid md:grid-cols-3 gap-8 mt-12 mx-auto"
          style={{ maxWidth: "800px" }}
        >
          <div className="text-center">
            <p className="font-semibold text-[#0A0A0A] mb-1">TypeScript SDK</p>
            <p className="text-sm text-[#6A6A6A]">
              Type-safe, instant integration
            </p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#0A0A0A] mb-1">
              Raw HTTP Support
            </p>
            <p className="text-sm text-[#6A6A6A]">
              Compatible with any language
            </p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#0A0A0A] mb-1">
              Real-time Pricing
            </p>
            <p className="text-sm text-[#6A6A6A]">
              Pay only for what you query
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
