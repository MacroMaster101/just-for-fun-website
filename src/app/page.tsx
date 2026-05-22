"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { LatestVideos } from "@/components/sections/LatestVideos";
import { Schedule } from "@/components/sections/Schedule";
import { Merch } from "@/components/sections/Merch";
import { Socials } from "@/components/sections/Socials";
import { Profile } from "@/components/sections/Profile";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <LoadingScreen />
      <Header />
      <main className="flex-grow">
        <Hero />
        <About />
        {user && <Profile />}
        <LatestVideos />
        <Schedule />
        <Merch />
        <Socials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
