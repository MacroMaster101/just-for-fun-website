"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Persistent floating music disc + hidden YouTube iframe. Mounted once in
 * the root layout so the audio survives client-side navigation between
 * pages (e.g. `/` ↔ `/admin`). Replaces the old Header-embedded version
 * that re-mounted on every route change and killed playback.
 */
export const AmbientPlayer = () => {
  const { user, loading } = useAuth();
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [activeYoutubeId, setActiveYoutubeId] = useState("h7MYJghRWt0");
  const [ambientVolume, setAmbientVolume] = useState(35);

  // Whether the iframe should boot with autoplay=1. True when the user's
  // last visible state was "playing" (persisted in localStorage). Browsers
  // may still block the autoplay-with-sound; if they do, the user clicks
  // the disc to start. We do NOT boot muted — that would lie to the user
  // about the playing state.
  const [bootAutoplay, setBootAutoplay] = useState(false);
  // Position (in whole seconds) + video id the iframe should resume from.
  // Only applied to the iframe URL when activeYoutubeId matches savedTrackId
  // (so a track swap via admin between visits restarts cleanly at 0).
  const [bootStartSeconds, setBootStartSeconds] = useState(0);
  const [savedTrackId, setSavedTrackId] = useState<string | null>(null);
  const [showFirstVisitTooltip, setShowFirstVisitTooltip] = useState(false);
  const firstVisitDecidedRef = useRef(false);
  // Track previous user state for the guest -> logged-in autoplay trigger.
  const prevUserRef = useRef<typeof user>(null);
  const hasSetBaselineRef = useRef(false);
  // Last known currentTime reported by the YouTube iframe via postMessage.
  // Updated by the listener below and flushed to localStorage every ~5s.
  const lastKnownTimeRef = useRef(0);
  // Mirror of ambientPlaying for read-after-mount enforcement (see handshake
  // effect). A ref lets setTimeout callbacks read the current value rather
  // than a stale closure.
  const ambientPlayingRef = useRef(false);
  // Gates the play/pause persistence effect so it doesn't overwrite the
  // saved state with the default `false` on initial mount, BEFORE the
  // hydration mount effect at line 89 has restored the user's last state.
  const didHydrateRef = useRef(false);
  // Pending seek queued during mount; applied once the iframe is ready and
  // the active video id matches what we restored from localStorage.
  const pendingSeekRef = useRef<{ videoId: string; seconds: number } | null>(null);
  // When a foreground YouTube video opens, temporarily pause the ambient
  // track and only resume it if the user had it playing beforehand.
  const resumeAfterTheaterRef = useRef(false);

  const sendPlayerCommand = useCallback((func: string, args: unknown = "") => {
    const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  }, []);

  const applyVolume = useCallback((volume = ambientVolume) => {
    sendPlayerCommand("setVolume", [volume]);
  }, [ambientVolume, sendPlayerCommand]);

  // Active-track polling. Re-checks every 5 seconds so admin-side
  // activation propagates quickly. Also re-runs whenever the tab regains
  // focus (visibility change) — if the user just switched back from the
  // admin tab where they activated a new track, this catches it instantly.
  // `cache: "no-store"` defeats both the browser HTTP cache and any
  // intermediate proxy cache that could otherwise hand us the old id.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const r = await fetch("/api/music/active", { cache: "no-store" });
        const data = r.ok
          ? await r.json()
          : { youtubeId: "h7MYJghRWt0" };
        if (cancelled) return;
        if (data.youtubeId) {
          setActiveYoutubeId((prev) =>
            prev === data.youtubeId ? prev : data.youtubeId
          );
        }
        if (typeof data.volume === "number" && Number.isFinite(data.volume)) {
          const nextVolume = Math.min(100, Math.max(0, Math.round(data.volume)));
          setAmbientVolume((prev) => prev === nextVolume ? prev : nextVolume);
        }
      } catch {
        if (!cancelled) setActiveYoutubeId((prev) => prev || "h7MYJghRWt0");
      } finally {
        inFlight = false;
      }
    };

    refresh();
    // 30s baseline poll. Active-track id changes rarely (admin rotation),
    // so a tight 5s poll was burning ~12 req/min for no real benefit.
    // Pause polling entirely while the tab is hidden, and refresh once on
    // visibility regain so coming back from the admin tab hits the new
    // active track without waiting for the next tick.
    let interval: ReturnType<typeof setInterval> | null = setInterval(refresh, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
        if (!interval) interval = setInterval(refresh, 30_000);
      } else if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // On mount: decide initial play state and whether to show the first-visit
  // tooltip hint. Runs exactly once per browser session.
  useEffect(() => {
    if (firstVisitDecidedRef.current) return;
    firstVisitDecidedRef.current = true;
    if (typeof window === "undefined") return;

    let firstVisit = false;
    try {
      firstVisit = !window.localStorage.getItem("jff:visited");
      if (firstVisit) window.localStorage.setItem("jff:visited", "1");
    } catch {
      firstVisit = true;
    }

    if (firstVisit) {
      try {
        // Marker the Header reads to show the theme-toggle hint for ~10s
        // on the same fresh visit.
        window.sessionStorage.setItem("jff:fresh-session", "1");
      } catch {
        // sessionStorage blocked — no big deal.
      }
      /* eslint-disable react-hooks/set-state-in-effect */
      setBootAutoplay(true);
      setShowFirstVisitTooltip(true);
      setAmbientPlaying(true);
      /* eslint-enable react-hooks/set-state-in-effect */
      ambientPlayingRef.current = true;
      didHydrateRef.current = true;
      return;
    }

    // Return visitor — restore whatever play state they had before refresh.
    let wasPlaying = false;
    let savedPosition = 0;
    let savedVideoId: string | null = null;
    try {
      wasPlaying = window.localStorage.getItem("jff:music-state") === "playing";
      savedVideoId = window.localStorage.getItem("jff:music-track");
      const rawTime = window.localStorage.getItem("jff:music-time");
      const parsed = rawTime ? Number(rawTime) : 0;
      if (Number.isFinite(parsed) && parsed > 0) savedPosition = Math.floor(parsed);
    } catch {
      // ignore
    }
    // Only resume the saved position if it's for the same video we're about
    // to load. If the admin swapped the active track between visits, the
    // handshake effect below sees the mismatch and clears the candidate so
    // we start the new track from 0.
    if (savedVideoId && savedPosition > 0) {
      pendingSeekRef.current = { videoId: savedVideoId, seconds: savedPosition };
    }
    if (savedVideoId) setSavedTrackId(savedVideoId);
    if (wasPlaying) {
      setBootAutoplay(true);
      setBootStartSeconds(savedPosition);
      setAmbientPlaying(true);
      ambientPlayingRef.current = true;
    }
    // Hydration done. The persist effect can now safely write changes to
    // localStorage without clobbering the user's previous saved state.
    didHydrateRef.current = true;
  }, []);

  // Listen for time updates from the YouTube iframe via postMessage. The
  // YT iframe API sends "infoDelivery" events containing currentTime when
  // we send the `listening` handshake (which we do once the iframe is ready
  // and on every src change).
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (!ev.origin.includes("youtube.com")) return;
      let data: unknown;
      try {
        data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
      } catch {
        return;
      }
      if (
        typeof data === "object" &&
        data !== null &&
        "event" in data &&
        (data as { event: string }).event === "infoDelivery"
      ) {
        const info = (data as { info?: { currentTime?: number } }).info;
        const t = info?.currentTime;
        if (typeof t === "number" && Number.isFinite(t) && t > 0) {
          lastKnownTimeRef.current = t;
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Tell the YouTube iframe to start pushing infoDelivery events to us. We
  // re-send this whenever the active track changes (iframe src swap remounts
  // the player and loses the listening subscription).
  //
  // ALSO important: enforce the React-side ambientPlaying state. YouTube's
  // embed parameters (loop=1&playlist=...) can cause the iframe to autoplay
  // even when we explicitly set autoplay=0 — particularly on Chrome with a
  // recent media engagement signal. So if React thinks we're paused, we
  // send an explicit pauseVideo command after the iframe has had time to
  // initialize. This makes the React state the single source of truth.
  useEffect(() => {
    const sendHandshake = () => {
      const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
      if (!iframe || !iframe.contentWindow) return;
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "listening", id: "youtube-ambient-player" }),
        "*"
      );
      const seek = pendingSeekRef.current;
      if (seek && seek.videoId === activeYoutubeId && seek.seconds > 0) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [seek.seconds, true] }),
          "*"
        );
      }
      pendingSeekRef.current = null;

      // Hard-enforce paused state — defeats YouTube's implicit autoplay
      // when loop=1&playlist=<id> tries to start playback against our wishes.
      if (!ambientPlayingRef.current) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
          "*"
        );
      }
    };
    const t = setTimeout(sendHandshake, 800);
    // Also schedule a follow-up enforcement at 2s in case the first one ran
    // before the iframe was fully ready.
    const t2 = setTimeout(() => {
      const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
      if (!iframe || !iframe.contentWindow) return;
      if (!ambientPlayingRef.current) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
          "*"
        );
      }
    }, 2000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [activeYoutubeId]);

  // Apply admin-controlled stream volume to the current YouTube iframe.
  // Re-run when either the active track or the saved admin volume changes,
  // because a track swap remounts the iframe and loses its previous volume.
  useEffect(() => {
    const t = setTimeout(() => applyVolume(ambientVolume), 850);
    return () => clearTimeout(t);
  }, [activeYoutubeId, ambientVolume, applyVolume]);

  // Flush the latest currentTime + active track id to localStorage every
  // ~5s, so a refresh resumes within +/- 5 seconds of where the user was.
  // Also writes one final sample on unload as a best-effort safety net.
  useEffect(() => {
    const persist = () => {
      try {
        const t = lastKnownTimeRef.current;
        if (t > 0) {
          window.localStorage.setItem("jff:music-time", String(Math.floor(t)));
          window.localStorage.setItem("jff:music-track", activeYoutubeId);
        }
      } catch {
        // localStorage blocked — silent skip.
      }
    };
    const interval = setInterval(persist, 5000);
    window.addEventListener("beforeunload", persist);
    return () => {
      persist();
      clearInterval(interval);
      window.removeEventListener("beforeunload", persist);
    };
  }, [activeYoutubeId]);

  // Persist play/pause state so a refresh restores whatever the user chose.
  // Also keeps ambientPlayingRef in sync for setTimeout callbacks that need
  // the latest value rather than a stale closure capture.
  //
  // The "didHydrate" gate stops this from clobbering localStorage on the
  // FIRST render (where ambientPlaying is the default `false`, BEFORE the
  // mount effect at line 89 has had a chance to read the saved state and
  // restore it). Without this gate, a "playing" saved state could get
  // overwritten with "paused" during the first effect pass.
  useEffect(() => {
    ambientPlayingRef.current = ambientPlaying;
    if (!didHydrateRef.current) return;
    try {
      window.localStorage.setItem(
        "jff:music-state",
        ambientPlaying ? "playing" : "paused"
      );
    } catch {
      // ignore
    }
  }, [ambientPlaying]);

  useEffect(() => {
    const onVideoTheater = (event: Event) => {
      const open = (event as CustomEvent<{ open?: boolean }>).detail?.open === true;

      if (open) {
        resumeAfterTheaterRef.current = ambientPlayingRef.current;
        if (ambientPlayingRef.current) {
          sendPlayerCommand("pauseVideo");
          setAmbientPlaying(false);
        }
        return;
      }

      if (resumeAfterTheaterRef.current) {
        applyVolume();
        sendPlayerCommand("playVideo");
        setAmbientPlaying(true);
      }
      resumeAfterTheaterRef.current = false;
    };

    window.addEventListener("jff:video-theater", onVideoTheater);
    return () => window.removeEventListener("jff:video-theater", onVideoTheater);
  }, [applyVolume, sendPlayerCommand]);

  // Auto-hide the first-visit hint tooltip after 10s.
  useEffect(() => {
    if (!showFirstVisitTooltip) return;
    const t = setTimeout(() => setShowFirstVisitTooltip(false), 10_000);
    return () => clearTimeout(t);
  }, [showFirstVisitTooltip]);

  // If the iframe was set to autoplay-with-sound but the browser blocked
  // it (no media engagement signal yet), the iframe ends up in a paused
  // state internally while React still thinks it should be playing. The
  // first user interaction anywhere on the page is our chance to issue a
  // synchronous playVideo command — this counts as a user gesture and the
  // browser allows it.
  useEffect(() => {
    if (!bootAutoplay) return;
    let attempted = false;
    const onInteract = () => {
      if (attempted) return;
      attempted = true;
      const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
      if (iframe && iframe.contentWindow) {
        applyVolume();
        sendPlayerCommand("playVideo");
      }
    };
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    window.addEventListener("touchstart", onInteract);
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, [bootAutoplay, applyVolume, sendPlayerCommand]);

  // Guest -> logged-in transition autoplay.
  useEffect(() => {
    if (loading) return;
    if (!hasSetBaselineRef.current) {
      prevUserRef.current = user;
      hasSetBaselineRef.current = true;
      return;
    }
    if (user && !prevUserRef.current && !ambientPlaying) {
      const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
      if (iframe && iframe.contentWindow) {
        applyVolume();
        sendPlayerCommand("playVideo");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAmbientPlaying(true);
      }
    }
    prevUserRef.current = user;
  }, [user, loading, ambientPlaying, applyVolume, sendPlayerCommand]);

  const toggleAmbient = () => {
    const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentWindow) return;

    if (ambientPlaying) {
      sendPlayerCommand("pauseVideo");
      setAmbientPlaying(false);
    } else {
      applyVolume();
      sendPlayerCommand("playVideo");
      setAmbientPlaying(true);
    }
  };

  return (
    <>
      {/* Floating Ambient Music Controller */}
      <div className="fixed bottom-3 left-3 z-[100] group flex items-center scale-90 origin-bottom-left sm:scale-100 sm:bottom-4 sm:left-4">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes musicWaveBounce {
            0%, 100% { height: 4px; }
            50% { height: 18px; }
          }
          .ambient-wave-1 { animation: musicWaveBounce 1.2s ease-in-out infinite; }
          .ambient-wave-2 { animation: musicWaveBounce 0.8s ease-in-out infinite; }
          .ambient-wave-3 { animation: musicWaveBounce 1.0s ease-in-out infinite; }
        `}} />

        {/* Tooltip — hover + first-visit auto-show for 10s. */}
        <div
          className={`absolute bottom-full left-0 mb-4 px-3 py-1.5 bg-[#0c0c0c]/95 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-2xl pointer-events-none transition-all duration-300 whitespace-nowrap z-50 group-hover:opacity-100 group-hover:translate-y-0 ${
            showFirstVisitTooltip
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1"
          }`}
        >
          {showFirstVisitTooltip
            ? "🎵 Synthwave is playing — click to pause"
            : ambientPlaying
              ? "Pause Synthwave Theme"
              : "Play Synthwave Theme"}
          <div className="absolute top-full left-6 border-4 border-transparent border-t-[#0c0c0c] filter drop-shadow-[0_1px_0_rgba(255,255,255,0.08)]" />
        </div>

        <button
          onClick={toggleAmbient}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#050505]/40 backdrop-blur-md transition-all duration-500 hover:scale-105 active:scale-95 focus:outline-none group/btn cursor-pointer"
          aria-label="Toggle ambient music"
        >
          <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
            ambientPlaying
              ? "bg-[#ff0033]/15 shadow-[0_0_30px_rgba(255,0,51,0.5)] ring-2 ring-[#ff0033]/30"
              : "bg-transparent group-hover/btn:bg-white/5 ring-1 ring-white/10"
          }`} />

          <div className={`relative w-[88%] h-[88%] rounded-full bg-[#0f0f0f] shadow-[inset_0_2px_8px_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center transition-all duration-[3000ms] ${
            ambientPlaying ? "animate-[spin_4s_linear_infinite]" : ""
          }`}>
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#0a0a0a_0%,#1a1a1a_25%,#0a0a0a_50%,#1a1a1a_75%,#0a0a0a_100%)] opacity-95" />
            <div className="absolute w-[86%] h-[86%] rounded-full border border-neutral-900/60" />
            <div className="absolute w-[72%] h-[72%] rounded-full border border-neutral-800/30" />
            <div className="absolute w-[58%] h-[58%] rounded-full border border-neutral-900/80" />
            <div className={`absolute w-[36%] h-[36%] rounded-full transition-all duration-700 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] ${
              ambientPlaying
                ? "bg-gradient-to-tr from-[#ff0033] to-[#ff2d55]"
                : "bg-neutral-800"
            }`}>
              <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-inner">
                <div className={`w-0.5 h-0.5 rounded-full ${ambientPlaying ? "bg-[#ff2d55]" : "bg-neutral-600"}`} />
              </div>
            </div>
          </div>

          <div
            className={`absolute top-0.5 right-0.5 w-6 h-10 z-20 pointer-events-none transition-all duration-700 ease-in-out origin-[82%_15%] ${
              ambientPlaying ? "rotate-[20deg]" : "rotate-0"
            }`}
          >
            <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-gradient-to-br from-neutral-500 via-neutral-300 to-neutral-600 border border-neutral-700 shadow-md flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-neutral-900" />
            </div>
            <div className="absolute top-2 right-1.5 w-0.5 h-6 bg-gradient-to-b from-neutral-300 via-neutral-400 to-neutral-600 origin-top rotate-[-12deg] rounded-full shadow-sm" />
            <div className="absolute bottom-0 left-0 w-2.5 h-1.5 bg-[#1c1c1c] border-t border-neutral-600 rounded-sm shadow-sm origin-center rotate-[15deg]">
              <div className={`absolute bottom-0 left-0.5 w-1 h-1 rounded-full transition-all duration-500 ${
                ambientPlaying ? "bg-[#ff2d55] shadow-[0_0_8px_#ff0033] scale-125" : "bg-neutral-600"
              }`} />
            </div>
          </div>

          {ambientPlaying && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff0033] opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#ff2d55] border border-white/20" />
            </span>
          )}
        </button>

        <div className={`flex items-end gap-0.5 h-5 ml-3 transition-all duration-500 ${
          ambientPlaying ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-3 scale-75 pointer-events-none"
        }`}>
          <span className="w-0.5 bg-[#ff0033] rounded-full ambient-wave-1" style={{ animationDelay: "0.1s" }} />
          <span className="w-0.5 bg-[#ff2d55] rounded-full ambient-wave-2" style={{ animationDelay: "0.3s" }} />
          <span className="w-0.5 bg-[#ff0033] rounded-full ambient-wave-3" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>

      {/* Hidden YouTube Ambient Audio Player. We boot with autoplay=1 when
          the user's previous state was playing (and on first visit). The
          browser may block autoplay-with-sound on a cold page — in that case
          the first user interaction below sends a playVideo command, which
          counts as a user gesture and is allowed. Mounted at the layout level
          so client-side navigation doesn't tear it down. */}
      <iframe
        // Key forces React to fully unmount + remount the iframe whenever
        // the track id changes. Without this, YouTube's internal player
        // sometimes gets stuck on the old video even when src is updated.
        key={activeYoutubeId}
        id="youtube-ambient-player"
        src={`https://www.youtube.com/embed/${activeYoutubeId}?enablejsapi=1&autoplay=${bootAutoplay ? 1 : 0}&controls=0&disablekb=1&fs=0&loop=1&playlist=${activeYoutubeId}&modestbranding=1&rel=0&iv_load_policy=3${bootStartSeconds > 0 && savedTrackId === activeYoutubeId ? `&start=${bootStartSeconds}` : ""}`}
        allow="autoplay"
        className="pointer-events-none absolute -left-[9999px] -top-[9999px] h-1 w-1 opacity-0"
        tabIndex={-1}
      />
    </>
  );
};
