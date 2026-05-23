"use client";

import { useEffect, useRef, useState } from "react";

export const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { x: pos.x, y: pos.y };
    const glow = { x: pos.x, y: pos.y };
    let raf = 0;

    const tick = () => {
      ring.x += (pos.x - ring.x) * 0.18;
      ring.y += (pos.y - ring.y) * 0.18;
      glow.x += (pos.x - glow.x) * 0.08;
      glow.y += (pos.y - glow.y) * 0.08;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glow.x}px, ${glow.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      const target = e.target as HTMLElement | null;
      const isInteractive =
        !!target &&
        !!target.closest(
          'a, button, [role="button"], input, textarea, select, [data-cursor="hover"]'
        );
      setHovering(isInteractive);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    raf = requestAnimationFrame(() => {
      setEnabled(true);
      tick();
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(raf);
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
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-[320px] w-[320px] rounded-full mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle, rgba(255,0,51,0.32) 0%, rgba(255,75,95,0.12) 35%, transparent 70%)",
          filter: "blur(14px)",
          transition: "opacity 200ms",
          opacity: hovering ? 0.95 : 0.6,
        }}
      />

      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full border border-[#ff0033]"
        style={{
          width: hovering ? 56 : 36,
          height: hovering ? 56 : 36,
          boxShadow:
            "0 0 18px rgba(255,0,51,0.7), inset 0 0 10px rgba(255,75,95,0.35)",
          transition:
            "width 180ms cubic-bezier(.2,.8,.2,1), height 180ms cubic-bezier(.2,.8,.2,1), border-color 180ms",
          borderColor: clicking ? "#ffffff" : "#ff0033",
        }}
      />

      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[10000] rounded-full bg-white"
        style={{
          width: clicking ? 4 : 6,
          height: clicking ? 4 : 6,
          boxShadow: "0 0 12px rgba(255,255,255,0.9), 0 0 22px rgba(255,0,51,0.7)",
          transition: "width 120ms, height 120ms",
        }}
      />
    </>
  );
};
