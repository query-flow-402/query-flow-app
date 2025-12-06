export function SocialProof() {
  const partners = [
    { name: "Avalanche", logo: "AVAX" },
    { name: "CoinGecko", logo: "CG" },
    { name: "TURF Network", logo: "TURF" },
    { name: "Thirdweb", logo: "TW" },
  ];

  return (
    <section className="section-alt py-8">
      <div className="mx-auto max-w-7xl px-8">
        <p className="text-center text-caption text-[#6A6A6A] mb-6">
          Trusted by AI agents and developers building on Avalanche
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#E5E5E5] flex items-center justify-center">
                <span className="text-xs font-bold text-[#6A6A6A]">
                  {partner.logo}
                </span>
              </div>
              <span className="text-sm font-semibold text-[#4A4A4A]">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
