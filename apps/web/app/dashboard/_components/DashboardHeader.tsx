"use client";

import Image from "next/image";
import Link from "next/link";
import { Wallet, ChevronRight, Copy, Check, LogOut } from "lucide-react";
import { useState } from "react";
import {
  useActiveAccount,
  useActiveWalletChain,
  useDisconnect,
  useActiveWallet,
} from "thirdweb/react";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function DashboardHeader() {
  const [copied, setCopied] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    if (wallet) {
      disconnect(wallet);
    }
    setShowDisconnect(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E5E5]">
      <div
        className="mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between"
        style={{ maxWidth: "1400px" }}
      >
        {/* Left: Logo + Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/queryflow-logo.png"
              alt="QueryFlow"
              width={32}
              height={32}
            />
            <span className="font-semibold text-[#0A0A0A] hidden sm:inline">
              QueryFlow
            </span>
          </Link>
          <ChevronRight size={16} className="text-[#9A9A9A]" />
          <span className="font-mono text-sm text-[#6A6A6A]">Dashboard</span>
        </div>

        {/* Right: Network + Wallet */}
        <div className="flex items-center gap-4">
          {/* Network Badge */}
          {chain && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F5]">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-mono text-xs text-[#6A6A6A]">
                {chain.name || `Chain ${chain.id}`}
              </span>
            </div>
          )}

          {/* Wallet Display */}
          {account ? (
            <div
              className="relative"
              onMouseEnter={() => setShowDisconnect(true)}
              onMouseLeave={() => setShowDisconnect(false)}
            >
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ background: "rgba(20, 184, 166, 0.1)" }}
              >
                <Wallet size={18} className="text-[#14B8A6]" />
                <span className="font-mono text-sm font-medium text-[#0A0A0A]">
                  {truncateAddress(account.address)}
                </span>
                {copied ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-[#9A9A9A]" />
                )}
              </button>

              {/* Disconnect dropdown */}
              {showDisconnect && (
                <button
                  onClick={handleDisconnect}
                  className="absolute top-full right-0 mt-1 w-full px-4 py-2 bg-white border border-[#E5E5E5] rounded-lg shadow-lg flex items-center gap-2 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  <span className="text-sm font-medium">Disconnect</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F5F5F5]">
              <Wallet size={18} className="text-[#9A9A9A]" />
              <span className="font-mono text-sm text-[#9A9A9A]">
                Not Connected
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
