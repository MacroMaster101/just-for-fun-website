import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "600", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JUST FOR FUN | Gaming Channel",
  description: "Welcome to JUST FOR FUN - Your ultimate gaming destination! Watch gameplay, walkthroughs, reviews, and live streams.",
  keywords: ["gaming", "gameplay", "game reviews", "live streaming", "JUST FOR FUN", "gaming channel", "video games"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full dark`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 font-sans flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
