"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { OverviewTab } from "./OverviewTab";
import { HistoryTab } from "./HistoryTab";
import { ExplorerTab } from "./ExplorerTab";
import { NetworkTab } from "./NetworkTab";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "History" },
  { id: "explorer", label: "Explorer" },
  { id: "network", label: "Network" },
  { id: "docs", label: "Docs" },
];

export function TabNavigation() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div>
      {/* Tab Bar */}
      <div className="border-b border-[#E5E5E5] mb-8">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            if (tab.id === "docs") {
              return (
                <a
                  key={tab.id}
                  href="/docs/index.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap text-[#6A6A6A] border-b-2 border-transparent hover:text-[#1A1A1A] hover:border-[#E5E5E5] flex items-center gap-2"
                >
                  {tab.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              );
            }
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[#14B8A6] border-b-2 border-[#14B8A6]"
                    : "text-[#6A6A6A] border-b-2 border-transparent hover:text-[#1A1A1A] hover:border-[#E5E5E5]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "explorer" && <ExplorerTab />}
        {activeTab === "network" && <NetworkTab />}
      </div>
    </div>
  );
}
