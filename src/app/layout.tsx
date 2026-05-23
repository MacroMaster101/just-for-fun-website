import type { Metadata } from "next";
import { Orbitron, Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CustomCursor } from "@/components/ui/CustomCursor";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Just For Fun BoYs | YouTube Gaming Channel",
  description:
    "Official Just For Fun BoYs channel site for YouTube videos, gaming highlights, live stream schedule, and community updates.",
  keywords: ["gaming", "gameplay", "just for fun", "justforfun", "justforfun-boys", "valorant sri lanka", "gaming channel", "valheim", "funny gaming moments", "esports website"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${inter.variable} ${spaceGrotesk.variable} h-full dark`}
    >
      <body className="min-h-full bg-[#060606] text-neutral-100 font-sans flex flex-col antialiased">
        <AuthProvider>
          <CustomCursor />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
