"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: pos.x, y: pos.y };
    const glow = { x: pos.x, y: pos.y };
    let raf = 0;
    let active = false;
    let lastHoverCheck = 0;

    const tick = () => {
      ring.x += (pos.x - ring.x) * 0.22;
      ring.y += (pos.y - ring.y) * 0.22;
      glow.x += (pos.x - glow.x) * 0.1;
      glow.y += (pos.y - glow.y) * 0.1;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0) translate(-50%, -50%)`;
      }

      const dx = Math.abs(pos.x - ring.x) + Math.abs(pos.x - glow.x);
      const dy = Math.abs(pos.y - ring.y) + Math.abs(pos.y - glow.y);
      if (dx < 0.4 && dy < 0.4) {
        active = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      // Throttle interactive-element lookup to ~60ms
      const now = e.timeStamp;
      if (now - lastHoverCheck > 60) {
        lastHoverCheck = now;
        const target = e.target as HTMLElement | null;
        const isInteractive =
          !!target &&
          !!target.closest(
            'a, button, [role="button"], input, textarea, select, [data-cursor="hover"]'
          );
        setHovering((prev) => (prev === isInteractive ? prev : isInteractive));
      }
      start();
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    setEnabled(true);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <style jsx global>{`
        @media (pointer: fine) {
          html,
          body,
          a,
          button,
          [role="button"] {
            cursor: none !important;
          }
        }
      `}</style>

      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-[320px] w-[320px] rounded-full"
        style={{
          background: isLight
            ? "none"
            : "radial-gradient(circle, rgba(255,0,51,0.32) 0%, rgba(255,75,95,0.12) 35%, transparent 70%)",
          mixBlendMode: isLight ? "normal" : "screen",
          filter: isLight ? "none" : "blur(14px)",
          transition: "opacity 200ms",
          opacity: isLight ? 0 : hovering ? 0.95 : 0.6,
          display: isLight ? "none" : "block",
        }}
      />

      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full border border-[#ff0033]"
        style={{
          width: hovering ? 56 : 36,
          height: hovering ? 56 : 36,
          boxShadow: isLight
            ? "none"
            : "0 0 18px rgba(255,0,51,0.7), inset 0 0 10px rgba(255,75,95,0.35)",
          transition:
            "width 180ms cubic-bezier(.2,.8,.2,1), height 180ms cubic-bezier(.2,.8,.2,1), border-color 180ms",
          borderColor: clicking
            ? isLight
              ? "#0a0a0a"
              : "#ffffff"
            : "#ff0033",
        }}
      />

      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] rounded-full"
        style={{
          width: clicking ? 4 : 6,
          height: clicking ? 4 : 6,
          backgroundColor: isLight ? "#ff0033" : "#ffffff",
          boxShadow: isLight
            ? "none"
            : "0 0 12px rgba(255,255,255,0.9), 0 0 22px rgba(255,0,51,0.7)",
          transition: "width 120ms, height 120ms",
        }}
      />
    </>
  );
};
