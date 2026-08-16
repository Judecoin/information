import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Judecoin Blockchain Explorer",
  description: "Explore live Judecoin blocks, transactions, Service Nodes, staking, and quorum activity.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=37", sizes: "any" },
      { url: "/judecoin-logo-minimal-ring-transparent.png?v=37", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=37",
    apple: "/apple-touch-icon.png?v=37",
  },
  openGraph: {
    title: "Judecoin Blockchain Explorer",
    description: "See the chain. Not the people.",
    images: [{ url: "/og-judecoin-explorer.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Judecoin Blockchain Explorer",
    description: "See the chain. Not the people.",
    images: ["/og-judecoin-explorer.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
