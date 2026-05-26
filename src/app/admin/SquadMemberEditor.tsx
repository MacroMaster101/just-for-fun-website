"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Gamepad2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { SquadMember } from "./types";

interface SquadGame {
  name: string;
  logoUrl: string;
}

export interface SquadMemberEditorProps {
  initial: SquadMember | (Omit<SquadMember, "id"> & { id?: string });
  isNew: boolean;
  avatarUploading: boolean;
  onAvatarUpload: (memberId: string, file: File) => void;
  onCancel: () => void;
  onSave: (member: SquadMember | Omit<SquadMember, "id">, isNew: boolean) => void;
}

const COMMON_ROLES = [
  "Founder / Main Duelist",
  "Co-Founder / Main Sentinel",
  "Co-Builder / Survival Specialist",
  "Member / Main Duelist",
  "Member / Main Initiator",
  "Member / Main Controller",
  "Member / Main Sentinel",
  "Founder",
  "Co-Founder"
];

const COMMON_COMBAT_STYLES = [
  "Aggressive / W-Key Warrior",
  "Calculated / Tactical",
  "Defensive / Architect",
  "Aggressive / Entry Fragger",
  "Tactical / Support Specialist",
  "Flexible / Fill Specialist",
  "Defensive / Sniper Anchor"
];

const GAME_AGENTS: Record<string, string[]> = {
  valorant: [
    "Jett", "Reyna", "Clove", "Omen", "Sage", "Chamber", "Cypher", "Phoenix",
    "Raze", "Breach", "Skye", "Fade", "Deadlock", "Iso", "Neon", "Sova",
    "Viper", "Astra", "Harbor", "Gekko", "Tejo", "Vyse"
  ],
  apex: [
    "Wraith", "Pathfinder", "Octane", "Bloodhound", "Gibraltar", "Lifeline",
    "Bangalore", "Caustic", "Mirage", "Wattson", "Crypto", "Revenant",
    "Loba", "Rampart", "Horizon", "Fuse", "Valkyrie", "Seer", "Ash",
    "Mad Maggie", "Newcastle", "Vantage", "Catalyst", "Ballistic",
    "Conduit", "Alter"
  ],
  overwatch: [
    "Tracer", "Genji", "Mercy", "Reinhardt", "D.Va", "Widowmaker", "Hanzo",
    "Cassidy", "Reaper", "Pharah", "Soldier: 76", "Sombra", "Bastion",
    "Junkrat", "Mei", "Torbjörn", "Doomfist", "Junker Queen", "Mauga",
    "Orisa", "Ramattra", "Roadhog", "Sigma", "Winston", "Wrecking Ball",
    "Zarya", "Ana", "Baptiste", "Brigitte", "Illari", "Juno", "Kiriko",
    "Lifeweaver", "Lúcio", "Moira", "Zenyatta"
  ]
};

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

  // Parse initial favoriteGames (which could be JSON string or legacy string)
  const initialGames: SquadGame[] = (initial.favoriteGames || []).map((gameStr) => {
    try {
      if (gameStr.trim().startsWith("{")) {
        const parsed = JSON.parse(gameStr);
        if (parsed && typeof parsed === "object" && parsed.name) {
          return {
            name: parsed.name,
            logoUrl: parsed.logoUrl || "",
          };
        }
      }
    } catch {
      // Ignore
    }
    return { name: gameStr, logoUrl: "" };
  });

  const [squadGames, setSquadGames] = useState<SquadGame[]>(initialGames);

  // Search states for games
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string; backgroundImage: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Overrides to toggle between custom input and dropdown selectors
  const [useCustomRole, setUseCustomRole] = useState(!COMMON_ROLES.includes(initial.role) && initial.role !== "");
  const [useCustomStyle, setUseCustomStyle] = useState(!COMMON_COMBAT_STYLES.includes(initial.combatStyle) && initial.combatStyle !== "");

  // Find matching game for agents dropdown
  const getActiveGameKey = () => {
    const activeNames = squadGames.map((g) => g.name.toLowerCase());
    if (activeNames.some((name) => name.includes("valorant"))) return "valorant";
    if (activeNames.some((name) => name.includes("apex"))) return "apex";
    if (activeNames.some((name) => name.includes("overwatch"))) return "overwatch";
    return null;
  };

  const activeGameKey = getActiveGameKey();

  const isAgentPredefined = () => {
    if (!activeGameKey) return false;
    const roster = GAME_AGENTS[activeGameKey];
    return roster.some((agent) => initial.signatureAgent.toLowerCase().includes(agent.toLowerCase()));
  };

  const [useCustomAgent, setUseCustomAgent] = useState(!isAgentPredefined() && initial.signatureAgent !== "");

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSuggestions([]);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/games/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Error searching games in editor:", err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    // Serialize squadGames to JSON strings
    const serializedGames = squadGames
      .map((g) => g.name.trim() ? JSON.stringify({ name: g.name.trim(), logoUrl: g.logoUrl.trim() }) : "")
      .filter((str) => str !== "");
    onSave({ ...form, favoriteGames: serializedGames }, isNew);
  };

  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadId = (!isNew && "id" in form && form.id) ? form.id : "new";
    onAvatarUpload(uploadId, file);
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
                    disabled={avatarUploading}
                    className="hidden"
                  />
                  <span
                    className={`inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 transition ${
                      avatarUploading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-[#ff0033]/40 hover:text-[var(--color-text)]"
                    }`}
                  >
                    <Plus size={12} />
                    {avatarUploading ? "Uploading…" : "Upload image"}
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
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Role *</label>
            <div className="flex items-center gap-1 bg-[var(--color-surface-2)] p-0.5 rounded-md border border-[var(--color-border)] select-none shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUseCustomRole(false);
                  update("role", COMMON_ROLES[0]);
                }}
                className={`px-2 py-0.5 rounded text-[8px] uppercase font-extrabold transition-all duration-200 cursor-pointer ${
                  !useCustomRole
                    ? "bg-[#ff0033] text-white shadow-[0_0_8px_rgba(255,0,51,0.4)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                Dropdown
              </button>
              <button
                type="button"
                onClick={() => setUseCustomRole(true)}
                className={`px-2 py-0.5 rounded text-[8px] uppercase font-extrabold transition-all duration-200 cursor-pointer ${
                  useCustomRole
                    ? "bg-[#ff0033] text-white shadow-[0_0_8px_rgba(255,0,51,0.4)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                Custom
              </button>
            </div>
          </div>
          {useCustomRole ? (
            <Input
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="Founder / Main Duelist"
              className="mt-2 text-xs font-semibold focus:ring-1 focus:ring-[#ff0033]/40 border-[var(--color-border)]"
            />
          ) : (
            <select
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30 font-semibold cursor-pointer transition-all duration-200 hover:border-[#ff0033]/30"
            >
              {!COMMON_ROLES.includes(form.role) && form.role !== "" && (
                <option value={form.role} className="bg-[var(--color-surface-2)] font-semibold text-xs">{form.role}</option>
              )}
              {COMMON_ROLES.map((role) => (
                <option key={role} value={role} className="bg-[var(--color-surface-2)] font-semibold text-xs">{role}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between min-h-[22px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Signature Agent</label>
            {activeGameKey ? (
              <div className="flex items-center gap-1 bg-[var(--color-surface-2)] p-0.5 rounded-md border border-[var(--color-border)] select-none shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomAgent(false);
                    update("signatureAgent", GAME_AGENTS[activeGameKey][0]);
                  }}
                  className={`px-2 py-0.5 rounded text-[8px] uppercase font-extrabold transition-all duration-200 cursor-pointer ${
                    !useCustomAgent
                      ? "bg-[#ff0033] text-white shadow-[0_0_8px_rgba(255,0,51,0.4)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  Dropdown
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomAgent(true)}
                  className={`px-2 py-0.5 rounded text-[8px] uppercase font-extrabold transition-all duration-200 cursor-pointer ${
                    useCustomAgent
                      ? "bg-[#ff0033] text-white shadow-[0_0_8px_rgba(255,0,51,0.4)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  Custom
                </button>
              </div>
            ) : (
              <span className="text-[8px] text-[var(--color-text-muted)] bg-[var(--color-surface-2)]/60 px-1.5 py-0.5 rounded border border-[var(--color-border)] uppercase font-extrabold tracking-wider shrink-0 select-none">
                🎮 Add game to unlock list
              </span>
            )}
          </div>
          {(!activeGameKey || useCustomAgent) ? (
            <Input
              value={form.signatureAgent}
              onChange={(e) => update("signatureAgent", e.target.value)}
              placeholder="Jett / Reyna"
              className="mt-2 text-xs font-semibold focus:ring-1 focus:ring-[#ff0033]/40 border-[var(--color-border)]"
            />
          ) : (
            <select
              value={form.signatureAgent}
              onChange={(e) => update("signatureAgent", e.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30 font-semibold cursor-pointer transition-all duration-200 hover:border-[#ff0033]/30"
            >
              {!GAME_AGENTS[activeGameKey].includes(form.signatureAgent) && form.signatureAgent !== "" && (
                <option value={form.signatureAgent} className="bg-[var(--color-surface-2)] font-semibold text-xs">{form.signatureAgent}</option>
              )}
              {GAME_AGENTS[activeGameKey].map((agent) => (
                <option key={agent} value={agent} className="bg-[var(--color-surface-2)] font-semibold text-xs">{agent}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Combat Style</label>
            <div className="flex items-center gap-1 bg-[var(--color-surface-2)] p-0.5 rounded-md border border-[var(--color-border)] select-none shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUseCustomStyle(false);
                  update("combatStyle", COMMON_COMBAT_STYLES[0]);
                }}
                className={`px-2 py-0.5 rounded text-[8px] uppercase font-extrabold transition-all duration-200 cursor-pointer ${
                  !useCustomStyle
                    ? "bg-[#ff0033] text-white shadow-[0_0_8px_rgba(255,0,51,0.4)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                Dropdown
              </button>
              <button
                type="button"
                onClick={() => setUseCustomStyle(true)}
                className={`px-2 py-0.5 rounded text-[8px] uppercase font-extrabold transition-all duration-200 cursor-pointer ${
                  useCustomStyle
                    ? "bg-[#ff0033] text-white shadow-[0_0_8px_rgba(255,0,51,0.4)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                Custom
              </button>
            </div>
          </div>
          {useCustomStyle ? (
            <Input
              value={form.combatStyle}
              onChange={(e) => update("combatStyle", e.target.value)}
              placeholder="Aggressive / W-Key Warrior"
              className="mt-2 text-xs font-semibold focus:ring-1 focus:ring-[#ff0033]/40 border-[var(--color-border)]"
            />
          ) : (
            <select
              value={form.combatStyle}
              onChange={(e) => update("combatStyle", e.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-text)] focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30 font-semibold cursor-pointer transition-all duration-200 hover:border-[#ff0033]/30"
            >
              {!COMMON_COMBAT_STYLES.includes(form.combatStyle) && form.combatStyle !== "" && (
                <option value={form.combatStyle} className="bg-[var(--color-surface-2)] font-semibold text-xs">{form.combatStyle}</option>
              )}
              {COMMON_COMBAT_STYLES.map((style) => (
                <option key={style} value={style} className="bg-[var(--color-surface-2)] font-semibold text-xs">{style}</option>
              ))}
            </select>
          )}
        </div>
        <div className="md:col-span-2 pt-4 border-t border-[var(--color-border)] relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#ff0033] flex items-center justify-between">
            <span>⚔️ Squad Games & Logos</span>
            <span className="text-[9px] text-[var(--color-text-muted)] normal-case font-medium">Search RAWG or add custom games & icons per member</span>
          </label>
          
          {/* Autocomplete Search input */}
          <div className="relative mt-2">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // Small delay to allow clicking on dropdown suggestions
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  placeholder="Type to search games (e.g. Valorant, Minecraft)..."
                  className="w-full text-xs"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#ff0033]/25 border-t-[#ff0033] animate-spin" />
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (searchQuery.trim()) {
                    setSquadGames([...squadGames, { name: searchQuery.trim(), logoUrl: "" }]);
                    setSearchQuery("");
                  } else {
                    setSquadGames([...squadGames, { name: "", logoUrl: "" }]);
                  }
                }}
                className="gap-1 px-3 text-xs"
              >
                <Plus size={12} /> Custom
              </Button>
            </div>

            {/* Dropdown Suggestions */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1.5 p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl max-h-64 overflow-y-auto animate-fade-in">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      // Check if already in the list
                      const alreadyAdded = squadGames.some(
                        (g) => g.name.toLowerCase() === s.name.toLowerCase()
                      );
                      if (!alreadyAdded) {
                        setSquadGames([...squadGames, { name: s.name, logoUrl: s.backgroundImage || "" }]);
                      }
                      setSearchQuery("");
                      setShowDropdown(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-xs font-bold text-[var(--color-text)] transition hover:bg-[#ff0033]/15 hover:text-white cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-md overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                      {s.backgroundImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.backgroundImage}
                          alt={s.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Gamepad2 size={12} className="text-[var(--color-text-muted)]" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="truncate text-xs font-extrabold text-[var(--color-text)]">{s.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active Games List */}
          <div className="mt-3 space-y-3">
            {squadGames.map((game, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/30 hover:bg-[var(--color-surface-2)]/50 hover:border-[#ff0033]/25 backdrop-blur-md transition-all duration-300 animate-fade-in border-l-4 border-l-[#ff0033] shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
              >
                {/* Live Logo Preview Container */}
                <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0 bg-[#0f0f0f] shadow-inner">
                  {game.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={game.logoUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <Gamepad2 size={16} className="text-[var(--color-text-muted)]" />
                  )}
                </div>

                {/* Input Fields */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    value={game.name}
                    onChange={(e) => {
                      const list = [...squadGames];
                      list[idx].name = e.target.value;
                      setSquadGames(list);
                    }}
                    placeholder="Game Name (e.g. Valorant)"
                    className="h-9 text-xs"
                  />
                  <Input
                    value={game.logoUrl}
                    onChange={(e) => {
                      const list = [...squadGames];
                      list[idx].logoUrl = e.target.value;
                      setSquadGames(list);
                    }}
                    placeholder="Logo URL (https://... or /icon.png)"
                    className="h-9 text-xs"
                  />
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => {
                    const list = squadGames.filter((_, i) => i !== idx);
                    setSquadGames(list);
                  }}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer self-end sm:self-auto shrink-0"
                  aria-label="Remove game"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
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
