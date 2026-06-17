import type { Metadata, Viewport } from "next";
import { Geist, Fredoka } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Rounded, chunky game font with clean numerals (replaces the pixel font,
// whose digits — especially 5 — read badly).
const gameFont = Fredoka({
  variable: "--font-pixel-src",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Le Chaton Fat — Frontier Feline Intelligence",
  description:
    "Feed the cat. Inflate the benchmarks. Become AGI. Somewhere in the millions though.",
  openGraph: {
    title: "Le Chaton Fat",
    description: "Feed the cat. Inflate the benchmarks. Become AGI.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3d9c9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${gameFont.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
