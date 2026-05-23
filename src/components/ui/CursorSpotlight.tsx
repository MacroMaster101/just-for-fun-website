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

    let raf = 0;
    const state = { x: parent.clientWidth / 2, y: parent.clientHeight / 2, tx: 0, ty: 0 };

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      state.tx = e.clientX - rect.left;
      state.ty = e.clientY - rect.top;
    };

    const tick = () => {
      state.x += (state.tx - state.x) * 0.12;
      state.y += (state.ty - state.y) * 0.12;
      el.style.background = `radial-gradient(${size}px circle at ${state.x}px ${state.y}px, ${color}, transparent 65%)`;
      raf = requestAnimationFrame(tick);
    };

    parent.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      parent.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [color, size]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${className}`}
    />
  );
};
