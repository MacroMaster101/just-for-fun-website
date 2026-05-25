"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  /** Display variant — desktop pill (default) or mobile full-width. */
  variant?: "desktop" | "mobile";
}

/**
 * Standalone notification bell. Sits next to the UserMenu in the header.
 * Hidden when no user is logged in. Owns its own dropdown panel, unread
 * badge, and polling — keeps notification concerns out of UserMenu.
 */
export const NotificationBell = ({ variant = "desktop" }: NotificationBellProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const userId = user?.id ?? null;

  // Reset cached state during render when the user logs out, so the stale
  // count from the previous session can't briefly flash. The comparison
  // pattern avoids the "setState inside an effect" lint rule.
  const [prevUserId, setPrevUserId] = useState<string | null>(userId);
  if (prevUserId !== userId) {
    setPrevUserId(userId);
    if (!userId) {
      setNotifications(null);
      setUnreadCount(0);
    }
  }

  // Background poll for unread count every 30s so the badge stays fresh
  // even when the dropdown is closed. Skipped when there's no user.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const refresh = () => {
      fetch("/api/notifications", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { notifications: [], unreadCount: 0 }))
        .then((d: { unreadCount?: number }) => {
          if (cancelled) return;
          if (typeof d.unreadCount === "number") setUnreadCount(d.unreadCount);
        })
        .catch(() => {
          // ignore — badge just won't update this tick.
        });
    };
    refresh();
    let interval: ReturnType<typeof setInterval> | null = setInterval(refresh, 30_000);
    const onVisibility = () => {
      if (document.hidden) {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      } else if (!interval) {
        refresh();
        interval = setInterval(refresh, 30_000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [userId]);

  // Load the full notification list whenever the dropdown opens, so the
  // list is always fresh and matches the latest unread count.
  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { notifications: [], unreadCount: 0 }))
      .then((d: { notifications?: Notification[]; unreadCount?: number }) => {
        if (cancelled) return;
        setNotifications(d.notifications || []);
        if (typeof d.unreadCount === "number") setUnreadCount(d.unreadCount);
      })
      .catch(() => {
        if (!cancelled) setNotifications([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

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

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev
          ? prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
          : prev
      );
    } catch {
      // ignore
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev
          ? prev.map((n) =>
              n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n
            )
          : prev
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  if (!user) return null;

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div ref={anchorRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          variant === "desktop"
            ? "relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 text-[var(--color-text-muted)] backdrop-blur transition hover:border-[#ff0033]/30 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            : "relative flex w-full items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left text-sm font-bold text-[var(--color-text)]"
        }
      >
        <Bell size={16} />
        {variant === "mobile" && (
          <span className="flex-1">Notifications</span>
        )}
        {unreadCount > 0 && (
          <span
            className={`flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff0033] px-1 text-[9px] font-black text-white ring-2 ring-[var(--color-bg)] ${
              variant === "desktop" ? "absolute -top-1 -right-1" : "ml-auto"
            }`}
            aria-hidden
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={
            variant === "desktop"
              ? "auth-surface absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.25)] animate-fade-in-up"
              : "auth-surface relative z-10 mt-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] p-2"
          }
        >
          <div className="mb-2 flex items-center justify-between px-2 pt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold uppercase tracking-wider text-[#ff4b5f] transition hover:text-[#ff0033]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications === null ? (
              <p className="px-2 py-6 text-center text-[11px] text-[var(--color-text-muted)]">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <Bell size={20} className="mx-auto mb-2 text-[var(--color-text-muted)]/60" />
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  No notifications yet.
                </p>
                <p className="mt-1 text-[10px] text-[var(--color-text-muted)]/70">
                  Replies from the team show up here.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {notifications.map((n) => {
                  const isUnread = !n.readAt;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => markOneRead(n.id)}
                        className={`w-full rounded-md border px-3 py-2.5 text-left transition ${
                          isUnread
                            ? "border-[#ff0033]/30 bg-[#ff0033]/8 hover:bg-[#ff0033]/12"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p
                            className={`truncate text-xs font-bold ${
                              isUnread
                                ? "text-[var(--color-text)]"
                                : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {n.title}
                          </p>
                          <span className="shrink-0 text-[9px] text-[var(--color-text-muted)]/70">
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p
                          className={`mt-1 line-clamp-4 whitespace-pre-wrap text-[11px] leading-snug ${
                            isUnread
                              ? "text-[var(--color-text)]/85"
                              : "text-[var(--color-text-muted)]"
                          }`}
                        >
                          {n.body}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
