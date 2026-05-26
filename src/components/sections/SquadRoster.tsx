"use client";

import React, { useEffect, useState } from "react";
import { Gamepad2, Monitor, Cpu, Shield, Activity, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  favoriteGames: string[];
  favoriteGamesEnriched?: Array<{ name: string; logoUrl: string }>;
  signatureAgent: string;
  twitchUrl?: string;
  specs: {
    cpu: string;
    gpu: string;
    ram: string;
    monitor: string;
    mouse: string;
  };
  bio: string;
  combatStyle: string;
}

interface ApiSquadMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  favoriteGames: string[];
  favoriteGamesEnriched?: Array<{ name: string; logoUrl: string }>;
  signatureAgent: string;
  twitchUrl: string | null;
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  mouse: string;
  bio: string;
  combatStyle: string;
}

const FALLBACK_MEMBERS: TeamMember[] = [
  {
    id: "member-1",
    name: "Kavisha (GGEZ)",
    role: "Founder / Main Duelist",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=400&q=80",
    favoriteGames: ["Valorant", "Valheim", "GTA V"],
    favoriteGamesEnriched: [
      { name: "Valorant", logoUrl: "" },
      { name: "Valheim", logoUrl: "" },
      { name: "GTA V", logoUrl: "" },
    ],
    signatureAgent: "Jett / Reyna",
    twitchUrl: "https://www.twitch.tv/justforfunggez",
    specs: {
      cpu: "AMD Ryzen 7 7800X3D",
      gpu: "NVIDIA RTX 4070 Ti Super",
      ram: "32GB DDR5 6000MHz",
      monitor: "ASUS ROG 240Hz IPS",
      mouse: "Logitech G Pro X Superlight 2",
    },
    bio: "Started Just For Fun to capture hilarious gaming sessions with the crew. Always clutching the 1v5 or dying in the first 5 seconds. No in-between.",
    combatStyle: "Aggressive / W-Key Warrior",
  },
  {
    id: "member-2",
    name: "Chathu (Sniper)",
    role: "Co-Founder / Main Sentinel",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
    favoriteGames: ["Valorant", "Battlefield V", "Rust"],
    favoriteGamesEnriched: [
      { name: "Valorant", logoUrl: "" },
      { name: "Battlefield V", logoUrl: "" },
      { name: "Rust", logoUrl: "" },
    ],
    signatureAgent: "Chamber / Cypher",
    specs: {
      cpu: "Intel Core i7-14700K",
      gpu: "NVIDIA RTX 4070",
      ram: "32GB DDR5 5600MHz",
      monitor: "BenQ ZOWIE 240Hz",
      mouse: "Razer DeathAdder V3 Pro",
    },
    bio: "The calm mastermind of the squad. Can hit cross-map sniper shots but will somehow get lost in a straight hallway. Holds down sites like a fortress.",
    combatStyle: "Calculated / Tactical",
  },
  {
    id: "member-3",
    name: "Prabhash (Survival)",
    role: "Co-Builder / Survival Specialist",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80",
    favoriteGames: ["Valheim", "Minecraft", "GTA V"],
    favoriteGamesEnriched: [
      { name: "Valheim", logoUrl: "" },
      { name: "Minecraft", logoUrl: "" },
      { name: "GTA V", logoUrl: "" },
    ],
    signatureAgent: "Omen / Sage",
    specs: {
      cpu: "AMD Ryzen 5 7600X",
      gpu: "NVIDIA RTX 4060 Ti",
      ram: "16GB DDR5 5200MHz",
      monitor: "MSI Optix 144Hz Curved",
      mouse: "HyperX Pulsefire Haste",
    },
    bio: "Architect of our epic Valheim fortresses. Spends 20 hours building a perfect house only for it to be smashed by a troll. Best support gamer ever.",
    combatStyle: "Defensive / Architect",
  },
];

function mapApiToTeamMember(m: ApiSquadMember): TeamMember {
  return {
    id: m.id,
    name: m.name,
    role: m.role,
    avatar: m.avatarUrl || "",
    favoriteGames: m.favoriteGames || [],
    favoriteGamesEnriched: m.favoriteGamesEnriched || [],
    signatureAgent: m.signatureAgent,
    twitchUrl: m.twitchUrl || undefined,
    specs: {
      cpu: m.cpu,
      gpu: m.gpu,
      ram: m.ram,
      monitor: m.monitor,
      mouse: m.mouse,
    },
    bio: m.bio,
    combatStyle: m.combatStyle,
  };
}

export const SquadRoster = () => {
  const [members, setMembers] = useState<TeamMember[]>(FALLBACK_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<TeamMember>(FALLBACK_MEMBERS[0]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/squad")
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((data: { members?: ApiSquadMember[] }) => {
        if (cancelled) return;
        const list = (data.members || []).map(mapApiToTeamMember);
        if (list.length > 0) {
          setMembers(list);
          setSelectedMember(list[0]);
        }
      })
      .catch(() => {
        // Keep the fallback list rendered.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="squad" className="relative overflow-hidden bg-[#060606] py-20 sm:py-24">
      {/* HUD Background Assets */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-[600px] h-[600px] bg-[#ff0033]/5 blur-[120px] pointer-events-none rounded-full animate-float" />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 w-[600px] h-[600px] bg-[#ffffff]/5 blur-[120px] pointer-events-none rounded-full animate-float [animation-delay:3s]" />
      <div className="absolute inset-0 bg-cyber-matrix opacity-[0.12] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center sm:mb-16">
          <h2 className="flex flex-wrap items-center justify-center gap-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="text-[#ff0033] drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">⚔️</span> Meet the Squad
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            The masterminds behind the chaotic gameplay and funny highlights!
          </p>
          <div className="w-16 h-[2px] bg-gradient-to-r from-[#ff0033] via-[#ffffff] to-[#ff4b5f] mx-auto rounded-full mt-4" />
        </div>

        {/* Character Roster Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Character Selection (Esports Grid) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs uppercase tracking-widest text-[#ff0033] font-extrabold mb-2">
              Select Operator
            </div>
            <div className="space-y-3">
              {members.map((member) => {
                const isSelected = member.id === selectedMember.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 relative overflow-hidden group cursor-pointer ${
                      isSelected
                        ? "bg-[#ff0033]/10 border-[#ff0033] shadow-[0_0_20px_rgba(255,0,51,0.2)]"
                        : "bg-[#181818]/30 border-white/5 hover:border-[#ff0033]/30 hover:bg-[#181818]/60"
                    }`}
                  >
                    {/* Active side indicator */}
                    {isSelected && (
                      <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-[#ff0033] to-[#ffffff]" />
                    )}

                    {/* Operator Avatar */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-[#0f0f0f] flex items-center justify-center">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="48px"
                        />
                      ) : (
                        <span className="font-display text-sm font-black text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-grow">
                      <h4 className="flex items-center gap-2 truncate font-display text-sm font-extrabold tracking-wide text-white">
                        {member.name}
                        {member.twitchUrl && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ffffff] animate-pulse" />
                        )}
                      </h4>
                      <p className="text-neutral-400 text-xs font-semibold">{member.role}</p>
                    </div>

                    {/* Signature Badge */}
                    <Badge variant={isSelected ? "primary" : "secondary"} className="shrink-0 text-[9px]">
                      {member.signatureAgent.split(" / ")[0]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Character Details Dashboard (HUD specs screen) */}
          <div className="lg:col-span-7">
            <Card className="relative overflow-hidden border border-white/10 bg-[#181818]/40 p-5 shadow-[0_15px_40px_-15px_rgba(255,0,51,0.2)] backdrop-blur-xl sm:p-8">
              {/* Scanline & ambient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/10 to-[#030303]/40 pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff0033]/40 via-[#ffffff]/40 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-5">
                  <div className="flex items-center gap-4">
                    {/* Glowing Avatar Portrait */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#ff0033] shadow-[0_0_15px_rgba(255,0,51,0.4)] shrink-0 bg-[#0f0f0f] flex items-center justify-center">
                      {selectedMember.avatar ? (
                        <Image
                          src={selectedMember.avatar}
                          alt={selectedMember.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <span className="font-display text-xl font-black text-white">
                          {selectedMember.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl text-white tracking-wide uppercase">
                        {selectedMember.name}
                      </h3>
                      <p className="text-[#ffffff] font-bold text-xs tracking-widest uppercase mt-0.5">
                        {selectedMember.role}
                      </p>
                    </div>
                  </div>
                  
                  {selectedMember.twitchUrl && (
                    <a
                      href={selectedMember.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0"
                    >
                      <button className="px-4 py-2 rounded-xl bg-[#ff0033] hover:bg-[#ff0033]/90 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#ff0033]/20">
                        <Activity size={12} className="animate-pulse" /> Live Setup Specs
                      </button>
                    </a>
                  )}
                </div>

                {/* Grid Roster Specs: Bio and Game stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Specs Grid: Core Bio and Combat stats */}
                  <div className="space-y-4 text-left">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1.5">
                        Biography
                      </div>
                      <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed font-medium">
                        {selectedMember.bio}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1.5 flex items-center gap-1">
                          <Zap size={10} className="text-[#ff0033]" /> Play Style
                        </div>
                        <span className="text-white font-bold text-xs bg-[#ff0033]/10 px-2.5 py-1 rounded-lg border border-[#ff0033]/20 block text-center truncate">
                          {selectedMember.combatStyle.split(" / ")[0]}
                        </span>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1.5 flex items-center gap-1">
                          <Shield size={10} className="text-[#ffffff]" /> Agent Pick
                        </div>
                        <span className="text-white font-bold text-xs bg-[#ffffff]/10 px-2.5 py-1 rounded-lg border border-[#ffffff]/20 block text-center truncate">
                          {selectedMember.signatureAgent.split(" / ")[0]}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-1.5 flex items-center gap-1">
                        <Gamepad2 size={12} className="text-[#ff0033]" /> Primary Games
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.favoriteGamesEnriched && selectedMember.favoriteGamesEnriched.length > 0 ? (
                          selectedMember.favoriteGamesEnriched.map((game) => (
                            <span
                              key={game.name}
                              className="inline-flex items-center gap-2 text-xs bg-[#0f0f0f] border border-white/5 px-2.5 py-1 rounded-lg text-neutral-300 font-bold"
                            >
                              {game.logoUrl ? (
                                <div className="relative w-4 h-4 overflow-hidden rounded shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={game.logoUrl}
                                    alt={game.name}
                                    className="object-contain w-full h-full"
                                  />
                                </div>
                              ) : (
                                <Gamepad2 size={10} className="text-[#ff0033]" />
                              )}
                              {game.name}
                            </span>
                          ))
                        ) : (
                          selectedMember.favoriteGames.map((game) => (
                            <span
                              key={game}
                              className="inline-flex items-center gap-2 text-xs bg-[#0f0f0f] border border-white/5 px-2.5 py-1 rounded-lg text-neutral-300 font-bold"
                            >
                              <Gamepad2 size={10} className="text-[#ff0033]" />
                              {game}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Specs Grid: Hardware Specifications */}
                  <div className="bg-[#0f0f0f]/80 border border-white/5 rounded-xl p-5 space-y-4 text-left">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#ffffff] pb-2 border-b border-white/5 flex items-center gap-1.5">
                      <Monitor size={12} className="text-[#ffffff]" /> Hardware Arsenal
                    </div>

                    <div className="space-y-3 font-semibold">
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-extrabold flex items-center gap-1">
                          <Cpu size={10} className="text-[#ff0033]" /> Central Unit (CPU)
                        </div>
                        <p className="text-neutral-200 text-xs font-bold">{selectedMember.specs.cpu}</p>
                      </div>

                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-extrabold flex items-center gap-1">
                          <Zap size={10} className="text-[#ff4b5f]" /> Graphics Engine (GPU)
                        </div>
                        <p className="text-neutral-200 text-xs font-bold">{selectedMember.specs.gpu}</p>
                      </div>

                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-extrabold flex items-center gap-1">
                          <Shield size={10} className="text-[#ffffff]" /> System Memory (RAM)
                        </div>
                        <p className="text-neutral-200 text-xs font-bold">{selectedMember.specs.ram}</p>
                      </div>

                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-extrabold flex items-center gap-1">
                          <Monitor size={10} className="text-[#ff0033]" /> Gaming Display
                        </div>
                        <p className="text-neutral-200 text-xs font-bold">{selectedMember.specs.monitor}</p>
                      </div>

                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-extrabold flex items-center gap-1">
                          <Gamepad2 size={10} className="text-[#ffffff]" /> Mouse Peripheral
                        </div>
                        <p className="text-neutral-200 text-xs font-bold">{selectedMember.specs.mouse}</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </Card>
          </div>

        </div>
      </div>
    </section>
  );
};
