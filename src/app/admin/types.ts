/**
 * Shared types for the admin console. Kept in their own module so tab
 * subcomponents (SquadMemberEditor, etc.) can import them without
 * dragging in the whole admin page.
 */

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  userId: string | null;
  replyText: string | null;
  repliedAt: string | null;
  repliedBy: string | null;
  createdAt: string;
}

export interface AdminEmail {
  email: string;
  createdAt: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  youtubeId: string;
  isActive: boolean;
  createdAt: string;
}

export interface StreamSlot {
  id: string;
  day: string;
  title: string;
  time: string;
  description: string;
  icon: string;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Game {
  id: string;
  name: string;
  logoUrl: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** YouTube-scheduled stream pulled from the cached payload — read-only on
 *  the admin side. The admin doesn't create/edit/delete these; they come
 *  straight from whatever the channel owner scheduled on YouTube. */
export interface UpcomingStream {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledStartTime: string;
  url: string;
}

export const emptyStreamSlot: Omit<StreamSlot, "id" | "createdAt" | "updatedAt"> = {
  day: "FRI",
  title: "",
  time: "",
  description: "",
  icon: "🎮",
  featured: false,
  sortOrder: 0,
};

export type SoundSource = "synth" | "upload";

export interface SoundClip {
  id: string;
  name: string;
  emoji: string;
  source: SoundSource;
  type: string;
  audioUrl: string;
  description: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const emptySoundClip: Omit<SoundClip, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  emoji: "🎮",
  source: "synth",
  type: "laser",
  audioUrl: "",
  description: "",
  color: "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-[#ff4b5f]",
  sortOrder: 0,
};

export type HighlightStatus = "pending" | "approved" | "rejected";
export type HighlightSource = "youtube" | "upload";

export interface Highlight {
  id: string;
  title: string;
  game: string;
  description: string;
  duration: string;
  source: HighlightSource;
  youtubeId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string;
  status: HighlightStatus;
  submittedByUserId: string | null;
  submittedByName: string;
  submittedByAvatar: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SquadMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  favoriteGames: string[];
  signatureAgent: string;
  twitchUrl: string | null;
  cpu: string;
  gpu: string;
  ram: string;
  monitor: string;
  mouse: string;
  bio: string;
  combatStyle: string;
  sortOrder: number;
}

export type MerchGrade = "LEGENDARY" | "RARE" | "COMMON";

export interface MerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  imageUrl: string;
  grade: MerchGrade;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const emptyMerchItem: Omit<MerchItem, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  description: "",
  price: 0,
  emoji: "🛍️",
  imageUrl: "",
  grade: "COMMON",
  sortOrder: 0,
};

export const emptySquadMember: Omit<SquadMember, "id"> = {
  name: "",
  role: "",
  avatarUrl: "",
  favoriteGames: [],
  signatureAgent: "",
  twitchUrl: null,
  cpu: "",
  gpu: "",
  ram: "",
  monitor: "",
  mouse: "",
  bio: "",
  combatStyle: "",
  sortOrder: 0,
};
