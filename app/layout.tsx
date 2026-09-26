import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { profile } from "@/data/portfolioData";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const title = `${profile.name} — ${profile.roles.join(" · ")}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description: profile.summary,
  openGraph: { type: "website", siteName: profile.name, title, description: profile.summary },
  twitter: { card: "summary_large_image", title, description: profile.summary, creator: "@thejinu22" },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF7",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
