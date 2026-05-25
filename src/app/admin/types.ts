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
