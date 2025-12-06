import { Check } from "lucide-react";

const queryTypes = [
  {
    type: "market",
    badge: "Market",
    title: "Market Sentiment",
    price: "$0.02",
    description:
      "Real-time sentiment analysis aggregating crypto prices, volume trends, and multi-source market indicators.",
    useCases: [
      "Trading bots needing market pulse",
      "Risk assessment systems",
      "Portfolio rebalancing automation",
    ],
  },
  {
    type: "price",
    badge: "Price",
    title: "Price Prediction",
    price: "$0.03",
    description:
      "AI-powered forecasts using historical data, technical indicators, and on-chain metrics for actionable predictions.",
    useCases: [
      "Algorithmic trading strategies",
      "Investment recommendation engines",
      "Market timing optimization",
    ],
  },
  {
    type: "risk",
    badge: "Risk",
    title: "Risk Assessment",
    price: "$0.05",
    description:
      "Deep wallet analysis checking on-chain behavior, transaction patterns, and fraud indicators for comprehensive risk scoring.",
    useCases: [
      "DeFi protocol security",
      "Fraud detection systems",
      "Compliance automation",
    ],
  },
  {
    type: "social",
    badge: "Social",
    title: "Social Sentiment",
    price: "$0.02",
    description:
      "Aggregated social media analysis tracking community sentiment, trending narratives, and manipulation detection.",
    useCases: [
      "Community health monitoring",
      "Influencer impact analysis",
      "Early trend detection",
    ],
  },
];

export function QueryTypes() {
  return (
    <section className="section-gradient py-32">
      <div className="mx-auto max-w-7xl px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-h1 text-[#0A0A0A] mb-4">
            Four Query Types, Endless Possibilities
          </h2>
          <p
            className="text-body-lg text-[#4A4A4A] mx-auto"
            style={{ maxWidth: "672px" }}
          >
            Pay only for what you use. Each query type is purpose-built for
            specific AI agent needs.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {queryTypes.map((query, index) => (
            <div
              key={query.type}
              className={`card animate-fade-in-up stagger-${index + 1}`}
            >
              {/* Badge */}
              <span className={`badge badge-${query.type}`}>{query.badge}</span>

              {/* Title */}
              <h3 className="text-h2 text-[#0A0A0A] mt-4">{query.title}</h3>

              {/* Price */}
              <p className="text-price text-[#14B8A6] mt-2">{query.price}</p>

              {/* Description */}
              <p className="text-body text-[#4A4A4A] mt-4 mb-6">
                {query.description}
              </p>

              {/* Animation Placeholder */}
              <div className="w-full h-40 rounded-xl bg-gradient-to-br from-[#F8F8F8] to-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center mb-6">
                <span className="text-caption text-[#9A9A9A]">
                  Animation Placeholder
                </span>
              </div>

              {/* Use Cases */}
              <ul className="space-y-2">
                {query.useCases.map((useCase) => (
                  <li
                    key={useCase}
                    className="flex items-start gap-2 text-body text-[#4A4A4A]"
                  >
                    <Check size={16} className="text-[#10B981] mt-1 shrink-0" />
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
