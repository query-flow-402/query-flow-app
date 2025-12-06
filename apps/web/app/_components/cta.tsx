import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="section-cta py-32 md:py-40">
      <div
        className="mx-auto px-6 md:px-8 text-center"
        style={{ maxWidth: "896px", width: "100%" }}
      >
        {/* Headline */}
        <h2
          className="text-white mb-6"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 300,
            lineHeight: 1.1,
          }}
        >
          Start Building with QueryFlow
        </h2>

        {/* Subheadline */}
        <p
          className="text-white/90 mb-12 mx-auto"
          style={{
            maxWidth: "600px",
            fontSize: "1.125rem",
            lineHeight: 1.6,
          }}
        >
          Join developers building the future of AI-powered data infrastructure
          on Avalanche.
        </p>

        {/* CTA Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-white text-[#14B8A6] font-bold rounded-xl hover:bg-[#F5F5F5] hover:scale-105 transition-all duration-200 shadow-lg"
          style={{ padding: "1.25rem 3rem", fontSize: "1.125rem" }}
        >
          Launch Dashboard
          <ArrowRight size={22} />
        </Link>

        {/* Sub-note */}
        <p className="text-sm text-white/70 mt-6">
          No credit card required — 100 free queries
        </p>
      </div>
    </section>
  );
}
