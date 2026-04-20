import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHROME DNA — 3D Energy Futures Terminal",
  description: "Advanced 3D visualization terminal for Energy Futures markets. DNA-spiral market analysis with AI-powered signals, EIA data, and real-time order flow.",
  keywords: ["futures", "energy", "3D", "visualization", "trading", "oil", "natural gas", "market analysis"],
  authors: [{ name: "CHROME DNA" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050510] text-foreground overflow-hidden`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
