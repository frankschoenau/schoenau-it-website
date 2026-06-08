import type { Metadata } from "next";
import "./globals.css";

import { GeistSans } from "geist/font/sans";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});



export const metadata: Metadata = {
  metadataBase: new URL("https://www.schoenau-it.de"),

  title:
    "Schönau IT | Digitalisierung, Automatisierung und KI-Beratung",
  alternates: {
  canonical: "https://www.schoenau-it.de",
  },
  description:
    "Schönau IT unterstützt Unternehmen bei Digitalisierung, Prozessautomatisierung, Systemintegration und dem sinnvollen Einsatz von KI.",
 
  icons: {
  icon: "/favicon.ico",
  },

  keywords: [
    "Digitalisierung",
    "Automatisierung",
    "KI Beratung",
    "Künstliche Intelligenz",
    "Prozessoptimierung",
    "Systemintegration",
    "IT Beratung",
    "Digitalisierung Mittelstand",
    "KI Unternehmen",
    "Schönau IT",
  ],

  openGraph: {
    title:
      "Schönau IT | Digitalisierung, Automatisierung und KI-Beratung",

    description:
      "Digitalisierung, Prozessautomatisierung, Systemintegration und praxisnahe KI-Lösungen für Unternehmen.",

    url: "https://www.schoenau-it.de",

    siteName: "Schönau IT",

    locale: "de_DE",

    type: "website",

    images: [
    {
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "Schönau IT",
    },
],
  },

  robots: {
    index: true,
    follow: true,
  },
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