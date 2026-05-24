"use client";

import React, { useEffect, useRef } from "react";
import { Bell, Eye, Play, Radio, Sparkles, Users, Video } from "lucide-react";
import Image from "next/image";
import { Youtube } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { SplineRobot } from "@/components/ui/SplineRobot";
import { CursorSpotlight } from "@/components/ui/CursorSpotlight";
import { useYouTube } from "@/components/providers/YouTubeProvider";

interface StatsItem {
  subscribers: string;
  videos: string;
  views: string;
  title: string;
  customUrl: string;
  description: string;
  avatar: string;
  banner: string;
  channelUrl: string;
}

const fallbackStats: StatsItem = {
  subscribers: "--",
  videos: "--",
  views: "--",
  title: "Just For Fun",
  customUrl: "@JustForFun-BoYs",
  description:
    "Sri Lankan gaming crew dropping clutch moments, chaotic fails, and weekend community streams.",
  avatar: "",
  banner: "",
  channelUrl: "https://www.youtube.com/@JustForFun-BoYs",
};

export const Hero = () => {
  const yt = useYouTube();
  const loading = yt.loading;
  const source = yt.source;
  const stats: StatsItem = { ...fallbackStats, ...(yt.stats || {}) };
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let raf = 0;
    let nextPx = 0;
    let nextPy = 0;
    let pending = false;

    const apply = () => {
      pending = false;
      el.style.setProperty("--px", nextPx.toString());
      el.style.setProperty("--py", nextPy.toString());
    };

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      // Only track when pointer is over the hero section
      if (
        e.clientY < rect.top ||
        e.clientY > rect.bottom ||
        e.clientX < rect.left ||
        e.clientX > rect.right
      ) {
        return;
      }
      nextPx = (e.clientX - rect.left) / rect.width - 0.5;
      nextPy = (e.clientY - rect.top) / rect.height - 0.5;
      if (!pending) {
        pending = true;
        raf = requestAnimationFrame(apply);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const channelUrl = stats.channelUrl || fallbackStats.channelUrl;

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen overflow-hidden bg-[#060606] pt-24 text-white scanlines"
      style={{ ["--px" as string]: "0", ["--py" as string]: "0" }}
    >
      {/* Layered background */}
      <div className="absolute inset-0 bg-cyber-matrix opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(255,0,51,0.28),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(255,45,85,0.18),transparent_50%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#060606]" />
      <CursorSpotlight color="rgba(255, 0, 51, 0.22)" size={800} />

      {/* Animated grid lines */}
      <div className="absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-[#ff0033]/60 to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl grid-cols-1 items-center gap-10 px-5 pb-16 sm:px-6 lg:grid-cols-12">
        {/* LEFT: Copy block */}
        <div className="lg:col-span-7">
          <div className="mb-6 flex flex-wrap items-center gap-3 animate-fade-in-up">
            <span className={`chip ${source === "youtube" ? "chip-red" : ""}`}>
              <Radio size={11} className={loading ? "" : "animate-pulse"} />
              {loading ? "Syncing YouTube" : source === "youtube" ? "Live YouTube Data" : "API Setup Needed"}
            </span>
            <span className="chip">
              <Sparkles size={11} /> Official Channel
            </span>
          </div>

          <div className="mb-6 flex items-center gap-4 animate-fade-in-up [animation-delay:0.05s]">
            <div
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-[#ff0033] bg-[#131313] shadow-[0_0_36px_rgba(255,0,51,0.5)] transition-transform duration-300"
              style={{
                transform:
                  "perspective(800px) rotateX(calc(var(--py) * -16deg)) rotateY(calc(var(--px) * 16deg))",
              }}
            >
              {stats.avatar ? (
                <Image src={stats.avatar} alt={stats.title} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-2xl font-black">
                  JFF
                </div>
              )}
              <span className="absolute inset-0 border-neon rounded-2xl" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#ff2d55]">
                {stats.customUrl}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-500">
                Gaming · Variety · Sri Lanka
              </p>
            </div>
          </div>

          <h1 className="font-display text-4xl font-black uppercase leading-[0.9] tracking-tight text-white animate-fade-in-up [animation-delay:0.1s] sm:text-6xl lg:text-7xl">
            <span className="block">Just For</span>
            <span className="block text-gradient-animated text-glow-red">Fun</span>
          </h1>

          <p className="mt-6 max-w-xl text-base font-medium leading-7 text-neutral-300 animate-fade-in-up [animation-delay:0.15s] sm:text-lg">
            {stats.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up [animation-delay:0.2s]">
            <a
              href={`${channelUrl}?sub_confirmation=1`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" glow className="gap-2">
                <Bell size={18} /> Subscribe
              </Button>
            </a>
            <a href="#latest">
              <Button variant="secondary" size="lg" className="gap-2">
                <Play size={18} /> Latest Videos
              </Button>
            </a>
            <a href={channelUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2">
                <Youtube size={18} /> Channel
              </Button>
            </a>
          </div>

          {/* Stats strip */}
          <div className="mt-10 grid grid-cols-3 gap-3 animate-fade-in-up [animation-delay:0.25s]">
            {[
              { label: "Subscribers", value: stats.subscribers, icon: Users },
              { label: "Videos", value: stats.videos, icon: Video },
              { label: "Total Views", value: stats.views, icon: Eye },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#131313]/70 p-3 backdrop-blur-xl glass-hover sm:p-4"
                  style={{
                    transform: `perspective(900px) rotateX(calc(var(--py) * ${4 + idx * 2}deg)) rotateY(calc(var(--px) * ${-4 - idx * 2}deg))`,
                  }}
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#ff0033]/12 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff0033]/15 text-[#ff2d55] sm:mb-2 sm:h-9 sm:w-9">
                      <Icon size={14} className="sm:hidden" />
                      <Icon size={17} className="hidden sm:block" />
                    </div>
                    <div className="font-display text-lg font-black text-white sm:text-2xl">
                      {loading ? (
                        <span className="block h-6 w-12 animate-pulse rounded bg-white/10 sm:h-7 sm:w-16" />
                      ) : (
                        item.value
                      )}
                    </div>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-neutral-500 sm:text-[10px] sm:tracking-[0.22em]">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Spline 3D Robot */}
        <div className="relative lg:col-span-5">
          <div className="relative aspect-square w-full max-w-[360px] mx-auto sm:max-w-[460px] lg:max-w-[560px]">
            {/* Glow rings behind robot */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,0,51,0.35)_0%,transparent_55%)] animate-glow-pulse" />
            <div className="absolute inset-8 rounded-full border border-[#ff0033]/20 animate-spin-slow" />
            <div className="absolute inset-16 rounded-full border border-[#ff2d55]/15" />

            {/* Orbiting badges */}
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2">
              <span className="absolute h-3 w-3 rounded-full bg-[#ff0033] shadow-[0_0_18px_rgba(255,0,51,0.9)] animate-orbit" />
              <span
                className="absolute h-2 w-2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.8)] animate-orbit"
                style={{ animationDelay: "-7s", animationDuration: "18s" }}
              />
              <span
                className="absolute h-2.5 w-2.5 rounded-full bg-[#ff2d55] shadow-[0_0_16px_rgba(255,45,85,0.8)] animate-orbit"
                style={{ animationDelay: "-14s", animationDuration: "26s" }}
              />
            </div>

            <SplineRobot className="relative z-10" />
          </div>

          {/* HUD callouts */}
          <div className="absolute left-0 top-4 hidden flex-col gap-2 lg:flex">
            <span className="chip chip-red">SYS ONLINE</span>
            <span className="chip">AI · v4.7</span>
          </div>
          <div className="absolute bottom-6 right-4 hidden flex-col items-end gap-2 lg:flex">
            <span className="chip">3D · WebGL</span>
            <span className="chip chip-red">LIVE LINK</span>
          </div>
        </div>
      </div>

      {/* Marquee strip at bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-y border-white/10 bg-[#0a0a0a]/80 py-3 backdrop-blur">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-sm font-black uppercase tracking-[0.3em] text-neutral-500">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-12">
              <span>★ Valorant</span>
              <span className="text-[#ff0033]">●</span>
              <span>★ Valheim</span>
              <span className="text-[#ff0033]">●</span>
              <span>★ GTA V</span>
              <span className="text-[#ff0033]">●</span>
              <span>★ Battlefield</span>
              <span className="text-[#ff0033]">●</span>
              <span>★ Minecraft</span>
              <span className="text-[#ff0033]">●</span>
              <span>★ Co-op Survival</span>
              <span className="text-[#ff0033]">●</span>
              <span>★ Weekend Streams</span>
              <span className="text-[#ff0033]">●</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
