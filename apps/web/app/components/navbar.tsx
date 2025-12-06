"use client";

import { useState, useEffect } from "react";
import { Menu, X, Wallet } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "Pricing", href: "#pricing" },
    { label: "Docs", href: "#docs" },
    { label: "GitHub", href: "https://github.com" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled ? "navbar-scrolled" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <Image
              src="/queryflow-logo.png"
              alt="QueryFlow"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            <span className="font-bold text-xl text-[#0A0A0A]">QueryFlow</span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-[#4A4A4A] hover:text-[#14B8A6] transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#14B8A6] transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Connect Wallet Button */}
          <div className="hidden md:block">
            <button className="btn-secondary flex items-center gap-2 text-sm py-2.5 px-5">
              <Wallet size={18} />
              Connect Wallet
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#E5E5E5]">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-semibold text-[#4A4A4A] hover:text-[#14B8A6] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <button className="btn-secondary flex items-center justify-center gap-2 text-sm py-2.5 w-full">
                <Wallet size={18} />
                Connect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
