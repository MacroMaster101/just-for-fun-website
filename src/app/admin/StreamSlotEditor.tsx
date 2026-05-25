"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { StreamSlot, emptyStreamSlot } from "./types";

type SlotDraft = StreamSlot | typeof emptyStreamSlot;

export interface StreamSlotEditorProps {
  initial: SlotDraft;
  isNew: boolean;
  onCancel: () => void;
  onSave: (slot: SlotDraft, isNew: boolean) => void;
}

/**
 * Form for creating or editing a single homepage stream schedule slot.
 * Mirrors the SquadMemberEditor pattern.
 */
export const StreamSlotEditor = ({
  initial,
  isNew,
  onCancel,
  onSave,
}: StreamSlotEditorProps) => {
  const [form, setForm] = useState(initial);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="p-6 border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-display font-extrabold text-lg text-[var(--color-text)]">
          {isNew ? "New Stream Slot" : `Edit: ${form.title || "Untitled"}`}
        </h4>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] cursor-pointer"
          aria-label="Close editor"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Day badge *</label>
          <Input
            value={form.day}
            onChange={(e) => update("day", e.target.value.toUpperCase().slice(0, 6))}
            placeholder="FRI"
            className="mt-2"
          />
          <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">3–6 character day code shown in the badge.</p>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Icon (emoji)</label>
          <Input
            value={form.icon}
            onChange={(e) => update("icon", e.target.value)}
            placeholder="🎮"
            className="mt-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Title *</label>
          <Input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Friday Night"
            className="mt-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Time *</label>
          <Input
            value={form.time}
            onChange={(e) => update("time", e.target.value)}
            placeholder="8:00 PM – 11:00 PM"
            className="mt-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder="Short pitch shown under the title on the homepage."
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Sort order</label>
          <Input
            type="number"
            value={String(form.sortOrder)}
            onChange={(e) => update("sortOrder", Number(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="accent-[#ff0033]"
            />
            <span className="text-xs font-bold text-[var(--color-text)]">
              Featured (main event)
            </span>
          </label>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-[var(--color-text-muted)]">
        Saving with <strong>Featured</strong> on will automatically unfeature any other slot — only one main event at a time.
      </p>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form, isNew)}>
          {isNew ? "Add Slot" : "Save Changes"}
        </Button>
      </div>
    </Card>
  );
};
