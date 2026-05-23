"use client";

import React from "react";
import { Heart } from "lucide-react";
import { Youtube, Discord, Twitch, Facebook } from "@/components/ui/Icons";

const watchLinks = [
  { label: "Home", href: "#hero" },
  { label: "About", href: "#about" },
  { label: "Squad", href: "#squad" },
  { label: "Latest Videos", href: "#latest" },
];

const communityLinks = [
  { label: "Sound Arena", href: "#arena" },
  { label: "Challenge Wheel", href: "#wheel" },
  { label: "Schedule", href: "#schedule" },
  { label: "Creator Shop", href: "#merch" },
  { label: "Contact", href: "#contact" },
];

const socials = [
  { icon: <Youtube size={16} />, href: "https://www.youtube.com/@JustForFun-BoYs", label: "YouTube" },
  { icon: <Twitch size={16} />, href: "https://www.twitch.tv/justforfunggez", label: "Twitch" },
  { icon: <Discord size={16} />, href: "https://discord.gg/YGEKC2xazD", label: "Discord" },
  { icon: <Facebook size={16} />, href: "https://www.facebook.com/profile.php?id=61577941642888", label: "Facebook" },
];

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#060606]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/70 to-transparent" />
      <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-[#ff0033]/15 blur-[120px]" />
      <div className="absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-[#ff2d55]/10 blur-[120px]" />

      {/* Giant brand text */}
      <div className="relative overflow-hidden">
        <div className="select-none whitespace-nowrap text-center font-display text-[20vw] font-black uppercase leading-[0.85] tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(255,0,51,0.16)]">
          Just For Fun
        </div>
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 pb-14 pt-4 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <a href="#hero" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff0033] to-[#b30024] text-white shadow-[0_0_24px_rgba(255,0,51,0.45)]">
              <Youtube size={22} />
            </span>
            <div>
              <p className="font-display text-base font-black uppercase tracking-wider text-white">
                Just For Fun BoYs
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#ff2d55]">
                @JustForFun-BoYs
              </p>
            </div>
          </a>
          <p className="mt-5 max-w-md text-sm leading-6 text-neutral-400">
            Official channel hub for clutch highlights, weekend community streams, gaming sessions
            and creator drops. Live data straight from YouTube.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-neutral-300 transition hover:-translate-y-0.5 hover:border-[#ff0033]/60 hover:bg-[#ff0033]/10 hover:text-white"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <h4 className="mb-4 font-display text-xs font-black uppercase tracking-[0.28em] text-[#ff2d55]">
            Watch
          </h4>
          <ul className="space-y-2.5 text-sm font-medium text-neutral-400">
            {watchLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex items-center gap-2 transition hover:text-white">
                  <span className="h-px w-3 bg-[#ff0033] transition-all group-hover:w-5" />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <h4 className="mb-4 font-display text-xs font-black uppercase tracking-[0.28em] text-[#ff2d55]">
            Community
          </h4>
          <ul className="space-y-2.5 text-sm font-medium text-neutral-400">
            {communityLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="transition hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-5 py-6 text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500 sm:px-6 md:flex-row md:items-center md:justify-between">
        <span>&copy; {year} Just For Fun BoYs</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff0033]" />
          Live YouTube Data
        </span>
        <span className="flex items-center gap-2 text-neutral-400">
          Built with <Heart size={12} className="fill-[#ff0033] text-[#ff0033]" />
        </span>
      </div>
    </footer>
  );
};
