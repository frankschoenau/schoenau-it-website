import type { Metadata } from "next";
import "./globals.css";

import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Schönau IT",
  description:
    "IT-Beratung und AI-gestützte Prozessoptimierung",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`
        ${GeistSans.variable}
        ${inter.variable}
      `}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}