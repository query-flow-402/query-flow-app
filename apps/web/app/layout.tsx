import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QueryFlow | Pay-Per-Query Data Insights for AI Agents",
  description:
    "No subscriptions. No accounts. AI agents pay for data in real-time using blockchain settlements in under 2 seconds. Built on Avalanche with x402 protocol.",
  keywords: [
    "AI agents",
    "pay-per-query",
    "x402",
    "Avalanche",
    "blockchain",
    "data insights",
    "crypto API",
  ],
  openGraph: {
    title: "QueryFlow | Pay-Per-Query Data Insights for AI Agents",
    description:
      "AI agents pay for data in real-time using blockchain settlements. No subscriptions, no accounts.",
    type: "website",
    siteName: "QueryFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "QueryFlow | Pay-Per-Query Data Insights for AI Agents",
    description:
      "AI agents pay for data in real-time using blockchain settlements. No subscriptions, no accounts.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
