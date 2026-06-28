"use client";

import { useState } from "react";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { SquadRoster } from "@/components/sections/SquadRoster";
import { LatestVideos } from "@/components/sections/LatestVideos";
import { Soundboard } from "@/components/sections/Soundboard";
import { ChallengeWheel } from "@/components/sections/ChallengeWheel";
import { Schedule } from "@/components/sections/Schedule";
import { Merch } from "@/components/sections/Merch";
import { Socials } from "@/components/sections/Socials";
import { Community } from "@/components/sections/Community";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  const [ready, setReady] = useState(false);

  return (
    <>
      <LoadingScreen onDone={() => setReady(true)} />
      {ready && (
        <>
          <Header />
          <main className="flex-grow overflow-x-hidden">
            <Hero />
            <About />
            <SquadRoster />
            <Schedule />
            <LatestVideos />
            <Soundboard />
            <ChallengeWheel />
            <Merch />
            <Socials />
            <Community />
            <Contact />
          </main>
          <Footer />
        </>
      )}
    </>
  );
}

