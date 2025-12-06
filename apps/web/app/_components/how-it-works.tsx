import { Zap, CreditCard, Sparkles } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Zap,
    title: "Agent Sends Request",
    description:
      "Your AI agent makes a standard HTTP POST request to any QueryFlow endpoint. No authentication, no API keys—just a simple request.",
  },
  {
    number: 2,
    icon: CreditCard,
    title: "Receive 402 & Pay",
    description:
      "QueryFlow responds with a 402 status and price quote. Your agent signs a payment with its wallet—settlement happens on Avalanche in under 2 seconds.",
  },
  {
    number: 3,
    icon: Sparkles,
    title: "Receive AI Insights",
    description:
      "Once payment is verified, QueryFlow fetches multi-source data, processes it with AI, and returns actionable insights as JSON. Query recorded on-chain for transparency.",
  },
];

export function HowItWorks() {
  return (
    <section className="section-white py-32" id="product">
      <div className="mx-auto max-w-7xl px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-h1 text-[#0A0A0A] mb-4">How QueryFlow Works</h2>
          <p
            className="text-body-lg text-[#4A4A4A] mx-auto"
            style={{ maxWidth: "672px" }}
          >
            Three steps to get real-time data insights, no subscription required
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`text-center animate-fade-in-up stagger-${index + 1}`}
            >
              {/* Step Number */}
              <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                <span className="text-2xl font-bold text-[#14B8A6]">
                  {step.number}
                </span>
              </div>

              {/* Icon */}
              <div className="w-48 h-36 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[#FFEBEB] to-[#FFF5F5] border border-[#E5E5E5] flex items-center justify-center">
                <step.icon size={48} className="text-[#14B8A6]" />
              </div>

              {/* Title */}
              <h3 className="text-h3 text-[#0A0A0A] mb-4">{step.title}</h3>

              {/* Description */}
              <p className="text-body text-[#4A4A4A]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
