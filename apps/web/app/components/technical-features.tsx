import { Zap, Shield, Globe, Clock, Database, Lock } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Sub-Second Finality",
    description:
      "Avalanche's consensus ensures payments settle in under 2 seconds.",
    size: "large",
  },
  {
    icon: Shield,
    title: "On-Chain Transparency",
    description: "Every query recorded on QueryRegistry smart contract.",
    size: "small",
  },
  {
    icon: Globe,
    title: "Multi-Source Data",
    description: "CoinGecko, on-chain analytics, social feeds aggregated.",
    size: "small",
  },
  {
    icon: Clock,
    title: "Real-Time Pricing",
    description:
      "Dynamic pricing based on data complexity and market conditions.",
    size: "small",
  },
  {
    icon: Database,
    title: "AI-Powered Insights",
    description:
      "Advanced models process raw data into actionable intelligence.",
    size: "small",
  },
  {
    icon: Lock,
    title: "No API Keys",
    description:
      "Your wallet is your identity. No accounts, no keys to manage.",
    size: "large",
  },
];

export function TechnicalFeatures() {
  return (
    <section className="section-white py-32">
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
            Built for Scale
          </h2>
          <p
            className="text-[#4A4A4A] mx-auto"
            style={{ maxWidth: "600px", fontSize: "1.125rem", lineHeight: 1.6 }}
          >
            Enterprise-grade infrastructure powered by Avalanche
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const isLarge = feature.size === "large";
            return (
              <div
                key={index}
                className={`p-8 rounded-2xl border border-[#E5E5E5] bg-white hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300 ${
                  isLarge ? "md:col-span-2" : ""
                }`}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#CCFBF1" }}
                >
                  <feature.icon size={24} className="text-[#14B8A6]" />
                </div>
                <h3 className="font-semibold text-[#0A0A0A] text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#4A4A4A]" style={{ lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
