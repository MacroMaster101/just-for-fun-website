"use client";

import React, { useState } from "react";
import { Sparkles, Trophy, Shuffle, RotateCcw, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ChallengeItem {
  id: number;
  text: string;
  game: string;
  difficulty: "Easy" | "Medium" | "Hard" | "IMPOSSIBLE";
  difficultyColor: string;
}

export const ChallengeWheel = () => {
  const challenges: ChallengeItem[] = [
    { id: 1, text: "Pistols Only for 1 Full Match", game: "Valorant", difficulty: "Hard", difficultyColor: "text-[#ff4b5f] bg-[#ff4b5f]/10 border-[#ff4b5f]/20" },
    { id: 2, text: "No Armor Allowed this expedition", game: "Valheim", difficulty: "Medium", difficultyColor: "text-white bg-white/10 border-white/20" },
    { id: 3, text: "Invert mouse coordinates for 1 round", game: "Valorant", difficulty: "IMPOSSIBLE", difficultyColor: "text-[#ff4757] bg-[#ff4757]/10 border-[#ff4757]/20" },
    { id: 4, text: "First-Person Driving Only", game: "GTA V", difficulty: "Easy", difficultyColor: "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20" },
    { id: 5, text: "No Jumping permitted for 10 minutes", game: "Any Game", difficulty: "Medium", difficultyColor: "text-[#eab308] bg-[#eab308]/10 border-[#eab308]/20" },
    { id: 6, text: "Whisper like a horror ASMR for 5 mins", game: "Stream Vibe", difficulty: "Easy", difficultyColor: "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20" },
    { id: 7, text: "Unbind the Use Key (No looting / opening)", game: "Survival", difficulty: "Hard", difficultyColor: "text-[#ff4b5f] bg-[#ff4b5f]/10 border-[#ff4b5f]/20" },
    { id: 8, text: "Complete next quest with screen upside down", game: "Viewer Special", difficulty: "IMPOSSIBLE", difficultyColor: "text-[#ff4757] bg-[#ff4757]/10 border-[#ff4757]/20" },
  ];

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<ChallengeItem | null>(null);

  const getAudioContextClass = () =>
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  const synthTick = () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  const spinTheWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // Pick a random index
    const randomIndex = Math.floor(Math.random() * challenges.length);
    const degreesPerSlice = 360 / challenges.length;
    
    // Set a rotation containing multiple full spins (e.g. 5-8 spins) + target slice offset
    // Target degrees is centered in the slice.
    // CSS rotation: target slice will line up with top pointer.
    // The top pointer is at 0 degrees.
    const sliceAngle = randomIndex * degreesPerSlice;
    // Align center of slice:
    const finalAngle = 360 - sliceAngle + (degreesPerSlice / 2);
    const newRotation = rotation + (360 * 6) + finalAngle - (rotation % 360);

    setRotation(newRotation);

    // Simulated ticking sound during spinning
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      if (tickCount < 25) {
        synthTick();
        tickCount++;
      } else {
        clearInterval(tickInterval);
      }
    }, 120);

    setTimeout(() => {
      setIsSpinning(false);
      setResult(challenges[randomIndex]);
      
      // Play a success sound
      if (typeof window !== "undefined") {
        try {
          const AudioContextClass = getAudioContextClass();
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "triangle";
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.16);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
          }
        } catch {}
      }
    }, 3000); // 3 seconds spin duration
  };

  return (
    <section id="wheel" className="relative py-24 bg-[#060606] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-[#ff0033] filter drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">🎡</span> Challenge Wheel
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Viewer Interaction Module: Roll random funny handicaps for the stream!
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
          
          {/* Left Column: Visual Canvas Wheel */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            
            {/* Outer neon wheel boundary */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border-4 border-[#ff0033]/25 p-1 bg-[#181818]/80 shadow-[0_0_40px_rgba(255,0,51,0.2)] flex items-center justify-center">
              
              {/* Pointer indicator */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#ff0033] z-30 drop-shadow-[0_0_8px_rgba(255,0,51,0.8)] filter animate-pulse" />
              
              {/* Center cap element */}
              <div className="absolute w-12 h-12 rounded-full bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] bg-[length:200%_auto] animate-aurora-shift z-20 flex items-center justify-center border-2 border-white/20 shadow-lg shadow-black/80">
                <Trophy size={16} className="text-white" />
              </div>

              {/* Slices container */}
              <div
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? "transform 3.0s cubic-bezier(0.15, 0.95, 0.35, 1.0)" : "none",
                }}
                className="w-full h-full rounded-full overflow-hidden relative"
              >
                {challenges.map((item, idx) => {
                  const angle = 360 / challenges.length;
                  const rotateAngle = idx * angle;
                  return (
                    <div
                      key={item.id}
                      style={{
                        transform: `rotate(${rotateAngle}deg)`,
                        transformOrigin: "50% 50%",
                      }}
                      className="absolute inset-0 flex justify-center text-center pt-6 origin-center"
                    >
                      {/* Divider lines radiating from center */}
                      <div
                        style={{ transform: `rotate(${angle / 2}deg)` }}
                        className="absolute inset-y-0 left-1/2 w-[1px] bg-white/10 origin-center"
                      />
                      
                      {/* Indicator text placed in slice */}
                      <span className="font-display font-black text-[9px] uppercase tracking-wider text-neutral-300 w-12 text-center break-words select-none leading-tight relative z-10 block mt-2">
                        {item.game.split(" ")[0]} #{item.id}
                      </span>
                    </div>
                  );
                })}

                {/* Alternating shaded slice backgrounds */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#ff0033]/10 to-transparent pointer-events-none rounded-full" />
              </div>

            </div>

            {/* Spin CTA Button */}
            <div className="mt-8">
              <Button
                onClick={spinTheWheel}
                disabled={isSpinning}
                glow
                variant="aurora"
                size="lg"
                className="gap-2 px-10 cursor-pointer"
              >
                <Shuffle size={16} className={isSpinning ? "animate-spin" : ""} />
                {isSpinning ? "Selecting Destiny..." : "Spin Operator Wheel"}
              </Button>
            </div>
          </div>

          {/* Right Column: Result Screen & Details */}
          <div className="lg:col-span-6">
            <Card className="border border-white/10 bg-[#181818]/70 backdrop-blur-xl p-8 relative overflow-hidden h-full flex flex-col justify-center shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
              
              {/* Visual dashboard aesthetic */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff0033]/10 blur-xl pointer-events-none rounded-full animate-pulse" />
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-1.5 border-b border-white/5 pb-4">
                  <h3 className="font-display font-extrabold text-xl text-white tracking-wide uppercase flex items-center gap-2">
                    <Sparkles className="text-[#ff0033]" /> Terminal Verdict
                  </h3>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-bold">
                    System handicaps & challenges
                  </p>
                </div>

                {isSpinning ? (
                  /* Spinning State View */
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-[#ff0033]/25 border-t-[#ff0033] rounded-full animate-spin" />
                    <p className="text-neutral-400 text-xs uppercase tracking-wider animate-pulse">
                      Analyzing stream matrix...
                    </p>
                  </div>
                ) : result ? (
                  /* Result Unveiled State */
                  <div className="space-y-5 animate-float">
                    <div className="flex items-center gap-3">
                      <span className="text-xs uppercase font-extrabold px-3 py-1 rounded-lg border border-white/20 bg-white/10 text-white tracking-wider">
                        {result.game}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border ${result.difficultyColor}`}>
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
                      <a
                        href="https://discord.gg/YGEKC2xazD"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-grow"
                      >
                        <button className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 text-neutral-300 text-xs font-bold transition-all cursor-pointer">
                          Report to Discord Chat
                        </button>
                      </a>
                      
                      <button
                        onClick={() => setResult(null)}
                        className="p-2.5 rounded-xl border border-[#ff0033]/20 bg-[#ff0033]/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:text-white transition-all cursor-pointer"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Initial State View */
                  <div className="py-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#0f0f0f] border border-white/10 flex items-center justify-center text-neutral-400 mx-auto">
                      <AlertTriangle size={20} className="text-[#ff0033]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-white text-sm">
                        No Active Penalty
                      </h4>
                      <p className="text-neutral-400 text-xs max-w-sm mx-auto leading-relaxed">
                        Spin the operator wheel to generate a random challenge or extreme handicap for the crew&apos;s next live match!
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </Card>
          </div>

        </div>

      </div>
    </section>
  );
};
