"use client";

import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { client, supportedChains } from "@/lib/thirdweb";
import { Wallet } from "lucide-react";

export function WalletConnect() {
  const account = useActiveAccount();

  // If wallet is connected, don't render the overlay
  if (account) {
    return null;
  }

  // Render full-screen auth gate
  return (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center p-8">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: "rgba(20, 184, 166, 0.1)" }}
        >
          <Wallet size={40} className="text-[#14B8A6]" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#0A0A0A] mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-[#6A6A6A] mb-8">
          Connect your wallet to access the QueryFlow dashboard and start making
          AI-powered queries.
        </p>

        {/* Thirdweb Connect Button */}
        <ConnectButton
          client={client}
          chains={supportedChains}
          connectButton={{
            label: "Connect Wallet",
            style: {
              background: "linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%)",
              color: "white",
              padding: "16px 32px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
            },
          }}
        />

        {/* Supported networks */}
        <p className="text-xs text-[#9A9A9A] mt-6">
          Supported networks: Avalanche C-Chain, Avalanche Fuji Testnet
        </p>
      </div>
    </div>
  );
}
