import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL("https://promptarcade-games.vercel.app"),
  title: {
    default: "Prompt Arcade",
    template: "%s | Prompt Arcade",
  },
  description:
    "Play AI-generated browser games built with prompts, Phaser, Matter.js, Three.js, and modern web technologies.",
  keywords: [
    "AI games",
    "browser games",
    "AI generated games",
    "prompt engineering",
    "Phaser games",
    "Three.js games",
    "indie browser games",
    "free arcade games",
    "open source games",
  ],
  openGraph: {
    title: "Prompt Arcade",
    description:
      "Play AI-generated browser games built with prompts, Phaser, Matter.js, Three.js, and modern web technologies.",
    type: "website",
    url: "https://promptarcade-games.vercel.app",
    siteName: "Prompt Arcade",
    images: [
      {
        url: "/assets/logo_full.png",
        width: 1200,
        height: 630,
        alt: "Prompt Arcade Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Arcade",
    description:
      "Play AI-generated browser games built with prompts, Phaser, Matter.js, Three.js, and modern web technologies.",
    images: ["/assets/logo_full.png"],
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
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-900 text-slate-50">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
