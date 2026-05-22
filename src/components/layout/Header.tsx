"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthModal } from "@/components/auth/AuthModal";

export const Header = () => {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "🏠 Home", href: "#hero" },
    { name: "📖 About", href: "#about" },
    ...(user ? [{ name: "👤 Profile", href: "#profile" }] : []),
    { name: "🎬 Latest", href: "#latest" },
    { name: "📅 Schedule", href: "#schedule" },
    { name: "🛍️ Merch", href: "#merch" },
    { name: "🌐 Socials", href: "#socials" },
    { name: "✉️ Contact", href: "#contact" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-lg py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-3 group">
            <span className="text-3xl animate-float">🎮</span>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-wider text-white group-hover:text-violet-400 transition-colors">
                JUST FOR FUN
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold leading-tight">
                Gaming &bull; Streams &bull; Epic
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4 bg-slate-900 border border-white/10 rounded-xl px-4 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center border border-violet-500/50 text-white font-bold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white max-w-[120px] truncate">
                      {user.user_metadata?.name || user.email?.split("@")[0]}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[120px]">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth("login")}
                  className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuth("signup")}
                  className="px-4 py-2 text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:scale-105 transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="xl:hidden flex items-center gap-4">
            {user && (
              <div className="md:hidden w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center border border-violet-500/50 text-white font-bold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer menu */}
      <div
        className={`fixed inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col pt-24 px-8 pb-8 transition-transform duration-300 xl:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-4 text-lg font-bold">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-white/5 text-slate-300 hover:text-white"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-slate-900 border border-white/10 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-violet-600/30 flex items-center justify-center border border-violet-500/50 text-white font-bold text-base">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-white">
                    {user.user_metadata?.name || user.email?.split("@")[0]}
                  </span>
                  <span className="text-xs text-slate-400">{user.email}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => openAuth("login")}
                className="w-full py-3 rounded-xl border border-white/10 text-slate-300 hover:text-white font-bold hover:bg-white/5 transition-all"
              >
                Login
              </button>
              <button
                onClick={() => openAuth("signup")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold transition-all shadow-md"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};
