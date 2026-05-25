import type { Metadata } from "next";
import { Orbitron, Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { YouTubeProvider } from "@/components/providers/YouTubeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AmbientPlayer } from "@/components/layout/AmbientPlayer";
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
  title: "Just For Fun | YouTube Gaming Channel",
  description:
    "Official Just For Fun channel hub for YouTube videos, gaming highlights, live stream schedule, and community updates.",
  keywords: [
    "gaming",
    "gameplay",
    "just for fun",
    "justforfun",
    "valorant sri lanka",
    "gaming channel",
    "valheim",
    "funny gaming moments",
    "esports website",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${orbitron.variable} ${inter.variable} ${spaceGrotesk.variable} h-full`}
    >
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)] font-sans flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>
            <YouTubeProvider>
              <CustomCursor />
              {children}
              <AmbientPlayer />
            </YouTubeProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
