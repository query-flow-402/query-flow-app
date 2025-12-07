"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { createContext, useContext, useState, ReactNode } from "react";
import { QueryDataProvider } from "./_context/QueryDataContext";

// Dashboard context for shared state
interface DashboardContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProviders");
  }
  return context;
}

// Combined providers wrapper
export function DashboardProviders({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("explorer");

  return (
    <ThirdwebProvider>
      <DashboardContext.Provider value={{ activeTab, setActiveTab }}>
        <QueryDataProvider>{children}</QueryDataProvider>
      </DashboardContext.Provider>
    </ThirdwebProvider>
  );
}
