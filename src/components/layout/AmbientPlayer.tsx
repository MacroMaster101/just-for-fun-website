"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Volume1, Volume2, VolumeX, ChevronLeft } from "lucide-react";

type PlayerCommandArg = string | number | boolean;
type PlayerCommandArgs = "" | PlayerCommandArg[];

const readStoredAmbientVolume = () => {
  if (typeof window === "undefined") return 35;
  try {
    const localVol = window.localStorage.getItem("jff:music-volume");
    if (!localVol) return 35;
    const parsed = Number(localVol);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
      ? parsed
      : 35;
  } catch {
    return 35;
  }
};

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
  const [ambientVolume, setAmbientVolume] = useState(readStoredAmbientVolume);
  const [isMuted, setIsMuted] = useState(false);
  const preMuteVolumeRef = useRef(ambientVolume);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeTypeRef = useRef<"in" | "out" | null>(null);

  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    fadeTypeRef.current = null;
  }, []);

  // Whether the iframe should boot with autoplay=1. True when the user's
  // last visible state was "playing" (persisted in localStorage). Browsers
  // may still block the autoplay-with-sound; if they do, the user clicks
  // the disc to start. We do NOT boot muted — that would lie to the user
  // about the playing state.
  const [bootAutoplay, setBootAutoplay] = useState(false);
  const bootAutoplayRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showEnterScreen, setShowEnterScreen] = useState(false);

  // Collapsed state for sliding the music disc off-screen
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobileRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => window.innerWidth < 1024;
    isMobileRef.current = checkMobile();

    if (isMobileRef.current) {
      // Mobile: ALWAYS start collapsed (half-hidden), ignore localStorage
      setIsCollapsed(true);
    } else {
      // Desktop: respect localStorage preference
      try {
        const saved = window.localStorage.getItem("jff:ambient-collapsed");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
        if (saved === "true") setIsCollapsed(true);
      } catch {}
    }

    // Listen for viewport changes (e.g. rotating device, responsive mode)
    const onResize = () => {
      const wasMobile = isMobileRef.current;
      const nowMobile = checkMobile();
      isMobileRef.current = nowMobile;
      if (!wasMobile && nowMobile) {
        // Switched to mobile → collapse
        setIsCollapsed(true);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handlePlayerClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      try {
        window.localStorage.setItem("jff:ambient-collapsed", "false");
      } catch {}
    } else {
      toggleAmbient();
    }
  };

  // Initialize iframeAutoplay state synchronously on client side to prevent reload
  const [iframeAutoplay] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const firstVisit = !window.localStorage.getItem("jff:visited");
      if (firstVisit) return 1;
      const wasPlaying = window.localStorage.getItem("jff:music-state") === "playing";
      return wasPlaying ? 1 : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    bootAutoplayRef.current = bootAutoplay;
  }, [bootAutoplay]);

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
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
  const playerReadyRef = useRef(false);
  const userHasInteractedRef = useRef(false);
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

  const sendPlayerCommand = useCallback((func: string, args: PlayerCommandArgs = "") => {
    const isUpload = activeYoutubeId.startsWith("http");
    if (isUpload) {
      const audio = document.getElementById("html5-ambient-player") as HTMLAudioElement | null;
      if (!audio) return;
      if (func === "playVideo") {
        audio.play().catch(() => {});
      } else if (func === "pauseVideo") {
        audio.pause();
      } else if (func === "setVolume") {
        const vol = Number(Array.isArray(args) ? args[0] : args);
        audio.volume = Math.min(1, Math.max(0, vol / 100));
      } else if (func === "seekTo") {
        const sec = Number(Array.isArray(args) ? args[0] : args);
        audio.currentTime = sec;
      }
    } else {
      const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
      if (!iframe || !iframe.contentWindow) return;
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  }, [activeYoutubeId]);

  const applyVolume = useCallback((volume = ambientVolume) => {
    const targetVol = isMuted ? 0 : volume;
    sendPlayerCommand("setVolume", [targetVol]);
  }, [ambientVolume, isMuted, sendPlayerCommand]);

  const toggleMute = () => {
    clearFade();
    if (isMuted) {
      setIsMuted(false);
      sendPlayerCommand("setVolume", [ambientVolume]);
    } else {
      preMuteVolumeRef.current = ambientVolume;
      setIsMuted(true);
      sendPlayerCommand("setVolume", [0]);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    clearFade();
    if (newVol > 0) {
      setIsMuted(false);
    }
    setAmbientVolume(newVol);
    applyVolume(newVol);
    try {
      window.localStorage.setItem("jff:music-volume", String(newVol));
    } catch {}
  };

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
          // Only update local volume from server if the user hasn't explicitly set their own volume
          let hasLocalVol = false;
          try {
            hasLocalVol = Boolean(window.localStorage.getItem("jff:music-volume"));
          } catch {}
          if (!hasLocalVol) {
            setAmbientVolume((prev) => prev === nextVolume ? prev : nextVolume);
          }
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
    let deferredState: ReturnType<typeof setTimeout> | null = null;
    const deferState = (fn: () => void) => {
      deferredState = setTimeout(fn, 0);
    };

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
      deferState(() => {
        setBootAutoplay(true);
        setShowFirstVisitTooltip(true);
        setAmbientPlaying(false);
        setShowEnterScreen(true);
      });
      ambientPlayingRef.current = false;
      didHydrateRef.current = true;
      return () => {
        if (deferredState) clearTimeout(deferredState);
      };
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
    if (savedVideoId || wasPlaying) {
      deferState(() => {
        if (savedVideoId) setSavedTrackId(savedVideoId);
        if (wasPlaying) {
          setBootAutoplay(true);
          setBootStartSeconds(savedPosition);
          setAmbientPlaying(false);
        }
      });
    }
    if (wasPlaying) ambientPlayingRef.current = false;
    // Hydration done. The persist effect can now safely write changes to
    // localStorage without clobbering the user's previous saved state.
    didHydrateRef.current = true;
    return () => {
      if (deferredState) clearTimeout(deferredState);
    };
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
      if (typeof data === "object" && data !== null && "event" in data) {
        const eventName = (data as { event: string }).event;
        
        if (eventName === "infoDelivery") {
          const info = (data as { info?: { currentTime?: number } }).info;
          const t = info?.currentTime;
          if (typeof t === "number" && Number.isFinite(t) && t > 0) {
            lastKnownTimeRef.current = t;
          }
        } else if (eventName === "onStateChange") {
          const playerState = (data as { info?: number }).info;
          if (playerState === 1) {
            setAmbientPlaying(true);
            setBootAutoplay(false);
          } else if (playerState === 2 || playerState === 0) {
            setAmbientPlaying(false);
          }
        } else if (eventName === "onReady" || eventName === "initialDelivery") {
          playerReadyRef.current = true;
          const iframe = document.getElementById("youtube-ambient-player") as HTMLIFrameElement | null;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(
              JSON.stringify({ event: "listening", id: "youtube-ambient-player" }),
              "*"
            );
            if (bootAutoplayRef.current) {
              sendPlayerCommand("setVolume", [0]);
              const seek = pendingSeekRef.current;
              if (seek && seek.videoId === activeYoutubeId && seek.seconds > 0) {
                iframe.contentWindow.postMessage(
                  JSON.stringify({ event: "command", func: "seekTo", args: [seek.seconds, true] }),
                  "*"
                );
              }
              pendingSeekRef.current = null;
              sendPlayerCommand("playVideo");
            }
          }
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [activeYoutubeId, applyVolume, sendPlayerCommand]);

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
    if (activeYoutubeId.startsWith("http")) {
      playerReadyRef.current = false;
      return;
    }
    playerReadyRef.current = false;
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
      if (!ambientPlayingRef.current && !bootAutoplayRef.current) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
          "*"
        );
      } else if (bootAutoplayRef.current) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [0] }),
          "*"
        );
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: "" }),
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
      if (!ambientPlayingRef.current && !bootAutoplayRef.current) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
          "*"
        );
      } else if (bootAutoplayRef.current) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [0] }),
          "*"
        );
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: "" }),
          "*"
        );
      }
    }, 2000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [activeYoutubeId, applyVolume]);

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

  // Smooth volume fade-in when the music starts playing
  useEffect(() => {
    if (ambientPlaying) {
      clearFade();
      
      const targetVolume = isMuted ? 0 : ambientVolume;
      if (targetVolume <= 0) return;

      let currentVol = 0;
      sendPlayerCommand("setVolume", [0]);
      fadeTypeRef.current = "in";

      const steps = 15;
      const stepValue = targetVolume / steps;
      const duration = 1200; // 1.2s total fade-in duration
      const stepTime = duration / steps; // 80ms per step

      let currentStep = 0;

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        currentVol = Math.min(targetVolume, currentStep * stepValue);
        sendPlayerCommand("setVolume", [Math.round(currentVol)]);

        if (currentStep >= steps) {
          clearFade();
        }
      }, stepTime);
    } else {
      // Only clear if we were fading in. If we are currently fading out,
      // let the fade-out run to completion.
      if (fadeTypeRef.current === "in") {
        clearFade();
      }
    }

    return () => {
      if (fadeTypeRef.current === "in") {
        clearFade();
      }
    };
  }, [ambientPlaying, ambientVolume, isMuted, sendPlayerCommand, clearFade]);

  // Global unmount safety hook to clear any remaining intervals on actual component unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const initiatePause = useCallback(() => {
    if (!ambientPlayingRef.current) return;

    clearFade();

    const currentVolume = isMuted ? 0 : ambientVolume;
    if (currentVolume <= 0) {
      sendPlayerCommand("pauseVideo");
      setAmbientPlaying(false);
      ambientPlayingRef.current = false;
      return;
    }

    const steps = 10;
    const stepValue = currentVolume / steps;
    const duration = 800;
    const stepTime = duration / steps;

    let currentStep = 0;

    setAmbientPlaying(false);
    ambientPlayingRef.current = false;
    fadeTypeRef.current = "out";

    fadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const vol = Math.max(0, currentVolume - currentStep * stepValue);
      sendPlayerCommand("setVolume", [Math.round(vol)]);

      if (currentStep >= steps) {
        clearFade();
        sendPlayerCommand("pauseVideo");
      }
    }, stepTime);
  }, [ambientVolume, isMuted, sendPlayerCommand, clearFade]);

  useEffect(() => {
    const onVideoTheater = (event: Event) => {
      const open = (event as CustomEvent<{ open?: boolean }>).detail?.open === true;

      if (open) {
        resumeAfterTheaterRef.current = ambientPlayingRef.current;
        if (ambientPlayingRef.current) {
          initiatePause();
        }
        return;
      }

      if (resumeAfterTheaterRef.current) {
        sendPlayerCommand("setVolume", [0]);
        sendPlayerCommand("playVideo");
        setAmbientPlaying(true);
      }
      resumeAfterTheaterRef.current = false;
    };

    window.addEventListener("jff:video-theater", onVideoTheater);
    return () => window.removeEventListener("jff:video-theater", onVideoTheater);
  }, [initiatePause, sendPlayerCommand]);

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
    if (!bootAutoplay || ambientPlaying) return;
    const onInteract = () => {
      userHasInteractedRef.current = true;
      if (playerReadyRef.current) {
        sendPlayerCommand("setVolume", [0]);
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
  }, [bootAutoplay, ambientPlaying, applyVolume, sendPlayerCommand]);

  // Guest -> logged-in transition autoplay.
  useEffect(() => {
    if (loading) return;
    let deferredState: ReturnType<typeof setTimeout> | null = null;
    if (!hasSetBaselineRef.current) {
      prevUserRef.current = user;
      hasSetBaselineRef.current = true;
      return;
    }
    if (user && !prevUserRef.current && !ambientPlaying) {
      const isUpload = activeYoutubeId.startsWith("http");
      const player = isUpload
        ? document.getElementById("html5-ambient-player")
        : document.getElementById("youtube-ambient-player");
      if (player) {
        sendPlayerCommand("setVolume", [0]);
        sendPlayerCommand("playVideo");
        deferredState = setTimeout(() => {
          setAmbientPlaying(true);
          setBootAutoplay(false);
        }, 0);
      }
    }
    prevUserRef.current = user;
    return () => {
      if (deferredState) clearTimeout(deferredState);
    };
  }, [user, loading, ambientPlaying, sendPlayerCommand, activeYoutubeId]);

  const toggleAmbient = () => {
    const isUpload = activeYoutubeId.startsWith("http");
    const player = isUpload
      ? document.getElementById("html5-ambient-player")
      : document.getElementById("youtube-ambient-player");
    if (!player) return;

    if (ambientPlaying) {
      initiatePause();
    } else {
      sendPlayerCommand("setVolume", [0]);
      sendPlayerCommand("playVideo");
      setAmbientPlaying(true);
    }
    setBootAutoplay(false);
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Floating Ambient Music Controller */}
      <div 
        className={`fixed bottom-24 lg:bottom-4 z-[100] group flex items-center scale-90 origin-bottom-left sm:scale-100 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isCollapsed
            ? "left-0 -translate-x-[36px] opacity-75 hover:opacity-100 hover:-translate-x-[24px]"
            : "left-1 lg:left-10 translate-x-0"
        }`}
      >
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
        {!isCollapsed && (
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
        )}

        {isCollapsed && (
          <div className="pointer-events-none absolute left-full ml-3 translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 bg-[#0a0a0a]/95 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap hidden lg:block z-50">
            Expand Music Player
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0a0a0a]" />
          </div>
        )}

        <button
          onClick={handlePlayerClick}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-[#050505]/40 backdrop-blur-md transition-all duration-500 hover:scale-105 active:scale-95 focus:outline-none group/btn cursor-pointer ${
            isCollapsed ? "shadow-[0_0_15px_rgba(255,0,51,0.4)] border border-[#ff0033]/30" : ""
          }`}
          aria-label={isCollapsed ? "Show music player" : "Toggle ambient music"}
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

        {!isCollapsed && (
          <div className={`flex items-end gap-0.5 h-5 ml-3 transition-all duration-500 group-hover:opacity-0 group-hover:translate-x-2 group-hover:scale-75 group-hover:pointer-events-none ${
            ambientPlaying ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-3 scale-75 pointer-events-none"
          }`}>
            <span className="w-0.5 bg-[#ff0033] rounded-full ambient-wave-1" style={{ animationDelay: "0.1s" }} />
            <span className="w-0.5 bg-[#ff2d55] rounded-full ambient-wave-2" style={{ animationDelay: "0.3s" }} />
            <span className="w-0.5 bg-[#ff0033] rounded-full ambient-wave-3" style={{ animationDelay: "0.2s" }} />
          </div>
        )}

        {/* Hover Slide-out Volume Panel (Outer wrapper provides a generous hover zone and a 300ms exit delay to prevent accidental slip-offs) */}
        {!isCollapsed && (
          <div className="absolute left-full -top-3 py-4 pr-6 pl-2 flex items-center opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-500 delay-300 group-hover:delay-0 z-50">
            <div className="flex items-center gap-2.5 bg-[#050505]/85 backdrop-blur-md border border-white/10 rounded-full py-1.5 px-3.5 shadow-2xl">
              {/* Speaker Button (Click to mute/unmute) */}
              <button
                onClick={toggleMute}
                className="text-[var(--color-text-muted)] hover:text-[#ff2d55] transition-colors cursor-pointer flex items-center justify-center shrink-0"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || ambientVolume === 0 ? (
                  <VolumeX size={15} />
                ) : ambientVolume < 35 ? (
                  <Volume1 size={15} />
                ) : (
                  <Volume2 size={15} />
                )}
              </button>

              {/* Volume Slider Track */}
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : ambientVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 h-1 rounded-full bg-neutral-800 accent-[#ff0033] cursor-pointer outline-none transition-all hover:scale-y-125"
                aria-label="Volume level"
              />

              {/* Volume Percent Text */}
              <span className="font-mono text-[9px] font-black text-[var(--color-text)] tracking-wider min-w-[24px] text-right">
                {isMuted ? 0 : ambientVolume}%
              </span>
            </div>
          </div>
        )}

        {/* Slide/Hide Toggle Handle (Only visible on hover when expanded, placed just outside the left edge of the disc) */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(true);
              try {
                window.localStorage.setItem("jff:ambient-collapsed", "true");
              } catch {}
            }}
            className="absolute left-[-26px] top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a]/95 text-neutral-400 hover:text-white hover:border-[#ff0033]/30 hover:bg-[#ff0033]/20 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-50 cursor-pointer shadow-sm group/collapse"
            aria-label="Hide music player"
          >
            <ChevronLeft size={10} />
            <span className="pointer-events-none absolute right-full mr-2 scale-90 opacity-0 transition-all group-hover/collapse:scale-100 group-hover/collapse:opacity-100 bg-[#0a0a0a] border border-white/10 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg whitespace-nowrap hidden lg:block">
              Collapse Player
            </span>
          </button>
        )}
      </div>

      {/* Hidden YouTube Ambient Audio Player. We boot with autoplay=1 when
          the user's previous state was playing (and on first visit). The
          browser may block autoplay-with-sound on a cold page — in that case
          the first user interaction below sends a playVideo command, which
          counts as a user gesture and is allowed. Mounted at the layout level
          so client-side navigation doesn't tear it down. */}
      {activeYoutubeId.startsWith("http") ? (
        <audio
          key={activeYoutubeId}
          id="html5-ambient-player"
          src={activeYoutubeId}
          loop
          preload="auto"
          className="hidden"
          onPlay={() => {
            setAmbientPlaying(true);
            setBootAutoplay(false);
          }}
          onPause={() => setAmbientPlaying(false)}
          onEnded={() => setAmbientPlaying(false)}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            if (t > 0) {
              lastKnownTimeRef.current = t;
            }
          }}
          onLoadedMetadata={(e) => {
            playerReadyRef.current = true;
            const audio = e.currentTarget;
            const targetVol = isMuted ? 0 : ambientVolume;
            audio.volume = targetVol / 100;
            
            const seek = pendingSeekRef.current;
            if (seek && seek.videoId === activeYoutubeId && seek.seconds > 0) {
              audio.currentTime = seek.seconds;
            }
            pendingSeekRef.current = null;
            
            if (bootAutoplayRef.current) {
              audio.volume = 0;
              audio.play().catch(() => {});
            } else {
              const targetVol = isMuted ? 0 : ambientVolume;
              audio.volume = targetVol / 100;
            }
          }}
        />
      ) : (
        <iframe
          // Key forces React to fully unmount + remount the iframe whenever
          // the track id changes. Without this, YouTube's internal player
          // sometimes gets stuck on the old video even when src is updated.
          key={activeYoutubeId}
          id="youtube-ambient-player"
          src={`https://www.youtube.com/embed/${activeYoutubeId}?enablejsapi=1&autoplay=${iframeAutoplay}&controls=0&disablekb=1&fs=0&loop=1&playlist=${activeYoutubeId}&modestbranding=1&rel=0&iv_load_policy=3${bootStartSeconds > 0 && savedTrackId === activeYoutubeId ? `&start=${bootStartSeconds}` : ""}`}
          allow="autoplay"
          className="pointer-events-none absolute -left-[9999px] -top-[9999px] h-1 w-1 opacity-0"
          tabIndex={-1}
        />
      )}

      {showEnterScreen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-700 animate-fade-in">
          {/* Neon Grid Background / Scanlines */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,51,0.15),transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,255,0,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none" />

          <div className="relative text-center max-w-sm px-6 py-10 rounded-3xl border border-white/10 bg-[#050505]/65 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6 group">
            {/* Glowing active outline */}
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-[#ff0033] to-[#ff2d55] opacity-30 blur-sm group-hover:opacity-60 transition duration-500" />
            
            {/* Logo Icon */}
            <div className="relative h-16 w-16 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center shadow-2xl animate-pulse">
              <span className="text-2xl">🎮</span>
              <div className="absolute inset-0 rounded-full bg-[#ff0033]/10 animate-ping" />
            </div>

            <div className="space-y-1">
              <h1 className="font-display font-black text-xl uppercase tracking-widest text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                JUST FOR FUN
              </h1>
              <p className="text-[9px] uppercase font-black tracking-[0.25em] text-[#ff2d55] animate-pulse">
                Immersive Music Experience
              </p>
            </div>

            <p className="text-[11px] text-neutral-400 font-medium leading-relaxed max-w-xs text-center">
              Welcome to the Arena. We play hand-selected Synthwave beats to elevate your stay. Click below to tune in.
            </p>

            <button
              onClick={() => {
                setShowEnterScreen(false);
                sendPlayerCommand("setVolume", [0]);
                sendPlayerCommand("playVideo");
                setAmbientPlaying(true);
                setBootAutoplay(false);
              }}
              className="mt-1 px-7 py-3 bg-gradient-to-r from-[#ff0033] to-[#ff2d55] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(255,0,51,0.4)] hover:shadow-[0_0_30px_rgba(255,0,51,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center gap-2 border border-white/20"
            >
              <span>📻 Tune In & Enter</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
