"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export type FavoriteKind = "video" | "sound";

interface FavoriteRecord {
  id: string;
  kind: FavoriteKind;
  itemId: string;
  itemTitle: string | null;
}

/**
 * Loads the current user's favorites once and exposes a Set of `${kind}:${itemId}`
 * keys plus toggle/check helpers. Heart buttons can use this without each one
 * making its own fetch.
 */
export const useFavorites = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const inflight = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      // Defer to next tick so setState happens outside the effect body.
      const t = setTimeout(() => {
        if (cancelled) return;
        setKeys(new Set());
        setReady(true);
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }
    fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : { favorites: [] }))
      .then((data: { favorites: FavoriteRecord[] }) => {
        if (cancelled) return;
        setKeys(new Set(data.favorites.map((f) => `${f.kind}:${f.itemId}`)));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isFavorited = useCallback(
    (kind: FavoriteKind, itemId: string) => keys.has(`${kind}:${itemId}`),
    [keys]
  );

  const toggle = useCallback(
    async (kind: FavoriteKind, itemId: string, itemTitle?: string) => {
      if (!user) return false;
      const key = `${kind}:${itemId}`;
      if (inflight.current.has(key)) return keys.has(key);
      inflight.current.add(key);

      const isFav = keys.has(key);
      // Optimistic update
      setKeys((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(key);
        else next.add(key);
        return next;
      });

      try {
        const res = await fetch("/api/favorites", {
          method: isFav ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, itemId, itemTitle }),
        });
        if (!res.ok) throw new Error();
        return !isFav;
      } catch {
        // Revert on failure
        setKeys((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(key);
          else next.delete(key);
          return next;
        });
        return isFav;
      } finally {
        inflight.current.delete(key);
      }
    },
    [user, keys]
  );

  return { ready, isFavorited, toggle, signedIn: !!user };
};
