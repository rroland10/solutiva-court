import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ThemeInit } from "@/components/ThemeInit";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://solutivacourt.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Solutiva Court - Next Generation Justice",
    template: "%s | Solutiva Court",
  },
  description:
    "Hybrid dispute resolution on Base L2 — AVF ERC-223 escrow on-chain, jury voting and AI off-chain.",
  keywords: [
    "dispute resolution",
    "decentralized justice",
    "legal tech",
    "jury pool",
    "base l2",
    "erc223",
    "blockchain",
  ],
  authors: [{ name: "Solutiva Court Team" }],
  creator: "Solutiva Court",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Solutiva Court",
    title: "Solutiva Court - Next Generation Justice",
    description:
      "Decentralized dispute resolution platform powered by blockchain technology",
    images: [{ url: "/images/logo.svg", width: 512, height: 512, alt: "Solutiva Court Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solutiva Court - Next Generation Justice",
    description:
      "Decentralized dispute resolution platform powered by blockchain technology",
    images: ["/images/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#312e81",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">
        <ThemeInit />
        <div className="court-columns" aria-hidden="true" />
        <div className="court-motif" aria-hidden="true" />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
