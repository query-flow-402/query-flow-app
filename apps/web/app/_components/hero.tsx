"use client";

import { ArrowRight, ExternalLink, Zap, Shield, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter();

  const handleLaunchDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <section className="min-h-[90vh] flex items-center section-gradient pt-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-16 md:py-24 w-full">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
          {/* Left Column - Content */}
          <div className="animate-fade-in-up">
            {/* Eyebrow */}
            <p className="text-eyebrow text-[#6A6A6A] mb-4">
              Powered by Avalanche x402 Protocol
            </p>

            {/* Headline */}
            <h1 className="text-display text-[#0A0A0A] mb-6">
              Pay-Per-Query Data Insights for AI Agents
            </h1>

            {/* Subheadline */}
            <p
              className="text-body-lg text-[#4A4A4A] mb-10"
              style={{ maxWidth: "560px" }}
            >
              No subscriptions. No accounts. AI agents pay for data in real-time
              using blockchain settlements in under 2 seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <button
                className="btn-primary text-base group"
                onClick={handleLaunchDashboard}
              >
                Launch Dashboard
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
              <a
                href="/docs/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-base group"
              >
                View Documentation
                <ExternalLink
                  size={18}
                  className="transition-transform group-hover:scale-110"
                />
              </a>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-8 md:gap-12">
              <div className="hover-lift">
                <p className="text-4xl font-bold text-[#14B8A6]">1,247</p>
                <p className="text-caption text-[#6A6A6A] text-eyebrow mt-1">
                  Queries On-Chain
                </p>
              </div>
              <div className="hover-lift">
                <p className="text-4xl font-bold text-[#14B8A6]">$0.02</p>
                <p className="text-caption text-[#6A6A6A] text-eyebrow mt-1">
                  Starting Price
                </p>
              </div>
              <div className="hover-lift">
                <p className="text-4xl font-bold text-[#14B8A6]">2.1s</p>
                <p className="text-caption text-[#6A6A6A] text-eyebrow mt-1">
                  Avg Settlement
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Floating Feature Cards */}
          <div className="hidden md:block relative h-[450px] animate-fade-in-up stagger-2">
            {/* Main Card */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-3xl flex flex-col items-center justify-center text-center p-6 "
              style={{
                background: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
                boxShadow: "0 25px 50px -12px rgba(20, 184, 166, 0.4)",
              }}
            >
              <div className="text-6xl font-bold text-white mb-2">Q</div>
              <p className="text-white/90 text-sm font-medium">QueryFlow</p>
              <p className="text-white/70 text-xs mt-1">x402 Protocol</p>
            </div>

            {/* Floating Cards */}
            <div
              className="absolute top-4 left-8 p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-lg animate-float-slow"
              style={{ animationDelay: "0s" }}
            >
              <Zap size={24} className="text-[#14B8A6] mb-2" />
              <p className="text-xs font-semibold text-[#0A0A0A]">
                Fast Settlement
              </p>
              <p className="text-xs text-[#6A6A6A]">&lt; 2 seconds</p>
            </div>

            <div
              className="absolute top-12 right-4 p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-lg animate-float-slow"
              style={{ animationDelay: "1s" }}
            >
              <Shield size={24} className="text-[#14B8A6] mb-2" />
              <p className="text-xs font-semibold text-[#0A0A0A]">On-Chain</p>
              <p className="text-xs text-[#6A6A6A]">Transparent</p>
            </div>

            <div
              className="absolute bottom-12 left-4 p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-lg animate-float-slow"
              style={{ animationDelay: "2s" }}
            >
              <Globe size={24} className="text-[#14B8A6] mb-2" />
              <p className="text-xs font-semibold text-[#0A0A0A]">
                Multi-Source
              </p>
              <p className="text-xs text-[#6A6A6A]">Data Aggregation</p>
            </div>

            {/* Code snippet card */}
            <div
              className="absolute bottom-4 right-0 p-3 rounded-xl bg-[#1A1A1A] shadow-lg animate-float-slow"
              style={{ animationDelay: "0.5s" }}
            >
              <pre className="text-xs font-mono text-[#10B981]">
                <span className="text-[#6A6A6A]">// Response</span>
                {"\n"}
                <span className="text-white">{"{"}</span> insight:{" "}
                <span className="text-[#F59E0B]">"bullish"</span>{" "}
                <span className="text-white">{"}"}</span>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
