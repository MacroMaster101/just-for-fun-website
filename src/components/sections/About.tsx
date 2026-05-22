"use client";

import React from "react";
import { Gamepad2, Heart, Award, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const About = () => {
  const features = [
    {
      icon: <Gamepad2 size={24} className="text-violet-400" />,
      title: "Main Games",
      description: "Valorant, Valheim, Battlefield, and other popular shooter & survival co-op games.",
    },
    {
      icon: <Heart size={24} className="text-pink-400" />,
      title: "Stream Vibe",
      description: "Chill, interactive, and positive. We hang out, play together, and chat about everything.",
    },
    {
      icon: <Award size={24} className="text-cyan-400" />,
      title: "Our Mission",
      description: "Build an open, welcoming community of casual gamers who play purely JUST FOR FUN.",
    },
    {
      icon: <Zap size={24} className="text-amber-400" />,
      title: "Content Mix",
      description: "High-level guides, funny fails, stream highlights, and gaming tech reviews.",
    },
  ];

  return (
    <section id="about" className="relative py-24 bg-slate-900/30 overflow-hidden">
      {/* Subtle details */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-violet-600/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-violet-500">🎯</span> About the Channel
          </h2>
          <p className="text-slate-400 text-sm tracking-wider uppercase font-semibold">
            Welcome to the community! Here&apos;s what makes us special.
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-cyan-500 mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Mission Description */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-wide">
              What is <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">JUST FOR FUN</span>?
            </h3>
            <p className="text-slate-300 leading-relaxed text-base">
              It started as a place to document fun gaming sessions with friends, but quickly evolved into an awesome community.
            </p>
            <p className="text-slate-400 leading-relaxed text-sm">
              We focus on positive vibes, having a good laugh, and enjoying video games for what they are: a way to unwind and connect. We don&apos;t care about top ranks or toxicity — we play strictly to enjoy the games and the company.
            </p>
            
            <div className="flex gap-4 pt-4">
              {["FPS Games", "Survival Co-op", "Casual Gaming"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Grid of Feature Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                hoverEffect
                className="p-6 border border-white/5 bg-slate-900/60 backdrop-blur-sm space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-white/5 shadow-inner">
                  {feature.icon}
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display font-extrabold text-white text-base tracking-wide">
                    {feature.title}
                  </h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
