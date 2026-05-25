"use client";

import React, { useState } from "react";
import { AlertTriangle, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { MerchGrade, MerchItem, emptyMerchItem } from "./types";

type Draft = MerchItem | typeof emptyMerchItem;

interface Props {
  initial: Draft;
  isUpdate: boolean;
  onCancel: () => void;
  onSave: (item: MerchItem | (typeof emptyMerchItem & { id?: string })) => void;
  error: string | null;
}

const GRADES: MerchGrade[] = ["LEGENDARY", "RARE", "COMMON"];

export const MerchEditor: React.FC<Props> = ({
  initial,
  isUpdate,
  onCancel,
  onSave,
  error,
}) => {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(String(initial.price ?? 0));
  const [emoji, setEmoji] = useState(initial.emoji);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [grade, setGrade] = useState<MerchGrade>(initial.grade);
  const [sortOrder, setSortOrder] = useState(String(initial.sortOrder ?? 0));

  const handleSubmit = () => {
    const priceNum = Number(price);
    const sortNum = Number(sortOrder);
    const payload = {
      ...(isUpdate && "id" in initial ? { id: (initial as MerchItem).id } : {}),
      name: name.trim(),
      description: description.trim(),
      price: Number.isFinite(priceNum) ? priceNum : 0,
      emoji: emoji.trim() || "🛍️",
      imageUrl: imageUrl.trim(),
      grade,
      sortOrder: Number.isFinite(sortNum) ? Math.trunc(sortNum) : 0,
    };
    onSave(payload as MerchItem);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-extrabold text-lg text-[var(--color-text)]">
          {isUpdate ? "Edit Product" : "Add Product"}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Name
          </span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="JFF 'Cyber-Obsidian' Hoodie"
            maxLength={80}
          />
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Short product blurb shown on the card."
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] focus:border-[#ff0033] focus:outline-none"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Price (USD)
          </span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Grade
          </span>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as MerchGrade)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-3 py-2.5 text-sm text-[var(--color-text)] focus:border-[#ff0033] focus:outline-none"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Emoji (fallback when no image)
          </span>
          <Input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={8}
            placeholder="🧥"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Sort order (lower = earlier)
          </span>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Image URL
          </span>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="gap-2" disabled={!name.trim()}>
          <Save size={14} /> {isUpdate ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </div>
  );
};
