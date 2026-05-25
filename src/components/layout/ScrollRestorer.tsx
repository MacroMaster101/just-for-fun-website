"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_PREFIX = "jff:scroll:";

/**
 * Persists window scroll position per-pathname to sessionStorage and
 * restores it after the page lays out. We can't rely on the browser's
 * built-in scroll restoration because the LoadingScreen overlay collapses
 * the page height to one screen during boot — by the time the real
 * sections mount, the browser has already given up trying to restore.
 *
 * Strategy:
 *   1. On every scroll, write the current y position to sessionStorage
 *      keyed by pathname (throttled via requestAnimationFrame).
 *   2. Tell the browser not to fight us: `history.scrollRestoration = "manual"`.
 *   3. After mount, poll once per animation frame for up to ~3s, waiting
 *      until document.body is tall enough to actually reach the saved y.
 *      As soon as it is, scroll there and stop polling.
 */
export const ScrollRestorer = () => {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = STORAGE_PREFIX + pathname;

    // Take over scroll restoration from the browser. Without this the
    // browser still tries to restore (often to 0) and races us.
    const prevRestoration = history.scrollRestoration;
    try {
      history.scrollRestoration = "manual";
    } catch {
      // Some browsers throw if called too early — ignore.
    }

    // ---- Save scroll position ----
    let rafPending = false;
    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        try {
          sessionStorage.setItem(key, String(window.scrollY));
        } catch {
          // Storage quota / private mode — give up silently.
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // pagehide is the modern, bfcache-friendly replacement for unload.
    const onPageHide = () => {
      try {
        sessionStorage.setItem(key, String(window.scrollY));
      } catch {}
    };
    window.addEventListener("pagehide", onPageHide);

    // ---- Restore scroll position ----
    let savedY = 0;
    try {
      const raw = sessionStorage.getItem(key);
      savedY = raw ? Number(raw) : 0;
    } catch {
      savedY = 0;
    }

    if (!Number.isFinite(savedY) || savedY <= 0) {
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pagehide", onPageHide);
        try {
          history.scrollRestoration = prevRestoration;
        } catch {}
      };
    }

    // Poll for layout readiness — try to scroll once the document is tall
    // enough to actually reach savedY. Bail after ~3s so we don't run
    // forever if the page never gets that tall.
    const deadline = performance.now() + 3000;
    let raf = 0;
    const tryRestore = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= savedY - 4) {
        window.scrollTo({ top: savedY, behavior: "auto" });
        return;
      }
      if (performance.now() < deadline) {
        raf = requestAnimationFrame(tryRestore);
      } else {
        // Last-ditch: scroll as far as we can.
        window.scrollTo({ top: maxScroll, behavior: "auto" });
      }
    };
    raf = requestAnimationFrame(tryRestore);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      try {
        history.scrollRestoration = prevRestoration;
      } catch {}
    };
  }, [pathname]);

  return null;
};
