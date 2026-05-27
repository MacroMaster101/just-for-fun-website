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

  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        const isFresh = window.sessionStorage.getItem("jff:fresh-session") === "1";
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const container = document.getElementById("mobile-bottom-nav-container");
    const activeBtn = document.getElementById(`bottom-nav-${activeNavSection}`);
    if (container && activeBtn) {
      const containerWidth = container.clientWidth;
      const btnWidth = activeBtn.clientWidth;
      const btnLeft = activeBtn.offsetLeft;
      const targetScrollLeft = btnLeft - (containerWidth / 2) + (btnWidth / 2);
      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    }
  }, [activeNavSection]);

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
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md rounded-2xl border border-white/10 bg-[#070708]/85 p-1.5 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] lg:hidden">
          <div 
            id="mobile-bottom-nav-container"
            className="flex items-center gap-1 overflow-x-auto scrollbar-none snap-x snap-mandatory px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {navLinks.map((link) => {
              const active = activeNavSection === link.href.slice(1);
              const LinkIcon = link.icon;
              return (
                <a
                  key={link.href}
                  id={`bottom-nav-${link.href.slice(1)}`}
                  href={link.href}
                  className={`flex flex-col items-center justify-center min-w-[58px] px-2 py-1.5 rounded-xl transition-all duration-300 snap-center ${
                    active
                      ? "bg-gradient-to-br from-[#ff0033] to-[#ff2d55] text-white shadow-[0_0_16px_rgba(255,0,51,0.5)] scale-[1.05]"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <LinkIcon size={16} className={active ? "scale-110" : ""} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 leading-none ${active ? "font-black" : ""}`}>
                    {link.name}
                  </span>
                </a>
              );
            })}
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            .scrollbar-none::-webkit-scrollbar {
              display: none !important;
            }
          `}} />
        </div>
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
