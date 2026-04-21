import type { Metadata } from "next";
import { Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import OrientationGuard from "@/components/orientation-guard";

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Rhythm Vault",
  description: "An immersive rhythm game fanmade level browser and music player",
  keywords: ["rhythm game", "fanmade", "arcar", "phigros", "pulsus", "music"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${syne.variable} ${spaceMono.variable} antialiased bg-black text-white`}
      >
        <OrientationGuard />
        {children}
      </body>
    </html>
  );
}
