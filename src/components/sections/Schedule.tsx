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
    <section id="schedule" className="relative py-24 bg-[#060606] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-[#ff0033]">📅</span> Stream Schedule
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Mark your calendars! Here&apos;s when you can catch the action live.
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] mx-auto rounded-full mt-4" />
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
                  ? "border-[#ff0033]/45 bg-[#181818]/90 scale-[1.02] shadow-[0_15px_30px_-15px_rgba(255,0,51,0.3)] md:-translate-y-1"
                  : "border-white/10 bg-[#181818]/60"
              }`}
            >
              {item.featured && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] bg-[length:200%_auto] animate-aurora-shift" />
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-lg ${
                      item.featured
                        ? "bg-[#ff0033]/18 text-[#ff4b5f] border border-[#ff0033]/35"
                        : "bg-[#0f0f0f] text-neutral-400 border border-white/10"
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
                  <div className="flex items-center gap-2 text-xs font-bold text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl w-fit">
                    <Clock size={14} /> {item.time}
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Schedule Footer warnings */}
        <div className="max-w-2xl mx-auto mt-16 p-4 rounded-lg bg-[#ff0033]/8 border border-[#ff0033]/20 flex gap-3 text-xs text-[#ff4b5f] leading-relaxed">
          <AlertTriangle size={16} className="text-[#ff0033] shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> Stream times are flexible and may vary due to gaming updates, internet connection, or scheduling changes. Follow us on social media and turn on notifications 🔔 to get alerted whenever we go live!
          </p>
        </div>
      </div>
    </section>
  );
};
