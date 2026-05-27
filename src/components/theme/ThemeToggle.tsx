"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

const options: { value: Theme; label: string; tooltip: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", tooltip: "Try Light mode", Icon: Sun },
  { value: "system", label: "System", tooltip: "Match system", Icon: Monitor },
  { value: "dark", label: "Dark", tooltip: "Try Dark mode", Icon: Moon },
];

interface ThemeToggleProps {
  /** When true, the active option's tooltip is shown automatically (first-visit hint). */
  showHint?: boolean;
}

export const ThemeToggle = ({ showHint = false }: ThemeToggleProps = {}) => {
  const { theme, setTheme, resolved } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Defer to next tick so the setState happens outside the effect body
    // (avoids react-hooks/set-state-in-effect; behavior is identical).
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const handleClick = (value: Theme) => {
    if (value === theme) return;

    const doc = typeof document !== "undefined" ? document : null;
    if (!doc) {
      setTheme(value);
      return;
    }

    type DocWithVT = Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const docVT = doc as DocWithVT;

    if (typeof docVT.startViewTransition === "function") {
      docVT.startViewTransition(() => {
        setTheme(value);
      });
      return;
    }

    // Fallback for browsers without View Transitions (Safari / Firefox / mobile).
    // Instead of transitioning thousands of elements (causes massive lag),
    // we create a single full-screen overlay, fade it to opaque, swap the
    // theme instantly while hidden, then fade the overlay out. This is ONE
    // GPU-composited layer — zero per-element transition cost.
    const overlay = doc.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      backgroundColor: value === "light" ? "#f5f5f7" : "#060606",
      opacity: "0",
      transition: "opacity 0.18s ease-in",
      pointerEvents: "none",
    });
    doc.body.appendChild(overlay);

    // Force layout so the initial opacity:0 is committed before we transition
    overlay.getBoundingClientRect();
    overlay.style.opacity = "1";

    // After the overlay is fully opaque, swap theme instantly underneath
    const onFadeIn = () => {
      overlay.removeEventListener("transitionend", onFadeIn);
      doc.documentElement.classList.add("theme-switching");
      setTheme(value);

      // Let one frame pass so the browser repaints with the new theme
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          doc.documentElement.classList.remove("theme-switching");
          overlay.style.transition = "opacity 0.18s ease-out";
          overlay.style.opacity = "0";

          const onFadeOut = () => {
            overlay.removeEventListener("transitionend", onFadeOut);
            overlay.remove();
          };
          overlay.addEventListener("transitionend", onFadeOut);

          // Safety cleanup in case transitionend doesn't fire
          setTimeout(() => overlay.remove(), 400);
        });
      });
    };
    overlay.addEventListener("transitionend", onFadeIn);

    // Safety: if transitionend never fires, proceed anyway
    setTimeout(() => {
      if (doc.body.contains(overlay)) {
        onFadeIn();
      }
    }, 300);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-0.5 backdrop-blur"
    >
      {options.map(({ value, label, tooltip, Icon }) => {
        const active = mounted && theme === value;
        const tipText =
          mounted && active && value === "system"
            ? `System (${resolved})`
            : tooltip;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            suppressHydrationWarning
            onClick={() => handleClick(value)}
            className={`group relative flex h-7 w-7 items-center justify-center rounded-full transition ${
              active
                ? "bg-[#ff0033] text-white shadow-[0_0_14px_rgba(255,0,51,0.45)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Icon size={14} />
            <span
              role="tooltip"
              suppressHydrationWarning
              className={`pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text)] shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 ${
                showHint && active
                  ? "translate-y-0 opacity-100"
                  : "translate-y-1 opacity-0"
              }`}
            >
              {tipText}
            </span>
          </button>
        );
      })}
    </div>
  );
};
