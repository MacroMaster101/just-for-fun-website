"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Eye, Play, Radio, Sparkles, Users, Video } from "lucide-react";
import Image from "next/image";
import { Youtube } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { SplineRobot } from "@/components/ui/SplineRobot";
import { CursorSpotlight } from "@/components/ui/CursorSpotlight";
import { FloatingGameLogos } from "@/components/ui/FloatingGameLogos";
import { useYouTube } from "@/components/providers/YouTubeProvider";
import { DEFAULT_MARQUEE } from "@/lib/heroDefaults";

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
  // Robot Spline scene URL — read from /api/settings so admins can swap
  // the model without a redeploy. Undefined falls back to the SplineRobot
  // component's own default so the site never breaks on a fresh DB.
  const [splineScene, setSplineScene] = useState<string | undefined>(undefined);
  const [games, setGames] = useState<Array<{ id: string; name: string; logoUrl: string }>>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { settings: {} }))
      .then((data: { settings?: Record<string, string> }) => {
        if (cancelled) return;
        const sceneUrl = data.settings?.["hero.splineScene"];
        if (typeof sceneUrl === "string" && sceneUrl) setSplineScene(sceneUrl);
      })
      .catch(() => {
        // ignore — SplineRobot has its own built-in default
      });
    fetch("/api/games")
      .then((r) => (r.ok ? r.json() : { games: [] }))
      .then((d: { games?: Array<{ id: string; name: string; logoUrl: string }> }) => {
        if (!cancelled) setGames(d.games || []);
      })
      .catch(() => {
        // Silent — DEFAULT_MARQUEE fallback handles the empty case.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !window.matchMedia("(pointer: fine)").matches)
    ) {
      // Skip the parallax effect on touch devices and reduced-motion users.
      return;
    }

    let raf = 0;
    let nextPx = 0;
    let nextPy = 0;
    let pending = false;

    // Cache the bounding rect — recomputing it on every mousemove forces a
    // synchronous layout. We refresh the cache only on scroll/resize, when
    // it can actually change. ResizeObserver also catches font-load shifts.
    let rect = el.getBoundingClientRect();
    const refreshRect = () => {
      rect = el.getBoundingClientRect();
    };
    window.addEventListener("scroll", refreshRect, { passive: true });
    window.addEventListener("resize", refreshRect);
    const ro = new ResizeObserver(refreshRect);
    ro.observe(el);

    const apply = () => {
      pending = false;
      el.style.setProperty("--px", nextPx.toString());
      el.style.setProperty("--py", nextPy.toString());
    };

    const onMove = (e: MouseEvent) => {
      // Use cached rect — no layout read per event.
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
      window.removeEventListener("scroll", refreshRect);
      window.removeEventListener("resize", refreshRect);
      ro.disconnect();
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

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl grid-cols-1 items-center gap-8 px-5 pb-16 sm:gap-10 sm:px-6 lg:grid-cols-12">
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
                  J4FN
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

          {/* Mobile Spline Robot Sandwich */}
          {isMobile && (
            <div className="lg:hidden relative mx-auto aspect-square w-full max-w-[280px] my-6 animate-fade-in">
              {/* Glow rings behind robot */}
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,0,51,0.35)_0%,transparent_55%)] animate-glow-pulse" />
              <div className="absolute inset-8 rounded-full border border-[#ff0033]/20 animate-spin-slow" />
              <div className="absolute inset-16 rounded-full border border-[#ff2d55]/15" />

              {/* Orbiting badges */}
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2">
                <span className="absolute h-3 w-3 rounded-full bg-[#ff0033] shadow-[0_0_18px_rgba(255,0,51,0.9)] animate-mobile-orbit" />
                <span
                  className="absolute h-2 w-2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.8)] animate-mobile-orbit"
                  style={{ animationDelay: "-7s", animationDuration: "18s" }}
                />
                <span
                  className="absolute h-2.5 w-2.5 rounded-full bg-[#ff2d55] shadow-[0_0_16px_rgba(255,45,85,0.8)] animate-mobile-orbit"
                  style={{ animationDelay: "-14s", animationDuration: "26s" }}
                />
              </div>

              {/* Floating game logos — drifting behind/around the robot */}
              <FloatingGameLogos games={games} />

              <SplineRobot scene={splineScene} className="relative z-10" />
            </div>
          )}

          <p className="mt-6 max-w-xl text-base font-medium leading-7 text-neutral-300 animate-fade-in-up [animation-delay:0.15s] sm:text-lg">
            {stats.description}
          </p>

          {/* Custom styles for Hero interactions */}
          <style>{`
            @keyframes bellShake {
              0%, 100% { transform: rotate(0deg); }
              15% { transform: rotate(12deg); }
              30% { transform: rotate(-10deg); }
              45% { transform: rotate(8deg); }
              60% { transform: rotate(-6deg); }
              75% { transform: rotate(4deg); }
              90% { transform: rotate(-2deg); }
            }
            .group:hover .animate-bell-shake {
              animation: bellShake 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
            }
            @keyframes mobileOrbit {
              0% { transform: rotate(0deg) translateX(76px) rotate(0deg); }
              100% { transform: rotate(360deg) translateX(76px) rotate(-360deg); }
            }
            .animate-mobile-orbit {
              animation: mobileOrbit 12s linear infinite;
            }
          `}</style>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 animate-fade-in-up [animation-delay:0.2s]">
            <a
              href={`${channelUrl}?sub_confirmation=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                glow
                className="w-full justify-center gap-2.5 bg-gradient-to-r from-[#ff0033] to-[#ff2d55] border border-white/20 text-white shadow-[0_0_24px_rgba(255,0,51,0.45)] transition-all duration-300 font-black uppercase tracking-[0.16em]"
              >
                <Bell size={16} className="animate-bell-shake transition-transform" />
                Subscribe
              </Button>
            </a>

            <a href="#latest" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full justify-center gap-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-neutral-100 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] backdrop-blur-md font-bold uppercase tracking-wider"
              >
                <Play size={16} className="transition-transform group-hover:scale-110" />
                Latest Videos
              </Button>
            </a>

            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-center gap-2.5 border border-white/10 hover:border-[#ff0000]/50 hover:bg-[#ff0000]/10 text-white hover:shadow-[0_0_20px_rgba(255,0,0,0.2)] backdrop-blur-sm transition-all duration-300 font-bold uppercase tracking-wider"
              >
                <Youtube size={16} className="transition-transform group-hover:scale-110" />
                Channel
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
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#131313]/70 p-2.5 sm:p-4 backdrop-blur-xl glass-hover"
                  style={{
                    transform: `perspective(900px) rotateX(calc(var(--py) * ${4 + idx * 2}deg)) rotateY(calc(var(--px) * ${-4 - idx * 2}deg))`,
                  }}
                >
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#ff0033]/12 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-1 flex h-6 w-6 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[#ff0033]/15 text-[#ff2d55] sm:mb-2">
                      <Icon size={12} className="sm:hidden" />
                      <Icon size={17} className="hidden sm:block" />
                    </div>
                    <div className="font-display text-sm font-black text-white sm:text-2xl">
                      {loading ? (
                        <span className="block h-5 w-10 animate-pulse rounded bg-white/10 sm:h-7 sm:w-16" />
                      ) : (
                        item.value
                      )}
                    </div>
                    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.14em] text-neutral-500 sm:text-[10px] sm:tracking-[0.22em]">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Spline 3D Robot */}
        {!isMobile && (
          <div className="relative hidden lg:block lg:col-span-5">
            <div className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[460px] lg:max-w-[560px]">
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

              {/* Floating game logos — drifting behind the robot */}
              <FloatingGameLogos games={games} className="hidden sm:block" />

              <SplineRobot scene={splineScene} className="relative z-10" />
            </div>

            {/* Scroll Down mouse wheel indicator centered under the robot */}
            <div
              onClick={() => {
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="absolute -bottom-20 left-1/2 z-20 hidden -translate-x-1/2 cursor-pointer select-none flex-col items-center gap-2 transition-all duration-300 hover:scale-105 sm:flex"
            >
              <style>{`
                @keyframes scrollDotMove {
                  0% { transform: translateY(0); opacity: 1; }
                  50% { transform: translateY(6px); opacity: 0.3; }
                  100% { transform: translateY(0); opacity: 1; }
                }
                .animate-scroll-dot-move {
                  animation: scrollDotMove 1.6s ease-in-out infinite;
                }
              `}</style>
              <div className="w-5 h-8 border border-neutral-400 rounded-full flex justify-center p-1.5 group-hover:border-[#ff0033] group-hover:shadow-[0_0_10px_rgba(255,0,51,0.25)] transition-all duration-300">
                <div className="w-1 h-2 bg-[#ff0033] rounded-full animate-scroll-dot-move shadow-[0_0_8px_rgba(255,0,51,0.8)]" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-neutral-400 group-hover:text-glow-red group-hover:text-white transition-all duration-300 whitespace-nowrap">
                Scroll to Deploy
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Marquee strip at bottom. Two render modes:
            - games (DB)  → logo + name cards, admin-managed
            - fallback    → text-only ★ Name chips from DEFAULT_MARQUEE
          Both duplicate the list twice for a seamless scroll loop. */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-y border-white/10 bg-[#0a0a0a]/80 py-3 backdrop-blur">
        {games.length > 0 ? (
          <div className="flex w-max animate-marquee gap-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex shrink-0 items-center gap-8">
                {games.map((g) => (
                  <div
                    key={`${i}-${g.id}`}
                    className="flex shrink-0 items-center gap-2.5"
                  >
                    <span className="text-[#ff0033]">★</span>
                    <span className="font-display text-sm font-black uppercase tracking-[0.28em] text-neutral-400 whitespace-nowrap">
                      {g.name}
                    </span>
                  </div>
                ))}
                {/* Trailing separator between the duplicated halves so the
                    loop reads "...A B C A B C..." not "...C A...". */}
                <span className="text-[#ff0033] shrink-0">●</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-display text-sm font-black uppercase tracking-[0.3em] text-neutral-500">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex shrink-0 items-center gap-12">
                {DEFAULT_MARQUEE.map((label, idx, arr) => (
                  <React.Fragment key={`${i}-${idx}`}>
                    <span>★ {label}</span>
                    {idx < arr.length - 1 && <span className="text-[#ff0033]">●</span>}
                  </React.Fragment>
                ))}
                <span className="text-[#ff0033]">●</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
