"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";

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
  const { user } = useAuth();
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

  // Determine whether the user has an email/password identity (vs OAuth-only).
  const hasPasswordIdentity = !!user?.identities?.some(
    (i) => i.provider === "email"
  );
  const oauthProvider = user?.identities?.find(
    (i) => i.provider !== "email"
  )?.provider;

  // Reset to chosen tab whenever the modal is opened.
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setTab(initialTab), 0);
    return () => clearTimeout(t);
  }, [isOpen, initialTab]);

  // Lock body scroll + escape-to-close.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  if (!isOpen || !user) return null;
  if (typeof document === "undefined") return null;

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
      // Refresh the auth user so the header avatar updates immediately.
      await supabase().auth.refreshSession();
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

  const removeFavorite = async (fav: FavoriteItem) => {
    setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    await fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: fav.kind, itemId: fav.itemId }),
    });
  };

  // Effective avatar: custom upload first, then OAuth provider fallback.
  const avatar =
    profile?.avatarUrl ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;
  const initial = (profile?.name || user.email || "U").charAt(0).toUpperCase();

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="auth-surface relative my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header w/ avatar uploader */}
        <div className="flex items-center gap-4 border-b border-white/10 p-6">
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
            {profile?.avatarUrl && (
              <button
                onClick={handleAvatarRemove}
                disabled={uploading}
                className="mt-1 flex items-center gap-1 text-[10px] font-bold text-neutral-500 transition hover:text-[#ff2d55] disabled:opacity-50"
              >
                <Trash2 size={10} /> Remove custom photo
              </button>
            )}
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
        <div className="max-h-[60vh] overflow-y-auto p-6">
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

              <button
                type="submit"
                disabled={saving}
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
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#ff4b5f]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                    Sign-in Method
                  </span>
                </div>
                <p className="text-sm text-white">
                  {hasPasswordIdentity && oauthProvider
                    ? `Email + ${capitalize(oauthProvider)}`
                    : hasPasswordIdentity
                      ? "Email & password"
                      : oauthProvider
                        ? capitalize(oauthProvider)
                        : "Unknown"}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">{user.email}</p>
              </div>

              {/* Password change — only for users with an email/password identity */}
              {hasPasswordIdentity ? (
                <form onSubmit={handlePasswordChange} className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <KeyRound size={14} className="text-[#ff4b5f]" />
                    <h3 className="font-display text-xs font-black uppercase tracking-[0.2em] text-white">
                      Change Password
                    </h3>
                  </div>
                  <label className="grid gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
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
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
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
                        className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
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
                    className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(255,0,51,0.35)] disabled:opacity-60"
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
                <div className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center">
                  <KeyRound size={20} className="mx-auto mb-2 text-neutral-600" />
                  <p className="text-sm text-neutral-400">
                    You signed in with{" "}
                    <span className="font-bold text-white">
                      {oauthProvider ? capitalize(oauthProvider) : "OAuth"}
                    </span>
                    . Manage your password from your{" "}
                    {oauthProvider ? capitalize(oauthProvider) : "provider"}{" "}
                    account settings.
                  </p>
                </div>
              )}
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
    className={`relative flex-1 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] transition ${
      active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
    }`}
  >
    {children}
    {active && (
      <span className="absolute inset-x-4 bottom-0 h-[2px] bg-[#ff0033]" />
    )}
  </button>
);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
