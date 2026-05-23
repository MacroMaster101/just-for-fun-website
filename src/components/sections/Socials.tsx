"use client";

import React from "react";
import { Video } from "lucide-react";
import { Youtube, Twitter, Twitch, Discord, Instagram } from "@/components/ui/Icons";
import { Card } from "@/components/ui/Card";

export const Socials = () => {
  const socials = [
    {
      name: "YouTube",
      tagline: "Main Gameplay Channel",
      icon: <Youtube size={30} />,
      href: "https://www.youtube.com/@JustForFun-BoYs",
      color: "hover:border-rose-500/50 hover:bg-rose-950/10 text-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]",
    },
    {
      name: "Twitch",
      tagline: "Live Gameplay Stream",
      icon: <Twitch size={30} />,
      href: "https://www.twitch.tv/justforfunggez",
      color: "hover:border-[#ff0033]/50 hover:bg-[#ff0033]/10 text-[#ff4b5f] hover:shadow-[0_0_20px_rgba(255,0,51,0.25)]",
    },
    {
      name: "TikTok",
      tagline: "Clips & Epic Clutches",
      icon: <Video size={30} />,
      href: "https://www.tiktok.com/@justforfunggez",
      color: "hover:border-pink-500/50 hover:bg-pink-950/10 text-pink-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.25)]",
    },
    {
      name: "Discord Roster",
      tagline: "Join the Crew Squad Guild",
      icon: <Discord size={30} />,
      href: "https://discord.gg/yourserver",
      color: "hover:border-indigo-500/50 hover:bg-indigo-950/10 text-indigo-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]",
    },
    {
      name: "Instagram",
      tagline: "Behind the Scenes Highlights",
      icon: <Instagram size={30} />,
      href: "https://instagram.com/justforfun",
      color: "hover:border-amber-500/50 hover:bg-amber-950/10 text-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    },
    {
      name: "Twitter / X",
      tagline: "Updates & Gaming Memes",
      icon: <Twitter size={30} />,
      href: "https://twitter.com/justforfun",
      color: "hover:border-white/30 hover:bg-white/10 text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.18)]",
    },
  ];

  return (
    <section id="socials" className="relative py-24 bg-[#060606] overflow-hidden bg-dot-pattern">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-[#ff0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">🌐</span> Social Grid
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Connect with the crew and stay in the loop across all networks!
          </p>
          <div className="w-16 h-[2px] bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] mx-auto rounded-full mt-4" />
        </div>

        {/* Social Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {socials.map((platform, idx) => (
            <a
              key={idx}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <Card
                hoverEffect
                className={`p-6 border border-white/10 bg-[#181818]/70 backdrop-blur-xl flex items-center gap-5 transition-all duration-300 ${platform.color}`}
              >
                <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                  {platform.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-extrabold text-white text-base tracking-wide uppercase">
                    {platform.name}
                  </h3>
                  <p className="text-neutral-400 text-xs leading-relaxed group-hover:text-neutral-300 transition-colors">
                    {platform.tagline}
                  </p>
                  <span className="inline-block text-[9px] uppercase font-bold tracking-widest text-[#ff4b5f] group-hover:text-white group-hover:translate-x-1 transition-all mt-2">
                    CONNECT VECTOR &rarr;
                  </span>
                </div>
              </Card>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};
