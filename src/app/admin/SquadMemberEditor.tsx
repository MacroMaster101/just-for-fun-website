"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { SquadMember } from "./types";

export interface SquadMemberEditorProps {
  initial: SquadMember | (Omit<SquadMember, "id"> & { id?: string });
  isNew: boolean;
  avatarUploading: boolean;
  onAvatarUpload: (memberId: string, file: File) => void;
  onCancel: () => void;
  onSave: (member: SquadMember | Omit<SquadMember, "id">, isNew: boolean) => void;
}

/**
 * Form for creating or editing a squad member. Lives in its own file so
 * the giant admin page doesn't have to carry 190 lines of form markup.
 */
export const SquadMemberEditor = ({
  initial,
  isNew,
  avatarUploading,
  onAvatarUpload,
  onCancel,
  onSave,
}: SquadMemberEditorProps) => {
  const [form, setForm] = useState(initial);
  const [gamesInput, setGamesInput] = useState((initial.favoriteGames || []).join(", "));

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    const games = gamesInput
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);
    onSave({ ...form, favoriteGames: games }, isNew);
  };

  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isNew || !("id" in form) || !form.id) {
      alert("Save the member first, then upload an avatar.");
      return;
    }
    onAvatarUpload(form.id, file);
  };

  const memberId = "id" in form ? form.id : undefined;

  return (
    <Card className="p-6 border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-5">
        <h4 className="font-display font-extrabold text-lg text-[var(--color-text)]">
          {isNew ? "New Squad Member" : `Edit: ${form.name || "Unnamed"}`}
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
        {/* Avatar */}
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            Avatar
          </label>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display font-black text-xl text-[var(--color-text)]">
                  {form.name.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={form.avatarUrl}
                onChange={(e) => update("avatarUrl", e.target.value)}
                placeholder="https://..."
              />
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[var(--color-text-muted)] cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={onAvatarFile}
                    disabled={isNew || avatarUploading}
                    className="hidden"
                  />
                  <span
                    className={`inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 transition ${
                      isNew || avatarUploading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-[#ff0033]/40 hover:text-[var(--color-text)]"
                    }`}
                  >
                    <Plus size={12} />
                    {avatarUploading ? "Uploading…" : isNew ? "Save first" : "Upload image"}
                  </span>
                </label>
                {memberId && form.avatarUrl && (
                  <span className="text-[10px] text-[var(--color-text-muted)] truncate">
                    Saved to Supabase storage.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Name *</label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Kavisha (GGEZ)" className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Role *</label>
          <Input value={form.role} onChange={(e) => update("role", e.target.value)} placeholder="Founder / Main Duelist" className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Signature Agent</label>
          <Input value={form.signatureAgent} onChange={(e) => update("signatureAgent", e.target.value)} placeholder="Jett / Reyna" className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Combat Style</label>
          <Input value={form.combatStyle} onChange={(e) => update("combatStyle", e.target.value)} placeholder="Aggressive / W-Key Warrior" className="mt-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Favorite Games (comma-separated)</label>
          <Input value={gamesInput} onChange={(e) => setGamesInput(e.target.value)} placeholder="Valorant, Valheim, GTA V" className="mt-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            placeholder="Short bio shown in the operator details card."
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Twitch URL (optional)</label>
          <Input value={form.twitchUrl ?? ""} onChange={(e) => update("twitchUrl", e.target.value || null)} placeholder="https://www.twitch.tv/..." className="mt-2" />
        </div>

        {/* Specs */}
        <div className="md:col-span-2 pt-2 border-t border-[var(--color-border)]">
          <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#ff0033] mb-3">Hardware Specs</h5>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">CPU</label>
          <Input value={form.cpu} onChange={(e) => update("cpu", e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">GPU</label>
          <Input value={form.gpu} onChange={(e) => update("gpu", e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">RAM</label>
          <Input value={form.ram} onChange={(e) => update("ram", e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Monitor</label>
          <Input value={form.monitor} onChange={(e) => update("monitor", e.target.value)} className="mt-2" />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Mouse</label>
          <Input value={form.mouse} onChange={(e) => update("mouse", e.target.value)} className="mt-2" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Sort Order</label>
          <Input
            type="number"
            value={String(form.sortOrder)}
            onChange={(e) => update("sortOrder", Number(e.target.value) || 0)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit}>{isNew ? "Add Member" : "Save Changes"}</Button>
      </div>
    </Card>
  );
};
