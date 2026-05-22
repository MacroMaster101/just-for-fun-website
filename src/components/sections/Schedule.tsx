"use client";

import React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const Schedule = () => {
  const scheduleData = [
    {
      day: "FRI",
      title: "Friday Night",
      time: "8:00 PM – 11:00 PM",
      description: "Chill start to the weekend with mixed casual games and good community vibes!",
      icon: "🎮",
      featured: false,
    },
    {
      day: "SAT",
      title: "Saturday Prime",
      time: "8:00 PM – Late Night",
      description: "Prime time gaming marathon with the squad! The biggest, longest stream of the week!",
      icon: "🔥",
      featured: true,
    },
    {
      day: "SUN",
      title: "Sunday Surprise",
      time: "Anytime (Surprise!)",
      description: "Random pop-up streams, co-op community hangouts, and testing new games.",
      icon: "🎲",
      featured: false,
    },
  ];

  return (
    <section id="schedule" className="relative py-24 bg-slate-900/30 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-violet-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-violet-500">📅</span> Stream Schedule
          </h2>
          <p className="text-slate-400 text-sm tracking-wider uppercase font-semibold">
            Mark your calendars! Here&apos;s when you can catch the action live.
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-cyan-500 mx-auto rounded-full mt-4" />
        </div>

        {/* Schedule Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {scheduleData.map((item, idx) => (
            <Card
              key={idx}
              hoverEffect
              glow={item.featured}
              className={`relative border p-6 flex flex-col justify-between overflow-hidden ${
                item.featured
                  ? "border-violet-500/35 bg-slate-900/80 scale-[1.02] shadow-[0_15px_30px_-15px_rgba(139,92,246,0.3)] md:-translate-y-1"
                  : "border-white/5 bg-slate-900/40"
              }`}
            >
              {item.featured && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-violet-500 to-cyan-500" />
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-lg ${
                      item.featured
                        ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                        : "bg-slate-950 text-slate-400 border border-white/5"
                    }`}
                  >
                    {item.day}
                  </div>
                  {item.featured && (
                    <Badge variant="primary" pulse>
                      ⭐ Main Event
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-display font-extrabold text-xl text-white flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span> {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/10 px-3 py-1.5 rounded-xl w-fit">
                    <Clock size={14} /> {item.time}
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Schedule Footer warnings */}
        <div className="max-w-2xl mx-auto mt-16 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3 text-xs text-amber-400 leading-relaxed">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Stream times are flexible and may vary due to gaming updates, internet connection, or scheduling changes. Follow us on social media and turn on notifications 🔔 to get alerted whenever we go live!
          </p>
        </div>
      </div>
    </section>
  );
};
