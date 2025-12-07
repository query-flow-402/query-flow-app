import { Metadata } from "next";
import { DashboardProviders } from "./providers";

export const metadata: Metadata = {
  title: "Dashboard | QueryFlow",
  description: "Monitor your AI agent queries and spending on QueryFlow",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProviders>
      <div className="min-h-screen bg-[#FAFAFA]">{children}</div>
    </DashboardProviders>
  );
}
