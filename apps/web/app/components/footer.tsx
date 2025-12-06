import Image from "next/image";
import { Github, Twitter } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Pricing", href: "#pricing" },
    { label: "Documentation", href: "#docs" },
    { label: "API Status", href: "#" },
  ],
  resources: [
    { label: "GitHub", href: "https://github.com" },
    { label: "Discord", href: "#" },
    { label: "Twitter", href: "#" },
    { label: "Blog", href: "#" },
  ],
  legal: [
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Security", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="section-dark py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/queryflow-logo.png"
                alt="QueryFlow"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-xl text-white">QueryFlow</span>
            </div>
            <p className="text-sm text-white/60">
              Pay-per-query data for AI agents
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-[#14B8A6] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-[#14B8A6] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/60 hover:text-[#14B8A6] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#2A2A2A] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            © 2025 QueryFlow. Built on Avalanche.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              className="text-white/50 hover:text-white transition-colors"
            >
              <Github size={20} />
            </a>
            <a
              href="https://twitter.com"
              className="text-white/50 hover:text-white transition-colors"
            >
              <Twitter size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
