"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "QueryFlow eliminated our API management overhead. Our trading bot just pays per query—no subscriptions, no rate limits to worry about.",
    author: "Alex Chen",
    role: "Lead Developer, TradingBot Inc.",
    avatar: "AC",
  },
  {
    quote:
      "The x402 integration was surprisingly simple. We had our risk assessment agent running within an hour. The on-chain transparency is a game-changer.",
    author: "Sarah Kim",
    role: "CTO, DeFi Shield",
    avatar: "SK",
  },
  {
    quote:
      "Sub-2-second settlements on Avalanche mean our agents can make real-time decisions. The AI insights quality exceeded our expectations.",
    author: "Marcus Johnson",
    role: "Founder, AI Trading Labs",
    avatar: "MJ",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () =>
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );

  const testimonial = testimonials[current];

  return (
    <section className="section-alt py-32">
      <div className="mx-auto px-6 md:px-8" style={{ maxWidth: "800px" }}>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2
            className="text-[#0A0A0A] mb-4"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Trusted by Builders
          </h2>
        </div>

        {/* Testimonial Card */}
        <div className="relative bg-white rounded-2xl p-10 border border-[#E5E5E5] shadow-sm">
          {/* Quote Icon */}
          <div className="absolute -top-4 left-8">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#14B8A6" }}
            >
              <Quote size={18} className="text-white" />
            </div>
          </div>

          {/* Quote Text */}
          <p
            className="text-[#0A0A0A] text-xl mb-8 mt-4"
            style={{ lineHeight: 1.6, fontStyle: "italic" }}
          >
            "{testimonial.quote}"
          </p>

          {/* Author */}
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
              style={{ background: "#14B8A6" }}
            >
              {testimonial.avatar}
            </div>
            <div>
              <p className="font-semibold text-[#0A0A0A]">
                {testimonial.author}
              </p>
              <p className="text-sm text-[#6A6A6A]">{testimonial.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-[#E5E5E5] flex items-center justify-center hover:border-[#14B8A6] hover:text-[#14B8A6] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === current ? "bg-[#14B8A6]" : "bg-[#E5E5E5]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-[#E5E5E5] flex items-center justify-center hover:border-[#14B8A6] hover:text-[#14B8A6] transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
