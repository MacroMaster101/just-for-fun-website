"use client";

import React from "react";
import { Gamepad2, Heart, Shield, Zap, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TiltCard } from "@/components/ui/TiltCard";
import { CursorSpotlight } from "@/components/ui/CursorSpotlight";

export const About = () => {
  const features = [
    {
      icon: <Gamepad2 size={22} className="text-[#ff0033]" />,
      title: "Main Esports Ops",
      description: "Tactical match play in Valorant, survival co-op fortresses in Valheim, and chaotic highlights in GTA V.",
    },
    {
      icon: <Heart size={22} className="text-[#ff4b5f]" />,
      title: "Chaotic Vibe",
      description: "Zero try-hard toxic drama. Just a group of friends laughing at epic fails and carrying each other to victory.",
    },
    {
      icon: <Shield size={22} className="text-white" />,
      title: "Our Guild Target",
      description: "Constructing an open, active community of casual gamers who play purely for the thrill and fun of it.",
    },
    {
      icon: <Zap size={22} className="text-[#ff4b5f]" />,
      title: "Broadcast Mix",
      description: "Funny gameplay, highlight clips, setup specs logs, and interactive viewer lobby nights.",
    },
  ];

  return (
    <section id="about" className="relative overflow-hidden bg-[#060606] py-20 sm:py-24">
      <CursorSpotlight color="rgba(255, 75, 95, 0.16)" size={520} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center sm:mb-16">
          <h2 className="flex flex-wrap items-center justify-center gap-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="text-[#ff0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.45)]">🎯</span> Channel DNA
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Get inside details on what makes our community unique!
          </p>
          <div className="w-16 h-[2px] bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Mission Description */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex">
              <span className="text-[10px] font-extrabold text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles size={10} /> Channel Story
              </span>
            </div>

            <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide uppercase leading-tight">
              What is <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#ff0033] drop-shadow-[0_0_10px_rgba(255,0,51,0.2)]">JUST FOR FUN</span>?
            </h3>
            
            <p className="text-neutral-300 leading-relaxed text-sm sm:text-base font-medium">
              It started as a simple sandbox server to document hilarious gaming sessions with friends. Today, it has evolved into a tight-knit community of thousands of fellow casual gamers.
            </p>
            
            <p className="text-neutral-400 leading-relaxed text-xs sm:text-sm font-medium">
              We focus on premium visual streams, funny highlights, and interactive viewer lobbies. We don&apos;t care about professional brackets or sweat-level toxicity — we play strictly to celebrate video games for what they are meant to be: a fun escape!
            </p>
            
            <div className="flex flex-wrap gap-3 border-t border-white/5 pt-4 sm:gap-4">
              {["FPS Highlights", "Co-op Survival", "Viewer Lobbies"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[10px] uppercase font-extrabold tracking-wider text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff0033] animate-ping" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Grid of Feature Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <TiltCard key={idx} max={10} scale={1.03} className="rounded-lg">
              <Card
                hoverEffect
                className="space-y-4 border border-white/10 bg-[#181818]/70 p-5 backdrop-blur-md sm:p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0f0f0f]/80 flex items-center justify-center border border-white/10 shadow-inner">
                  {feature.icon}
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display font-extrabold text-white text-sm tracking-wide uppercase">
                    {feature.title}
                  </h4>
                  <p className="text-neutral-400 text-xs leading-relaxed font-medium">
                    {feature.description}
                  </p>
                </div>
              </Card>
              </TiltCard>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
