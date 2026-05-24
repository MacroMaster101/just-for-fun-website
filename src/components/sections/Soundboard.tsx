"use client";

import React, { useState } from "react";
import { Play, Volume2, ShieldAlert, Sparkles, Flame, Share2 } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";

interface SoundItem {
  id: string;
  name: string;
  emoji: string;
  type: "laser" | "chime" | "powerup" | "fanfare" | "buzzer" | "subbass";
  color: string;
  description: string;
}

interface CustomClip {
  id: string;
  title: string;
  duration: string;
  game: string;
  thumbnail: string;
  videoUrl: string;
  likes: number;
}

export const Soundboard = () => {
  const sounds: SoundItem[] = [
    {
      id: "sound-1",
      name: "Pew Laser",
      emoji: "💥",
      type: "laser",
      color: "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-[#ff4b5f]",
      description: "Valorant sidearm headshot",
    },
    {
      id: "sound-2",
      name: "Level Up",
      emoji: "🛡️",
      type: "powerup",
      color: "hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.18)] text-white",
      description: "Valheim base expansion complete",
    },
    {
      id: "sound-3",
      name: "Double Kill",
      emoji: "⚔️",
      type: "chime",
      color: "hover:border-[#ff4b5f] hover:shadow-[0_0_15px_rgba(255,75,95,0.25)] text-[#ff6b6b]",
      description: "Ultimate double kill combo",
    },
    {
      id: "sound-4",
      name: "Epic Victory",
      emoji: "🏆",
      type: "fanfare",
      color: "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-white",
      description: "Match Point / Victory fanfare",
    },
    {
      id: "sound-5",
      name: "Epic Fail",
      emoji: "💀",
      type: "buzzer",
      color: "hover:border-[#ff4b5f] hover:shadow-[0_0_15px_rgba(255,75,95,0.25)] text-[#ff4b5f]",
      description: "Troll smashed our builds",
    },
    {
      id: "sound-6",
      name: "Sub Bass Drop",
      emoji: "🔊",
      type: "subbass",
      color: "hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.18)] text-white",
      description: "Dynamic gaming clutch mode drop",
    },
  ];

  const highlights: CustomClip[] = [
    {
      id: "clip-1",
      title: "EPIC 1v5 Jett Clutch in Valorant Ranked! 🏆",
      duration: "0:45",
      game: "Valorant",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      likes: 142,
    },
    {
      id: "clip-2",
      title: "When Trolls Invaded Our Valheim Castle (FAIL) 💀🔥",
      duration: "1:12",
      game: "Valheim",
      thumbnail: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://www.youtube.com/watch?v=F3XN-V7p2W0",
      likes: 98,
    },
    {
      id: "clip-3",
      title: "Chasing 300kmh on GTA V Highway! 🏎️💨",
      duration: "0:58",
      game: "GTA V",
      thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80",
      videoUrl: "https://www.youtube.com/watch?v=k85mRPQMb14",
      likes: 187,
    },
  ];

  const [lovedClips, setLovedClips] = useState<Record<string, boolean>>({});
  const [clipLikes, setClipLikes] = useState<Record<string, number>>({});

  const getAudioContextClass = () =>
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  // Web Audio Synthesizer for high-fidelity custom gaming sound effects
  const playSynthesizedSound = (type: string) => {
    if (typeof window === "undefined") return;
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "laser") {
        // Laser Gun Shoot Effect
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "chime") {
        // Double Kill High bell chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.2); // D6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "powerup") {
        // Arpeggiated Level Up sound
        osc.type = "triangle";
        osc.frequency.setValueAtTime(261.63, now); // C4
        osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
        osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.24); // C5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === "fanfare") {
        // Epic game victory trumpet
        osc.type = "square";
        osc.frequency.setValueAtTime(392.00, now); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.12); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.24); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.36); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === "buzzer") {
        // Sad retro failure buzz
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.65);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);
        osc.start(now);
        osc.stop(now + 0.75);
      } else if (type === "subbass") {
        // Deep kinetic gaming bass drop
        osc.type = "sine";
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.9);
      }
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  };

  const handleLoveClip = (clipId: string, initialLikes: number) => {
    const wasLoved = lovedClips[clipId];
    setLovedClips((prev) => ({ ...prev, [clipId]: !wasLoved }));
    setClipLikes((prev) => ({
      ...prev,
      [clipId]: (prev[clipId] ?? initialLikes) + (wasLoved ? -1 : 1),
    }));
  };

  return (
    <section id="arena" className="relative py-24 bg-[#060606] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-[#ff0033] filter drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">🔥</span> Highlights & Sound Arena
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Click to trigger stream audio effects or enjoy community clutch highlights!
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Stream Soundboard (Synth Audio) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                <Volume2 className="text-[#ff0033]" /> Crew Soundboard
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Synthesized 8-bit sound effects using your browser&apos;s Audio Engine. Perfect for gaming streams!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => playSynthesizedSound(sound.type)}
                  className={`p-5 rounded-lg border border-white/10 bg-[#181818]/70 backdrop-blur-md text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer group hover:bg-[#202020]/70 active:scale-95 ${sound.color}`}
                >
                  <span className="text-3xl transition-transform duration-300 group-hover:scale-125">
                    {sound.emoji}
                  </span>
                  <div className="space-y-0.5">
                    <span className="block font-display font-bold text-xs text-white uppercase tracking-wider">
                      {sound.name}
                    </span>
                    <span className="block text-[9px] text-neutral-500 line-clamp-1">
                      {sound.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-[#181818]/60 border border-white/10 rounded-lg p-4 flex items-center gap-3">
              <ShieldAlert className="text-[#ff0033] shrink-0" size={18} />
              <p className="text-[10px] text-neutral-400 leading-normal">
                These soundboards generate sounds on-the-fly inside your browser. Try clicking multiple keys rapidly to create intense, glitchy stream build-ups!
              </p>
            </div>
          </div>

          {/* Right Column: Mini Highlights Arena */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                <Sparkles className="text-[#ff4b5f]" /> Community Highlights
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Check out trending funny stream moments and epic plays!
              </p>
            </div>

            <div className="space-y-4">
              {highlights.map((clip) => {
                const isLoved = lovedClips[clip.id];
                const activeLikes = clipLikes[clip.id] ?? clip.likes;
                return (
                  <Card
                    key={clip.id}
                    className="p-4 border border-white/10 bg-[#181818]/70 hover:border-[#ff0033]/25 transition-all duration-300 flex gap-4 items-center"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-28 aspect-video rounded-lg overflow-hidden border border-white/5 shrink-0 bg-neutral-900 group">
                      <Image
                        src={clip.thumbnail}
                        alt={clip.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                      <a
                        href={clip.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-[#000]/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Play size={16} className="text-white fill-white" />
                      </a>
                      <span className="absolute bottom-1 right-1 bg-black/85 text-[8px] font-bold text-[#ffffff] px-1.5 py-0.5 rounded image-overlay-badge">
                        {clip.duration}
                      </span>
                    </div>

                    {/* Clip details */}
                    <div className="flex-grow space-y-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
                          {clip.game}
                        </span>
                        <h4 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 leading-snug mt-1.5">
                          {clip.title}
                        </h4>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-4 text-[10px] text-neutral-500">
                        <button
                          onClick={() => handleLoveClip(clip.id, clip.likes)}
                          className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                            isLoved ? "text-[#ff0033]" : "hover:text-neutral-300"
                          }`}
                        >
                          <Flame size={12} className={isLoved ? "fill-[#ff0033] text-[#ff0033]" : ""} />
                          {activeLikes} Lit
                        </button>

                        <a
                          href={clip.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 hover:text-neutral-300 font-bold"
                        >
                          <Share2 size={12} />
                          Share Link
                        </a>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
