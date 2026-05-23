"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "./ThemeProvider";

const options: { value: Theme; label: string; tooltip: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", tooltip: "Try Light mode", Icon: Sun },
  { value: "system", label: "System", tooltip: "Match system", Icon: Monitor },
  { value: "dark", label: "Dark", tooltip: "Try Dark mode", Icon: Moon },
];

export const ThemeToggle = () => {
  const { theme, setTheme, resolved } = useTheme();

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

    doc.documentElement.classList.add("theme-switching");
    setTheme(value);
    window.setTimeout(() => {
      doc.documentElement.classList.remove("theme-switching");
    }, 320);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-0.5 backdrop-blur"
    >
      {options.map(({ value, label, tooltip, Icon }) => {
        const active = theme === value;
        const tipText =
          active && value === "system" ? `System (${resolved})` : tooltip;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
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
              className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text)] opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
            >
              {tipText}
            </span>
          </button>
        );
      })}
    </div>
  );
};
