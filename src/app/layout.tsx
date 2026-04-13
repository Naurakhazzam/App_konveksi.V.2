import type { Metadata } from "next";
import { Manrope, DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-manrope",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Stitchlyx.Syncore V2",
  description: "Garment Operating System",
};

import { ToastProvider } from "@/components/molecules/Toast";
import SettingsInjector from "@/components/organisms/SettingsInjector";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${dmSans.variable} ${geistMono.variable}`}>
      <body>
        <ToastProvider>
          <SettingsInjector />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
