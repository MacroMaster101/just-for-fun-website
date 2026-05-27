"use client";

import React, { useEffect, useState } from "react";
import {
  Home,
  Info,
  Users,
  Calendar,
  Play,
  Swords,
  Disc,
  ShoppingBag,
  Share2,
  MessageSquare,
  Mail,
  LayoutGrid,
  X,
} from "lucide-react";
import { Youtube } from "@/components/ui/Icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/auth/NotificationBell";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Home", href: "#hero", icon: Home },
  { name: "About", href: "#about", icon: Info },
  { name: "Squad", href: "#squad", icon: Users },
  { name: "Schedule", href: "#schedule", icon: Calendar },
  { name: "Videos", href: "#latest", icon: Play },
  { name: "Arena", href: "#arena", icon: Swords },
  { name: "Wheel", href: "#wheel", icon: Disc },
  { name: "Shop", href: "#merch", icon: ShoppingBag },
  { name: "Socials", href: "#socials", icon: Share2 },
  { name: "Community", href: "#community", icon: MessageSquare },
  { name: "Contact", href: "#contact", icon: Mail },
];

const navSectionAliases: Record<string, string> = {
  "crew-wall": "community",
};

const sectionSpyIds = [
  ...navLinks.map((link) => link.href.slice(1)),
  ...Object.keys(navSectionAliases),
];

export const Header = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [showThemeHint, setShowThemeHint] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        const isFresh = window.sessionStorage.getItem("j4fn:fresh-session") === "1";
        if (isFresh) {
          setShowThemeHint(true);
          window.setTimeout(() => setShowThemeHint(false), 10_000);
        }
      } catch {
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const openAuth = (mode: "login" | "signup", err: string | null = null) => {
    setAuthMode(mode);
    setAuthError(err);
    setAuthOpen(true);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      const mode = customEvent.detail?.mode === "signup" ? "signup" : "login";
      openAuth(mode);
    };
    window.addEventListener("open-auth-modal", handleOpenAuth);
    return () => window.removeEventListener("open-auth-modal", handleOpenAuth);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorMsg =
      params.get("auth_error") ||
      params.get("error_description") ||
      hashParams.get("error_description");
    if (errorMsg) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount: reading auth error from URL params
      openAuth("login", errorMsg);
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > 24;
      setScrolled((prev) => (prev === past ? prev : past));

      // If scrolled to the absolute bottom of the page, force "contact" section active
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;
      if (isAtBottom) {
        setActiveSection("contact");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = sectionSpyIds
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

        // Guard against defaulting to "hero" when scrolled to the absolute bottom
        const isAtBottom = typeof window !== "undefined" &&
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;

        if (isAtBottom) {
          setActiveSection("contact");
          return;
        }

        const next = sectionSpyIds.find((id) => visible.has(id)) || "hero";
        setActiveSection((prev) => (prev === next ? prev : next));
      },
      {
        rootMargin: "-140px 0px -55% 0px",
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const activeNavSection = navSectionAliases[activeSection] ?? activeSection;

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

          {!isAdminPage && (
            <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-[#0c0c0c]/80 p-1 backdrop-blur lg:flex">
              {navLinks.map((link) => {
                const active = activeNavSection === link.href.slice(1);
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle showHint={showThemeHint} />
            {user ? (
              <>
                <NotificationBell variant="desktop" />
                <UserMenu variant="desktop" />
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => openAuth("login")}
                  className="rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold text-neutral-300 transition hover:bg-white/10 hover:text-white whitespace-nowrap"
                >
                  Log In
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="rounded-full bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-black text-white shadow-[0_0_16px_rgba(255,0,51,0.4)] transition hover:shadow-[0_0_24px_rgba(255,0,51,0.6)] whitespace-nowrap"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {!isAdminPage && (
        <>
          {/* Expanded Menu Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-300 lg:hidden ${
              menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setMenuOpen(false)}
          />

          {/* Expanded Grid Panel */}
          <div
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md rounded-3xl border border-white/10 bg-[#07070a]/90 p-5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out lg:hidden ${
              menuOpen
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                : "opacity-0 translate-y-10 scale-95 pointer-events-none"
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div>
                <h3 className="font-display text-xs font-black uppercase tracking-wider text-white">
                  Navigation Hub
                </h3>
                <p className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest mt-0.5">
                  Explore Channel Sections
                </p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#ff2d55] bg-[#ff2d55]/10 px-2.5 py-1 rounded-full border border-[#ff2d55]/20">
                J4FN Gaming
              </span>
            </div>

            {/* Grid of Links */}
            <div className="grid grid-cols-3 gap-2">
              {navLinks.map((link) => {
                const active = activeNavSection === link.href.slice(1);
                const LinkIcon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group ${
                      active
                        ? "bg-gradient-to-br from-[#ff0033]/20 to-[#ff2d55]/10 border-[#ff0033]/40 shadow-[0_0_15px_rgba(255,0,51,0.2)] text-white"
                        : "bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    <span
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        active
                          ? "bg-gradient-to-br from-[#ff0033] to-[#ff2d55] text-white shadow-[0_0_10px_rgba(255,0,51,0.5)]"
                          : "bg-neutral-900/60 text-neutral-400 group-hover:text-white group-hover:bg-[#ff0033]/15"
                      }`}
                    >
                      <LinkIcon size={16} className="transition-transform duration-300 group-hover:scale-110" />
                    </span>
                    <span
                      className={`text-[9px] font-display font-bold uppercase tracking-wider mt-2 text-center leading-none ${
                        active ? "text-white font-black" : "text-neutral-400 group-hover:text-white"
                      }`}
                    >
                      {link.name}
                    </span>
                  </a>
                );
              })}

              {/* 12th Grid Element - YouTube official link */}
              <a
                href="https://youtube.com/@justforfungaming"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-[#ff0000]/10 border-[#ff0000]/25 text-neutral-400 hover:text-white hover:bg-[#ff0000]/20 hover:border-[#ff0000]/40 transition-all duration-300 group"
              >
                <span className="p-2 rounded-xl bg-[#ff0000] text-white shadow-[0_0_10px_rgba(255,0,0,0.5)]">
                  <Youtube size={16} className="transition-transform duration-300 group-hover:scale-110" />
                </span>
                <span className="text-[9px] font-display font-black uppercase tracking-wider mt-2 text-white text-center leading-none">
                  YouTube
                </span>
              </a>
            </div>
          </div>

          {/* Floating Glassmorphic Pill Dock */}
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[360px] rounded-full border border-white/10 bg-[#07070a]/65 px-4 py-2 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.75)] lg:hidden transition-all duration-300">
            <div className="flex items-center justify-between gap-1">
              {/* Home */}
              <a
                href="#hero"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 relative group ${
                  activeNavSection === "hero"
                    ? "text-[#ff0033]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Home
                  size={20}
                  className={`transition-all duration-300 ${
                    activeNavSection === "hero" ? "scale-110 drop-shadow-[0_0_8px_rgba(255,0,51,0.65)]" : "group-hover:scale-105"
                  }`}
                />
                {activeNavSection === "hero" && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff0033] shadow-[0_0_4px_rgba(255,0,51,0.8)]" />
                )}
              </a>

              {/* Videos */}
              <a
                href="#latest"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 relative group ${
                  activeNavSection === "latest"
                    ? "text-[#ff0033]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Play
                  size={20}
                  className={`transition-all duration-300 ${
                    activeNavSection === "latest" ? "scale-110 drop-shadow-[0_0_8px_rgba(255,0,51,0.65)]" : "group-hover:scale-105"
                  }`}
                />
                {activeNavSection === "latest" && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff0033] shadow-[0_0_4px_rgba(255,0,51,0.8)]" />
                )}
              </a>

              {/* Glowing Center Menu Toggle Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff0033] to-[#ff2d55] text-white shadow-[0_0_20px_rgba(255,0,51,0.6),inset_0_1px_1px_rgba(255,255,255,0.25)] transition-transform duration-300 active:scale-90 hover:scale-105 z-50 border border-white/20"
              >
                {menuOpen ? (
                  <X size={20} className="transition-transform duration-300 rotate-90" />
                ) : (
                  <LayoutGrid size={20} className="transition-transform duration-300" />
                )}
              </button>

              {/* Arena */}
              <a
                href="#arena"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 relative group ${
                  activeNavSection === "arena"
                    ? "text-[#ff0033]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Swords
                  size={20}
                  className={`transition-all duration-300 ${
                    activeNavSection === "arena" ? "scale-110 drop-shadow-[0_0_8px_rgba(255,0,51,0.65)]" : "group-hover:scale-105"
                  }`}
                />
                {activeNavSection === "arena" && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff0033] shadow-[0_0_4px_rgba(255,0,51,0.8)]" />
                )}
              </a>

              {/* Shop */}
              <a
                href="#merch"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 relative group ${
                  activeNavSection === "merch"
                    ? "text-[#ff0033]"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <ShoppingBag
                  size={20}
                  className={`transition-all duration-300 ${
                    activeNavSection === "merch" ? "scale-110 drop-shadow-[0_0_8px_rgba(255,0,51,0.65)]" : "group-hover:scale-105"
                  }`}
                />
                {activeNavSection === "merch" && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ff0033] shadow-[0_0_4px_rgba(255,0,51,0.8)]" />
                )}
              </a>
            </div>
          </div>
        </>
      )}

      <AuthModal
        isOpen={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setAuthError(null);
        }}
        initialMode={authMode}
        initialError={authError}
      />
    </>
  );
};
