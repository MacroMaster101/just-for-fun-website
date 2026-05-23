"use client";

import React, { useEffect, useState } from "react";

const PARTICLES = [
  { width: "15px", height: "15px", left: "10%", top: "20%", delay: "0s", duration: "7s", color: "bg-[#ff0033]/20 shadow-[0_0_10px_rgba(255,0,51,0.2)]" },
  { width: "25px", height: "25px", left: "75%", top: "15%", delay: "0.7s", duration: "9s", color: "bg-[#ffffff]/20 shadow-[0_0_12px_rgba(255,255,255,0.2)]" },
  { width: "12px", height: "12px", left: "45%", top: "80%", delay: "1.4s", duration: "6s", color: "bg-[#ff4b5f]/20 shadow-[0_0_8px_rgba(255,75,95,0.2)]" },
  { width: "20px", height: "20px", left: "85%", top: "65%", delay: "2.1s", duration: "8s", color: "bg-[#ff0033]/20 shadow-[0_0_10px_rgba(255,0,51,0.2)]" },
  { width: "18px", height: "18px", left: "20%", top: "70%", delay: "2.8s", duration: "5s", color: "bg-[#ffffff]/20 shadow-[0_0_10px_rgba(255,255,255,0.2)]" },
  { width: "22px", height: "22px", left: "60%", top: "40%", delay: "3.5s", duration: "10s", color: "bg-[#ff4b5f]/20 shadow-[0_0_12px_rgba(255,75,95,0.2)]" },
  { width: "14px", height: "14px", left: "30%", top: "10%", delay: "4.2s", duration: "7s", color: "bg-[#ff0033]/20 shadow-[0_0_8px_rgba(255,0,51,0.2)]" },
  { width: "28px", height: "28px", left: "90%", top: "30%", delay: "4.9s", duration: "8s", color: "bg-[#ffffff]/20 shadow-[0_0_15px_rgba(255,255,255,0.2)]" },
];

const LOADING_TEXTS = [
  "CONNECTING TO NEURAL NET...",
  "LOADING SQUAD DATABASES...",
  "CHARGING THE WHEEL...",
  "PREPARING SOUNDS...",
  "READY FOR ACTION!"
];

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const textIndex = Math.min(Math.floor(progress / 20), LOADING_TEXTS.length - 1);
  const statusText = LOADING_TEXTS[textIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setVisible(false), 600); // fade out duration
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-600 ${
        progress === 100 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background Animated Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        {PARTICLES.map((particle, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-sm animate-float ${particle.color}`}
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
        {/* Liquid Morphing Blob */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ff0033] via-[#ffffff] to-[#ff4b5f] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] animate-blob-morph opacity-60 blur-md" />
          <div className="absolute inset-2 bg-gradient-to-bl from-[#ff4b5f] via-[#ff0033] to-[#ffffff] rounded-[50%_60%_30%_60%/30%_60%_70%_40%] animate-blob-morph [animation-delay:2s] opacity-75 blur-xs" />
          <div className="absolute inset-4 bg-[#0f0f0f] rounded-full flex items-center justify-center border border-white/10 shadow-[inset_0_0_15px_rgba(255,0,51,0.3)]">
            <div className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse">
              🎮
            </div>
          </div>
        </div>

        {/* Text */}
        <h1 className="font-display font-extrabold text-4xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#ff0033] via-[#ffffff] to-[#ff4b5f] animate-aurora-shift bg-[length:200%_auto] filter drop-shadow-[0_0_10px_rgba(255,0,51,0.3)]">
          JUST FOR FUN
        </h1>
        <p className="text-[#ffffff] text-xs font-bold tracking-widest uppercase mt-2 opacity-80">
          Gaming Channel
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-[#181818] rounded-full h-2 mt-8 border border-white/10 overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] p-[1px]">
          <div
            className="bg-gradient-to-r from-[#ff0033] via-[#ffffff] to-[#ff4b5f] bg-[length:200%_auto] h-full rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(255,255,255,0.7)] animate-aurora-shift"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Status */}
        <p className="text-xs font-mono text-[#ff0033] tracking-widest mt-4">
          {statusText} <span className="animate-ping font-sans">|</span>
        </p>
      </div>
    </div>
  );
};
