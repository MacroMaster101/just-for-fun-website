"use client";

import React from "react";
import { Play, Users, Video, Eye, Calendar, Sparkles } from "lucide-react";
import { Youtube } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const Hero = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden bg-grid-pattern bg-slate-950"
    >
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Cyber Grid Mask */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
        {/* Left Column: Title and details */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex">
            <Badge variant="primary" pulse>
              <Sparkles size={10} className="mr-1" /> Live Gaming Channel
            </Badge>
          </div>

          <h1 className="font-display font-extrabold text-5xl sm:text-6xl xl:text-7xl tracking-tight leading-tight text-white">
            JUST FOR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(139,92,246,0.3)] animate-[glow-pulse_3s_infinite_alternate]">
              FUN
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
            Experience{" "}
            <strong className="text-violet-400">high-octane gameplay</strong>,
            epic clutches, and variety gaming. No try-hard drama, just pure gaming
            with an awesome community!
          </p>

          {/* Game Tags */}
          <div className="flex flex-wrap gap-2.5">
            {["🎯 Valorant", "⚔️ Valheim", "💥 Battlefield", "🎲 Variety Games"].map(
              (tag) => (
                <span
                  key={tag}
                  className="bg-slate-900 border border-white/5 px-3 py-1 rounded-xl text-xs font-semibold text-slate-300 hover:border-violet-500/20 transition-all cursor-default"
                >
                  {tag}
                </span>
              )
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <a
              href="https://www.youtube.com/channel/UCcCp0B0bypJE4EJjwq8u2lQ?sub_confirmation=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="lg" glow className="gap-2 w-full sm:w-auto">
                <Youtube size={20} /> Subscribe Now
              </Button>
            </a>
            <a href="#latest" className="inline-flex">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Play size={18} /> Watch Latest
              </Button>
            </a>
          </div>

          {/* Channel Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/5 max-w-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Users size={20} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white leading-tight">1K+</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Subs
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Video size={20} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white leading-tight">50+</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Videos
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Eye size={20} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-white leading-tight">10K+</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Views
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming stream preview card */}
        <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
          <Card
            glow
            hoverEffect
            className="w-full max-w-sm border border-white/10 p-6 space-y-6 relative overflow-hidden"
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <Badge variant="warning" pulse>
                Upcoming Stream
              </Badge>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Calendar size={12} /> Live Next
              </span>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="font-display font-extrabold text-xl text-white tracking-wide leading-snug">
                Variety Gaming Night
              </h3>
              <p className="text-sm text-slate-400">
                🕐 Every Weekend &bull; 8:00 PM
              </p>
              <p className="text-xs text-slate-500 leading-relaxed pt-2">
                Join the live stream on YouTube for chill gaming sessions, viewer games, and QA chat!
              </p>
            </div>

            {/* Footer details */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Platform
              </span>
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                YouTube Live
              </span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
