/**
 * Fallback sound buttons rendered on the homepage when the SoundClip table
 * is empty (fresh install, or admin cleared everything). Mirrors the
 * shape returned by /api/sounds. Keep the `type` values in sync with the
 * synth waveforms in Soundboard.tsx.
 */
export type SoundType = "laser" | "chime" | "powerup" | "fanfare" | "buzzer" | "subbass";
export type SoundSource = "synth" | "upload";

export interface SoundDefinition {
  id: string;
  name: string;
  emoji: string;
  source: SoundSource;
  type: SoundType;
  audioUrl: string;
  color: string;
  description: string;
}

/** Maximum number of soundboard buttons rendered on the homepage. The
 *  admin can store more than this in the DB; only the lowest-sortOrder
 *  rows up to this cap surface publicly. */
export const PUBLIC_SOUND_LIMIT = 12;

/** Curated emoji presets for the admin sound editor. The picker also
 *  accepts a custom emoji typed into the free-text input. */
export const EMOJI_PRESETS = [
  "🎮", "🎯", "💥", "⚔️", "🛡️", "🏆", "💀", "🔥", "⚡",
  "🚀", "💣", "🎲", "🕹️", "👾", "🤖", "👻", "🧠", "💎",
  "🔫", "🗡️", "🏹", "💪", "🦾", "👊", "🎧", "🔊", "📢",
  "🌟", "✨", "🎉",
];

export const DEFAULT_SOUNDS: SoundDefinition[] = [
  {
    id: "default-1",
    name: "Pew Laser",
    emoji: "💥",
    source: "synth",
    type: "laser",
    audioUrl: "",
    color: "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-[#ff4b5f]",
    description: "Valorant sidearm headshot",
  },
  {
    id: "default-2",
    name: "Level Up",
    emoji: "🛡️",
    source: "synth",
    type: "powerup",
    audioUrl: "",
    color: "hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.18)] text-white",
    description: "Valheim base expansion complete",
  },
  {
    id: "default-3",
    name: "Double Kill",
    emoji: "⚔️",
    source: "synth",
    type: "chime",
    audioUrl: "",
    color: "hover:border-[#ff4b5f] hover:shadow-[0_0_15px_rgba(255,75,95,0.25)] text-[#ff6b6b]",
    description: "Ultimate double kill combo",
  },
  {
    id: "default-4",
    name: "Epic Victory",
    emoji: "🏆",
    source: "synth",
    type: "fanfare",
    audioUrl: "",
    color: "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-white",
    description: "Match Point / Victory fanfare",
  },
  {
    id: "default-5",
    name: "Epic Fail",
    emoji: "💀",
    source: "synth",
    type: "buzzer",
    audioUrl: "",
    color: "hover:border-[#ff4b5f] hover:shadow-[0_0_15px_rgba(255,75,95,0.25)] text-[#ff4b5f]",
    description: "Troll smashed our builds",
  },
  {
    id: "default-6",
    name: "Sub Bass Drop",
    emoji: "🔊",
    source: "synth",
    type: "subbass",
    audioUrl: "",
    color: "hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.18)] text-white",
    description: "Dynamic gaming clutch mode drop",
  },
  {
    id: "default-7",
    name: "Headshot",
    emoji: "🎯",
    source: "synth",
    type: "laser",
    audioUrl: "",
    color: "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-[#ff4b5f]",
    description: "Pinpoint precision elimination",
  },
  {
    id: "default-8",
    name: "Combo Streak",
    emoji: "⚡",
    source: "synth",
    type: "chime",
    audioUrl: "",
    color: "hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.18)] text-white",
    description: "Unstoppable kill chain",
  },
  {
    id: "default-9",
    name: "GG Easy",
    emoji: "🏁",
    source: "synth",
    type: "fanfare",
    audioUrl: "",
    color: "hover:border-[#ff4b5f] hover:shadow-[0_0_15px_rgba(255,75,95,0.25)] text-[#ff6b6b]",
    description: "Round-ending power play",
  },
  {
    id: "default-10",
    name: "Rage Quit",
    emoji: "💢",
    source: "synth",
    type: "buzzer",
    audioUrl: "",
    color: "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-[#ff4b5f]",
    description: "Teammate just alt-F4'd",
  },
  {
    id: "default-11",
    name: "Loot Drop",
    emoji: "💎",
    source: "synth",
    type: "powerup",
    audioUrl: "",
    color: "hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.18)] text-white",
    description: "Legendary item pickup",
  },
  {
    id: "default-12",
    name: "Boss Down",
    emoji: "👹",
    source: "synth",
    type: "subbass",
    audioUrl: "",
    color: "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-white",
    description: "Raid boss eliminated",
  },
];

export const SOUND_TYPE_OPTIONS: { value: SoundType; label: string }[] = [
  { value: "laser", label: "Laser zap" },
  { value: "chime", label: "Bell chime" },
  { value: "powerup", label: "Power-up arpeggio" },
  { value: "fanfare", label: "Victory fanfare" },
  { value: "buzzer", label: "Failure buzz" },
  { value: "subbass", label: "Sub-bass drop" },
];
