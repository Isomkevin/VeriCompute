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
  title: "VeriCompute — Verifiable Compute on Stellar",
  description:
    "Pay for AI inference only when cryptographic proof confirms the exact program ran on your input. RISC Zero zkVM proofs, Soroban on-chain verification, conditional escrow settlement.",
  openGraph: {
    title: "VeriCompute — Verifiable Compute on Stellar",
    description:
      "Cryptographic receipts from RISC Zero. On-chain verification on Soroban. Escrow that releases payment only when the proof checks out.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
