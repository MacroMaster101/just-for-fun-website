"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LogOut, UserCog, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProfileModal } from "@/components/auth/ProfileModal";

interface UserMenuProps {
  /** Display variant — desktop pill or mobile full-width. */
  variant?: "desktop" | "mobile";
  onAfterAction?: () => void;
}

export const UserMenu = ({
  variant = "desktop",
  onAfterAction,
}: UserMenuProps) => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"profile" | "favorites">("profile");
  const [favCount, setFavCount] = useState<number | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  // Reset avatar load error state when user changes (e.g. login/logout)
  useEffect(() => {
    setAvatarError(false);
  }, [user]);

  // Check dynamically if the active user holds administrator permissions
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    fetch("/api/admin/check")
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((data) => {
        setIsAdmin(data.isAdmin);
      })
      .catch(() => setIsAdmin(false));
  }, [user]);

  // Close dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!anchorRef.current) return;
      if (!anchorRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Lazy-load the favorites count once when the menu opens.
  useEffect(() => {
    if (!open || favCount !== null) return;
    let cancelled = false;
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then((d: { favorites: unknown[] }) => {
        if (!cancelled) setFavCount(d.favorites.length);
      })
      .catch(() => {
        if (!cancelled) setFavCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [open, favCount]);

  if (!user) return null;

  const displayName =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User";
  const displayAvatar =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null;

  const openModal = (tab: "profile" | "favorites") => {
    setModalTab(tab);
    setModalOpen(true);
    setOpen(false);
    onAfterAction?.();
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    // Force the favorites count to reload next time someone logs in.
    setFavCount(null);
    onAfterAction?.();
  };

  return (
    <>
      <div
        ref={anchorRef}
        className={variant === "mobile" ? "relative" : "relative"}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className={
            variant === "desktop"
              ? "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2 transition hover:border-white/20 hover:bg-white/10"
              : "flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left"
          }
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {!avatarError && displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayAvatar}
              alt={displayName}
              onError={() => setAvatarError(true)}
              className={
                variant === "desktop"
                  ? "h-7 w-7 rounded-full object-cover"
                  : "h-9 w-9 rounded-full object-cover"
              }
            />
          ) : (
            <span
              className={`flex items-center justify-center rounded-full bg-[#ff0033]/20 font-black text-white ${
                variant === "desktop" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
              }`}
            >
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span
            className={
              variant === "desktop"
                ? "hidden max-w-[100px] truncate text-xs font-bold text-white lg:inline"
                : "min-w-0 flex-1 truncate text-sm font-bold text-white"
            }
          >
            {displayName}
          </span>
          <ChevronDown
            size={variant === "desktop" ? 12 : 14}
            className={`text-neutral-400 transition-transform ${
              open ? "rotate-180" : ""
            } ${variant === "desktop" ? "mr-1" : "ml-auto"}`}
          />
        </button>

        {open && (
          <div
            role="menu"
            className={
              variant === "desktop"
                ? "auth-surface absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-white/10 bg-[#0c0c0c] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-fade-in-up"
                : "auth-surface relative z-10 mt-2 rounded-xl border border-white/10 bg-[#0c0c0c] p-1.5"
            }
          >
            {/* User identity row */}
            <div className="flex items-center gap-3 rounded-lg px-2.5 py-2.5">
              {!avatarError && displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatar}
                  alt={displayName}
                  onError={() => setAvatarError(true)}
                  className="h-10 w-10 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff0033]/20 text-sm font-black text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {displayName}
                </p>
                <p className="truncate text-[11px] text-neutral-500">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="my-1 h-px bg-white/5" />

            <MenuItem icon={<UserCog size={14} />} onClick={() => openModal("profile")}>
              Edit profile
            </MenuItem>
            <MenuItem
              icon={<Heart size={14} />}
              onClick={() => openModal("favorites")}
              trailing={
                favCount !== null ? (
                  <span className="text-[10px] font-black text-neutral-500">
                    {favCount}
                  </span>
                ) : null
              }
            >
              My favorites
            </MenuItem>

            {isAdmin && (
              <MenuItem
                icon={<ShieldAlert size={14} />}
                onClick={() => {
                  window.location.href = "/admin";
                  setOpen(false);
                }}
              >
                Admin console
              </MenuItem>
            )}

            <div className="my-1 h-px bg-white/5" />

            <MenuItem
              icon={<LogOut size={14} />}
              onClick={handleSignOut}
              danger
            >
              Sign out
            </MenuItem>
          </div>
        )}
      </div>

      <ProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
      />
    </>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
}

const MenuItem = ({
  icon,
  children,
  onClick,
  trailing,
  danger,
}: MenuItemProps) => (
  <button
    role="menuitem"
    onClick={onClick}
    data-danger={danger ? "true" : undefined}
    className={`menu-item flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${
      danger
        ? "menu-item-danger text-[#ff4b5f] hover:bg-[#ff0033]/10"
        : "text-neutral-200 hover:bg-white/5 hover:text-white"
    }`}
  >
    <span
      className={`menu-item-icon flex h-7 w-7 items-center justify-center rounded-md ${
        danger ? "bg-[#ff0033]/10" : "bg-white/5"
      }`}
    >
      {icon}
    </span>
    <span className="menu-item-label flex-1 font-semibold">{children}</span>
    {trailing && <span className="menu-item-trailing">{trailing}</span>}
  </button>
);
