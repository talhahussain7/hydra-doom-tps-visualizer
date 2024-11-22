import type { Metadata } from "next";
// import localFont from "next/font/local";
import { VT323 } from 'next/font/google'
import "./globals.css";

const vt323 = VT323({ weight: ['400'],style: ["normal"], subsets:["latin"]});

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "Hydra Doom TPS Visualizer",
  description: "Inspired by a twitter post, the aim is to showcase TPS of the Hydra Network during the Doom Tournament",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${vt323.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
