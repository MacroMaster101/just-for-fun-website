"use client";

import React, { useState, useEffect } from "react";
import { Discord } from "@/components/ui/Icons";
import { CrewWall } from "./CrewWall";
import { PageRating } from "./PageRating";
import { Users, Star } from "lucide-react";

const DISCORD_SERVER_ID = "948867249849114664";
const DISCORD_INVITE_URL = "https://discord.gg/jzcNVPGx3h";

type TabId = "discord" | "roster" | "ratings";

export const Community = () => {
  const [activeTab, setActiveTab] = useState<TabId>("discord");
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#crew-wall" || hash === "#roster") {
        setActiveTab("roster");
      } else if (hash === "#ratings" || hash === "#hq-ratings") {
        setActiveTab("ratings");
      } else if (hash === "#discord") {
        setActiveTab("discord");
      }
    };

    // Load initial tab from sessionStorage or URL hash
    try {
      const hash = window.location.hash;
      if (hash === "#crew-wall" || hash === "#roster") {
        setActiveTab("roster");
      } else if (hash === "#ratings" || hash === "#hq-ratings") {
        setActiveTab("ratings");
      } else {
        const saved = window.sessionStorage.getItem("jff:community-tab");
        if (saved === "discord" || saved === "roster" || saved === "ratings") {
          setActiveTab(saved);
        }
      }
    } catch {
      // ignore
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Monitor active text inputs globally to lock auto-rotation during user typing sessions
  useEffect(() => {
    const checkFocus = () => {
      if (typeof document === "undefined") return;
      const activeEl = document.activeElement;
      const active = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";
      setIsTyping(active);
    };

    window.addEventListener("focusin", checkFocus);
    window.addEventListener("focusout", checkFocus);
    return () => {
      window.removeEventListener("focusin", checkFocus);
      window.removeEventListener("focusout", checkFocus);
    };
  }, []);

  // Smart Auto-Rotation loop that resets smoothly on manual tab swaps or typing blurs
  useEffect(() => {
    if (isTyping) {
      setProgress(0);
      return;
    }

    const intervalTime = 8000; // 8 seconds per tab
    const stepTime = 100; // update progress every 100ms
    const totalSteps = intervalTime / stepTime;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const currentProgress = Math.min((stepCount / totalSteps) * 100, 100);
      setProgress(currentProgress);

      if (stepCount >= totalSteps) {
        stepCount = 0;
        setActiveTab((prev) => {
          if (prev === "discord") return "roster";
          if (prev === "roster") return "ratings";
          return "discord";
        });
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isTyping, activeTab]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    try {
      window.sessionStorage.setItem("jff:community-tab", tab);
    } catch {
      // ignore
    }
  };

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    {
      id: "discord",
      label: "Discord HQ",
      icon: <Discord size={14} />,
    },
    {
      id: "roster",
      label: "Crew Roster",
      icon: <Users size={14} />,
    },
    {
      id: "ratings",
      label: "HQ Ratings",
      icon: <Star size={14} />,
    },
  ];

  return (
    <section
      id="community"
      className="relative overflow-hidden bg-[#060606] py-20 sm:py-24"
    >
      {/* Top neon divider line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />
      
      {/* Subtle scanline grid backdrop for the entire community hub */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,0,51,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,51,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-[#ff0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.6)]">
              <Users size={32} />
            </span>{" "}
            Community Hub
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm tracking-wider uppercase font-semibold">
            Enlist in the squad, join live Discord voice lobbies, and rate the headquarters!
          </p>
          <div className="w-16 h-[2px] bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] mx-auto rounded-full mt-4" />
        </div>

        {/* Tab Selection Switcher */}
        <div className="flex flex-col items-center mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-[#0c0c0c]/80 p-1.5 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    active
                      ? "bg-[#ff0033] text-white shadow-[0_0_15px_rgba(255,0,51,0.45)] scale-105"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Futuristic Cyber Charging Progress Bar */}
          <div className="w-48 h-[2px] bg-white/5 rounded-full mt-4 overflow-hidden border border-white/5 shadow-[0_0_10px_rgba(0,0,0,0.5)] relative">
            <div
              className={`h-full bg-[#ff0033] shadow-[0_0_8px_rgba(255,0,51,0.85)] transition-all ease-linear ${
                isTyping ? "opacity-40 animate-pulse bg-neutral-500 shadow-none" : ""
              }`}
              style={{
                width: isTyping ? "100%" : `${progress}%`,
                transitionDuration: isTyping ? "500ms" : "100ms",
              }}
            />
            {isTyping && (
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black uppercase tracking-widest text-neutral-400 scale-[0.9] select-none">
                TYPING...
              </span>
            )}
          </div>
        </div>

        {/* Tab Contents View */}
        <div className="transition-all duration-500 min-h-[300px]">
          
          {/* TAB 1: DISCORD WIDGET */}
          {activeTab === "discord" && (
            <div className="grid items-center justify-center gap-8 lg:grid-cols-[1fr_auto] animate-fade-in-up">
              <div className="relative mx-auto w-full max-w-[350px]">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#5865F2]/40 via-[#ff0033]/20 to-[#5865F2]/40 blur-xl opacity-60" />
                <div className="relative rounded-2xl border border-white/10 bg-[#181818]/70 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_rgba(88,101,242,0.25)]">
                  <iframe
                    src={`https://discord.com/widget?id=${DISCORD_SERVER_ID}&theme=dark`}
                    width="350"
                    height="500"
                    sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                    title="Just For Fun Discord Server"
                    className="block h-[460px] w-full max-w-full border-0 sm:h-[500px]"
                  />
                </div>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#5865F2] px-5 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(88,101,242,0.35)] transition hover:scale-[1.02] lg:hidden"
                >
                  <Discord size={18} /> Join the Server
                </a>
              </div>

              {/* Side blurb + CTA (desktop only) */}
              <div className="hidden lg:flex flex-col gap-4 max-w-xs animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                <h3 className="font-display font-extrabold text-white text-2xl uppercase tracking-wide flex items-center gap-2">
                  <Discord className="text-[#5865F2]" size={24} /> Real-Time Chat
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Voice channels, weekly squad nights, custom game lobbies, and a feed of every new upload. The widget shows live who&apos;s online right now.
                </p>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5865F2] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(88,101,242,0.5)] transition hover:scale-105 hover:shadow-[0_0_36px_rgba(88,101,242,0.75)]"
                >
                  <Discord size={18} /> Join the Server
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: CREW WALL */}
          {activeTab === "roster" && (
            <div className="animate-fade-in-up">
              <CrewWall />
            </div>
          )}

          {/* TAB 3: HQ RATINGS */}
          {activeTab === "ratings" && (
            <div className="animate-fade-in-up">
              <PageRating />
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
