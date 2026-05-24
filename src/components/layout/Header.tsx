"use client";

import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Youtube } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/auth/UserMenu";
import { usePathname } from "next/navigation";



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
  const [authError, setAuthError] = useState<string | null>(null);
  
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const [activeYoutubeId, setActiveYoutubeId] = useState("h7MYJghRWt0");
  // First-visit autoplay: when localStorage has no flag, mount the iframe
  // with autoplay=1&mute=1 (browsers permit muted autoplay) so the track
  // begins immediately. On the user's first interaction we unmute it.
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showFirstVisitTooltips, setShowFirstVisitTooltips] = useState(false);
  const firstVisitDecidedRef = useRef(false);

  useEffect(() => {
    if (firstVisitDecidedRef.current) return;
    firstVisitDecidedRef.current = true;
    if (typeof window === "undefined") return;
    let firstVisit = false;
    try {
      firstVisit = !window.localStorage.getItem("jff:visited");
      if (firstVisit) window.localStorage.setItem("jff:visited", "1");
    } catch {
      // localStorage blocked (private mode, etc.) — treat as first visit
      // so we still try the autoplay; worst case the browser blocks it.
      firstVisit = true;
    }
    if (firstVisit) {
      // One-shot sync from localStorage (external state) into React state —
      // intentional and runs exactly once per browser, not a render cascade.
      /* eslint-disable react-hooks/set-state-in-effect */
      setIsFirstVisit(true);
      setShowFirstVisitTooltips(true);
      setAmbientPlaying(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, []);

  // Auto-hide the first-visit hint tooltips after 10s.
  useEffect(() => {
    if (!showFirstVisitTooltips) return;
    const t = setTimeout(() => setShowFirstVisitTooltips(false), 10_000);
    return () => clearTimeout(t);
  }, [showFirstVisitTooltips]);

  // First user interaction → unmute the iframe so they can actually hear it.
  useEffect(() => {
    if (!isFirstVisit) return;
    const onInteract = () => {
      const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "unMute", args: "" }),
          "*"
        );
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [35] }),
          "*"
        );
      }
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
    window.addEventListener("pointerdown", onInteract, { once: true });
    window.addEventListener("keydown", onInteract, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [isFirstVisit]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetch("/api/music/active")
        .then((r) => (r.ok ? r.json() : { youtubeId: "h7MYJghRWt0" }))
        .then((data) => {
          if (cancelled) return;
          if (data.youtubeId) {
            // Functional update so we only re-render (and swap the iframe src)
            // when the active track actually changed.
            setActiveYoutubeId((prev) => (prev === data.youtubeId ? prev : data.youtubeId));
          }
        })
        .catch(() => {
          if (!cancelled) setActiveYoutubeId((prev) => prev || "h7MYJghRWt0");
        });
    };
    refresh();
    // Poll every 60s so an admin-side activation propagates to listeners
    // without requiring a hard reload of the homepage.
    const interval = setInterval(refresh, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
  
  // Track explicit user login transitions to trigger autoplay.
  // Refs are used so we can compare across renders without scheduling extra renders.
  const prevUserRef = useRef<typeof user>(null);
  const hasSetBaselineRef = useRef(false);

  const openAuth = (mode: "login" | "signup", err: string | null = null) => {
    setAuthMode(mode);
    setAuthError(err);
    setAuthOpen(true);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorMsg =
      params.get("auth_error") ||
      params.get("error_description") ||
      hashParams.get("error_description");
    if (errorMsg) {
      // One-shot auth error surfaced from an OAuth callback redirect — opening
      // the modal here is intentional state sync from URL params, not a
      // cascading render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      openAuth("login", errorMsg);
      // Clean up the URL query params so they don't persist on reload
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

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
    if (loading) return;

    // First post-loading pass: capture baseline so an existing session doesn't auto-play on refresh.
    if (!hasSetBaselineRef.current) {
      prevUserRef.current = user;
      hasSetBaselineRef.current = true;
      return;
    }

    // Detect explicit guest -> logged-in transition
    if (user && !prevUserRef.current && !ambientPlaying) {
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
        // Sync local state to mirror the external (iframe) state we just updated.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAmbientPlaying(true);
      }
    }

    prevUserRef.current = user;
  }, [user, loading, ambientPlaying]);

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
          {!isAdminPage && (
            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-[#0c0c0c]/80 p-1 backdrop-blur lg:flex">
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
          )}
          {/* Right cluster */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle showHint={showFirstVisitTooltips} />
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
            className="rounded-full border border-white/10 bg-white/5 p-2 text-neutral-200 transition hover:bg-white/10 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-30 overflow-y-auto bg-[#060606]/97 px-6 pb-8 pt-24 backdrop-blur-2xl transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="grid gap-2 text-sm font-bold uppercase tracking-wide text-neutral-300">
          <div className="mb-3 flex justify-center">
            <ThemeToggle showHint={showFirstVisitTooltips} />
          </div>

          {!isAdminPage && navLinks.map((link) => {
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
        onClose={() => {
          setAuthOpen(false);
          setAuthError(null);
        }}
        initialMode={authMode}
        initialError={authError}
      />

      {/* Floating Ambient Music Controller (Music Disc style) */}
      <div className="fixed bottom-3 left-3 z-[100] group flex items-center scale-90 origin-bottom-left sm:scale-100 sm:bottom-4 sm:left-4">
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

        {/* Tooltip — hover, with a first-visit auto-show for the first 10s. */}
        <div
          className={`absolute bottom-full left-0 mb-4 px-3 py-1.5 bg-[#0c0c0c]/95 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-2xl pointer-events-none transition-all duration-300 whitespace-nowrap z-50 group-hover:opacity-100 group-hover:translate-y-0 ${
            showFirstVisitTooltips
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1"
          }`}
        >
          {showFirstVisitTooltips
            ? "🎵 Synthwave is playing — click to pause"
            : ambientPlaying
              ? "Pause Synthwave Theme"
              : "Play Synthwave Theme"}
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

      {/* Hidden YouTube Ambient Audio Player.
          For first-time visitors we boot the iframe muted with autoplay=1 so
          browsers permit it; the first user interaction (handled above) sends
          an unMute command. Returning visitors get the normal paused-on-load. */}
      <iframe
        id="youtube-ambient-player"
        src={`https://www.youtube.com/embed/${activeYoutubeId}?enablejsapi=1&autoplay=${isFirstVisit ? 1 : 0}&mute=${isFirstVisit ? 1 : 0}&controls=0&disablekb=1&fs=0&loop=1&playlist=${activeYoutubeId}&modestbranding=1&rel=0&iv_load_policy=3`}
        allow="autoplay"
        className="pointer-events-none absolute -left-[9999px] -top-[9999px] h-1 w-1 opacity-0"
        tabIndex={-1}
      />
    </>
  );
};
