"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Wallet,
  Copy,
  Check,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import {
  useActiveAccount,
  useActiveWalletChain,
  useDisconnect,
  useActiveWallet,
  useConnect,
  ConnectButton,
} from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { client, supportedChains, defaultChain } from "@/lib/thirdweb";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function DashboardHeader() {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

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
    setShowDropdown(false);
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
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              {/* Main button - just shows address */}
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                style={{ background: "rgba(20, 184, 166, 0.1)" }}
              >
                <Wallet size={18} className="text-[#14B8A6]" />
                <span className="font-mono text-sm font-medium text-[#0A0A0A]">
                  {truncateAddress(account.address)}
                </span>
                <ChevronDown size={14} className="text-[#9A9A9A]" />
              </div>

              {/* Dropdown menu */}
              {showDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-[#E5E5E5] rounded-lg shadow-lg overflow-hidden">
                  {/* Copy address */}
                  <button
                    onClick={copyAddress}
                    className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-[#F5F5F5] transition-colors"
                  >
                    {copied ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="text-[#6A6A6A]" />
                    )}
                    <span className="text-sm text-[#0A0A0A]">
                      {copied ? "Copied!" : "Copy Address"}
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="border-t border-[#E5E5E5]" />

                  {/* Disconnect */}
                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2.5 flex items-center gap-2 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    <span className="text-sm font-medium">Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Connect Button - Use Thirdweb only for connection modal
            <ConnectButton
              client={client}
              chains={supportedChains}
              chain={defaultChain}
              connectButton={{
                label: "Connect Wallet",
                style: {
                  backgroundColor: "rgba(20, 184, 166, 0.1)",
                  color: "#0A0A0A",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  fontWeight: 500,
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                },
              }}
              theme="light"
              connectModal={{
                title: "Connect to QueryFlow",
                size: "compact",
                showThirdwebBranding: false,
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}
