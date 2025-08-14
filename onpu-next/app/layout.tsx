import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MidiProvider } from "@/components/providers/MidiProvider";
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
  title: "Onpu - 楽譜学習アプリ",
  description: "音符を見て瞬時に音名を答える練習ができる楽譜学習アプリ",
  keywords: ["楽譜", "音楽", "学習", "練習", "音符", "ピアノ", "MIDI"],
  authors: [{ name: "Onpu Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <MidiProvider>
            {children}
          </MidiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
