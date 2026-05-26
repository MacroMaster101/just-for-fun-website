"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Trash2,
  Plus,
  RefreshCw,
  Mail,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  Compass,
  Users,
  MessageSquare,
  Clock,
  UserCog,
  Radio,
  Settings,
  Bot,
  Calendar,
  ExternalLink,
  Gamepad2,
  Volume2,
  Sparkles,
  Check,
  XCircle,
  Play,
  Store,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Header } from "@/components/layout/Header";
import { SplineRobot } from "@/components/ui/SplineRobot";
import { SquadMemberEditor } from "./SquadMemberEditor";
import { StreamSlotEditor } from "./StreamSlotEditor";
import { EmojiPicker } from "./EmojiPicker";
import { MerchEditor } from "./MerchEditor";
import {
  emptyMerchItem,
  emptySoundClip,
  emptySquadMember,
  emptyStreamSlot,
  type AdminEmail,
  type ContactMessage,
  type Game,
  type Highlight,
  type HighlightStatus,
  type MerchItem,
  type MusicTrack,
  type SoundClip,
  type SquadMember,
  type StreamSlot,
  type UpcomingStream,
} from "./types";
import { PUBLIC_SOUND_LIMIT, SOUND_TYPE_OPTIONS } from "@/lib/soundboardDefaults";

const DEFAULT_FLOATING_GAMES = [
  {
    id: "default-game-1",
    name: "Valorant",
    logoUrl: "https://media.rawg.io/media/games/b11/b11127b9ee3c3701bd15b9af3286d20e.jpg",
  },
  {
    id: "default-game-2",
    name: "Valheim",
    logoUrl: "https://media.rawg.io/media/games/adb/adb59be81367b19c2544457424bcf086.jpg",
  },
  {
    id: "default-game-3",
    name: "Grand Theft Auto V",
    logoUrl: "https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg",
  },
  {
    id: "default-game-4",
    name: "Minecraft",
    logoUrl: "https://media.rawg.io/media/games/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg",
  },
  {
    id: "default-game-5",
    name: "Battlefield 6",
    logoUrl: "https://media.rawg.io/media/games/dcc/dcc38d78ab1f1a90fdc4ba1bea3a73ff.jpg",
  },
];

type FloatingGameSetting = {
  id: string;
  name: string;
  logoUrl: string;
};

type FloatingWordSetting = {
  text: string;
  style: "outline" | "glassy";
  dot?: string;
};

const DEFAULT_SYSTEM_WORDS: FloatingWordSetting[] = [
  { text: "J4FN SQUAD", style: "outline" },
  { text: "CLUTCH TIME", style: "glassy", dot: "#ff0033" },
  { text: "GG EZ", style: "outline" },
  { text: "MELTDOWN", style: "glassy", dot: "#00ff66" },
  { text: "AIM BOT", style: "glassy", dot: "#ffffff" },
  { text: "GAME ON", style: "outline" },
];

const ADMIN_TAB_IDS = [
  "command",
  "inbox",
  "admins",
  "cache",
  "music",
  "squad",
  "schedule",
  "sounds",
  "highlights",
  "settings",
  "games",
  "merch",
] as const;

type AdminTab = (typeof ADMIN_TAB_IDS)[number];

const isAdminTab = (value: string | null | undefined): value is AdminTab =>
  Boolean(value && ADMIN_TAB_IDS.includes(value as AdminTab));

const getAdminTabFromHash = (): AdminTab => {
  if (typeof window === "undefined") return "command";
  const hash = window.location.hash.replace(/^#/, "");
  return isAdminTab(hash) ? hash : "command";
};

const DISCORD_ADMIN_LINKS = [
  {
    title: "YouTube Status Bot",
    description: "Manage Discord updates for YouTube live/status alerts.",
    url: "https://discord-youtube-status-bot.fly.dev",
  },
  {
    title: "J4FN Server Bot",
    description: "Open the J4FN Discord server bot admin panel.",
    url: "https://discord-j4fn-server-bot.fly.dev",
  },
  {
    title: "Music Bot",
    description: "Control the J4FN Discord music bot dashboard.",
    url: "https://discord-music-bot-j4fn.fly.dev",
  },
] as const;

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Security & Loading states
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [countdown, setCountdown] = useState(5);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<AdminTab>("command");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [admins, setAdmins] = useState<AdminEmail[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [editingMember, setEditingMember] = useState<SquadMember | null>(null);
  const [creatingMember, setCreatingMember] = useState<Omit<SquadMember, "id"> | null>(null);
  const [squadFormError, setSquadFormError] = useState<string | null>(null);
  const [squadFormSuccess, setSquadFormSuccess] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Games (with logos) state — drives the hero marquee when populated.
  const [games, setGames] = useState<Game[]>([]);
  const [newGameName, setNewGameName] = useState("");
  const [gameUploadingFor, setGameUploadingFor] = useState<string | null>(null);
  const [gameError, setGameError] = useState<string | null>(null);
  const [gameSuccess, setGameSuccess] = useState<string | null>(null);

  // RAWG auto-suggest states
  const [gameSuggestions, setGameSuggestions] = useState<Array<{ id: number; name: string; backgroundImage: string }>>([]);
  const [searchingGames, setSearchingGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ name: string; logoUrl: string } | null>(null);
  const [showGameSuggestions, setShowGameSuggestions] = useState(false);

  // Schedule (stream slots) state
  const [streamSlots, setStreamSlots] = useState<StreamSlot[]>([]);
  // Auto-pulled from the cached YouTube payload — read-only on this tab.
  const [upcomingYouTubeStreams, setUpcomingYouTubeStreams] = useState<UpcomingStream[]>([]);
  const [youtubeCachedAt, setYoutubeCachedAt] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<StreamSlot | null>(null);
  const [creatingSlot, setCreatingSlot] = useState<typeof emptyStreamSlot | null>(null);
  const [slotFormError, setSlotFormError] = useState<string | null>(null);
  const [slotFormSuccess, setSlotFormSuccess] = useState<string | null>(null);

  // Sounds (Soundboard) state
  const [sounds, setSounds] = useState<SoundClip[]>([]);
  const [editingSound, setEditingSound] = useState<SoundClip | null>(null);
  const [creatingSound, setCreatingSound] = useState<typeof emptySoundClip | null>(null);
  const [soundFormError, setSoundFormError] = useState<string | null>(null);
  const [soundFormSuccess, setSoundFormSuccess] = useState<string | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);

  // Highlights (community clips) state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightFilter, setHighlightFilter] = useState<HighlightStatus | "all">("pending");
  const [highlightActionId, setHighlightActionId] = useState<string | null>(null);
  const [highlightError, setHighlightError] = useState<string | null>(null);
  const [highlightSuccess, setHighlightSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTabFromHash = () => {
      const next = getAdminTabFromHash();
      setActiveTab((prev) => (prev === next ? prev : next));
    };

    // Intentional URL -> tab state sync so browser refresh keeps the active
    // admin panel instead of resetting to Command Center.
    syncTabFromHash();

    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  // Message reading modal/drawer state
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  // Clear the reply form whenever the open message changes so the previous
  // draft/error doesn't bleed into a different conversation.
  const openedMessageId = selectedMessage?.id ?? null;
  useEffect(() => {
    // Reset form state whenever the open message id changes (including to
    // null). The setState calls inside an effect are a deliberate "external
    // event (modal opened) -> internal state reset" sync, not a render
    // cascade — guarded by the openedMessageId dependency so it only runs
    // when the open message actually changes.
    /* eslint-disable react-hooks/set-state-in-effect */
    setReplyText("");
    setReplyError(null);
    setReplySuccess(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [openedMessageId]);

  // Admin form state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminFormError, setAdminFormError] = useState<string | null>(null);
  const [adminFormSuccess, setAdminFormSuccess] = useState<string | null>(null);

  // Site settings form state (Spline scene URL etc.)
  const [splineSceneUrl, setSplineSceneUrl] = useState("");
  const [splineSceneSaved, setSplineSceneSaved] = useState(""); // tracks original for diff
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // Creator Shop state
  const [merchItems, setMerchItems] = useState<MerchItem[]>([]);
  const [editingMerch, setEditingMerch] = useState<MerchItem | null>(null);
  const [creatingMerch, setCreatingMerch] = useState<typeof emptyMerchItem | null>(null);
  const [merchFormError, setMerchFormError] = useState<string | null>(null);
  const [merchFormSuccess, setMerchFormSuccess] = useState<string | null>(null);
  const [shopLive, setShopLive] = useState(false);
  const [shopLiveSaved, setShopLiveSaved] = useState(false);

  // Floating settings state
  const [floatingGames, setFloatingGames] = useState<FloatingGameSetting[]>([]);
  const [floatingGamesSaved, setFloatingGamesSaved] = useState<string>("");
  const [floatingWords, setFloatingWords] = useState<FloatingWordSetting[]>([]);
  const [floatingWordsSaved, setFloatingWordsSaved] = useState<string>("");

  // Floating Games RAWG suggestions state
  const [newFloatingGameName, setNewFloatingGameName] = useState("");
  const [floatingGameSuggestions, setFloatingGameSuggestions] = useState<Array<{ id: number; name: string; backgroundImage: string }>>([]);
  const [searchingFloatingGames, setSearchingFloatingGames] = useState(false);
  const [selectedFloatingGame, setSelectedFloatingGame] = useState<{ name: string; logoUrl: string } | null>(null);
  const [showFloatingGameSuggestions, setShowFloatingGameSuggestions] = useState(false);
  const [floatingGameUploadingFor, setFloatingGameUploadingFor] = useState<string | null>(null);

  // Floating Words adding state
  const [newWordText, setNewWordText] = useState("");
  const [newWordStyle, setNewWordStyle] = useState<"outline" | "glassy">("outline");
  const [newWordDotColor, setNewWordDotColor] = useState("#ff0033");

  // Debounced search for RAWG games inside Floating Games editor
  useEffect(() => {
    const query = newFloatingGameName.trim();
    if (!query) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setFloatingGameSuggestions([]);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    if (selectedFloatingGame && selectedFloatingGame.name.toLowerCase() === query.toLowerCase()) {
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingFloatingGames(true);
      try {
        const res = await fetch(`/api/admin/games/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setFloatingGameSuggestions(data.results || []);
          setShowFloatingGameSuggestions(true);
        }
      } catch (err) {
        console.error("Error searching floating games:", err);
      } finally {
        setSearchingFloatingGames(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [newFloatingGameName, selectedFloatingGame]);

  // Save Floating Games Setting
  const [floatingGamesSaving, setFloatingGamesSaving] = useState(false);
  const handleSaveFloatingGames = async (list: FloatingGameSetting[]) => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setFloatingGamesSaving(true);
    try {
      const value = list.length > 0 ? JSON.stringify(list) : "";
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero.floatingGames", value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSettingsError(data.error || "Failed to save floating games.");
        return;
      }
      setFloatingGamesSaved(value);
      if (value === "") {
        setFloatingGames(DEFAULT_FLOATING_GAMES);
      }
      setSettingsSuccess("Floating games list updated successfully.");
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch {
      setSettingsError("Network error.");
    } finally {
      setFloatingGamesSaving(false);
    }
  };

  // Upload Floating Game Logo
  const handleUploadFloatingGameLogo = async (idx: number, file: File) => {
    setFloatingGameUploadingFor(String(idx));
    setSettingsError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("gameId", `floating-game-${idx}`); // Bypasses DB update, returns public URL directly
      const res = await fetch("/api/admin/games/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setSettingsError(data.error || "Floating game logo upload failed.");
        return;
      }

      const updatedList = floatingGames.map((g, i) => i === idx ? { ...g, logoUrl: data.logoUrl } : g);
      setFloatingGames(updatedList);
      setSettingsSuccess("Logo uploaded successfully.");
      setTimeout(() => setSettingsSuccess(null), 2500);
    } catch {
      setSettingsError("Network error.");
    } finally {
      setFloatingGameUploadingFor(null);
    }
  };

  // Save Floating Words Setting
  const [floatingWordsSaving, setFloatingWordsSaving] = useState(false);
  const handleSaveFloatingWords = async (list: FloatingWordSetting[]) => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setFloatingWordsSaving(true);
    try {
      const value = list.length > 0 ? JSON.stringify(list) : "";
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero.floatingWords", value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSettingsError(data.error || "Failed to save floating words.");
        return;
      }
      setFloatingWordsSaved(value);
      if (value === "") {
        setFloatingWords(DEFAULT_SYSTEM_WORDS);
      }
      setSettingsSuccess("Floating words list updated successfully.");
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch {
      setSettingsError("Network error.");
    } finally {
      setFloatingWordsSaving(false);
    }
  };

  // Music form state
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackYoutubeId, setNewTrackYoutubeId] = useState("");
  const [musicVolume, setMusicVolume] = useState(35);
  const [musicVolumeSaved, setMusicVolumeSaved] = useState(35);
  const [musicVolumeSaving, setMusicVolumeSaving] = useState(false);
  const [musicFormError, setMusicFormError] = useState<string | null>(null);
  const [musicFormSuccess, setMusicFormSuccess] = useState<string | null>(null);

  // Syncing states
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Check admin status
  // Depend on the user *id*, not the user object itself. Supabase emits a new
  // user object on every TOKEN_REFRESHED / USER_UPDATED event (same id, new
  // reference) which would otherwise re-fire this admin check on every JWT
  // refresh — observed as a flurry of /api/admin/check calls in the logs.
  const userId = user?.id ?? null;
  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/admin/check");
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (active) {
          setIsAdmin(data.isAdmin);
          setChecking(false);
        }
      } catch {
        if (active) {
          setIsAdmin(false);
          setChecking(false);
        }
      }
    };

    checkStatus();
    return () => { active = false; };
  }, [userId]);

  // Handle redirect if not admin
  useEffect(() => {
    if (isAdmin !== false) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAdmin, router]);

  // Debounced search for RAWG games
  useEffect(() => {
    const query = newGameName.trim();
    if (!query) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setGameSuggestions([]);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    // If the input exactly matches the selected game name, don't re-trigger a search
    if (selectedGame && selectedGame.name.toLowerCase() === query.toLowerCase()) {
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingGames(true);
      try {
        const res = await fetch(`/api/admin/games/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setGameSuggestions(data.results || []);
          setShowGameSuggestions(true);
        }
      } catch (err) {
        console.error("Error searching games:", err);
      } finally {
        setSearchingGames(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [newGameName, selectedGame]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/emails");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  };

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/admin/music", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error("Failed to fetch music tracks:", err);
    }
  };

  const fetchSquad = async () => {
    try {
      const res = await fetch("/api/admin/squad");
      if (res.ok) {
        const data = await res.json();
        setSquad(data.members);
      }
    } catch (err) {
      console.error("Failed to fetch squad:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const sceneUrl = (data.settings?.["hero.splineScene"] as string | undefined) ?? "";
      setSplineSceneUrl(sceneUrl);
      setSplineSceneSaved(sceneUrl);

      const rawMusicVolume = Number((data.settings?.["music.volume"] as string | undefined) ?? "35");
      const nextMusicVolume = Number.isInteger(rawMusicVolume)
        ? Math.min(100, Math.max(0, rawMusicVolume))
        : 35;
      setMusicVolume(nextMusicVolume);
      setMusicVolumeSaved(nextMusicVolume);

      const fg = (data.settings?.["hero.floatingGames"] as string | undefined) ?? "";
      setFloatingGamesSaved(fg);
      if (fg) {
        try {
          const parsed = JSON.parse(fg);
          if (Array.isArray(parsed)) setFloatingGames(parsed);
        } catch { }
      } else {
        setFloatingGames(DEFAULT_FLOATING_GAMES);
      }

      const fw = (data.settings?.["hero.floatingWords"] as string | undefined) ?? "";
      setFloatingWordsSaved(fw);
      if (fw) {
        try {
          const parsed = JSON.parse(fw);
          if (Array.isArray(parsed)) setFloatingWords(parsed);
        } catch { }
      } else {
        setFloatingWords(DEFAULT_SYSTEM_WORDS);
      }

      const live = data.settings?.["shop.live"] === "true";
      setShopLive(live);
      setShopLiveSaved(live);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const fetchMerch = async () => {
    try {
      const res = await fetch("/api/admin/merch", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMerchItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch merch items:", err);
    }
  };

  const handleSaveMerch = async (item: MerchItem | (typeof emptyMerchItem & { id?: string })) => {
    setMerchFormError(null);
    setMerchFormSuccess(null);
    const isUpdate = "id" in item && typeof item.id === "string" && item.id.length > 0;
    try {
      const res = await fetch("/api/admin/merch", {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMerchFormError(data.error || "Failed to save product.");
        return;
      }
      setMerchFormSuccess(isUpdate ? "Product updated." : "Product added.");
      setEditingMerch(null);
      setCreatingMerch(null);
      await fetchMerch();
    } catch (err) {
      console.error("Failed to save merch:", err);
      setMerchFormError("Network error while saving.");
    }
  };

  const handleDeleteMerch = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/merch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMerchItems((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete merch:", err);
    }
  };

  const handleSaveShopLive = async () => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "shop.live", value: shopLive ? "true" : "false" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSettingsError(data.error || "Failed to save shop status.");
        return;
      }
      setShopLiveSaved(shopLive);
      setSettingsSuccess(shopLive ? "Shop is now LIVE." : "Shop is now in Coming Soon mode.");
    } catch (err) {
      console.error("Failed to toggle shop live:", err);
      setSettingsError("Network error while saving.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const fetchGames = async () => {
    try {
      const res = await fetch("/api/admin/games", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
      }
    } catch (err) {
      console.error("Failed to fetch games:", err);
    }
  };

  const flashGameSuccess = (msg: string) => {
    setGameSuccess(msg);
    setGameError(null);
    setTimeout(() => setGameSuccess(null), 2500);
  };

  const handleAddGame = async () => {
    const name = newGameName.trim();
    if (!name) {
      setGameError("Name is required.");
      return;
    }

    let logoUrl = "";
    if (selectedGame && selectedGame.name.toLowerCase() === name.toLowerCase()) {
      logoUrl = selectedGame.logoUrl;
    }

    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl, sortOrder: games.length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGameError(data.error || "Failed to add game.");
        return;
      }
      setNewGameName("");
      setSelectedGame(null);
      setGameSuggestions([]);
      flashGameSuccess(
        logoUrl
          ? "Game added with logo successfully!"
          : "Game added. Upload a logo next."
      );
      await fetchGames();
    } catch {
      setGameError("Network error.");
    }
  };

  const handleRenameGame = async (id: string, name: string) => {
    try {
      const res = await fetch("/api/admin/games", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (res.ok) await fetchGames();
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDeleteGame = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from the marquee?`)) return;
    try {
      const res = await fetch("/api/admin/games", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        flashGameSuccess("Game removed.");
        await fetchGames();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUploadGameLogo = async (gameId: string, file: File) => {
    setGameUploadingFor(gameId);
    setGameError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("gameId", gameId);
      const res = await fetch("/api/admin/games/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setGameError(data.error || "Logo upload failed.");
        return;
      }
      flashGameSuccess("Logo uploaded.");
      await fetchGames();
    } catch {
      setGameError("Network error.");
    } finally {
      setGameUploadingFor(null);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/admin/schedule", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStreamSlots(data.slots || []);
        setUpcomingYouTubeStreams(filterFreshUpcoming(data.upcomingStreams || []));
        setYoutubeCachedAt(data.youtubeCachedAt ?? null);
      }
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    }
  };

  const flashSlotSuccess = (msg: string) => {
    setSlotFormSuccess(msg);
    setSlotFormError(null);
    setTimeout(() => setSlotFormSuccess(null), 2500);
  };

  const handleSaveSlot = async (
    slot: StreamSlot | (typeof emptyStreamSlot),
    isNew: boolean
  ) => {
    setSlotFormError(null);
    setSlotFormSuccess(null);
    if (!slot.day.trim() || !slot.title.trim() || !slot.time.trim()) {
      setSlotFormError("Day, title, and time are required.");
      return;
    }
    try {
      const res = await fetch("/api/admin/schedule", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slot),
      });
      const data = await res.json();
      if (!res.ok) {
        setSlotFormError(data.error || "Save failed.");
        return;
      }
      flashSlotSuccess(isNew ? "Slot added." : "Slot updated.");
      setEditingSlot(null);
      setCreatingSlot(null);
      await fetchSchedule();
    } catch (err) {
      console.error("Failed to save slot:", err);
      setSlotFormError("Network error.");
    }
  };

  const handleDeleteSlot = async (id: string, title: string) => {
    if (!confirm(`Delete the "${title}" slot?`)) return;
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        flashSlotSuccess("Slot removed.");
        await fetchSchedule();
      }
    } catch (err) {
      console.error("Failed to delete slot:", err);
    }
  };

  const fetchSounds = async () => {
    try {
      const res = await fetch("/api/admin/sounds", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSounds(data.sounds || []);
      }
    } catch (err) {
      console.error("Failed to fetch sounds:", err);
    }
  };

  const flashSoundSuccess = (msg: string) => {
    setSoundFormSuccess(msg);
    setSoundFormError(null);
    setTimeout(() => setSoundFormSuccess(null), 2500);
  };

  const handleSaveSound = async (
    sound: SoundClip | typeof emptySoundClip,
    isNew: boolean
  ) => {
    setSoundFormError(null);
    setSoundFormSuccess(null);
    if (!sound.name.trim()) {
      setSoundFormError("Sound name is required.");
      return;
    }
    try {
      const res = await fetch("/api/admin/sounds", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sound),
      });
      const data = await res.json();
      if (!res.ok) {
        setSoundFormError(data.error || "Save failed.");
        return;
      }
      flashSoundSuccess(isNew ? "Sound added." : "Sound updated.");
      setEditingSound(null);
      setCreatingSound(null);
      await fetchSounds();
    } catch {
      setSoundFormError("Network error.");
    }
  };

  const handleSeedSounds = async () => {
    setSoundFormError(null);
    setSoundFormSuccess(null);
    try {
      const res = await fetch("/api/admin/sounds/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSoundFormError(data.error || "Seed failed.");
        return;
      }
      flashSoundSuccess(
        data.inserted === 0
          ? "Already up to date — no missing defaults."
          : `Added ${data.inserted} default sound${data.inserted === 1 ? "" : "s"}.`
      );
      await fetchSounds();
    } catch {
      setSoundFormError("Network error.");
    }
  };

  const handleUploadSoundAudio = async (soundId: string, file: File) => {
    setAudioUploading(true);
    setSoundFormError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("soundId", soundId);
      const res = await fetch("/api/admin/sounds/audio", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setSoundFormError(data.error || "Audio upload failed.");
        return;
      }
      flashSoundSuccess("Audio uploaded.");
      // Patch the editor draft so the new URL + source=upload is reflected.
      setEditingSound((prev) =>
        prev && prev.id === soundId
          ? { ...prev, audioUrl: data.audioUrl, source: "upload" }
          : prev
      );
      await fetchSounds();
    } catch {
      setSoundFormError("Network error.");
    } finally {
      setAudioUploading(false);
    }
  };

  const handleDeleteSound = async (id: string, name: string) => {
    if (!confirm(`Delete the "${name}" sound?`)) return;
    try {
      const res = await fetch("/api/admin/sounds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        flashSoundSuccess("Sound removed.");
        await fetchSounds();
      }
    } catch (err) {
      console.error("Failed to delete sound:", err);
    }
  };

  const fetchHighlights = async () => {
    try {
      const params = highlightFilter === "all" ? "" : `?status=${highlightFilter}`;
      const res = await fetch(`/api/admin/highlights${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setHighlights(data.highlights || []);
      }
    } catch (err) {
      console.error("Failed to fetch highlights:", err);
    }
  };

  const flashHighlightSuccess = (msg: string) => {
    setHighlightSuccess(msg);
    setHighlightError(null);
    setTimeout(() => setHighlightSuccess(null), 2500);
  };

  const handleReviewHighlight = async (id: string, status: HighlightStatus) => {
    setHighlightActionId(id);
    setHighlightError(null);
    try {
      const res = await fetch("/api/admin/highlights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHighlightError(data.error || "Action failed.");
        return;
      }
      flashHighlightSuccess(
        status === "approved" ? "Highlight approved." : status === "rejected" ? "Highlight rejected." : "Status updated."
      );
      await fetchHighlights();
    } catch {
      setHighlightError("Network error.");
    } finally {
      setHighlightActionId(null);
    }
  };

  const handleDeleteHighlight = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This removes it permanently.`)) return;
    setHighlightActionId(id);
    try {
      const res = await fetch("/api/admin/highlights", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        flashHighlightSuccess("Highlight removed.");
        await fetchHighlights();
      }
    } catch (err) {
      console.error("Failed to delete highlight:", err);
    } finally {
      setHighlightActionId(null);
    }
  };

  const handleSaveSpline = async () => {
    setSettingsError(null);
    setSettingsSuccess(null);
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero.splineScene", value: splineSceneUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSettingsError(data.error || "Failed to save.");
        return;
      }
      setSplineSceneSaved(splineSceneUrl.trim());
      setSettingsSuccess("Robot scene updated. Refresh the homepage to see it.");
      setTimeout(() => setSettingsSuccess(null), 4000);
    } catch {
      setSettingsError("Network error.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const flashSquadSuccess = (msg: string) => {
    setSquadFormSuccess(msg);
    setSquadFormError(null);
    setTimeout(() => setSquadFormSuccess(null), 2500);
  };

  const handleSaveMember = async (member: SquadMember | Omit<SquadMember, "id">, isNew: boolean) => {
    setSquadFormError(null);
    setSquadFormSuccess(null);
    if (!member.name.trim() || !member.role.trim()) {
      setSquadFormError("Name and role are required.");
      return;
    }
    try {
      const res = await fetch("/api/admin/squad", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
      const data = await res.json();
      if (!res.ok) {
        setSquadFormError(data.error || "Save failed.");
        return;
      }
      flashSquadSuccess(isNew ? "Member added." : "Member updated.");
      setEditingMember(null);
      setCreatingMember(null);
      await fetchSquad();
    } catch (err) {
      console.error("Failed to save squad member:", err);
      setSquadFormError("Network error.");
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the squad?`)) return;
    try {
      const res = await fetch("/api/admin/squad", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        flashSquadSuccess("Member removed.");
        await fetchSquad();
      }
    } catch (err) {
      console.error("Failed to delete squad member:", err);
    }
  };

  const handleAvatarUpload = async (memberId: string, file: File) => {
    setAvatarUploading(true);
    setSquadFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("memberId", memberId);
      const res = await fetch("/api/admin/squad/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setSquadFormError(data.error || "Avatar upload failed.");
        return;
      }
      flashSquadSuccess("Avatar updated.");
      // Refresh the editing form with the new URL.
      setEditingMember((prev) =>
        prev && prev.id === memberId ? { ...prev, avatarUrl: data.avatarUrl } : prev
      );
      await fetchSquad();
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setSquadFormError("Network error.");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Load active tab data. The fetch helpers update state from an async response —
  // a valid "external data → react state" sync pattern that the lint rule flags
  // because it can't see past the synchronous call.
  useEffect(() => {
    if (!isAdmin) return;

    /* eslint-disable react-hooks/set-state-in-effect */
    if (activeTab === "inbox") {
      fetchMessages();
    } else if (activeTab === "admins") {
      fetchAdmins();
    } else if (activeTab === "music") {
      fetchTracks();
      fetchSettings();
    } else if (activeTab === "squad") {
      fetchSquad();
    } else if (activeTab === "schedule") {
      fetchSchedule();
    } else if (activeTab === "sounds") {
      fetchSounds();
    } else if (activeTab === "highlights") {
      fetchHighlights();
    } else if (activeTab === "games") {
      fetchGames();
    } else if (activeTab === "settings") {
      fetchSettings();
    } else if (activeTab === "merch") {
      fetchMerch();
      fetchSettings();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // fetchHighlights closes over highlightFilter; listing the filter in deps
    // is what we want so the panel reloads when the admin flips the tabs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAdmin, highlightFilter]);

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact message?")) return;
    try {
      const res = await fetch("/api/admin/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage) return;
    setReplyError(null);
    setReplySuccess(null);
    const trimmed = replyText.trim();
    if (!trimmed) {
      setReplyError("Reply cannot be empty.");
      return;
    }
    setReplySending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMessage.id, reply: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReplyError(data.error || "Failed to send reply.");
        return;
      }
      // Patch both the messages list and the open modal with the new reply
      // fields so the UI reflects "replied" state without a re-fetch.
      const replyTimestamp = new Date().toISOString();
      const patch = (m: ContactMessage): ContactMessage =>
        m.id === selectedMessage.id
          ? { ...m, replyText: trimmed, repliedAt: replyTimestamp, repliedBy: m.repliedBy }
          : m;
      setMessages((prev) => prev.map(patch));
      setSelectedMessage((m) => (m ? patch(m) : m));
      setReplyText("");
      const deliveryNote =
        data.delivery === "notification"
          ? "Sent as in-app notification."
          : data.delivery === "email"
            ? "Sent via email."
            : "Saved (email/notification skipped — check SMTP config).";
      setReplySuccess(deliveryNote);
    } catch (err) {
      console.error("Failed to send reply:", err);
      setReplyError("Network error.");
    } finally {
      setReplySending(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError(null);
    setAdminFormSuccess(null);

    const email = newAdminEmail.toLowerCase().trim();
    if (!email) {
      setAdminFormError("Please enter an email address.");
      return;
    }

    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAdminFormError(data.error || "Failed to add administrator.");
      } else {
        setAdminFormSuccess("Administrator added successfully!");
        setNewAdminEmail("");
        fetchAdmins();
      }
    } catch {
      setAdminFormError("Something went wrong. Please try again.");
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from administrators?`)) return;
    try {
      const res = await fetch("/api/admin/emails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to remove administrator.");
      } else {
        setAdmins((prev) => prev.filter((a) => a.email !== email));
      }
    } catch {
      alert("Failed to remove administrator.");
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setMusicFormError(null);
    setMusicFormSuccess(null);

    const title = newTrackTitle.trim();
    const youtubeId = newTrackYoutubeId.trim();

    if (!title || !youtubeId) {
      setMusicFormError("Title and YouTube Video ID are required.");
      return;
    }

    try {
      const res = await fetch("/api/admin/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, youtubeId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMusicFormError(data.error || "Failed to add music track.");
      } else {
        setMusicFormSuccess("Background music track added successfully!");
        setNewTrackTitle("");
        setNewTrackYoutubeId("");
        fetchTracks();
      }
    } catch {
      setMusicFormError("Something went wrong. Please try again.");
    }
  };

  const handleSaveMusicVolume = async () => {
    setMusicFormError(null);
    setMusicFormSuccess(null);
    setMusicVolumeSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "music.volume", value: String(musicVolume) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMusicFormError(data.error || "Failed to save music volume.");
        return;
      }
      setMusicVolumeSaved(musicVolume);
      setMusicFormSuccess("Music stream volume updated successfully!");
      setTimeout(() => setMusicFormSuccess(null), 3000);
    } catch {
      setMusicFormError("Something went wrong. Please try again.");
    } finally {
      setMusicVolumeSaving(false);
    }
  };

  const handleActivateTrack = async (id: string) => {
    // Optimistic update so the ACTIVE badge swaps immediately. We snapshot
    // the previous list so we can roll back if the server call fails.
    const previousTracks = tracks;
    setTracks((prev) => prev.map((t) => ({ ...t, isActive: t.id === id })));
    try {
      const res = await fetch("/api/admin/music", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTracks(previousTracks);
        alert(data.error || "Failed to activate track.");
        return;
      }
      // Server returns the fresh list from inside the transaction — use it
      // directly instead of a separate GET that could race the commit.
      if (Array.isArray(data.tracks)) {
        setTracks(data.tracks);
      }
    } catch {
      setTracks(previousTracks);
      alert("Failed to activate track.");
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Are you sure you want to delete this background music track?")) return;
    try {
      const res = await fetch("/api/admin/music", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete music track.");
      } else {
        fetchTracks();
      }
    } catch {
      alert("Failed to delete music track.");
    }
  };

  const handleSyncCache = async () => {
    setSyncing(true);
    setSyncSuccess(null);
    setSyncError(null);

    try {
      // Trigger live video sync cache with ?force=1 to bypass the 15-minute rate limit.
      const res = await fetch("/api/youtube/refresh?force=1", {
        method: "POST",
        cache: "no-store",
      });
      const data = await res.json();

      if (res.ok) {
        setSyncSuccess("YouTube Cache refreshed successfully!");
        // Instantly refresh the schedule view so the new time and streams show up in the UI
        await fetchSchedule();
      } else {
        setSyncError(data.message || "Cache sync failed.");
      }
    } catch {
      setSyncError("Network error. Unable to trigger Cache sync.");
    } finally {
      setSyncing(false);
    }
  };

  // Loading view
  if (checking) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center relative transition-colors duration-300">
        <div className="absolute inset-0 bg-grid-subtle opacity-20" />
        <div className="relative text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--color-border)]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#ff0033] animate-spin" />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
            Validating Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Access denied view
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6 relative transition-colors duration-300">
        <div className="absolute inset-0 bg-grid-subtle opacity-30" />
        <Card className="max-w-md w-full p-8 border-[#ff0033]/20 bg-[var(--color-bg-soft)]/80 backdrop-blur-xl text-center space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(255,0,51,0.15)]">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff0033]" />

          <div className="inline-flex p-4 rounded-full bg-red-950/40 border border-red-500/20 text-[#ff2d55] animate-pulse">
            <ShieldAlert size={40} />
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl tracking-wide uppercase text-[var(--color-text)]">
              Access Denied
            </h1>
            <p className="text-xs font-semibold tracking-wider text-[#ff0033] uppercase">
              Section Restricted to Administrators
            </p>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed pt-2">
              Your account holds insufficient privileges to access this console. You are being redirected to the homepage in <span className="font-mono text-[#ff2d55] font-bold text-base">{countdown}</span> seconds.
            </p>
          </div>

          <Button
            variant="outline"
            fullWidth
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ArrowLeft size={16} /> Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Filter messages for search
  const filteredMessages = messages.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.message.toLowerCase().includes(query)
    );
  });

  const adminTabs: Array<{ id: AdminTab; name: string; icon: React.ReactNode }> = [
    { id: "command", name: "Command Center", icon: <Compass size={16} /> },
    { id: "inbox", name: "Contact Inbox", icon: <MessageSquare size={16} /> },
    { id: "admins", name: "Administration", icon: <Users size={16} /> },
    { id: "music", name: "Music Stream", icon: <Radio size={16} /> },
    { id: "squad", name: "Squad Roster", icon: <Users size={16} /> },
    { id: "schedule", name: "Stream Schedule", icon: <Calendar size={16} /> },
    { id: "sounds", name: "Soundboard", icon: <Volume2 size={16} /> },
    { id: "highlights", name: "Highlights Queue", icon: <Sparkles size={16} /> },
    { id: "games", name: "Manage Games", icon: <Gamepad2 size={16} /> },
    { id: "merch", name: "Creator Shop", icon: <Store size={16} /> },
    { id: "settings", name: "Site Settings", icon: <Settings size={16} /> },
    { id: "cache", name: "YouTube Cache", icon: <RefreshCw size={16} /> },
  ];

  const handleAdminTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    if (typeof window === "undefined") return;
    const nextUrl = `${window.location.pathname}${window.location.search}#${tab}`;
    window.history.replaceState(null, "", nextUrl);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] bg-grid-subtle pt-28 pb-16 relative transition-colors duration-300">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          {/* Top Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-8 mb-10">
            <div className="space-y-1.5">
              <h1 className="font-display font-black text-3xl sm:text-4xl text-[var(--color-text)] tracking-tight flex items-center gap-3">
                <UserCog className="text-[#ff0033] animate-spin-slow drop-shadow-[0_0_8px_rgba(255,0,51,0.4)]" size={32} />
                Control Console
              </h1>
              <p className="text-[var(--color-text-muted)] text-xs tracking-wider uppercase font-semibold">
                Manage administrators, review client communications, and coordinate platform operations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="gap-2"
            >
              <ArrowLeft size={14} /> Back to Website
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Tab Menu Selector */}
            <div className="lg:col-span-3 space-y-2.5">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleAdminTabChange(tab.id)}
                  className={`flex w-full items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 border text-left cursor-pointer ${activeTab === tab.id
                      ? "border-[#ff0033] bg-[#ff0033]/10 text-[#ff0033] shadow-[0_0_20px_rgba(255,0,51,0.12)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-soft)]/50 text-[var(--color-text-muted)] hover:border-[#ff0033]/30 hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                    }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Right Column: Dynamic Content cards */}
            <div className="lg:col-span-9">

              {/* Tab 1: Command Center Overview */}
              {activeTab === "command" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Card 1 */}
                    <Card hoverEffect className="p-6 border-[var(--color-border)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--color-text-subtle)] font-mono text-[10px] uppercase tracking-widest">Database messages</span>
                          <MessageSquare size={18} className="text-[#ff2d55]" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[var(--color-text)]">Live</span>
                          <Badge variant="success" pulse>Connected</Badge>
                        </div>
                        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                          Communications inbox is fully operational and storing viewer submissions.
                        </p>
                      </div>
                    </Card>

                    {/* Card 2 */}
                    <Card hoverEffect className="p-6 border-[var(--color-border)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--color-text-subtle)] font-mono text-[10px] uppercase tracking-widest">Admin security</span>
                          <Users size={18} className="text-[#ff2d55]" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[var(--color-text)]">Active</span>
                          <Badge variant="primary">Filtered</Badge>
                        </div>
                        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                          Control Console access is limited strictly to active administrator accounts.
                        </p>
                      </div>
                    </Card>

                    {/* Card 3 */}
                    <Card hoverEffect className="p-6 border-[var(--color-border)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--color-text-subtle)] font-mono text-[10px] uppercase tracking-widest">API Sync Status</span>
                          <Clock size={18} className="text-[#ff2d55]" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[var(--color-text)]">Cache</span>
                          <Badge variant="success">Standby</Badge>
                        </div>
                        <p className="text-[var(--color-text-muted)] text-xs leading-relaxed">
                          YouTube video cache tables are operating normally.
                        </p>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-6 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-[#5865F2]/8 blur-2xl" />
                    <div className="relative space-y-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#5865F2]/25 bg-[#5865F2]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#5865F2]">
                            <Bot size={13} /> Discord Tools
                          </div>
                          <h3 className="font-display text-xl font-black uppercase text-[var(--color-text)]">
                            Bot Admin Dashboards
                          </h3>
                          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
                            Quick redirects to the external Discord bot control pages.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {DISCORD_ADMIN_LINKS.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex min-h-[130px] flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 transition hover:border-[#5865F2]/60 hover:bg-[#5865F2]/10 hover:shadow-[0_0_24px_rgba(88,101,242,0.14)]"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-sm font-black uppercase tracking-wide text-[var(--color-text)]">
                                  {link.title}
                                </h4>
                                <ExternalLink
                                  size={15}
                                  className="mt-0.5 shrink-0 text-[var(--color-text-muted)] transition group-hover:text-[#5865F2]"
                                />
                              </div>
                              <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                                {link.description}
                              </p>
                            </div>
                            <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#5865F2]">
                              Open dashboard
                              <ExternalLink size={12} />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-4">
                      <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                        🎮 Welcome to the Command Console
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                        This secure admin panel allows you to direct all backend actions for the **Just For Fun Gaming Channel** website.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-2">
                          <h4 className="text-xs font-black uppercase text-[var(--color-text)] tracking-widest">Inbox Control</h4>
                          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">Read incoming feedback, respond directly using one-click SMTP email integration, and purge database logs once handled.</p>
                        </div>
                        <div className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-2">
                          <h4 className="text-xs font-black uppercase text-[var(--color-text)] tracking-widest">Admin Roster</h4>
                          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">Add trusted creators and co-hosts by entering their emails. Only people in the roster are authorized to access this console.</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab 2: Contact Messages Inbox */}
              {activeTab === "inbox" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                      <input
                        type="text"
                        placeholder="Search messages by name, email, or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--color-bg-soft)]/80 border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-subtle)] rounded-full py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-[#ff0033]/50 focus:ring-1 focus:ring-[#ff0033]/30 transition-all duration-300"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchMessages} className="gap-2 shrink-0">
                      <RefreshCw size={14} /> Refresh Inbox
                    </Button>
                  </div>

                  <Card className="border-[var(--color-border)] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-surface-2)]/60">
                            <th className="p-4">Sender</th>
                            <th className="p-4">Message Snippet</th>
                            <th className="p-4">Submitted At</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMessages.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-12 text-center text-xs text-[var(--color-text-muted)]">
                                No messages found in your inbox.
                              </td>
                            </tr>
                          ) : (
                            filteredMessages.map((msg) => (
                              <tr
                                key={msg.id}
                                className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/40 transition-colors group/row cursor-pointer"
                                onClick={() => setSelectedMessage(msg)}
                              >
                                <td className="p-4">
                                  <div className="font-semibold text-xs text-[var(--color-text)] truncate max-w-[150px]">{msg.name}</div>
                                  <div className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[150px]">{msg.email}</div>
                                </td>
                                <td className="p-4 max-w-[280px]">
                                  <p className="text-xs text-[var(--color-text-muted)] truncate">{msg.message}</p>
                                </td>
                                <td className="p-4 text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                                  {new Date(msg.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-2">
                                    <a
                                      href={`mailto:${msg.email}?subject=Reply from JFF Gaming Channel&body=Hi ${msg.name},%0D%0A%0D%0A`}
                                      className="p-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[#ff0033]/50 hover:text-[var(--color-text)] transition"
                                      title="Reply via Email"
                                    >
                                      <Mail size={14} />
                                    </a>
                                    <button
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="p-2 rounded-lg bg-red-950/20 border border-red-500/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:border-[#ff0033] hover:text-white transition"
                                      title="Delete Submission"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab 3: Admins Management CRUD */}
              {activeTab === "admins" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Roster list */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-extrabold text-lg text-[var(--color-text)]">
                        🛡️ Active Administrators
                      </h3>
                      <Button variant="outline" size="sm" onClick={fetchAdmins}>
                        <RefreshCw size={12} />
                      </Button>
                    </div>

                    <Card className="border-[var(--color-border)] overflow-hidden">
                      <div className="divide-y divide-[var(--color-border)]">
                        {admins.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">Loading administrators...</div>
                        ) : (
                          admins.map((admin) => {
                            const isSelf = admin.email === user?.email?.toLowerCase().trim();
                            return (
                              <div key={admin.email} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-2)]/40 transition-colors">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[var(--color-text)] truncate flex items-center gap-2">
                                    {admin.email}
                                    {isSelf && <Badge variant="success">You</Badge>}
                                  </p>
                                  <p className="text-[10px] text-[var(--color-text-muted)] pt-0.5">
                                    Registered: {new Date(admin.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRemoveAdmin(admin.email)}
                                  disabled={isSelf}
                                  className="p-2 rounded-lg bg-red-950/20 border border-red-500/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:border-[#ff0033] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                                  title={isSelf ? "You cannot remove your own admin access" : "Remove Administrator"}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Add admin form */}
                  <div className="md:col-span-5 space-y-4">
                    <h3 className="font-display font-extrabold text-lg text-[var(--color-text)]">
                      ➕ Add Administrator
                    </h3>
                    <Card className="p-6 border-[var(--color-border)]">
                      <form onSubmit={handleAddAdmin} className="space-y-4">
                        {adminFormError && (
                          <div className="flex items-start gap-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 p-4 text-xs text-rose-300">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                            <span>{adminFormError}</span>
                          </div>
                        )}

                        {adminFormSuccess && (
                          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-xs text-emerald-300">
                            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                            <span>{adminFormSuccess}</span>
                          </div>
                        )}

                        <Input
                          label="New Admin Email"
                          type="email"
                          required
                          placeholder="co-host@example.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                        />

                        <Button type="submit" variant="aurora" glow fullWidth className="gap-2">
                          <UserPlus size={16} /> Authorize Admin
                        </Button>
                      </form>
                    </Card>
                  </div>
                </div>
              )}

              {/* Tab 4: Music Stream CRUD */}
              {activeTab === "music" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-fade-in-up">
                  {/* Tracks list */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-extrabold text-lg text-[var(--color-text)] flex items-center gap-2">
                        <Radio size={20} className="text-[#ff0033] animate-pulse" />
                        Music Library
                      </h3>
                      <Button variant="outline" size="sm" onClick={fetchTracks}>
                        <RefreshCw size={12} />
                      </Button>
                    </div>

                    <Card className="border-[var(--color-border)] overflow-hidden">
                      <div className="divide-y divide-[var(--color-border)]">
                        {tracks.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                            No custom music tracks added. The site is currently playing the default Synthwave stream.
                          </div>
                        ) : (
                          tracks.map((track) => (
                            <div key={track.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-2)]/40 transition-colors">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[var(--color-text)] truncate flex items-center gap-2">
                                  🎵 {track.title}
                                  {track.isActive && <Badge variant="success" className="ml-1" pulse>Active</Badge>}
                                </p>
                                <p className="text-[10px] text-[var(--color-text-muted)] font-mono pt-0.5">
                                  Video ID: {track.youtubeId} · Added: {new Date(track.createdAt).toLocaleDateString()}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {!track.isActive && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleActivateTrack(track.id)}
                                    className="px-3.5 py-1 text-[10px]"
                                  >
                                    Activate
                                  </Button>
                                )}
                                <button
                                  onClick={() => handleDeleteTrack(track.id)}
                                  className="p-2 rounded-lg bg-red-950/20 border border-red-500/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:border-[#ff0033] hover:text-white transition"
                                  title="Delete Music Track"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Add track form */}
                  <div className="md:col-span-5 space-y-4">
                    <h3 className="font-display font-extrabold text-lg text-[var(--color-text)] flex items-center gap-2">
                      <Volume2 size={18} className="text-[#ff0033]" />
                      Stream Volume
                    </h3>
                    <Card className="p-6 border-[var(--color-border)]">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
                              Ambient music level
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                              Applies to the floating music player across the site.
                            </p>
                          </div>
                          <div className="h-11 min-w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 flex items-center justify-center font-mono text-sm font-black text-[#ff0033]">
                            {musicVolume}%
                          </div>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={musicVolume}
                          onChange={(e) => setMusicVolume(Number(e.target.value))}
                          className="w-full accent-[#ff0033] cursor-pointer"
                          aria-label="Music stream volume"
                        />

                        <div className="grid grid-cols-3 gap-2">
                          {[20, 35, 60].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setMusicVolume(preset)}
                              className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                                musicVolume === preset
                                  ? "border-[#ff0033] bg-[#ff0033]/15 text-white"
                                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[#ff0033]/60 hover:text-[var(--color-text)]"
                              }`}
                            >
                              {preset}%
                            </button>
                          ))}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          fullWidth
                          disabled={musicVolumeSaving || musicVolume === musicVolumeSaved}
                          onClick={handleSaveMusicVolume}
                          className="gap-2"
                        >
                          <Check size={14} />
                          {musicVolumeSaving ? "Saving..." : "Save Volume"}
                        </Button>
                      </div>
                    </Card>

                    <h3 className="font-display font-extrabold text-lg text-[var(--color-text)]">
                      ➕ Add Custom Track
                    </h3>
                    <Card className="p-6 border-[var(--color-border)]">
                      <form onSubmit={handleAddTrack} className="space-y-4">
                        {musicFormError && (
                          <div className="flex items-start gap-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 p-4 text-xs text-rose-300">
                            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                            <span>{musicFormError}</span>
                          </div>
                        )}

                        {musicFormSuccess && (
                          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-xs text-emerald-300">
                            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                            <span>{musicFormSuccess}</span>
                          </div>
                        )}

                        <Input
                          label="Track Title"
                          type="text"
                          required
                          placeholder="e.g. Chill Synthwave Beat 2026"
                          value={newTrackTitle}
                          onChange={(e) => setNewTrackTitle(e.target.value)}
                        />

                        <Input
                          label="YouTube Video ID or URL"
                          type="text"
                          required
                          placeholder="h7MYJghRWt0 or https://youtu.be/h7MYJghRWt0"
                          value={newTrackYoutubeId}
                          onChange={(e) => setNewTrackYoutubeId(e.target.value)}
                        />

                        <Button type="submit" variant="aurora" glow fullWidth className="gap-2">
                          <Plus size={16} /> Register Track
                        </Button>
                      </form>
                    </Card>

                    {/* Tips box */}
                    <Card className="p-4 border-[var(--color-border)] bg-[var(--color-surface-2)]/30 text-xs text-[var(--color-text-muted)] space-y-2">
                      <p className="font-black uppercase tracking-wider text-[9px] text-[#ff0033]">💡 How to find the YouTube Video ID?</p>
                      <p className="leading-relaxed">Copy the 11-character code at the end of the YouTube video URL.</p>
                      <p className="font-mono text-[10px] text-[var(--color-text)] bg-[var(--color-surface-2)] p-2 rounded border border-[var(--color-border)]">https://youtube.com/watch?v=<span className="text-[#ff0033] font-bold">h7MYJghRWt0</span></p>
                    </Card>
                  </div>
                </div>
              )}

              {/* Tab 5: Squad Roster CRUD */}
              {activeTab === "squad" && (
                <div className="space-y-6">
                  <Card className="p-6 border-[var(--color-border)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                      <div>
                        <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                          ⚔️ Squad Roster
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Edit the operators shown on the homepage <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-[10px]">Meet the Squad</code> section.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setCreatingMember({ ...emptySquadMember });
                          setEditingMember(null);
                          setSquadFormError(null);
                          setSquadFormSuccess(null);
                        }}
                        className="gap-2"
                      >
                        <Plus size={14} /> Add Member
                      </Button>
                    </div>

                    {squadFormError && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                        <AlertTriangle size={14} /> {squadFormError}
                      </div>
                    )}
                    {squadFormSuccess && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                        <CheckCircle2 size={14} /> {squadFormSuccess}
                      </div>
                    )}

                    {/* Roster list */}
                    {squad.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                        No members yet. Click <strong>Add Member</strong> to create the first one — the homepage will fall back to the built-in default trio until then.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {squad.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                          >
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                              {m.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="font-display font-black text-sm text-[var(--color-text)]">
                                  {m.name.charAt(0).toUpperCase() || "?"}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-[var(--color-text)] truncate">{m.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)] truncate">{m.role}</p>
                            </div>
                            <div className="hidden sm:flex flex-wrap gap-1">
                              {m.favoriteGames.slice(0, 2).map((g) => (
                                <Badge key={g} variant="secondary" className="text-[9px]">{g}</Badge>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingMember(m);
                                setCreatingMember(null);
                                setSquadFormError(null);
                                setSquadFormSuccess(null);
                              }}
                              className="gap-1.5"
                            >
                              <UserCog size={12} /> Edit
                            </Button>
                            <button
                              onClick={() => handleDeleteMember(m.id, m.name)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              aria-label={`Delete ${m.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Editor — single form rendered for either create or edit */}
                  {(editingMember || creatingMember) && (
                    <SquadMemberEditor
                      key={editingMember?.id || "new"}
                      initial={editingMember || (creatingMember as Omit<SquadMember, "id"> & { id?: string })}
                      isNew={!editingMember}
                      avatarUploading={avatarUploading}
                      onAvatarUpload={handleAvatarUpload}
                      onCancel={() => {
                        setEditingMember(null);
                        setCreatingMember(null);
                        setSquadFormError(null);
                      }}
                      onSave={(member, isNew) => handleSaveMember(member, isNew)}
                    />
                  )}
                </div>
              )}

              {/* Tab 6: Stream Schedule CRUD */}
              {activeTab === "schedule" && (
                <div className="space-y-6">
                  {/* Read-only: streams the channel owner scheduled on YouTube itself.
                      Auto-refreshed by the daily cron — sync sooner via YouTube Cache tab. */}
                  <Card className="p-6 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]/60" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-display font-extrabold text-lg text-[var(--color-text)] flex items-center gap-2">
                          <Radio size={16} className="text-[#ff4b5f]" />
                          Auto-pulled from YouTube
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Streams you scheduled on YouTube directly. Read-only here — manage them on{" "}
                          <a
                            href="https://studio.youtube.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#ff4b5f] hover:underline"
                          >
                            YouTube Studio
                          </a>{" "}
                          and they refresh on the next cron tick (or hit Sync in the YouTube Cache tab).
                        </p>
                      </div>
                      {youtubeCachedAt && (
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono whitespace-nowrap">
                          Cache: {new Date(youtubeCachedAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {upcomingYouTubeStreams.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-text-muted)]">
                        No upcoming scheduled streams found on YouTube. When you schedule one in YouTube Studio it will show up here after the next cache refresh.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {upcomingYouTubeStreams.map((s) => (
                          <a
                            key={s.id}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#ff0033]/40 transition group"
                          >
                            {s.thumbnail && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.thumbnail}
                                alt=""
                                className="h-12 w-20 rounded-md object-cover shrink-0 border border-[var(--color-border)]"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-[var(--color-text)] truncate group-hover:text-[#ff4b5f] transition">
                                {s.title}
                              </p>
                              <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                                {new Date(s.scheduledStartTime).toLocaleString()}
                              </p>
                            </div>
                            <ExternalLink size={14} className="text-[var(--color-text-muted)] shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </Card>

                  <Card className="p-6 border-[var(--color-border)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                      <div>
                        <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                          📅 Weekly Schedule (manual)
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Recurring slots you control. Shown alongside the YouTube auto-pull above. Empty <em>and</em> no YouTube streams = the homepage shows a <strong>Coming soon</strong> placeholder.
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setCreatingSlot({ ...emptyStreamSlot });
                          setEditingSlot(null);
                          setSlotFormError(null);
                          setSlotFormSuccess(null);
                        }}
                        className="gap-2"
                      >
                        <Plus size={14} /> Add Slot
                      </Button>
                    </div>

                    {slotFormError && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                        <AlertTriangle size={14} /> {slotFormError}
                      </div>
                    )}
                    {slotFormSuccess && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                        <CheckCircle2 size={14} /> {slotFormSuccess}
                      </div>
                    )}

                    {streamSlots.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                        No stream slots yet. Click <strong>Add Slot</strong> to create one — the homepage will show a <em>Coming soon</em> card until you do.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {streamSlots.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-surface-2)] font-display font-black text-sm text-[var(--color-text)] shrink-0">
                              {s.day}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                                <span>{s.icon}</span>
                                <span className="truncate">{s.title}</span>
                                {s.featured && (
                                  <Badge variant="primary" className="text-[9px]">Featured</Badge>
                                )}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)] truncate">
                                {s.time}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSlot(s);
                                setCreatingSlot(null);
                                setSlotFormError(null);
                                setSlotFormSuccess(null);
                              }}
                              className="gap-1.5"
                            >
                              <UserCog size={12} /> Edit
                            </Button>
                            <button
                              onClick={() => handleDeleteSlot(s.id, s.title)}
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                              aria-label={`Delete ${s.title}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {(editingSlot || creatingSlot) && (
                    <StreamSlotEditor
                      key={editingSlot?.id || "new"}
                      initial={editingSlot || (creatingSlot as typeof emptyStreamSlot)}
                      isNew={!editingSlot}
                      onCancel={() => {
                        setEditingSlot(null);
                        setCreatingSlot(null);
                        setSlotFormError(null);
                      }}
                      onSave={(slot, isNew) => handleSaveSlot(slot, isNew)}
                    />
                  )}
                </div>
              )}

              {/* Tab: Soundboard CRUD */}
              {activeTab === "sounds" && (
                <div className="space-y-6">
                  <Card className="p-6 border-[var(--color-border)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                      <div>
                        <h3 className="font-display font-extrabold text-xl text-[var(--color-text)] flex items-center gap-2">
                          <Volume2 size={20} className="text-[#ff0033]" />
                          Soundboard
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Synth buttons shown on the homepage <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-[10px]">Highlights &amp; Sound Arena</code>. Empty list falls back to the built-in defaults.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold font-mono tracking-wider ${Math.min(sounds.length, PUBLIC_SOUND_LIMIT) === PUBLIC_SOUND_LIMIT
                              ? "border-[#ff0033]/40 bg-[#ff0033]/10 text-[#ff4b5f]"
                              : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                            }`}
                          title="Public sounds / homepage limit"
                        >
                          <Volume2 size={12} />
                          {Math.min(sounds.length, PUBLIC_SOUND_LIMIT)}/{PUBLIC_SOUND_LIMIT}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSeedSounds}
                          className="gap-1.5"
                          title="Insert any built-in default sounds that aren't already in the DB"
                        >
                          <RefreshCw size={12} /> Top up defaults
                        </Button>
                        <Button
                          onClick={() => {
                            setCreatingSound({ ...emptySoundClip, sortOrder: sounds.length });
                            setEditingSound(null);
                            setSoundFormError(null);
                            setSoundFormSuccess(null);
                          }}
                          className="gap-2"
                        >
                          <Plus size={14} /> Add Sound
                        </Button>
                      </div>
                    </div>

                    {soundFormError && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                        <AlertTriangle size={14} /> {soundFormError}
                      </div>
                    )}
                    {soundFormSuccess && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                        <CheckCircle2 size={14} /> {soundFormSuccess}
                      </div>
                    )}

                    {sounds.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)] space-y-3">
                        <p>
                          No custom sounds yet — the homepage is showing the 6 built-in defaults.
                        </p>
                        <p className="text-xs">
                          Load the defaults into the database so you can edit them, or start fresh with <strong>Add Sound</strong>.
                        </p>
                        <Button onClick={handleSeedSounds} variant="outline" size="sm" className="gap-2">
                          <Plus size={12} /> Load default sounds
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                          The homepage shows the first <strong>{PUBLIC_SOUND_LIMIT}</strong> rows (by sort order). Anything beyond that lives in the DB but stays hidden from visitors.
                        </p>
                        {sounds.map((s, i) => {
                          const isPublic = i < PUBLIC_SOUND_LIMIT;
                          return (
                            <div
                              key={s.id}
                              className={`flex items-center gap-4 p-3 rounded-lg border bg-[var(--color-surface)] ${isPublic ? "border-[var(--color-border)]" : "border-dashed border-[var(--color-border)] opacity-60"
                                }`}
                            >
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-2xl shrink-0">
                                {s.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-[var(--color-text)] truncate flex items-center gap-2">
                                  <span className="truncate">{s.name}</span>
                                  {!isPublic && (
                                    <Badge variant="secondary" className="text-[9px] shrink-0">Hidden</Badge>
                                  )}
                                  {s.source === "upload" && (
                                    <Badge variant="primary" className="text-[9px] shrink-0">Audio</Badge>
                                  )}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] truncate">
                                  <span className="uppercase font-mono text-[10px] mr-2">{s.type}</span>
                                  {s.description}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingSound(s);
                                  setCreatingSound(null);
                                  setSoundFormError(null);
                                  setSoundFormSuccess(null);
                                }}
                                className="gap-1.5"
                              >
                                <UserCog size={12} /> Edit
                              </Button>
                              <button
                                onClick={() => handleDeleteSound(s.id, s.name)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                                aria-label={`Delete ${s.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  {(editingSound || creatingSound) && (
                    <Card className="p-6 border-[var(--color-border)]">
                      <h4 className="font-display font-extrabold text-lg text-[var(--color-text)] mb-4">
                        {editingSound ? "Edit sound" : "New sound"}
                      </h4>
                      {(() => {
                        const draft = (editingSound || creatingSound) as SoundClip | typeof emptySoundClip;
                        const setDraft = (patch: Partial<SoundClip>) => {
                          if (editingSound) {
                            setEditingSound({ ...editingSound, ...patch });
                          } else if (creatingSound) {
                            setCreatingSound({ ...creatingSound, ...patch });
                          }
                        };
                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Input
                                label="Name"
                                value={draft.name}
                                onChange={(e) => setDraft({ name: e.target.value })}
                                placeholder="e.g. Triple Kill"
                                maxLength={60}
                              />
                              <EmojiPicker
                                value={draft.emoji}
                                onChange={(next) => setDraft({ emoji: next })}
                              />
                            </div>

                            {/* Source toggle — synth vs uploaded audio file */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                                Sound source
                              </label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDraft({ source: "synth" })}
                                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${draft.source === "synth"
                                      ? "border-[#ff0033] bg-[#ff0033]/10 text-[#ff4b5f]"
                                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                    }`}
                                >
                                  Synth waveform
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDraft({ source: "upload" })}
                                  className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${draft.source === "upload"
                                      ? "border-[#ff0033] bg-[#ff0033]/10 text-[#ff4b5f]"
                                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                    }`}
                                >
                                  Uploaded audio
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {draft.source === "synth" ? (
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                                    Synth waveform
                                  </label>
                                  <select
                                    value={draft.type}
                                    onChange={(e) => setDraft({ type: e.target.value })}
                                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[#ff0033] focus:outline-none"
                                  >
                                    {SOUND_TYPE_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                                    Audio file (mp3 / wav / ogg, max 3MB)
                                  </label>
                                  {editingSound ? (
                                    <div className="space-y-2">
                                      <input
                                        type="file"
                                        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          if (f) handleUploadSoundAudio(editingSound.id, f);
                                          e.target.value = "";
                                        }}
                                        disabled={audioUploading}
                                        className="block w-full text-xs text-[var(--color-text-muted)] file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-[var(--color-border)] file:bg-[var(--color-surface-2)] file:text-[var(--color-text)] file:font-bold file:cursor-pointer hover:file:bg-[var(--color-surface)]"
                                      />
                                      {draft.audioUrl && (
                                        <audio controls src={draft.audioUrl} className="w-full h-8" />
                                      )}
                                      {audioUploading && (
                                        <p className="text-[10px] text-[var(--color-text-muted)]">Uploading…</p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed p-2 rounded-lg border border-dashed border-[var(--color-border)]">
                                      Save the sound first, then re-open it to upload an audio file.
                                    </p>
                                  )}
                                </div>
                              )}
                              <Input
                                label="Sort order"
                                type="number"
                                value={String(draft.sortOrder)}
                                onChange={(e) => setDraft({ sortOrder: Number(e.target.value) || 0 })}
                              />
                            </div>
                            <Input
                              label="Description"
                              value={draft.description}
                              onChange={(e) => setDraft({ description: e.target.value })}
                              placeholder="One-line caption shown under the button"
                              maxLength={200}
                            />
                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setEditingSound(null);
                                  setCreatingSound(null);
                                  setSoundFormError(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleSaveSound(draft, !editingSound)}
                              >
                                {editingSound ? "Save changes" : "Create sound"}
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </Card>
                  )}
                </div>
              )}

              {/* Tab: Highlights moderation queue */}
              {activeTab === "highlights" && (
                <div className="space-y-6">
                  <Card className="p-6 border-[var(--color-border)]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                      <div>
                        <h3 className="font-display font-extrabold text-xl text-[var(--color-text)] flex items-center gap-2">
                          <Sparkles size={20} className="text-[#ff4b5f]" />
                          Community Highlights
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          Review viewer-submitted clips. Only <strong>approved</strong> rows show up publicly.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setHighlightFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border transition ${highlightFilter === f
                                ? "border-[#ff0033] bg-[#ff0033]/10 text-[#ff4b5f]"
                                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                              }`}
                          >
                            {f}
                          </button>
                        ))}
                        <Button variant="outline" size="sm" onClick={fetchHighlights} className="gap-1.5">
                          <RefreshCw size={12} /> Refresh
                        </Button>
                      </div>
                    </div>

                    {highlightError && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                        <AlertTriangle size={14} /> {highlightError}
                      </div>
                    )}
                    {highlightSuccess && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                        <CheckCircle2 size={14} /> {highlightSuccess}
                      </div>
                    )}

                    {highlights.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
                        Nothing here right now. {highlightFilter === "pending" ? "No clips waiting for review." : `No ${highlightFilter} highlights.`}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {highlights.map((h) => {
                          const watchUrl = h.source === "youtube" && h.youtubeId
                            ? `https://www.youtube.com/watch?v=${h.youtubeId}`
                            : h.videoUrl || "";
                          const isBusy = highlightActionId === h.id;
                          return (
                            <div
                              key={h.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                            >
                              <div className="relative h-16 w-28 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] shrink-0">
                                {h.thumbnailUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={h.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-[var(--color-text-muted)]">
                                    <Play size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <Badge variant={h.status === "approved" ? "success" : h.status === "rejected" ? "danger" : "primary"} className="text-[9px]">
                                    {h.status}
                                  </Badge>
                                  {h.game && (
                                    <Badge variant="secondary" className="text-[9px]">{h.game}</Badge>
                                  )}
                                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                                    {h.source === "youtube" ? "YouTube" : "Uploaded"}
                                  </span>
                                </div>
                                <p className="font-bold text-sm text-[var(--color-text)] truncate">{h.title}</p>
                                <p className="text-xs text-[var(--color-text-muted)] truncate">
                                  By {h.submittedByName}
                                  {h.submittedByUserId ? "" : " (anonymous)"}
                                  {" · "}
                                  {new Date(h.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {watchUrl && (
                                  <a
                                    href={watchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[#ff0033]/40 transition"
                                  >
                                    <Play size={12} /> Watch
                                  </a>
                                )}
                                {h.status !== "approved" && (
                                  <button
                                    disabled={isBusy}
                                    onClick={() => handleReviewHighlight(h.id, "approved")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition cursor-pointer"
                                  >
                                    <Check size={12} /> Approve
                                  </button>
                                )}
                                {h.status !== "rejected" && (
                                  <button
                                    disabled={isBusy}
                                    onClick={() => handleReviewHighlight(h.id, "rejected")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[#ff4b5f]/40 disabled:opacity-50 transition cursor-pointer"
                                  >
                                    <XCircle size={12} /> Reject
                                  </button>
                                )}
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleDeleteHighlight(h.id, h.title)}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition cursor-pointer"
                                  aria-label={`Delete ${h.title}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Tab 7: Site Settings — Hero Robot */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  {/* Hero Robot — Spline scene URL editor with live preview. */}
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0033]/15 text-[#ff4b5f]">
                          <Bot size={18} />
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                            Hero Robot
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Swap the 3D model in the hero section.
                          </p>
                        </div>
                      </div>

                      <div className="relative w-full aspect-video max-w-md rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                        <SplineRobot
                          key={splineSceneSaved || "default"}
                          scene={splineSceneSaved || undefined}
                          className="absolute inset-0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="https://prod.spline.design/.../scene.splinecode"
                          value={splineSceneUrl}
                          onChange={(e) => setSplineSceneUrl(e.target.value)}
                        />
                      </div>

                      {settingsError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                          <AlertTriangle size={14} /> {settingsError}
                        </div>
                      )}
                      {settingsSuccess && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                          <CheckCircle2 size={14} /> {settingsSuccess}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setSplineSceneUrl("")}
                          disabled={settingsSaving || splineSceneUrl === ""}
                        >
                          Use default
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setSplineSceneUrl(splineSceneSaved)}
                          disabled={splineSceneUrl === splineSceneSaved || settingsSaving}
                        >
                          Revert
                        </Button>
                        <Button
                          onClick={handleSaveSpline}
                          disabled={
                            settingsSaving || splineSceneUrl.trim() === splineSceneSaved.trim()
                          }
                          className="gap-2"
                        >
                          {settingsSaving ? "Saving…" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Floating Game Logos Card — Custom floating items around robot */}
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0033]/15 text-[#ff4b5f]">
                          <Gamepad2 size={18} />
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                            Floating Game Logos
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Custom game logos that float around the 3D robot on the right side.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 relative">
                        <div className="flex-grow relative">
                          <Input
                            placeholder="e.g. Minecraft (Search floating games...)"
                            value={newFloatingGameName}
                            onChange={(e) => setNewFloatingGameName(e.target.value)}
                            onFocus={() => {
                              if (floatingGameSuggestions.length > 0) {
                                setShowFloatingGameSuggestions(true);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowFloatingGameSuggestions(false), 200);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const name = newFloatingGameName.trim();
                                if (name) {
                                  let logoUrl = "";
                                  if (selectedFloatingGame && selectedFloatingGame.name.toLowerCase() === name.toLowerCase()) {
                                    logoUrl = selectedFloatingGame.logoUrl;
                                  }
                                  const newGameItem = { id: `floating-${Date.now()}`, name, logoUrl };
                                  setFloatingGames((prev) => [...prev, newGameItem]);
                                  setNewFloatingGameName("");
                                  setSelectedFloatingGame(null);
                                  setFloatingGameSuggestions([]);
                                }
                              }
                            }}
                            maxLength={60}
                            className="w-full"
                          />

                          {showFloatingGameSuggestions && floatingGameSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-20 mt-2 p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl max-h-64 overflow-y-auto">
                              {floatingGameSuggestions.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setNewFloatingGameName(s.name);
                                    setSelectedFloatingGame({ name: s.name, logoUrl: s.backgroundImage });
                                    setShowFloatingGameSuggestions(false);
                                  }}
                                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs font-bold text-[var(--color-text)] transition hover:bg-[#ff0033]/15 hover:text-white cursor-pointer"
                                >
                                  <div className="h-8 w-8 rounded-md overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                                    {s.backgroundImage ? (
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
                                    <p className="truncate text-sm font-bold text-[var(--color-text)]">{s.name}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {searchingFloatingGames && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                              <RefreshCw size={14} className="animate-spin text-[var(--color-text-muted)]" />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => {
                            const name = newFloatingGameName.trim();
                            if (name) {
                              let logoUrl = "";
                              if (selectedFloatingGame && selectedFloatingGame.name.toLowerCase() === name.toLowerCase()) {
                                logoUrl = selectedFloatingGame.logoUrl;
                              }
                              const newGameItem = { id: `floating-${Date.now()}`, name, logoUrl };
                              setFloatingGames((prev) => [...prev, newGameItem]);
                              setNewFloatingGameName("");
                              setSelectedFloatingGame(null);
                              setFloatingGameSuggestions([]);
                            }
                          }}
                          disabled={!newFloatingGameName.trim()}
                          className="gap-2 shrink-0"
                        >
                          <Plus size={14} /> Add
                        </Button>
                      </div>

                      {floatingGames.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-text-muted)]">
                          No custom floating games. (Currently falling back to the marquee list below).
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {floatingGames.map((g, idx) => (
                            <div
                              key={g.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                            >
                              <div className="h-12 w-12 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                                {g.logoUrl ? (
                                  <img
                                    src={g.logoUrl}
                                    alt={g.name}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <Gamepad2 size={18} className="text-[var(--color-text-muted)]" />
                                )}
                              </div>
                              <input
                                type="text"
                                value={g.name}
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  setFloatingGames((prev) =>
                                    prev.map((x, i) =>
                                      i === idx ? { ...x, name: newName } : x
                                    )
                                  );
                                }}
                                maxLength={60}
                                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm font-bold text-[var(--color-text)] focus:underline"
                              />
                              <label className="cursor-pointer shrink-0">
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleUploadFloatingGameLogo(idx, f);
                                    e.target.value = "";
                                  }}
                                  disabled={floatingGameUploadingFor === String(idx)}
                                  className="hidden"
                                />
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-bold transition ${floatingGameUploadingFor === String(idx)
                                      ? "opacity-50 cursor-not-allowed"
                                      : "text-[var(--color-text-muted)] hover:border-[#ff0033]/40 hover:text-[var(--color-text)]"
                                    }`}
                                >
                                  <Plus size={12} />
                                  {floatingGameUploadingFor === String(idx)
                                    ? "Uploading…"
                                    : g.logoUrl
                                      ? "Replace"
                                      : "Upload"}
                                </span>
                              </label>
                              <button
                                onClick={() => {
                                  setFloatingGames((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer shrink-0"
                                aria-label={`Delete ${g.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleSaveFloatingGames([])}
                          disabled={floatingGamesSaving || floatingGamesSaved === ""}
                        >
                          Use default
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (floatingGamesSaved) {
                              try {
                                setFloatingGames(JSON.parse(floatingGamesSaved));
                              } catch { }
                            } else {
                              setFloatingGames(DEFAULT_FLOATING_GAMES);
                            }
                          }}
                          disabled={
                            floatingGamesSaving ||
                            JSON.stringify(floatingGames) === (floatingGamesSaved ? JSON.stringify(JSON.parse(floatingGamesSaved)) : JSON.stringify(DEFAULT_FLOATING_GAMES))
                          }
                        >
                          Revert
                        </Button>
                        <Button
                          onClick={() => handleSaveFloatingGames(floatingGames)}
                          disabled={
                            floatingGamesSaving ||
                            JSON.stringify(floatingGames) === (floatingGamesSaved ? JSON.stringify(JSON.parse(floatingGamesSaved)) : JSON.stringify(DEFAULT_FLOATING_GAMES))
                          }
                          className="gap-2"
                        >
                          {floatingGamesSaving ? "Saving…" : "Save Floating Games"}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Floating Sci-Fi Words Card — Custom drift text pill capsules */}
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0033]/15 text-[#ff4b5f]">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                            Floating Sci-Fi Words
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Custom sci-fi label capsules that drift around the 3D robot.
                          </p>
                        </div>
                      </div>

                      {/* Add Word Form */}
                      <div className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text)]">
                          Add Sci-Fi Capsule Word
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            placeholder="e.g. CLUTCH"
                            value={newWordText}
                            onChange={(e) => setNewWordText(e.target.value.toUpperCase())}
                            maxLength={16}
                          />
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Style Option</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setNewWordStyle("outline")}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition ${newWordStyle === "outline"
                                    ? "border-[#ff0033] bg-[#ff0033]/10 text-[#ff4b5f]"
                                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white"
                                  }`}
                              >
                                Outline Pink
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewWordStyle("glassy")}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition ${newWordStyle === "glassy"
                                    ? "border-white bg-white/10 text-white"
                                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white"
                                  }`}
                              >
                                Glassy Capsule
                              </button>
                            </div>
                          </div>
                          {newWordStyle === "glassy" && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Status Dot Color</label>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {["#ff0033", "#ffffff", "#ffd700", "#00ff66", "#00e5ff"].map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setNewWordDotColor(c)}
                                    className="w-5 h-5 rounded-full border transition shrink-0 relative flex items-center justify-center"
                                    style={{
                                      backgroundColor: c,
                                      borderColor: newWordDotColor === c ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.3)"
                                    }}
                                  >
                                    {newWordDotColor === c && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-black/60 block" />
                                    )}
                                  </button>
                                ))}
                                <input
                                  type="color"
                                  value={newWordDotColor}
                                  onChange={(e) => setNewWordDotColor(e.target.value)}
                                  className="w-5 h-5 rounded overflow-hidden cursor-pointer border-0 p-0 shrink-0"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button
                            onClick={() => {
                              const txt = newWordText.trim().toUpperCase();
                              if (!txt) return;
                              const newWord = {
                                text: txt,
                                style: newWordStyle,
                                dot: newWordStyle === "glassy" ? newWordDotColor : undefined
                              };
                              setFloatingWords((prev) => [...prev, newWord]);
                              setNewWordText("");
                            }}
                            disabled={!newWordText.trim()}
                            size="sm"
                            className="gap-1.5"
                          >
                            <Plus size={12} /> Add Word Capsule
                          </Button>
                        </div>
                      </div>

                      {floatingWords.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-text-muted)]">
                          No custom floating words. (Currently falling back to JFF defaults: CHAOS, CLUTCH, JFF SQUAD, CO-OP, MELTDOWNS).
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {floatingWords.map((w, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] relative"
                            >
                              <button
                                onClick={() => {
                                  setFloatingWords((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="absolute top-2 right-2 p-1 rounded-md text-red-400 hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                                aria-label="Remove word"
                              >
                                <X size={12} />
                              </button>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Capsule Text</label>
                                <input
                                  type="text"
                                  value={w.text}
                                  onChange={(e) => {
                                    const txt = e.target.value.toUpperCase();
                                    setFloatingWords((prev) =>
                                      prev.map((x, i) =>
                                        i === idx ? { ...x, text: txt } : x
                                      )
                                    );
                                  }}
                                  maxLength={16}
                                  className="bg-transparent border-0 outline-none text-xs font-black tracking-widest text-[var(--color-text)] focus:underline uppercase font-mono"
                                />
                              </div>
                              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2 mt-1">
                                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">
                                  Style: {w.style === "glassy" ? "Glassy" : "Outline"}
                                </span>
                                {w.style === "glassy" && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Dot:</span>
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                                      style={{ backgroundColor: w.dot || "#ff0033" }}
                                    />
                                    <input
                                      type="color"
                                      value={w.dot || "#ff0033"}
                                      onChange={(e) => {
                                        const c = e.target.value;
                                        setFloatingWords((prev) =>
                                          prev.map((x, i) =>
                                            i === idx ? { ...x, dot: c } : x
                                          )
                                        );
                                      }}
                                      className="w-4 h-4 rounded-full overflow-hidden cursor-pointer border-0 p-0 shrink-0"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleSaveFloatingWords([])}
                          disabled={floatingWordsSaving || floatingWordsSaved === ""}
                        >
                          Use default
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            if (floatingWordsSaved) {
                              try {
                                setFloatingWords(JSON.parse(floatingWordsSaved));
                              } catch { }
                            } else {
                              setFloatingWords(DEFAULT_SYSTEM_WORDS);
                            }
                          }}
                          disabled={
                            floatingWordsSaving ||
                            JSON.stringify(floatingWords) === (floatingWordsSaved ? JSON.stringify(JSON.parse(floatingWordsSaved)) : JSON.stringify(DEFAULT_SYSTEM_WORDS))
                          }
                        >
                          Revert
                        </Button>
                        <Button
                          onClick={() => handleSaveFloatingWords(floatingWords)}
                          disabled={
                            floatingWordsSaving ||
                            JSON.stringify(floatingWords) === (floatingWordsSaved ? JSON.stringify(JSON.parse(floatingWordsSaved)) : JSON.stringify(DEFAULT_SYSTEM_WORDS))
                          }
                          className="gap-2"
                        >
                          {floatingWordsSaving ? "Saving…" : "Save Floating Words"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Tab 8: Manage Games (logos & names marquee) */}
              {activeTab === "games" && (
                <div className="space-y-6">
                  {/* Games with logos — drives the hero bottom marquee. */}
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0033]/15 text-[#ff4b5f]">
                          <Gamepad2 size={18} />
                        </div>
                        <div>
                          <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                            Games
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Logos shown in the scrolling strip at the bottom of the hero.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 relative">
                        <div className="flex-grow relative">
                          <Input
                            placeholder="e.g. Valorant (Search games...)"
                            value={newGameName}
                            onChange={(e) => setNewGameName(e.target.value)}
                            onFocus={() => {
                              if (gameSuggestions.length > 0) {
                                setShowGameSuggestions(true);
                              }
                            }}
                            onBlur={() => {
                              // Small delay to allow clicking on dropdown suggestions
                              setTimeout(() => setShowGameSuggestions(false), 200);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddGame();
                              }
                            }}
                            maxLength={60}
                            className="w-full"
                          />

                          {/* Dropdown Suggestions */}
                          {showGameSuggestions && gameSuggestions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full z-20 mt-2 p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-soft)] shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl max-h-64 overflow-y-auto">
                              {gameSuggestions.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => {
                                    setNewGameName(s.name);
                                    setSelectedGame({ name: s.name, logoUrl: s.backgroundImage });
                                    setShowGameSuggestions(false);
                                  }}
                                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs font-bold text-[var(--color-text)] transition hover:bg-[#ff0033]/15 hover:text-white cursor-pointer"
                                >
                                  <div className="h-8 w-8 rounded-md overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
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
                                    <p className="truncate text-sm font-bold text-[var(--color-text)]">{s.name}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {searchingGames && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                              <RefreshCw size={14} className="animate-spin text-[var(--color-text-muted)]" />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleAddGame}
                          disabled={!newGameName.trim()}
                          className="gap-2 shrink-0"
                        >
                          <Plus size={14} /> Add
                        </Button>
                      </div>

                      {gameError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                          <AlertTriangle size={14} /> {gameError}
                        </div>
                      )}
                      {gameSuccess && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                          <CheckCircle2 size={14} /> {gameSuccess}
                        </div>
                      )}

                      {games.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-text-muted)]">
                          No games yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {games.map((g) => (
                            <div
                              key={g.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
                            >
                              <div className="h-12 w-12 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-center shrink-0">
                                {g.logoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={g.logoUrl}
                                    alt={g.name}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <Gamepad2 size={18} className="text-[var(--color-text-muted)]" />
                                )}
                              </div>
                              <input
                                type="text"
                                value={g.name}
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  setGames((prev) =>
                                    prev.map((x) =>
                                      x.id === g.id ? { ...x, name: newName } : x
                                    )
                                  );
                                }}
                                onBlur={(e) => {
                                  if (e.target.value.trim() !== g.name) {
                                    handleRenameGame(g.id, e.target.value.trim());
                                  }
                                }}
                                maxLength={60}
                                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm font-bold text-[var(--color-text)] focus:underline"
                              />
                              <label className="cursor-pointer shrink-0">
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleUploadGameLogo(g.id, f);
                                    e.target.value = ""; // allow re-uploading same file
                                  }}
                                  disabled={gameUploadingFor === g.id}
                                  className="hidden"
                                />
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-bold transition ${gameUploadingFor === g.id
                                      ? "opacity-50 cursor-not-allowed"
                                      : "text-[var(--color-text-muted)] hover:border-[#ff0033]/40 hover:text-[var(--color-text)]"
                                    }`}
                                >
                                  <Plus size={12} />
                                  {gameUploadingFor === g.id
                                    ? "Uploading…"
                                    : g.logoUrl
                                      ? "Replace"
                                      : "Upload"}
                                </span>
                              </label>
                              <button
                                onClick={() => handleDeleteGame(g.id, g.name)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer shrink-0"
                                aria-label={`Delete ${g.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Creator Shop — products + live toggle */}
              {activeTab === "merch" && (
                <div className="space-y-6">
                  {/* Live toggle */}
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff0033]/15 text-[#ff4b5f]">
                          <Store size={18} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                            Creator Shop Status
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Off → public site shows a Coming Soon panel. On → the product grid is live.
                          </p>
                        </div>
                        <Badge variant={shopLiveSaved ? "primary" : "secondary"}>
                          {shopLiveSaved ? "LIVE" : "COMING SOON"}
                        </Badge>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={shopLive}
                          onChange={(e) => setShopLive(e.target.checked)}
                          className="h-4 w-4 accent-[#ff0033]"
                        />
                        <span className="text-sm font-bold text-[var(--color-text)]">
                          Shop is live (show product grid publicly)
                        </span>
                      </label>

                      {settingsError && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-500">
                          <AlertTriangle size={14} /> {settingsError}
                        </div>
                      )}
                      {settingsSuccess && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                          <CheckCircle2 size={14} /> {settingsSuccess}
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => setShopLive(shopLiveSaved)}
                          disabled={shopLive === shopLiveSaved || settingsSaving}
                        >
                          Revert
                        </Button>
                        <Button
                          onClick={handleSaveShopLive}
                          disabled={settingsSaving || shopLive === shopLiveSaved}
                          className="gap-2"
                        >
                          {settingsSaving ? "Saving…" : "Save Status"}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Product list */}
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-5">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                            Products ({merchItems.length})
                          </h3>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Add, edit, or remove items shown in the Creator Shop grid.
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            setCreatingMerch({ ...emptyMerchItem });
                            setMerchFormError(null);
                            setMerchFormSuccess(null);
                          }}
                          className="gap-2"
                        >
                          <Plus size={14} /> Add Product
                        </Button>
                      </div>

                      {merchFormSuccess && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs font-bold text-green-500">
                          <CheckCircle2 size={14} /> {merchFormSuccess}
                        </div>
                      )}

                      {merchItems.length === 0 && !creatingMerch ? (
                        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-text-muted)]">
                          No products yet. The public shop will show a Coming Soon panel until you add some.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {merchItems.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)]/40 p-4 flex gap-4"
                            >
                              <div className="h-20 w-20 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-hidden relative flex items-center justify-center text-3xl">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                ) : (
                                  <span>{item.emoji}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-display font-extrabold text-sm text-[var(--color-text)] truncate">
                                      {item.name}
                                    </p>
                                    <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2 mt-0.5">
                                      {item.description || "—"}
                                    </p>
                                  </div>
                                  <Badge variant="secondary">{item.grade}</Badge>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm font-black text-[#ff4b5f]">
                                    ${item.price.toFixed(2)}
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingMerch(item);
                                        setMerchFormError(null);
                                        setMerchFormSuccess(null);
                                      }}
                                      className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[#ff0033]/40 transition"
                                      title="Edit"
                                    >
                                      <UserCog size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMerch(item.id)}
                                      className="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-red-500 hover:border-red-500/40 transition"
                                      title="Delete"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Create / Edit form modal-ish (inline) */}
                  {(creatingMerch || editingMerch) && (
                    <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                      <MerchEditor
                        initial={editingMerch ?? creatingMerch!}
                        isUpdate={!!editingMerch}
                        onCancel={() => {
                          setEditingMerch(null);
                          setCreatingMerch(null);
                          setMerchFormError(null);
                        }}
                        onSave={handleSaveMerch}
                        error={merchFormError}
                      />
                    </Card>
                  )}
                </div>
              )}

              {/* Tab 7: YouTube Cache controls */}
              {activeTab === "cache" && (
                <div className="space-y-6">
                  <Card className="p-8 border-[var(--color-border)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ff0033]" />
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-display font-extrabold text-xl text-[var(--color-text)]">
                          🔄 YouTube Data Caching & Management
                        </h3>
                        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                          To prevent your site from exhausting the daily YouTube API quota (10,000 units), video data is cached in PostgreSQL and served directly to viewers.
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] space-y-4">
                        <h4 className="text-xs font-black uppercase text-[var(--color-text)] tracking-widest flex items-center gap-2">
                          <Clock size={14} className="text-[#ff0033]" /> Caching Specifications
                        </h4>
                        <ul className="space-y-2 text-xs text-[var(--color-text-muted)] list-disc list-inside pl-1">
                          <li>Loads video title, description, thumbnail URLs, and stats.</li>
                          <li>Stores payload inside the `YouTubeCache` table.</li>
                          <li>System refreshes cache periodically via background cron triggers.</li>
                        </ul>
                      </div>

                      {syncSuccess && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-xs text-emerald-300">
                          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                          <span>{syncSuccess}</span>
                        </div>
                      )}

                      {syncError && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 p-4 text-xs text-rose-300">
                          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                          <span>{syncError}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <Button
                          variant="primary"
                          glow
                          onClick={handleSyncCache}
                          disabled={syncing}
                          className="gap-2 px-6"
                        >
                          <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                          {syncing ? "Syncing YouTube Cache..." : "Sync Cache Now"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Expanded Message Modal/Drawer Overlay */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <Card glass className="max-w-2xl w-full p-8 border-[var(--color-border)] bg-[var(--color-bg-soft)]/95 backdrop-blur-2xl relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up">
            <button
              onClick={() => setSelectedMessage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-6">
              <div className="border-b border-[var(--color-border)] pb-4">
                <div className="flex items-baseline gap-2">
                  <Badge variant="primary" className="mb-2">Message Detail</Badge>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-[var(--color-text)] truncate">
                  {selectedMessage.name}
                </h3>
                <p className="text-xs text-[#ff4b5f] font-semibold pt-1">
                  <a href={`mailto:${selectedMessage.email}`} className="hover:underline">
                    {selectedMessage.email}
                  </a>
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] pt-1 font-mono uppercase tracking-wider">
                  Submitted: {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">Message Content:</p>
                <div className="p-5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] leading-relaxed max-h-[250px] overflow-y-auto whitespace-pre-wrap border-l-2 border-[#ff0033]">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Existing reply (if admin already replied previously). */}
              {selectedMessage.replyText && (
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
                    Sent Reply
                    {selectedMessage.repliedAt && (
                      <span className="ml-2 text-neutral-500 normal-case">
                        · {new Date(selectedMessage.repliedAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                  <div className="p-4 rounded-xl bg-[#0c0c0c] border border-emerald-500/20 text-sm text-neutral-200 leading-relaxed max-h-[180px] overflow-y-auto whitespace-pre-wrap border-l-2 border-emerald-500">
                    {selectedMessage.replyText}
                  </div>
                </div>
              )}

              {/* Compose new reply. */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
                  {selectedMessage.replyText ? "Send another reply" : "Reply"}
                  <span className="ml-2 text-neutral-500 normal-case">
                    · {selectedMessage.userId ? "in-app notification" : "via email"}
                  </span>
                </p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder={`Hi ${selectedMessage.name},\n\n`}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30 resize-none"
                />
                {replyError && (
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> {replyError}
                  </p>
                )}
                {replySuccess && (
                  <p className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 size={11} /> {replySuccess}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  onClick={handleSendReply}
                  disabled={replySending || !replyText.trim()}
                  className="flex-1 gap-2"
                >
                  <Mail size={16} /> {replySending ? "Sending…" : "Send Reply"}
                </Button>

                <Button
                  variant="danger"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="gap-2"
                >
                  <Trash2 size={16} /> Delete
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setSelectedMessage(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

/**
 * Drops streams whose scheduledStart is already in the past, with a 5-minute
 * grace window for YouTube cache lag. Lives at module scope so calling
 * Date.now() doesn't trip React's purity rules inside the component body.
 */
function filterFreshUpcoming(streams: UpcomingStream[]): UpcomingStream[] {
  const now = Date.now();
  return streams.filter((s) => {
    const t = Date.parse(s.scheduledStartTime);
    return Number.isFinite(t) && t > now - 5 * 60 * 1000;
  });
}
