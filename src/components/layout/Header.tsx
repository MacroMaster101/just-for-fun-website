"use client";

import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Youtube } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/auth/NotificationBell";
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
  { name: "Community", href: "#community" },
  { name: "Contact", href: "#contact" },
];

export const Header = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  // Surface the theme toggle's tooltip for ~10s on first visit. The
  // localStorage flag itself is owned by AmbientPlayer (set on its mount);
  // we just read it here to decide whether to nudge the user about the
  // theme picker too.
  const [showThemeHint, setShowThemeHint] = useState(false);

  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // If AmbientPlayer hasn't set the flag yet, this is a first visit and
    // we should show the hint. Run on next tick so AmbientPlayer's own
    // mount effect has a chance to run first when both share the same page.
    const t = setTimeout(() => {
      try {
        // After AmbientPlayer runs, the flag is set — so we look at the
        // sessionStorage marker AmbientPlayer also writes, see below.
        const isFresh = window.sessionStorage.getItem("jff:fresh-session") === "1";
        if (isFresh) {
          setShowThemeHint(true);
          window.setTimeout(() => setShowThemeHint(false), 10_000);
        }
      } catch {
        // sessionStorage blocked — skip the hint.
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);

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

  // Scroll handler does ONLY the lightweight scrolled-past-threshold check
  // (one read of window.scrollY). The expensive "which section am I on"
  // detection is delegated to an IntersectionObserver below, which fires
  // only when sections actually cross the viewport threshold instead of
  // running 10× getBoundingClientRect on every scroll tick.
  useEffect(() => {
    const onScroll = () => {
      // Functional update skips the re-render when the value hasn't changed.
      const past = window.scrollY > 24;
      setScrolled((prev) => (prev === past ? prev : past));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Section spy via IntersectionObserver. Triggers when any of the nav
  // sections crosses the band 140px below the viewport top (rootMargin
  // `-140px 0px ...`). The first intersecting entry wins, matching the
  // old top-down search behavior but at zero scroll-event cost.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ids = navLinks.map((l) => l.href.slice(1));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Pick the first id (in nav order) that's currently intersecting.
        const next = ids.find((id) => visible.has(id)) || "hero";
        setActiveSection((prev) => (prev === next ? prev : next));
      },
      {
        // Anchor near the header's 140px hit-zone used previously.
        rootMargin: "-140px 0px -55% 0px",
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
          {/* Logo — links to home on admin (and other non-homepage routes),
              jumps to #hero anchor on the homepage. */}
          <a href={isAdminPage ? "/" : "#hero"} className="group flex items-center gap-3">
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
            <ThemeToggle showHint={showThemeHint} />
            {user ? (
              <>
                <NotificationBell variant="desktop" />
                <UserMenu variant="desktop" />
              </>
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
            <ThemeToggle showHint={showThemeHint} />
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

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            {user ? (
              <>
                <NotificationBell variant="mobile" />
                <UserMenu
                  variant="mobile"
                  onAfterAction={() => setMobileMenuOpen(false)}
                />
              </>
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

      {/* Ambient music disc + iframe now lives in the root layout
          (src/components/layout/AmbientPlayer.tsx) so it persists across
          client-side navigation between pages. */}
    </>
  );
};
