"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  Camera,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { diceBearAvatar, resolveAvatarUrl } from "@/lib/avatar";

interface ProfileData {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface FavoriteItem {
  id: string;
  kind: "video" | "sound";
  itemId: string;
  itemTitle: string | null;
  createdAt: string;
}

type Tab = "profile" | "favorites" | "account";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

export const ProfileModal = ({
  isOpen,
  onClose,
  initialTab = "profile",
}: ProfileModalProps) => {
  const { user, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Password change state (email/password users only)
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwDone, setPwDone] = useState(false);

  // Account deletion state (type-DELETE confirmation flow)
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Determine whether the user has an email/password identity (vs OAuth-only).
  const hasPasswordIdentity = !!user?.identities?.some(
    (i) => i.provider === "email"
  );
  const oauthProvider = user?.identities?.find(
    (i) => i.provider !== "email"
  )?.provider;

  // Reset to chosen tab whenever the modal is opened, and clear any stale
  // confirm text from the danger zone so the user has to re-type it next time.
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      setTab(initialTab);
      setDeleteConfirm("");
      setDeleteError(null);
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, initialTab]);

  // Refs mirror the unsaved-changes state so the Escape handler (registered
  // once per open) can read the latest values without re-binding.
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  // Lock body scroll + escape-to-close (with unsaved-changes guard).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (dirtyRef.current && !savingRef.current) {
        const ok = confirm(
          "You have unsaved changes to your profile. Close without saving?"
        );
        if (!ok) return;
      }
      onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  // Load profile + favorites when modal opens (or user changes).
  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    const load = async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (cancelled) return;
      setLoading(true);
      try {
        const [pRes, fRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/favorites"),
        ]);
        if (cancelled) return;
        if (pRes.ok) {
          const { profile } = await pRes.json();
          setProfile(profile);
          setName(profile?.name ?? "");
          setBio(profile?.bio ?? "");
        }
        if (fRes.ok) {
          const { favorites } = await fRes.json();
          setFavorites(favorites);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  useEffect(() => {
    if (!pwDone) return;
    const t = setTimeout(() => setPwDone(false), 2500);
    return () => clearTimeout(t);
  }, [pwDone]);

  // Mirror unsaved-changes state into refs for the Escape key handler.
  useEffect(() => {
    dirtyRef.current =
      name !== (profile?.name ?? "") || bio !== (profile?.bio ?? "");
  }, [name, bio, profile]);
  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  if (!isOpen || !user) return null;
  if (typeof document === "undefined") return null;

  // Name/bio are the only fields gated behind "Save Changes" (avatar actions
  // apply immediately). Track whether they differ from the saved profile so
  // we can warn before the user discards unsaved edits.
  const isDirty =
    name !== (profile?.name ?? "") || bio !== (profile?.bio ?? "");

  // Close, but warn first if there are unsaved name/bio edits.
  const handleClose = () => {
    if (isDirty && !saving) {
      const ok = confirm(
        "You have unsaved changes to your profile. Close without saving?"
      );
      if (!ok) return;
    }
    onClose();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const { profile } = await res.json();
      setProfile(profile);
      // Keep Supabase auth metadata in sync so the header pill + dropdown
      // (which read from user_metadata, not the Profile row) update too.
      await supabase().auth.updateUser({
        data: { name: profile.name, full_name: profile.name },
      });
      await supabase().auth.refreshSession();
      await refreshProfile();
      setJustSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setAvatarError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setProfile(data.profile);
      // Refresh the auth user + shared profile so the header avatar updates
      // immediately (no page refresh needed).
      await supabase().auth.refreshSession();
      await refreshProfile();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    setUploading(true);
    setAvatarError(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setProfile(data.profile);
      await supabase().auth.refreshSession();
      await refreshProfile();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  // Set avatar to a random DiceBear cartoon avatar
  const handleUseDiceBear = async () => {
    setUploading(true);
    setAvatarError(null);
    try {
      const seed = `${user.id}-${Date.now()}`;
      const url = diceBearAvatar(seed);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!res.ok) throw new Error("Failed to set avatar");
      const { profile } = await res.json();
      setProfile(profile);
      // NOTE: do NOT write the DiceBear URL into user_metadata.avatar_url /
      // picture — those hold the original OAuth (Google) photo, which we need
      // to keep so "Use email photo" can restore it later. The Profile row's
      // avatarUrl is the source of truth for the custom avatar.
      await supabase().auth.refreshSession();
      await refreshProfile();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  // The original OAuth/Google email-linked photo.
  //
  // Primary source: the OAuth identity's identity_data. Supabase populates
  // this from the provider at sign-in and `updateUser` NEVER touches it, so
  // it survives even if user_metadata.avatar_url got clobbered by an older
  // build that wrote a DiceBear URL there. We fall back to user_metadata
  // (filtering out DiceBear URLs) for older sessions that predate this.
  const identityPhoto = (() => {
    for (const id of user.identities ?? []) {
      if (id.provider === "email") continue;
      const data = id.identity_data as Record<string, unknown> | undefined;
      const url =
        (data?.avatar_url as string | undefined) ||
        (data?.picture as string | undefined);
      if (url && !url.includes("api.dicebear.com")) return url;
    }
    return null;
  })();
  const metadataPhoto =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null;
  const oauthAvatarUrl =
    identityPhoto ||
    (metadataPhoto && !metadataPhoto.includes("api.dicebear.com")
      ? metadataPhoto
      : null);

  const handleUseEmailPhoto = async () => {
    if (!oauthAvatarUrl) return;
    setUploading(true);
    setAvatarError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: oauthAvatarUrl }),
      });
      if (!res.ok) throw new Error("Failed to set avatar");
      const { profile } = await res.json();
      setProfile(profile);
      await supabase().auth.refreshSession();
      await refreshProfile();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPw.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwBusy(true);
    const { error } = await supabase().auth.updateUser({ password: newPw });
    setPwBusy(false);
    if (error) {
      setPwError(error.message);
      return;
    }
    setNewPw("");
    setConfirmPw("");
    setShowNewPw(false);
    setShowConfirmPw(false);
    setPwDone(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim() !== "DELETE") {
      setDeleteError("Type DELETE (in caps) to confirm.");
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete account.");
        setDeleting(false);
        return;
      }
      // Sign the local session out and bounce home. The auth.users row is
      // already gone, but signOut clears the cookies the SSR client uses.
      await supabase().auth.signOut().catch(() => {});
      window.location.assign("/?account=deleted");
    } catch (err) {
      console.error("Account delete failed:", err);
      setDeleteError("Network error while deleting account.");
      setDeleting(false);
    }
  };

  const removeFavorite = async (fav: FavoriteItem) => {
    setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    await fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: fav.kind, itemId: fav.itemId }),
    });
  };

  // Effective avatar: custom upload → OAuth provider → DiceBear bot
  // seeded by user.id (same fallback used in the header pill and the
  // public Crew Wall, so the user sees a consistent identity).
  const avatar = resolveAvatarUrl(
    profile?.avatarUrl ??
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.picture as string | undefined) ??
      null,
    user.id
  );
  const initial = (profile?.name || user.email || "U").charAt(0).toUpperCase();

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="auth-surface relative my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header w/ avatar uploader */}
        <div className="flex items-center gap-3 sm:gap-4 border-b border-white/10 p-4 sm:p-6">
          <div className="relative">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={profile?.name ?? "avatar"}
                className="h-16 w-16 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff0033]/20 text-xl font-black text-white">
                {initial}
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0c0c0c] bg-[#ff0033] text-white shadow transition hover:bg-[#ff2d55] disabled:opacity-60"
              aria-label="Change photo"
              title="Change photo"
            >
              {uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Camera size={12} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black text-white">
              {profile?.name || user.email}
            </p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
            {avatarError && (
              <p className="mt-1 text-[11px] text-red-400">{avatarError}</p>
            )}
            {/* Avatar quick-action buttons */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={handleUseDiceBear}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-full border border-[#ff0033]/30 bg-[#ff0033]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff4b5f] transition-all duration-300 hover:bg-[#ff0033]/20 hover:border-[#ff0033] hover:text-white hover:shadow-[0_0_12px_rgba(255,0,51,0.2)] disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Bot size={10} />
                )}
                Use cartoon avatar
              </button>
              {oauthAvatarUrl && (
                <button
                  onClick={handleUseEmailPhoto}
                  disabled={uploading}
                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-400 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Mail size={10} />
                  )}
                  Use email photo
                </button>
              )}
              {profile?.avatarUrl && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={uploading}
                  className="flex items-center gap-1 text-[10px] font-bold text-neutral-600 transition hover:text-[#ff2d55] disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={10} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <TabBtn active={tab === "profile"} onClick={() => setTab("profile")}>
            Profile
          </TabBtn>
          <TabBtn
            active={tab === "favorites"}
            onClick={() => setTab("favorites")}
          >
            Favorites{" "}
            <span className="ml-1.5 text-neutral-500">{favorites.length}</span>
          </TabBtn>
          <TabBtn active={tab === "account"} onClick={() => setTab("account")}>
            Account
          </TabBtn>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
              <Loader2 size={14} className="animate-spin" /> Loading...
            </div>
          ) : tab === "profile" ? (
            <form onSubmit={handleSave} className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                  Display Name
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  className="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
                  placeholder="Your name"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                  Bio
                </span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="resize-none rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
                  placeholder="Tell the crew about yourself..."
                />
                <span className="text-right text-[10px] text-neutral-600">
                  {bio.length}/500
                </span>
              </label>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              {isDirty && !saving && (
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unsaved changes — click Save Changes to keep them.
                </p>
              )}

              <button
                type="submit"
                disabled={saving || !isDirty}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(255,0,51,0.35)] disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving
                  </>
                ) : justSaved ? (
                  "✓ Saved"
                ) : (
                  <>
                    <Save size={14} /> Save Changes
                  </>
                )}
              </button>
            </form>
          ) : tab === "favorites" ? (
            favorites.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 px-4 py-12 text-center">
                <Heart size={20} className="mx-auto mb-3 text-neutral-600" />
                <p className="text-sm text-neutral-400">
                  No favorites yet. Tap the heart on videos or sound clips to
                  save them here.
                </p>
              </div>
            ) : (
              <ul className="grid gap-2">
                {favorites.map((fav) => (
                  <li
                    key={fav.id}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded text-[9px] font-black uppercase ${
                        fav.kind === "video"
                          ? "bg-[#ff0033]/15 text-[#ff4b5f]"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      {fav.kind === "video" ? "VID" : "SND"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-white">
                      {fav.itemTitle || fav.itemId}
                    </span>
                    <button
                      onClick={() => removeFavorite(fav)}
                      className="text-[#ff0033] transition hover:text-[#ff2d55]"
                      aria-label="Remove favorite"
                    >
                      <Heart size={14} className="fill-current" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            // Account tab
            <div className="grid gap-6">
              {/* Identity info */}
              <div className="relative rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#ff0033]/10 to-transparent blur-xl pointer-events-none" />
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#ff2d55]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                    Sign-in Method
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 font-bold text-white text-xs">
                    {oauthProvider ? capitalize(oauthProvider).substring(0, 3).toUpperCase() : "PWD"}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {hasPasswordIdentity && oauthProvider
                        ? `Email + ${capitalize(oauthProvider)}`
                        : hasPasswordIdentity
                          ? "Email & Password"
                          : oauthProvider
                            ? capitalize(oauthProvider)
                            : "Unknown"}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Password change — only for users with an email/password identity */}
              {hasPasswordIdentity ? (
                <form onSubmit={handlePasswordChange} className="relative rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-5 grid gap-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <KeyRound size={16} className="text-[#ff2d55]" />
                    <h3 className="font-display text-xs font-black uppercase tracking-[0.2em] text-white">
                      Change Password
                    </h3>
                  </div>
                  
                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                      New Password
                    </span>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        required
                        minLength={6}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0a]/90 pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:ring-1 focus:ring-[#ff0033]/50 focus:outline-none transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                        title={showNewPw ? "Hide password" : "Show password"}
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                  
                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                      Confirm Password
                    </span>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        required
                        minLength={6}
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0a]/90 pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:ring-1 focus:ring-[#ff0033]/50 focus:outline-none transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                        title={showConfirmPw ? "Hide password" : "Show password"}
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                  
                  {pwError && (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {pwError}
                    </p>
                  )}
                  
                  <button
                    type="submit"
                    disabled={pwBusy}
                    className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[0_0_18px_rgba(255,0,51,0.35)] hover:shadow-[0_0_24px_rgba(255,0,51,0.55)] transition-all duration-300 disabled:opacity-60"
                  >
                    {pwBusy ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Updating
                      </>
                    ) : pwDone ? (
                      "✓ Password updated"
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>
              ) : (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent p-5 text-center relative overflow-hidden">
                  <KeyRound size={24} className="mx-auto mb-3 text-neutral-500" />
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    You signed in with{" "}
                    <span className="font-bold text-white">
                      {oauthProvider ? capitalize(oauthProvider) : "OAuth"}
                    </span>
                    .
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
                    Manage your password directly within your {oauthProvider ? capitalize(oauthProvider) : "external provider"} account settings.
                  </p>
                </div>
              )}

              {/* Danger Zone — permanently delete this account */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.02] p-5 shadow-[inset_0_1px_1px_rgba(239,68,68,0.05)]">
                <div className="mb-3 flex items-center gap-2 border-b border-red-500/10 pb-3">
                  <Trash2 size={16} className="text-red-400" />
                  <h3 className="font-display text-xs font-black uppercase tracking-[0.2em] text-red-400">
                    Danger Zone
                  </h3>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Deleting your account is <span className="font-bold text-red-300">permanent</span> and cannot be undone. All your favorites, custom profile data, and sign-in credentials will be instantly purged.
                </p>
                
                <label className="mt-4 grid gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                    Type <span className="font-mono text-red-400 font-black">DELETE</span> to confirm
                  </span>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => {
                      setDeleteConfirm(e.target.value);
                      if (deleteError) setDeleteError(null);
                    }}
                    placeholder="DELETE"
                    className="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm font-mono text-white placeholder:text-neutral-700 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 focus:outline-none transition-all duration-300"
                  />
                </label>

                {deleteError && (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 animate-pulse">
                    {deleteError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteConfirm.trim() !== "DELETE"}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-300 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Deleting account…
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} /> Permanently Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const TabBtn = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`relative flex-1 px-2 py-3 sm:px-4 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.18em] transition ${
      active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
    }`}
  >
    {children}
    {active && (
      <span className="absolute inset-x-2 sm:inset-x-4 bottom-0 h-[2px] bg-[#ff0033]" />
    )}
  </button>
);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
