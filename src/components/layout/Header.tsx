"use client";

import React, { useEffect, useState } from "react";
import { Disc, Menu, Radio, X } from "lucide-react";
import { Youtube } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/auth/UserMenu";


const navLinks = [
  { name: "Home", href: "#hero" },
  { name: "About", href: "#about" },
  { name: "Squad", href: "#squad" },
  { name: "Videos", href: "#latest" },
  { name: "Arena", href: "#arena" },
  { name: "Wheel", href: "#wheel" },
  { name: "Schedule", href: "#schedule" },
  { name: "Shop", href: "#merch" },
  { name: "Socials", href: "#socials" },
  { name: "Contact", href: "#contact" },
];

export const Header = () => {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  // Track explicit user login transitions to trigger autoplay
  const [initialLoadingFinished, setInitialLoadingFinished] = useState(false);
  const [prevUser, setPrevUser] = useState<any>(null);
  const [hasSetBaseline, setHasSetBaseline] = useState(false);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);

      const sections = navLinks.map((l) => l.href.slice(1));
      let current = "hero";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140 && rect.bottom > 140) {
          current = id;
          break;
        }
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!loading) {
      setInitialLoadingFinished(true);
    }
  }, [loading]);

  useEffect(() => {
    if (!initialLoadingFinished) return;

    // On first load resolution, capture baseline user state (prevents playing on page refresh with session)
    if (!hasSetBaseline) {
      setPrevUser(user);
      setHasSetBaseline(true);
      return;
    }

    // Detect explicit guest -> logged-in transition
    if (user && !prevUser && !ambientPlaying) {
      const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [35] }),
          "*"
        );
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: "" }),
          "*"
        );
        setAmbientPlaying(true);
      }
    }

    setPrevUser(user);
  }, [user, prevUser, initialLoadingFinished, hasSetBaseline, ambientPlaying]);

  const toggleAmbient = () => {
    const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentWindow) return;

    if (ambientPlaying) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
        "*"
      );
      setAmbientPlaying(false);
    } else {
      // Set volume to 35% for a nice background level
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [35] }),
        "*"
      );
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: "" }),
        "*"
      );
      setAmbientPlaying(true);
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 py-2.5 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
            : "border-b border-transparent bg-[var(--color-bg)]/40 py-3.5 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
          {/* Logo */}
          <a href="#hero" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff0033] to-[#b30024] text-white shadow-[0_0_24px_rgba(255,0,51,0.45)] transition-transform group-hover:scale-110">
              <Youtube size={22} />
              <span className="absolute inset-0 rounded-xl border border-white/20" />
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-sm font-black uppercase tracking-wider text-white">
                Just For Fun
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#ff2d55]">
                Gaming Channel
              </span>
            </span>
          </a>

          {/* Pill nav */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-[#0c0c0c]/80 p-1 backdrop-blur xl:flex">
            {navLinks.map((link) => {
              const active = activeSection === link.href.slice(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                    active
                      ? "bg-[#ff0033] text-white shadow-[0_0_18px_rgba(255,0,51,0.5)]"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>
          {/* Right cluster */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {user ? (
              <UserMenu variant="desktop" />
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openAuth("login")}
                  className="rounded-full px-3 py-1.5 text-xs font-bold text-neutral-300 transition hover:bg-white/10 hover:text-white"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="rounded-full bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-3 py-1.5 text-xs font-black text-white shadow-[0_0_16px_rgba(255,0,51,0.4)] transition hover:shadow-[0_0_24px_rgba(255,0,51,0.6)]"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-neutral-200 transition hover:bg-white/10 xl:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-30 bg-[#060606]/97 px-6 pb-8 pt-24 backdrop-blur-2xl transition-transform duration-300 xl:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="grid gap-2 text-sm font-bold uppercase tracking-wide text-neutral-300">
          <div className="mb-3 flex justify-center">
            <ThemeToggle />
          </div>

          {navLinks.map((link) => {
            const active = activeSection === link.href.slice(1);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg border px-4 py-3 transition ${
                  active
                    ? "border-[#ff0033] bg-[#ff0033]/10 text-white"
                    : "border-white/10 bg-[#131313] hover:border-[#ff0033]/50"
                }`}
              >
                {link.name}
              </a>
            );
          })}

          <div className="mt-4 border-t border-white/10 pt-4">
            {user ? (
              <UserMenu
                variant="mobile"
                onAfterAction={() => setMobileMenuOpen(false)}
              />
            ) : (
              <div className="grid gap-2">
                <button
                  onClick={() => openAuth("login")}
                  className="rounded-full border border-white/10 px-4 py-3 text-sm font-bold text-neutral-200"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="rounded-full bg-[#ff0033] px-4 py-3 text-sm font-black text-white shadow-[0_0_18px_rgba(255,0,51,0.4)]"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />

      {/* Floating Ambient Music Controller (Music Disc style) */}
      <div className="fixed bottom-4 left-4 z-[100] group flex items-center">
        {/* Style Tag for Audio Visualizer Bars & Hover Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes musicWaveBounce {
            0%, 100% { height: 4px; }
            50% { height: 18px; }
          }
          .animate-wave-1 { animation: musicWaveBounce 1.2s ease-in-out infinite; }
          .animate-wave-2 { animation: musicWaveBounce 0.8s ease-in-out infinite; }
          .animate-wave-3 { animation: musicWaveBounce 1.0s ease-in-out infinite; }
        `}} />

        {/* Tooltip */}
        <div className="absolute bottom-full left-0 mb-4 px-3 py-1.5 bg-[#0c0c0c]/95 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap z-50">
          {ambientPlaying ? "Pause Synthwave Theme" : "Play Synthwave Theme"}
          {/* Tooltip Arrow (centered on w-14 button at left-6) */}
          <div className="absolute top-full left-6 border-4 border-transparent border-t-[#0c0c0c] filter drop-shadow-[0_1px_0_rgba(255,255,255,0.08)]"></div>
        </div>

        {/* The Disc Controller Button */}
        <button
          onClick={toggleAmbient}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#050505]/40 backdrop-blur-md transition-all duration-500 hover:scale-105 active:scale-95 focus:outline-none group/btn cursor-pointer"
          aria-label="Toggle ambient music"
        >
          {/* Neon outer breathing aura ring */}
          <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
            ambientPlaying 
              ? "bg-[#ff0033]/15 shadow-[0_0_30px_rgba(255,0,51,0.5)] ring-2 ring-[#ff0033]/30" 
              : "bg-transparent group-hover/btn:bg-white/5 ring-1 ring-white/10"
          }`} />

          {/* Vinyl Disc Base */}
          <div className={`relative w-[88%] h-[88%] rounded-full bg-[#0f0f0f] shadow-[inset_0_2px_8px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center transition-all duration-[3000ms] ${
            ambientPlaying ? "animate-[spin_4s_linear_infinite]" : ""
          }`}>
            {/* Realistic Vinyl Grooves - Conic Gradient & Specular Light Reflection */}
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#0a0a0a_0%,#1a1a1a_25%,#0a0a0a_50%,#1a1a1a_75%,#0a0a0a_100%)] opacity-95" />
            
            {/* Micro Concentric Grooves */}
            <div className="absolute w-[86%] h-[86%] rounded-full border border-neutral-900/60" />
            <div className="absolute w-[72%] h-[72%] rounded-full border border-neutral-800/30" />
            <div className="absolute w-[58%] h-[58%] rounded-full border border-neutral-900/80" />
            
            {/* Center Label (Sticker) */}
            <div className={`absolute w-[36%] h-[36%] rounded-full transition-all duration-700 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] ${
              ambientPlaying 
                ? "bg-gradient-to-tr from-[#ff0033] to-[#ff2d55]" 
                : "bg-neutral-800"
            }`}>
              {/* Central Spindle Hole / Brass Core */}
              <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-inner">
                <div className={`w-0.5 h-0.5 rounded-full ${ambientPlaying ? "bg-[#ff2d55]" : "bg-neutral-600"}`} />
              </div>
            </div>
          </div>

          {/* Interactive Stylus Tonearm (Pivots over the record when active) */}
          <div 
            className={`absolute top-0.5 right-0.5 w-6 h-10 z-20 pointer-events-none transition-all duration-700 ease-in-out origin-[82%_15%] ${
              ambientPlaying ? "rotate-[20deg]" : "rotate-0"
            }`}
          >
            {/* Pivot Joint Base (Silver metallic cap) */}
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-gradient-to-br from-neutral-500 via-neutral-300 to-neutral-600 border border-neutral-700 shadow-md flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-neutral-900" />
            </div>
            {/* Metallic Stylus Arm */}
            <div className="absolute top-2 right-1.5 w-0.5 h-6 bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-600 origin-top rotate-[-12deg] rounded-full shadow-sm" />
            {/* Headshell / Needle body */}
            <div className="absolute bottom-0 left-0 w-2.5 h-1.5 bg-[#1c1c1c] border-t border-neutral-600 rounded-sm shadow-sm origin-center rotate-[15deg]">
              {/* Laser active red glowing tip */}
              <div className={`absolute bottom-0 left-0.5 w-1 h-1 rounded-full transition-all duration-500 ${
                ambientPlaying ? "bg-[#ff2d55] shadow-[0_0_8px_#ff0033] scale-125" : "bg-neutral-600"
              }`} />
            </div>
          </div>

          {/* Live pulsing glowing beacon dot */}
          {ambientPlaying && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff0033] opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#ff2d55] border border-white/20"></span>
            </span>
          )}
        </button>

        {/* Mini Audio Visualizer Wave (Slides out from right of disc when playing) */}
        <div className={`flex items-end gap-0.5 h-5 ml-3 transition-all duration-500 ${
          ambientPlaying ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-3 scale-75 pointer-events-none"
        }`}>
          <span className="w-0.5 bg-[#ff0033] rounded-full animate-wave-1" style={{ animationDelay: "0.1s" }} />
          <span className="w-0.5 bg-[#ff2d55] rounded-full animate-wave-2" style={{ animationDelay: "0.3s" }} />
          <span className="w-0.5 bg-[#ff0033] rounded-full animate-wave-3" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>

      {/* Hidden YouTube Ambient Audio Player */}
      <iframe
        id="youtube-ambient-player"
        src="https://www.youtube.com/embed/h7MYJghRWt0?enablejsapi=1&autoplay=0&controls=0&disablekb=1&fs=0&loop=1&playlist=h7MYJghRWt0&modestbranding=1&rel=0&iv_load_policy=3"
        allow="autoplay"
        className="pointer-events-none absolute -left-[9999px] -top-[9999px] h-1 w-1 opacity-0"
        tabIndex={-1}
      />
    </>
  );
};
