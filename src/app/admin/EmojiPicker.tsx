"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { EMOJI_PRESETS } from "@/lib/soundboardDefaults";

interface EmojiPickerProps {
  value: string;
  onChange: (next: string) => void;
  label?: string;
}

/**
 * Emoji selector for the admin Soundboard editor. Click the chip to reveal
 * a grid of preset emojis; type into the input to use any custom emoji.
 * Closes the grid on outside click.
 */
export const EmojiPicker: React.FC<EmojiPickerProps> = ({ value, onChange, label = "Emoji" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-2xl hover:border-[#ff0033]/40 transition cursor-pointer"
          aria-label="Open emoji picker"
        >
          <span>{value || "🎮"}</span>
          <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={8}
          placeholder="Or type any emoji"
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[#ff0033] focus:outline-none"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-full max-w-sm p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="grid grid-cols-9 gap-1">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
                className={`text-xl p-1.5 rounded-md transition cursor-pointer hover:bg-[#ff0033]/15 ${
                  value === emoji ? "bg-[#ff0033]/20 ring-1 ring-[#ff0033]/40" : ""
                }`}
                aria-label={`Select ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
