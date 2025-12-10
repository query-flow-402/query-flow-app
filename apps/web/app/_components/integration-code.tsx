import { Copy, Check, Package } from "lucide-react";
import { useState } from "react";

const codeExample = `import { QueryFlowClient } from "@queryflow-402/sdk";

// Initialize with your private key and enable real payments
const client = new QueryFlowClient(process.env.PRIVATE_KEY, {
  mode: "tx" // Enables real AVAX transactions
});

// Get AI-powered market insights (~$0.02 in AVAX)
const result = await client.market({
  assets: ["BTC", "ETH"],
  timeframe: "24h"
});

console.log(result.sentiment);
// Output: { score: 75, trend: "bullish", summary: "..." }`;

export function IntegrationCode() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="sdk" className="section-alt py-32">
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
            className="text-[#4A4A4A] mx-auto mb-6"
            style={{ maxWidth: "600px", fontSize: "1.125rem", lineHeight: 1.6 }}
          >
            Add pay-per-query data to your AI agent in minutes. Use our official
            SDK or raw HTTP requests.
          </p>

          {/* NPM Package Button */}
          <a
            href="https://www.npmjs.com/package/@queryflow-402/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#CB3837] hover:bg-[#A52F2E] text-white font-medium rounded-lg transition-colors"
          >
            <Package size={20} />
            View on NPM
          </a>
        </div>

        {/* Install Command */}
        <div
          className="flex items-center justify-center gap-4 mb-8 mx-auto"
          style={{ maxWidth: "500px" }}
        >
          <code className="flex-1 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg px-4 py-3 font-mono text-sm text-[#333]">
            npm install @queryflow-402/sdk
          </code>
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
              Real AVAX Payments
            </p>
            <p className="text-sm text-[#6A6A6A]">No API keys, pay per query</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#0A0A0A] mb-1">SSE Streaming</p>
            <p className="text-sm text-[#6A6A6A]">Real-time AI responses</p>
          </div>
        </div>
      </div>
    </section>
  );
}
