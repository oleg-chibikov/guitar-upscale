import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Guitar upscale",
  description: "Upscale your guitar skills",
  keywords:
    "guitar, chords, scale, string, fret, skills, music, instrument, simulator, emulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="manifest.json" />
        <meta name="google" content="notranslate" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

export const viewport: Viewport = {
  themeColor: "#262626",
  initialScale: 1,
  width: "device-width",
  maximumScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};
