"use client";

import React, { useEffect, useState } from "react";

const PARTICLES = [
  { width: "15px", height: "15px", left: "10%", top: "20%", delay: "0s", duration: "7s" },
  { width: "25px", height: "25px", left: "75%", top: "15%", delay: "0.7s", duration: "9s" },
  { width: "12px", height: "12px", left: "45%", top: "80%", delay: "1.4s", duration: "6s" },
  { width: "20px", height: "20px", left: "85%", top: "65%", delay: "2.1s", duration: "8s" },
  { width: "18px", height: "18px", left: "20%", top: "70%", delay: "2.8s", duration: "5s" },
  { width: "22px", height: "22px", left: "60%", top: "40%", delay: "3.5s", duration: "10s" },
  { width: "14px", height: "14px", left: "30%", top: "10%", delay: "4.2s", duration: "7s" },
  { width: "28px", height: "28px", left: "90%", top: "30%", delay: "4.9s", duration: "8s" },
];

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setVisible(false), 500); // fade out duration
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 transition-opacity duration-500 ${
        progress === 100 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-violet-500/20 blur-sm animate-float"
            style={{
              width: particle.width,
              height: particle.height,
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
        {/* Animated Rings and Emoji */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border border-violet-500/30 animate-[spin_4s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border border-cyan-500/20 animate-[spin_6s_linear_infinite_reverse]" />
          <div className="absolute inset-4 rounded-full border border-pink-500/10 animate-[spin_8s_linear_infinite]" />
          <div className="text-5xl drop-shadow-[0_0_15px_rgba(139,92,246,0.6)] animate-pulse">
            🎮
          </div>
        </div>

        {/* Text */}
        <h1 className="font-display font-extrabold text-4xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400">
          JUST FOR FUN
        </h1>
        <p className="text-gray-400 text-sm tracking-widest uppercase mt-2">
          Gaming Channel
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-900/80 rounded-full h-1.5 mt-8 border border-white/5 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
          <div
            className="bg-gradient-to-r from-violet-500 to-cyan-500 h-full rounded-full transition-all duration-100 ease-out shadow-[0_0_8px_rgba(139,92,246,0.5)]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Status */}
        <p className="text-xs text-gray-500 tracking-wider mt-3">
          INITIALIZING SYSTEM <span className="animate-pulse">...</span>
        </p>
      </div>
    </div>
  );
};
