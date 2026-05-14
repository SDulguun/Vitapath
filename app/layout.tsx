import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Body / UI font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Editorial display font for h1/h2 + score numerals
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitamin-chi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VitaPath · Vitamins that fit your day",
  description:
    "A short quiz, an explainable health score, and supplement picks backed by real studies. VitaPath flags interactions before they happen.",
  openGraph: {
    title: "VitaPath · Vitamins that fit your day",
    description:
      "Explainable health score. Cited supplement picks. Real studies.",
    type: "website",
    siteName: "VitaPath",
  },
  twitter: {
    card: "summary_large_image",
    title: "VitaPath · Vitamins that fit your day",
    description:
      "Explainable health score. Cited supplement picks. Real studies.",
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
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
