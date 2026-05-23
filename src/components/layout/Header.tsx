"use client";

import React, { useEffect, useState } from "react";
import { LogOut, Menu, Radio, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { Youtube } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type AmbientNodeGroup = {
  osc: OscillatorNode;
  lfo: OscillatorNode;
};

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
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [nodes, setNodes] = useState<AmbientNodeGroup[]>([]);

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
    return () => {
      if (!audioCtx || audioCtx.state === "closed") return;
      nodes.forEach((g) => {
        try { g.osc.stop(); } catch {}
        try { g.lfo.stop(); } catch {}
      });
      void audioCtx.close().catch(() => {});
    };
  }, [audioCtx, nodes]);

  const startAmbient = () => {
    const AC =
      window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const filter = ctx.createBiquadFilter();
    const masterGain = ctx.createGain();
    filter.type = "lowpass";
    filter.frequency.value = 340;
    filter.Q.value = 1;
    masterGain.gain.setValueAtTime(0.035, ctx.currentTime);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    const groups = [65.41, 98, 130.81].map((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      osc.type = i % 2 === 0 ? "sawtooth" : "triangle";
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 8;
      oscGain.gain.value = 0.28;
      lfo.type = "sine";
      lfo.frequency.value = 0.1 + i * 0.05;
      lfoGain.gain.value = 0.1;
      osc.connect(oscGain);
      oscGain.connect(filter);
      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      osc.start();
      lfo.start();
      return { osc, lfo };
    });

    setAudioCtx(ctx);
    setNodes(groups);
    setAmbientPlaying(true);
  };

  const stopAmbient = () => {
    if (!audioCtx) return;
    nodes.forEach((g) => {
      try { g.osc.stop(); } catch {}
      try { g.lfo.stop(); } catch {}
    });
    if (audioCtx.state !== "closed") {
      void audioCtx.close().catch(() => {});
    }
    setAudioCtx(null);
    setNodes([]);
    setAmbientPlaying(false);
  };

  const toggleAmbient = () => (ambientPlaying ? stopAmbient() : startAmbient());

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const visibleNav = user ? [{ name: "Profile", href: "#profile" }, ...navLinks] : navLinks;

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
                BoYs Channel
              </span>
            </span>
          </a>

          {/* Pill nav */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-[#0c0c0c]/80 p-1 backdrop-blur xl:flex">
            {visibleNav.map((link) => {
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
            <button
              onClick={toggleAmbient}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                ambientPlaying
                  ? "border-[#ff0033]/60 bg-[#ff0033]/15 text-[#ff2d55] shadow-[0_0_18px_rgba(255,0,51,0.3)]"
                  : "border-white/10 bg-white/5 text-neutral-400 hover:text-white"
              }`}
            >
              <Radio size={14} className={ambientPlaying ? "animate-pulse" : ""} />
              {ambientPlaying ? "FX On" : "FX Off"}
            </button>

            {user ? (
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff0033]/20 text-sm font-black text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate text-xs font-bold text-white">
                  {user.user_metadata?.name || user.email?.split("@")[0]}
                </span>
                <button onClick={signOut} className="text-neutral-500 transition hover:text-[#ff2d55]">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth("login")}
                  className="rounded-full px-4 py-2 text-sm font-bold text-neutral-300 transition hover:bg-white/10 hover:text-white"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="rounded-full bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-4 py-2 text-sm font-black text-white shadow-[0_0_18px_rgba(255,0,51,0.4)] transition hover:shadow-[0_0_28px_rgba(255,0,51,0.6)]"
                >
                  Join Crew
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
          <button
            onClick={toggleAmbient}
            className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-white"
          >
            <Radio size={16} className={ambientPlaying ? "animate-pulse text-[#ff0033]" : ""} />
            {ambientPlaying ? "Stream FX On" : "Stream FX Off"}
          </button>
          {visibleNav.map((link) => {
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
        </nav>

        <div className="mt-8 border-t border-white/10 pt-6">
          {user ? (
            <button
              onClick={() => {
                signOut();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#ff0033]/40 px-4 py-3 text-sm font-black text-[#ff2d55] transition hover:bg-[#ff0033]/10"
            >
              <LogOut size={16} /> Sign Out
            </button>
          ) : (
            <div className="grid gap-3">
              <button
                onClick={() => openAuth("login")}
                className="rounded-full border border-white/10 px-4 py-3 text-sm font-bold text-neutral-200"
              >
                Login
              </button>
              <button
                onClick={() => openAuth("signup")}
                className="rounded-full bg-[#ff0033] px-4 py-3 text-sm font-black text-white shadow-[0_0_18px_rgba(255,0,51,0.4)]"
              >
                Join the Crew
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};
