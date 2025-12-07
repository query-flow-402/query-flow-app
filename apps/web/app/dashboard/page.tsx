"use client";

import { DashboardHeader } from "./_components/DashboardHeader";
import { StatsCards } from "./_components/StatsCards";
import { TabNavigation } from "./_components/TabNavigation";
import { WalletConnect } from "./_components/WalletConnect";

export default function DashboardPage() {
  return (
    <>
      <WalletConnect />
      <DashboardHeader />
      <main
        className="mx-auto px-6 md:px-8 py-8"
        style={{ maxWidth: "1400px" }}
      >
        <StatsCards />
        <TabNavigation />
      </main>
    </>
  );
}
