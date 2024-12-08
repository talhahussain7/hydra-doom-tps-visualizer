import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";

const vt323 = VT323({ weight: ["400"], style: ["normal"], subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://hydra-twitter-visualizer.vercel.app'),
  title: "Hydra Doom TPS Visualizer",
  description: "Inspired by a twitter post, the aim is to showcase TPS of the Hydra Network during the Doom Tournament",
  keywords: "Hydra, Doom, Cardano, Visualizer, Blockchain Network, Peak TPS, Transactions Per Second",
  authors: [{ name: "Talha Hussain", url: "" }],
  openGraph: {
    title: "Hydra Doom TPS Visualizer",
    description: "Real-time visualization of Hydra Network's TPS during the Doom Tournament",
    siteName: "Hydra Doom TPS Visualizer",
    images: [
      {
        url: "/banner-image.png",
        width: 1200,
        height: 630,
        alt: "Hydra Doom TPS Visualizer Banner"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hydra Doom TPS Visualizer",
    description: "Real-time visualization of Hydra Network's TPS during the Doom Tournament",
    images: ["/banner-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  }
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${vt323.className} antialiased`}>{children}</body>
    </html>
  );
}
