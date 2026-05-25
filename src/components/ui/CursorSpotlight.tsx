"use client";

import { useEffect, useRef } from "react";

interface CursorSpotlightProps {
  color?: string;
  size?: number;
  className?: string;
}

export const CursorSpotlight = ({
  color = "rgba(255, 0, 51, 0.22)",
  size = 600,
  className = "",
}: CursorSpotlightProps) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    // Skip on touch / reduced-motion
    if (typeof window !== "undefined") {
      if (!window.matchMedia("(pointer: fine)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    }

    let raf = 0;
    let active = false;
    let dirty = false;
    const state = {
      x: parent.clientWidth / 2,
      y: parent.clientHeight / 2,
      tx: parent.clientWidth / 2,
      ty: parent.clientHeight / 2,
    };

    el.style.setProperty("--spot-color", color);
    el.style.setProperty("--spot-size", `${size}px`);
    el.style.background = `radial-gradient(var(--spot-size) circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--spot-color), transparent 65%)`;
    el.style.opacity = "0";
    el.style.willChange = "opacity";

    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      active = false;
    };

    const tick = () => {
      state.x += (state.tx - state.x) * 0.16;
      state.y += (state.ty - state.y) * 0.16;
      el.style.setProperty("--spot-x", `${state.x}px`);
      el.style.setProperty("--spot-y", `${state.y}px`);

      // Stop once we've caught up (no movement happening)
      const dx = Math.abs(state.tx - state.x);
      const dy = Math.abs(state.ty - state.y);
      if (!dirty && dx < 0.5 && dy < 0.5) {
        stop();
        return;
      }
      dirty = false;
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (active) return;
      active = true;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      state.tx = e.clientX - rect.left;
      state.ty = e.clientY - rect.top;
      dirty = true;
      start();
    };

    const onEnter = () => {
      el.style.opacity = "1";
    };
    const onLeave = () => {
      el.style.opacity = "0";
      stop();
    };

    parent.addEventListener("mousemove", onMove, { passive: true });
    parent.addEventListener("mouseenter", onEnter);
    parent.addEventListener("mouseleave", onLeave);

    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseenter", onEnter);
      parent.removeEventListener("mouseleave", onLeave);
      stop();
    };
  }, [color, size]);

  return (
    <div
      ref={ref}
      aria-hidden
      data-cursor-spotlight
      className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${className}`}
    />
  );
};
