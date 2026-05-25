"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Lock,
  Unlock,
  Crosshair,
  Sword,
  Car,
  Skull,
  Headphones,
  Gamepad2,
  Flame,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ChallengeItem {
  id: number;
  text: string;
  game: string;
  difficulty: "Easy" | "Medium" | "Hard" | "IMPOSSIBLE";
}

const DIFFICULTY_STYLES: Record<ChallengeItem["difficulty"], string> = {
  Easy: "text-[#22c55e] bg-[#22c55e]/15 border-[#22c55e]/40",
  Medium: "text-[#eab308] bg-[#eab308]/15 border-[#eab308]/40",
  Hard: "text-[#ff4b5f] bg-[#ff4b5f]/15 border-[#ff4b5f]/40",
  IMPOSSIBLE: "text-[#ff4757] bg-[#ff4757]/20 border-[#ff4757]/50",
};

// Game → icon + accent color (icon reel)
const GAME_META: Record<string, { Icon: React.ComponentType<{ size?: number; className?: string }>; tint: string; bg: string }> = {
  Valorant: { Icon: Crosshair, tint: "text-[#ff4655]", bg: "bg-[#ff4655]/10" },
  Valheim: { Icon: Sword, tint: "text-[#a78bfa]", bg: "bg-[#a78bfa]/10" },
  "GTA V": { Icon: Car, tint: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
  Survival: { Icon: Skull, tint: "text-[#f97316]", bg: "bg-[#f97316]/10" },
  "Stream Vibe": { Icon: Headphones, tint: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10" },
  "Any Game": { Icon: Gamepad2, tint: "text-white", bg: "bg-white/5" },
  "FPS Any": { Icon: Target, tint: "text-[#ff4b5f]", bg: "bg-[#ff4b5f]/10" },
  "Viewer Special": { Icon: Flame, tint: "text-[#ff0033]", bg: "bg-[#ff0033]/10" },
};

const CHALLENGES: ChallengeItem[] = [
  { id: 1, text: "Pistols Only for 1 Full Match", game: "Valorant", difficulty: "Hard" },
  { id: 2, text: "No Armor for the Whole Expedition", game: "Valheim", difficulty: "Medium" },
  { id: 3, text: "Invert Mouse Y-Axis for 1 Round", game: "Valorant", difficulty: "IMPOSSIBLE" },
  { id: 4, text: "First-Person Driving Only", game: "GTA V", difficulty: "Easy" },
  { id: 5, text: "No Jumping for 10 Minutes", game: "Any Game", difficulty: "Medium" },
  { id: 6, text: "Whisper Like Horror ASMR for 5 mins", game: "Stream Vibe", difficulty: "Easy" },
  { id: 7, text: "Unbind the Use Key — No Looting", game: "Survival", difficulty: "Hard" },
  { id: 8, text: "Play with Screen Upside Down", game: "Viewer Special", difficulty: "IMPOSSIBLE" },
  { id: 9, text: "Knife-Only Eliminations Only", game: "Valorant", difficulty: "Hard" },
  { id: 10, text: "Speak Only in Movie Quotes for 1 Match", game: "Stream Vibe", difficulty: "Medium" },
  { id: 11, text: "Sensitivity Bumped to 10x for 1 Round", game: "FPS Any", difficulty: "IMPOSSIBLE" },
  { id: 12, text: "Crouch-Walk Everywhere for 10 min", game: "Any Game", difficulty: "Easy" },
  { id: 13, text: "No Minimap Allowed", game: "GTA V", difficulty: "Medium" },
  { id: 14, text: "Use Only the Worst Weapon in Inventory", game: "Survival", difficulty: "Hard" },
  { id: 15, text: "Sing Every Callout for 1 Match", game: "Valorant", difficulty: "Medium" },
  { id: 16, text: "No HUD Mode — Hide Health & Ammo", game: "FPS Any", difficulty: "Hard" },
  { id: 17, text: "Drive Only in Reverse Wherever Possible", game: "GTA V", difficulty: "Medium" },
  { id: 18, text: "Speedrun Solo Boss with No Heals", game: "Valheim", difficulty: "IMPOSSIBLE" },
  { id: 19, text: "One-Handed Keyboard Only", game: "Viewer Special", difficulty: "Hard" },
  { id: 20, text: "Hot Sauce Penalty on Every Death", game: "Stream Vibe", difficulty: "Easy" },
  { id: 21, text: "Switch Chair Every 60 Seconds", game: "Stream Vibe", difficulty: "Easy" },
  { id: 22, text: "Only Communicate with Soundboard", game: "Stream Vibe", difficulty: "Medium" },
  { id: 23, text: "No Sprint, No Crouch, No Jump", game: "Any Game", difficulty: "IMPOSSIBLE" },
  { id: 24, text: "Build Your Base Blindfolded for 2 min", game: "Valheim", difficulty: "Hard" },
];

const REEL_ITEM_HEIGHT = 88; // px
const REEL_REPEATS = 10;
const REEL_DURATIONS = [2.6, 3.2, 3.8]; // seconds — each reel stops sequentially

// ─── Audio helpers ──────────────────────────────────────────────────────
const getAudioContextClass = () =>
  typeof window !== "undefined"
    ? window.AudioContext ||
      (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    : undefined;

const tick = () => {
  const AC = getAudioContextClass();
  if (!AC) return;
  try {
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(820, ctx.currentTime);
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.05);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
};

const reelStop = () => {
  const AC = getAudioContextClass();
  if (!AC) return;
  try {
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
};

const jackpot = () => {
  const AC = getAudioContextClass();
  if (!AC) return;
  try {
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t + 0.08);
    osc.frequency.setValueAtTime(784, t + 0.16);
    osc.frequency.setValueAtTime(1046, t + 0.24);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start();
    osc.stop(t + 0.55);
  } catch {}
};

// ─── Reel ───────────────────────────────────────────────────────────────
interface ReelProps {
  items: ChallengeItem[];
  targetIndex: number;
  spinning: boolean;
  duration: number;
  renderCell: (item: ChallengeItem) => React.ReactNode;
  onStop?: () => void;
}

const Reel: React.FC<ReelProps> = ({ items, targetIndex, spinning, duration, renderCell, onStop }) => {
  // Build the long strip
  const strip = useMemo(() => {
    const out: ChallengeItem[] = [];
    for (let i = 0; i < REEL_REPEATS; i++) out.push(...items);
    return out;
  }, [items]);

  const offset = useMemo(() => {
    if (targetIndex < 0) return 0;
    const landingRepeat = REEL_REPEATS - 2;
    const flatIndex = landingRepeat * items.length + targetIndex;
    // Center the landing item in the 3-row visible window (row index 1).
    return (flatIndex - 1) * REEL_ITEM_HEIGHT;
  }, [items.length, targetIndex]);

  useEffect(() => {
    if (!spinning) return;

    const timeout = setTimeout(() => {
      reelStop();
      onStop?.();
    }, duration * 1000);

    return () => clearTimeout(timeout);
    // We deliberately re-run only when spinning flips on; targetIndex is
    // captured at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]);

  return (
    <div
      className="slot-reel relative overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] border border-white/10 rounded-xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]"
      style={{ height: REEL_ITEM_HEIGHT * 3 }}
    >
      {/* Subtle inner highlight on top half */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-10" />
      {/* Soft fade masks — light enough that adjacent rows are still readable */}
      <div className="slot-reel-mask-top absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#0a0a0a]/80 to-transparent pointer-events-none z-20" />
      <div className="slot-reel-mask-bottom absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#0a0a0a]/80 to-transparent pointer-events-none z-20" />

      {/* Strip */}
      <div
        style={{
          transform: `translateY(-${offset}px)`,
          transition: spinning ? `transform ${duration}s cubic-bezier(0.16, 0.84, 0.24, 1)` : "none",
        }}
        className="will-change-transform"
      >
        {strip.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            style={{ height: REEL_ITEM_HEIGHT }}
            className="flex items-center justify-center px-3 border-b border-white/[0.04]"
          >
            {renderCell(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main section ───────────────────────────────────────────────────────
export const ChallengeWheel = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<ChallengeItem | null>(null);
  const [locked, setLocked] = useState(false);
  const [targetIndex, setTargetIndex] = useState(-1);
  const [pulled, setPulled] = useState(false);
  const [spinCount, setSpinCount] = useState(0);
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const reportToDiscord = async () => {
    if (!result || reportStatus === "sending" || reportStatus === "sent") return;
    setReportStatus("sending");
    try {
      const res = await fetch("/api/discord/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: result.id,
          text: result.text,
          game: result.game,
          difficulty: result.difficulty,
        }),
      });
      if (!res.ok) throw new Error("Discord report failed");
      setReportStatus("sent");
      // Auto-reset after a few seconds so the user could re-report a new spin.
      setTimeout(() => setReportStatus("idle"), 4000);
    } catch (err) {
      console.error(err);
      setReportStatus("error");
      setTimeout(() => setReportStatus("idle"), 4000);
    }
  };

  const spin = () => {
    if (isSpinning || locked) return;
    const next = Math.floor(Math.random() * CHALLENGES.length);
    setIsSpinning(true);
    setResult(null);
    setTargetIndex(next);
    setPulled(true);
    setSpinCount((c) => c + 1);
    setReportStatus("idle");
    // Hold the lever down for most of the spin, then let it spring back up
    // just before the reels finish locking in.
    setTimeout(() => setPulled(false), 2800);
    setTimeout(() => {
      setIsSpinning(false);
      setResult(CHALLENGES[next]);
      jackpot();
    }, Math.max(...REEL_DURATIONS) * 1000);

    // Tick sounds during the spin
    let ticks = 0;
    const tickInterval = setInterval(() => {
      if (ticks < 32) {
        tick();
        ticks++;
      } else {
        clearInterval(tickInterval);
      }
    }, 100);
  };

  const clearResult = () => {
    setResult(null);
    setTargetIndex(-1); // signals reels to reset
    setReportStatus("idle");
  };

  return (
    <section id="wheel" className="relative py-24 bg-[#060606] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#ff0033]/8 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-[#ff0033] filter drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">🎰</span>{" "}
            Challenge Slot
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Pull the lever — three reels lock in your handicap for the next live match.
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-stretch max-w-6xl mx-auto">
          {/* Slot Machine Cabinet — nudged left on lg+ so the lever has breathing room */}
          <div className="lg:col-span-7 flex items-center justify-center lg:justify-start">
            <div className="relative">
              {/* Cabinet outer frame — brushed metal look */}
              <div className="slot-cabinet relative rounded-[28px] p-5 sm:p-7 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8),inset_0_2px_0_rgba(255,255,255,0.08)] border border-white/[0.08]">
                {/* Marquee lights — running around the cabinet edge */}
                <div className="absolute inset-x-6 top-2 flex justify-between pointer-events-none">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <span
                      key={i}
                      className="block w-1.5 h-1.5 rounded-full bg-[#ff0033]"
                      style={{
                        boxShadow: "0 0 8px rgba(255,0,51,0.9)",
                        opacity: isSpinning ? (i % 2 === 0 ? 1 : 0.3) : 0.85,
                        animation: isSpinning ? `marquee-blink 0.4s ${i * 0.04}s infinite alternate` : undefined,
                      }}
                    />
                  ))}
                </div>

                {/* Marquee header */}
                <div className="text-center mb-4 pt-3">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff0033]/20 via-[#ff4b5f]/30 to-[#ff0033]/20 border border-[#ff0033]/40">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white drop-shadow-[0_0_8px_rgba(255,0,51,0.8)]">
                      ★ Challenge Slot ★
                    </span>
                  </div>
                </div>

                {/* Inner display — black glass behind the reels */}
                <div className="slot-display relative rounded-2xl bg-black p-3 sm:p-4 border border-white/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.9)]">
                  {/* Selection highlight bar — overlays the center row across all 3 reels */}
                  <div
                    className="absolute left-3 right-3 sm:left-4 sm:right-4 z-30 pointer-events-none border-y-2 border-[#ff0033]/70 bg-gradient-to-r from-[#ff0033]/[0.08] via-[#ff4b5f]/[0.05] to-[#ff0033]/[0.08] shadow-[0_0_30px_rgba(255,0,51,0.4),inset_0_0_20px_rgba(255,0,51,0.15)]"
                    style={{
                      top: `calc(${REEL_ITEM_HEIGHT}px + 0.75rem)`,
                      height: REEL_ITEM_HEIGHT,
                    }}
                  />
                  {/* Selection indicator arrows */}
                  <div
                    className="absolute left-1 z-30 pointer-events-none"
                    style={{ top: `calc(${REEL_ITEM_HEIGHT}px + ${REEL_ITEM_HEIGHT / 2}px + 0.75rem - 8px)` }}
                  >
                    <div className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[10px] border-l-[#ff0033] drop-shadow-[0_0_6px_rgba(255,0,51,0.9)]" />
                  </div>
                  <div
                    className="absolute right-1 z-30 pointer-events-none"
                    style={{ top: `calc(${REEL_ITEM_HEIGHT}px + ${REEL_ITEM_HEIGHT / 2}px + 0.75rem - 8px)` }}
                  >
                    <div className="w-0 h-0 border-y-[8px] border-y-transparent border-r-[10px] border-r-[#ff0033] drop-shadow-[0_0_6px_rgba(255,0,51,0.9)]" />
                  </div>

                  {/* Three reels */}
                  <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 sm:gap-3 relative">
                    {/* Reel 1 — game icon */}
                    <Reel
                      items={CHALLENGES}
                      targetIndex={targetIndex}
                      spinning={isSpinning}
                      duration={REEL_DURATIONS[0]}
                      renderCell={(item) => {
                        const meta = GAME_META[item.game] ?? GAME_META["Any Game"];
                        const Icon = meta.Icon;
                        return (
                          <div className={`w-full h-full flex flex-col items-center justify-center gap-1 rounded-lg ${meta.bg}`}>
                            <Icon size={28} className={meta.tint} />
                            <span className={`text-[9px] font-black uppercase tracking-wider ${meta.tint} leading-tight text-center`}>
                              {item.game}
                            </span>
                          </div>
                        );
                      }}
                    />

                    {/* Reel 2 — challenge text */}
                    <Reel
                      items={CHALLENGES}
                      targetIndex={targetIndex}
                      spinning={isSpinning}
                      duration={REEL_DURATIONS[1]}
                      renderCell={(item) => (
                        <div className="w-full h-full flex flex-col items-center justify-center text-center px-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-1">
                            #{String(item.id).padStart(2, "0")}
                          </span>
                          <span className="slot-reel-text font-display text-[11px] sm:text-xs font-bold text-white leading-tight line-clamp-2">
                            {item.text}
                          </span>
                        </div>
                      )}
                    />

                    {/* Reel 3 — difficulty badge */}
                    <Reel
                      items={CHALLENGES}
                      targetIndex={targetIndex}
                      spinning={isSpinning}
                      duration={REEL_DURATIONS[2]}
                      renderCell={(item) => (
                        <div className="w-full h-full flex items-center justify-center">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border tracking-wider ${DIFFICULTY_STYLES[item.difficulty]}`}
                          >
                            {item.difficulty}
                          </span>
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* Cabinet footer — credits + spin counter */}
                <div className="flex items-center justify-between mt-4 px-2 pb-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setLocked((v) => !v)}
                      title={locked ? "Unlock the reel" : "Lock the reel"}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer ${
                        locked
                          ? "border-[#ff0033]/40 bg-[#ff0033]/10 text-[#ff4b5f]"
                          : "border-white/10 bg-white/[0.02] text-neutral-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {locked ? <Lock size={11} /> : <Unlock size={11} />}
                      {locked ? "Locked" : "Unlocked"}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-neutral-500">Spins</span>
                    <span className="font-mono text-xs font-black text-[#ff4b5f] px-2 py-0.5 rounded bg-black border border-[#ff0033]/30 shadow-[inset_0_0_8px_rgba(255,0,51,0.2)] min-w-[44px] text-center">
                      {String(spinCount).padStart(4, "0")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side lever — swings vertically (top → bottom) around a pivot at its base */}
              <div
                className="hidden lg:block absolute"
                style={{ right: -52, top: "50%", transform: "translateY(-50%)", width: 60, height: 260 }}
              >
                {/* Mounting plate — visually attaches the pivot base to the cabinet's right edge */}
                <div className="absolute left-0 bottom-6 w-6 h-14 rounded-r-lg bg-gradient-to-r from-[#1a1a1a] to-[#333] border-y border-r border-black/60 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.6),2px_0_6px_rgba(0,0,0,0.5)]" />

                {/* Pivot bolt at the BOTTOM (so the arm swings down around it) */}
                <div
                  className="absolute z-20 w-7 h-7 rounded-full bg-gradient-to-br from-[#666] via-[#333] to-[#111] border border-black/60 shadow-[inset_0_-2px_3px_rgba(0,0,0,0.7),inset_0_2px_3px_rgba(255,255,255,0.2),0_2px_6px_rgba(0,0,0,0.7)]"
                  style={{ left: 14, bottom: 16 }}
                >
                  <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-[#222] to-[#0a0a0a] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#ff0033] shadow-[0_0_4px_rgba(255,0,51,0.9)]" />
                  </div>
                </div>

                <button
                  onClick={spin}
                  disabled={isSpinning || locked}
                  title="Pull the lever"
                  className="group absolute inset-0 cursor-pointer disabled:cursor-not-allowed bg-transparent border-0 p-0"
                  aria-label="Spin the slot"
                >
                  {/* Lever arm — pivot at the BOTTOM-CENTER of the arm.
                      Rest state: 0deg = arm points straight UP (ball at top).
                      Pulled state: 110deg = arm swings forward-down (ball low). */}
                  <div
                    className="absolute"
                    style={{
                      // Pivot point matches the bolt center: left=14+3.5=17.5, bottom=16+3.5=19.5
                      left: 17.5,
                      bottom: 19.5,
                      width: 14, // arm thickness
                      height: 180, // arm length (vertical)
                      transform: `translateX(-50%) rotate(${pulled ? 110 : 0}deg)`,
                      transformOrigin: "50% 100%",
                      transition: pulled
                        ? "transform 240ms cubic-bezier(.4,.05,.6,1)"
                        : "transform 750ms cubic-bezier(.34,1.56,.64,1)",
                    }}
                  >
                    {/* Shaft (vertical) */}
                    <div className="absolute inset-x-1 top-7 bottom-1 rounded-full bg-gradient-to-r from-[#444] via-[#bbb] to-[#444] shadow-[inset_-2px_0_3px_rgba(0,0,0,0.5),inset_1px_0_2px_rgba(255,255,255,0.4)]" />

                    {/* Lever ball at the TOP of the arm */}
                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full transition-colors ${
                        isSpinning || locked
                          ? "bg-gradient-to-br from-neutral-500 to-neutral-700"
                          : "bg-gradient-to-br from-[#ff7a8e] via-[#ff0033] to-[#7a0018] group-hover:from-[#ff8a9e]"
                      }`}
                      style={{
                        boxShadow:
                          isSpinning || locked
                            ? "0 4px 10px rgba(0,0,0,0.5), inset 0 -4px 8px rgba(0,0,0,0.4), inset 0 3px 5px rgba(255,255,255,0.25)"
                            : "0 4px 16px rgba(255,0,51,0.65), inset 0 -4px 8px rgba(0,0,0,0.45), inset 0 3px 5px rgba(255,255,255,0.5)",
                      }}
                    >
                      {/* Highlight gleam */}
                      <div className="absolute top-1.5 left-2 w-3 h-2 rounded-full bg-white/50 blur-[2px]" />
                    </div>
                  </div>
                </button>

                {/* Status label — solid red pill, readable in both light and dark mode */}
                <div
                  className="slot-status-pill absolute left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-black whitespace-nowrap pointer-events-none"
                  style={{ bottom: -22 }}
                  data-state={isSpinning ? "spinning" : locked ? "locked" : "idle"}
                >
                  {isSpinning ? "Spinning…" : locked ? "Locked" : "Pull ↓"}
                </div>
              </div>

              {/* Mobile/tablet spin button — replaces the side lever below lg */}
              <div className="lg:hidden mt-5 flex justify-center">
                <button
                  onClick={spin}
                  disabled={isSpinning || locked}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-[#ff0033] to-[#b30024] text-white font-display font-black uppercase tracking-widest text-sm shadow-[0_8px_24px_rgba(255,0,51,0.45)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:scale-105 transition-transform"
                >
                  {isSpinning ? "Spinning..." : locked ? "Locked" : "Pull Lever"}
                </button>
              </div>
            </div>
          </div>

          {/* Verdict Card */}
          <div className="lg:col-span-5">
            <Card className="border border-white/10 bg-[#181818]/70 backdrop-blur-xl p-8 relative overflow-hidden h-full flex flex-col justify-center shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff0033]/10 blur-xl pointer-events-none rounded-full animate-pulse" />

              <div className="space-y-6 relative z-10">
                <div className="space-y-1.5 border-b border-white/5 pb-4">
                  <h3 className="font-display font-extrabold text-xl text-white tracking-wide uppercase flex items-center gap-2">
                    <Sparkles className="text-[#ff0033]" /> Terminal Verdict
                  </h3>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-bold">
                    System handicaps &amp; challenges
                  </p>
                </div>

                {isSpinning ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-[#ff0033]/25 border-t-[#ff0033] rounded-full animate-spin" />
                    <p className="text-neutral-400 text-xs uppercase tracking-wider animate-pulse">
                      Reels locking in...
                    </p>
                  </div>
                ) : result ? (
                  <div className="space-y-5 animate-float">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-lg border border-white/20 bg-white/10 text-white tracking-wider">
                        {result.game}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border ${DIFFICULTY_STYLES[result.difficulty]}`}
                      >
                        {result.difficulty}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                        Assigned Penalty
                      </div>
                      <h4 className="font-display font-black text-xl sm:text-2xl text-white tracking-wide uppercase leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        &quot;{result.text}&quot;
                      </h4>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={reportToDiscord}
                        disabled={reportStatus === "sending" || reportStatus === "sent"}
                        className={`flex-grow py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:cursor-default ${
                          reportStatus === "sent"
                            ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
                            : reportStatus === "error"
                            ? "border-[#ff4b5f]/40 bg-[#ff4b5f]/10 text-[#ff4b5f]"
                            : reportStatus === "sending"
                            ? "border-white/10 bg-white/[0.05] text-neutral-400"
                            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 text-neutral-300"
                        }`}
                      >
                        {reportStatus === "sending"
                          ? "Sending to Discord…"
                          : reportStatus === "sent"
                          ? "✓ Posted to #challenge-gaming-content"
                          : reportStatus === "error"
                          ? "✕ Failed — try again"
                          : "Post to Discord Chat"}
                      </button>
                      <button
                        onClick={clearResult}
                        title="Clear result"
                        className="p-2.5 rounded-xl border border-[#ff0033]/20 bg-[#ff0033]/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:text-white transition-all cursor-pointer"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#0f0f0f] border border-white/10 flex items-center justify-center text-neutral-400 mx-auto">
                      <AlertTriangle size={20} className="text-[#ff0033]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-white text-sm">No Active Penalty</h4>
                      <p className="text-neutral-400 text-xs max-w-sm mx-auto leading-relaxed">
                        Pull the lever to spin the {CHALLENGES.length}-challenge reels and load a random
                        handicap into the crew&apos;s next live match.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-blink {
          from { opacity: 1; }
          to { opacity: 0.2; }
        }
      `}</style>
    </section>
  );
};
