"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Clock, AlertTriangle, Radio, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StreamSlot {
  id: string;
  day: string;
  title: string;
  time: string;
  description: string;
  icon: string;
  featured: boolean;
  sortOrder: number;
}

interface UpcomingStream {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledStartTime: string;
  url: string;
}

interface ScheduleApiResponse {
  slots?: StreamSlot[];
  upcomingStreams?: UpcomingStream[];
}

/** Format an ISO timestamp as a friendly card heading like
 *  "Sat, May 31 · 8:00 PM" in the user's locale. */
function formatUpcoming(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
}

export const Schedule = () => {
  const [data, setData] = useState<ScheduleApiResponse | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingStream[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/schedule")
      .then((r) => (r.ok ? r.json() : { slots: [], upcomingStreams: [] }))
      .then((d: ScheduleApiResponse) => {
        if (cancelled) return;
        setData(d);
        // Filter past-dated streams here (uses Date.now which is impure and
        // can't run during render under React's purity rules).
        const now = Date.now();
        const filtered = (d.upcomingStreams || []).filter((s) => {
          const t = Date.parse(s.scheduledStartTime);
          return Number.isFinite(t) && t > now - 5 * 60 * 1000;
        });
        setUpcoming(filtered);
      })
      .catch(() => {
        if (!cancelled) {
          setData({ slots: [], upcomingStreams: [] });
          setUpcoming([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const slots = data?.slots ?? null;

  const showSkeleton = data === null;
  const isCompletelyEmpty =
    data !== null && (slots?.length ?? 0) === 0 && upcoming.length === 0;

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

        {/* Loading skeleton */}
        {showSkeleton && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <Card
                key={i}
                className="border border-white/10 bg-[#181818]/60 p-6 space-y-6"
              >
                <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/5" />
                <div className="space-y-3">
                  <div className="h-5 w-3/4 animate-pulse rounded-md bg-white/5" />
                  <div className="h-7 w-1/2 animate-pulse rounded-xl bg-white/5" />
                  <div className="h-3 w-full animate-pulse rounded bg-white/5" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-white/5" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state — no upcoming streams AND no manual slots configured. */}
        {isCompletelyEmpty && (
          <div className="mx-auto max-w-xl">
            <Card className="relative overflow-hidden border border-white/10 bg-[#181818]/70 p-10 text-center">
              <div className="absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[#ff0033]/15 blur-3xl" />
              <div className="relative space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff0033]/30 bg-[#ff0033]/10 text-[#ff4b5f]">
                  <Calendar size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-black uppercase text-white tracking-wide">
                    Coming Soon
                  </h3>
                  <p className="text-sm leading-relaxed text-neutral-400">
                    No streams scheduled right now. Follow us on socials and turn on notifications 🔔 — we&apos;ll drop the next schedule here as soon as it&apos;s set.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff0033]" />
                  <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff0033] [animation-delay:0.2s]" />
                  <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff0033] [animation-delay:0.4s]" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Upcoming YouTube streams — shown first when present. */}
        {!showSkeleton && upcoming.length > 0 && (
          <div className="mb-12 space-y-5">
            <div className="flex items-center gap-3">
              <Radio size={16} className="text-[#ff4b5f] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff4b5f]">
                Upcoming on YouTube
              </span>
              <span className="text-[10px] font-bold text-neutral-500">
                · auto-pulled from the channel
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((stream) => (
                <a
                  key={stream.id}
                  href={stream.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Card className="relative overflow-hidden border border-[#ff0033]/30 bg-[#181818]/80 hover:border-[#ff0033] transition shadow-[0_15px_30px_-15px_rgba(255,0,51,0.25)]">
                    {stream.thumbnail && (
                      <div className="relative aspect-video w-full overflow-hidden bg-black">
                        <Image
                          src={stream.thumbnail}
                          alt={stream.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#ff0033] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                          <Radio size={10} /> Scheduled
                        </span>
                      </div>
                    )}
                    <div className="space-y-3 p-5">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#ff4b5f]">
                        <Clock size={11} />
                        {formatUpcoming(stream.scheduledStartTime)}
                      </div>
                      <h3 className="font-display font-extrabold text-base text-white line-clamp-2 group-hover:text-[#ff4b5f] transition">
                        {stream.title}
                      </h3>
                      {stream.description && (
                        <p className="text-neutral-500 text-xs leading-relaxed line-clamp-2">
                          {stream.description}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white transition">
                        Set reminder on YouTube <ExternalLink size={11} />
                      </span>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Manual recurring slots */}
        {!showSkeleton && slots && slots.length > 0 && (
          <>
            {upcoming.length > 0 && (
              <div className="mb-5 flex items-center gap-3">
                <Calendar size={16} className="text-neutral-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-neutral-500">
                  Weekly rhythm
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {slots.map((item) => (
                <Card
                  key={item.id}
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
          </>
        )}

        {/* Schedule Footer warnings — only show when there ARE slots */}
        {!showSkeleton && !isCompletelyEmpty && (
          <div className="max-w-2xl mx-auto mt-16 p-4 rounded-lg bg-[#ff0033]/8 border border-[#ff0033]/20 flex gap-3 text-xs text-[#ff4b5f] leading-relaxed">
            <AlertTriangle size={16} className="text-[#ff0033] shrink-0 mt-0.5" />
            <p>
              <strong>Note:</strong> Stream times are flexible and may vary due to gaming updates, internet connection, or scheduling changes. Follow us on social media and turn on notifications 🔔 to get alerted whenever we go live!
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
