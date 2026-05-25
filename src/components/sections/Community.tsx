"use client";

import React from "react";
import { Discord } from "@/components/ui/Icons";

const DISCORD_SERVER_ID = "948867249849114664";
const DISCORD_INVITE_URL = "https://discord.gg/jzcNVPGx3h";

export const Community = () => {
  return (
    <section id="community" className="relative py-24 bg-[#060606] overflow-hidden bg-dot-pattern">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5865F2]/45 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-[#5865F2] drop-shadow-[0_0_8px_rgba(88,101,242,0.6)]">
              <Discord size={32} />
            </span>{" "}
            Crew Community
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Hop into the Discord — see who's online and join the squad live.
          </p>
          <div className="w-16 h-[2px] bg-gradient-to-r from-[#5865F2] via-white to-[#ff0033] mx-auto rounded-full mt-4" />
        </div>

        {/* Widget Embed */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center justify-center">
          <div className="relative mx-auto w-full max-w-[350px] animate-fade-in-up">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#5865F2]/40 via-[#ff0033]/20 to-[#5865F2]/40 blur-xl opacity-60" />
            <div className="relative rounded-2xl border border-white/10 bg-[#181818]/70 backdrop-blur-xl overflow-hidden shadow-[0_0_30px_rgba(88,101,242,0.25)]">
              <iframe
                src={`https://discord.com/widget?id=${DISCORD_SERVER_ID}&theme=dark`}
                width="350"
                height="500"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                title="Just For Fun Discord Server"
                className="block border-0"
              />
            </div>
          </div>

          {/* Side blurb + CTA (desktop only) */}
          <div className="hidden lg:flex flex-col gap-4 max-w-xs animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h3 className="font-display font-extrabold text-white text-2xl uppercase tracking-wide">
              Real-Time Crew Chat
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Voice channels, weekly squad nights, custom game lobbies, and a feed of every new upload. The widget shows live who's online right now.
            </p>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5865F2] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(88,101,242,0.5)] transition hover:scale-105 hover:shadow-[0_0_36px_rgba(88,101,242,0.75)]"
            >
              <Discord size={18} /> Join the Server
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
