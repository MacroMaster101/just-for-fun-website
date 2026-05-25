"use client";

import React, { useEffect, useRef, useState } from "react";

const LOADING_TEXTS = [
  "BOOTING SYSTEMS",
  "LOADING SQUAD",
  "SYNCING STREAMS",
  "CALIBRATING HUD",
  "READY",
];

const RING_R = 54;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

interface LoadingScreenProps {
  onDone?: () => void;
  /** Total animated duration in ms (default 1600) */
  duration?: number;
}

export const LoadingScreen = ({
  onDone,
  duration = 1600,
}: LoadingScreenProps) => {
  const [textBucket, setTextBucket] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const barRef = useRef<HTMLDivElement | null>(null);
  const scanlineRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<SVGCircleElement | null>(null);
  const pctTextRef = useRef<HTMLSpanElement | null>(null);
  // Stash onDone in a ref so the RAF effect doesn't re-run (and reset
  // progress) whenever the parent re-renders and passes a new arrow.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let lastBucket = 0;
    let lastPctInt = 0;
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = eased * 100;

      if (barRef.current) barRef.current.style.width = pct + "%";
      if (scanlineRef.current) scanlineRef.current.style.top = pct + "%";
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(
          CIRCUMFERENCE * (1 - pct / 100)
        );
      }

      frame++;
      if (frame % 4 === 0 && pctTextRef.current) {
        const pctInt = Math.floor(pct);
        if (pctInt !== lastPctInt) {
          lastPctInt = pctInt;
          pctTextRef.current.textContent =
            String(pctInt).padStart(3, "0") + "%";
        }
      }

      const bucket = Math.min(Math.floor(pct / 20), LOADING_TEXTS.length - 1);
      if (bucket !== lastBucket) {
        lastBucket = bucket;
        setTextBucket(bucket);
      }

      if (t >= 1) {
        if (pctTextRef.current) pctTextRef.current.textContent = "100%";
        // Tell parent to mount the page now (behind the fading overlay)
        onDoneRef.current?.();
        setFading(true);
        setTimeout(() => setVisible(false), 450);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  if (!visible) return null;

  const statusText = LOADING_TEXTS[textBucket];

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#060606] transition-opacity duration-[450ms] ease-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={fading}
      role="status"
    >
      {/* Static grid (paints once, no mask -> cheaper) */}
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,0,51,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,51,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Vignette via single radial gradient — composited once */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,0,51,0.12),transparent_55%)]" />

      {/* Horizontal scanline — animated via ref */}
      <div
        ref={scanlineRef}
        className="pointer-events-none absolute inset-x-0 h-px bg-[#ff0033]"
        style={{
          top: "0%",
          opacity: 0.6,
          willChange: "top",
        }}
      />

      {/* Center stack */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center px-6 text-center">
        {/* Logo + ring */}
        <div className="relative mb-10 h-32 w-32">
          {/* Rotating outer ring */}
          <svg
            className="absolute inset-0 h-full w-full animate-spin"
            style={{ animationDuration: "10s", willChange: "transform" }}
            viewBox="0 0 120 120"
            fill="none"
          >
            <circle
              cx="60"
              cy="60"
              r="58"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
          </svg>

          {/* Progress ring */}
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 120 120"
            fill="none"
          >
            <circle
              cx="60"
              cy="60"
              r={RING_R}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="2"
            />
            <circle
              ref={ringRef}
              cx="60"
              cy="60"
              r={RING_R}
              stroke="#ff0033"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
            />
          </svg>

          {/* Inner mark */}
          <div className="absolute inset-4 flex items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a]">
            <span className="font-display text-2xl font-black tracking-tight text-white">
              JFF
            </span>
          </div>

          {/* Corner brackets */}
          {[
            "left-0 top-0 border-l border-t",
            "right-0 top-0 border-r border-t",
            "left-0 bottom-0 border-l border-b",
            "right-0 bottom-0 border-r border-b",
          ].map((cls, i) => (
            <span
              key={i}
              className={`absolute h-3 w-3 border-[#ff0033] ${cls}`}
            />
          ))}
        </div>

        {/* Wordmark */}
        <h1 className="font-display text-3xl font-black uppercase tracking-[0.18em] text-white sm:text-4xl">
          Just For <span className="text-[#ff0033]">Fun</span>
        </h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-500">
          Gaming · Live · Sri Lanka
        </p>

        {/* Progress bar */}
        <div className="mt-10 w-full">
          <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-inset ring-white/5">
            <div
              ref={barRef}
              className="h-full rounded-full bg-[#ff0033]"
              style={{
                width: "0%",
                willChange: "width",
              }}
            />
          </div>

          {/* Status row */}
          <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em]">
            <span className="flex items-center gap-2 text-[#ff4b5f]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#ff0033] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff0033]" />
              </span>
              {statusText}
            </span>
            <span ref={pctTextRef} className="text-white/70 tabular-nums">
              000%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom signature */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.5em] text-neutral-600">
        v4 · Crimson Build
      </div>
    </div>
  );
};
