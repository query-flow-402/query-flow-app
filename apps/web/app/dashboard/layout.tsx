import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | QueryFlow",
  description: "Monitor your AI agent queries and spending on QueryFlow",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#FAFAFA]">{children}</div>;
}
