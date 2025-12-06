import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Developer",
    price: "Free",
    subprice: null,
    description: "Perfect for testing and development",
    features: [
      "100 free queries per month",
      "All 4 query types",
      "Fuji testnet access",
      "Community support",
      "Public documentation",
    ],
    cta: "Start Building",
    featured: false,
    ctaStyle: "btn-secondary w-full justify-center",
  },
  {
    name: "Production",
    price: "$0.01-$0.10",
    subprice: "per query",
    description: "For AI agents in production environments",
    features: [
      "Pay per query (no limits)",
      "Avalanche mainnet",
      "Priority support",
      "Advanced analytics dashboard",
      "Webhook notifications",
      "99.9% uptime SLA",
    ],
    cta: "Launch Dashboard",
    featured: true,
    ctaStyle: "btn-primary w-full justify-center",
  },
  {
    name: "Enterprise",
    price: "Custom",
    subprice: null,
    description: "For teams with high-volume needs",
    features: [
      "Volume discounts",
      "Dedicated infrastructure",
      "Private data sources",
      "Custom SLAs",
      "Priority feature requests",
      "On-premise deployment options",
    ],
    cta: "Contact Sales",
    featured: false,
    ctaStyle: "btn-secondary w-full justify-center",
  },
];

export function Pricing() {
  return (
    <section className="section-white py-32" id="pricing">
      <div className="mx-auto max-w-6xl px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-h1 text-[#0A0A0A] mb-4">
            Simple, Transparent Pricing
          </h2>
          <p
            className="text-body-lg text-[#4A4A4A] mx-auto"
            style={{ maxWidth: "672px" }}
          >
            No subscriptions. No hidden fees. Pay only when your agents query
            data.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-10 transition-all duration-300 animate-fade-in-up stagger-${index + 1} ${
                plan.featured
                  ? "border-2 border-[#14B8A6] bg-gradient-to-b from-[rgba(20, 184, 166,0.02)] to-transparent shadow-lg"
                  : "border-2 border-[#E5E5E5] bg-white hover:border-[#14B8A6] hover:shadow-lg"
              }`}
            >
              {/* Featured Badge */}
              {plan.featured && (
                <div className="absolute -top-3 right-6 bg-[#14B8A6] text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              {/* Plan Label */}
              <p className="text-eyebrow text-[#6A6A6A] mb-4">{plan.name}</p>

              {/* Price */}
              <p
                className={`text-5xl font-bold mb-1 ${plan.featured ? "text-[#14B8A6]" : "text-[#1A1A1A]"}`}
              >
                {plan.price}
              </p>
              {plan.subprice && (
                <p className="text-caption text-[#6A6A6A] mb-4">
                  {plan.subprice}
                </p>
              )}

              {/* Description */}
              <p className="text-body text-[#4A4A4A] mb-8">
                {plan.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-body text-[#4A4A4A]"
                  >
                    <Check
                      size={18}
                      className="text-[#10B981] mt-0.5 shrink-0"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button className={plan.ctaStyle}>
                {plan.cta}
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <p className="text-center text-caption text-[#6A6A6A] mt-12">
          All plans include on-chain payment verification and transparent query
          recording
        </p>
      </div>
    </section>
  );
}
