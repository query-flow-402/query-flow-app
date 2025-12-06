"use client";

import {
  Navbar,
  Hero,
  SocialProof,
  HowItWorks,
  QueryTypes,
  TechnicalFeatures,
  Testimonials,
  IntegrationCode,
  Pricing,
  FAQ,
  CTA,
  Footer,
} from "./_components";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <HowItWorks />
        <QueryTypes />
        <TechnicalFeatures />
        <IntegrationCode />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
