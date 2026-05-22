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
      icon: <Youtube size={32} />,
      href: "https://www.youtube.com/channel/UCcCp0B0bypJE4EJjwq8u2lQ",
      color: "hover:border-red-600/50 hover:bg-red-950/10 text-red-500",
    },
    {
      name: "Discord",
      tagline: "Join the Squad Guild",
      icon: <Discord size={32} />,
      href: "https://discord.gg/yourserver",
      color: "hover:border-violet-600/50 hover:bg-violet-950/10 text-violet-400",
    },
    {
      name: "Instagram",
      tagline: "Behind the Scenes Highlights",
      icon: <Instagram size={32} />,
      href: "https://instagram.com/justforfun",
      color: "hover:border-pink-600/50 hover:bg-pink-950/10 text-pink-400",
    },
    {
      name: "TikTok",
      tagline: "Clips & Epic Clutches",
      icon: <Video size={32} />,
      href: "https://tiktok.com/@justforfun",
      color: "hover:border-purple-600/50 hover:bg-purple-950/10 text-purple-400",
    },
    {
      name: "Twitter / X",
      tagline: "Updates & Game Memes",
      icon: <Twitter size={32} />,
      href: "https://twitter.com/justforfun",
      color: "hover:border-cyan-600/50 hover:bg-cyan-950/10 text-cyan-400",
    },
    {
      name: "Twitch",
      tagline: "Live Backup Stream Channel",
      icon: <Twitch size={32} />,
      href: "https://twitch.tv/justforfun",
      color: "hover:border-indigo-600/50 hover:bg-indigo-950/10 text-indigo-400",
    },
  ];

  return (
    <section id="socials" className="relative py-24 bg-slate-900/30 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-cyan-600/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-violet-500">🌐</span> Connect with Me
          </h2>
          <p className="text-slate-400 text-sm tracking-wider uppercase font-semibold">
            Join the community and stay connected across all platforms!
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-cyan-500 mx-auto rounded-full mt-4" />
        </div>

        {/* Social Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {socials.map((platform, idx) => (
            <a
              key={idx}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card
                hoverEffect
                className={`p-6 border border-white/5 bg-slate-900/40 backdrop-blur-sm flex items-center gap-5 transition-all duration-300 ${platform.color}`}
              >
                <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                  {platform.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-extrabold text-white text-base tracking-wide">
                    {platform.name}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">
                    {platform.tagline}
                  </p>
                  <span className="inline-block text-[10px] uppercase font-bold tracking-widest text-violet-400 group-hover:translate-x-1 transition-transform mt-1">
                    Connect &rarr;
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
