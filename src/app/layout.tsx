import type { Metadata } from "next";
import { Orbitron, Inter, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const themeInitScript = `(function(){try{var s=localStorage.getItem('jff-theme')||'system';var r=s==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):s;var h=document.documentElement;h.classList.add(r);h.style.colorScheme=r;}catch(e){document.documentElement.classList.add('dark');}})();`;

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
      suppressHydrationWarning
      className={`${orbitron.variable} ${inter.variable} ${spaceGrotesk.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-text)] font-sans flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CustomCursor />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
