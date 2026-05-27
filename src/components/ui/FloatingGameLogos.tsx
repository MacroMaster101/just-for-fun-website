"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Game {
  id: string;
  name: string;
  logoUrl: string;
}

interface FloatingItem {
  id: string;
  type: "game" | "word";
  game?: Game;
  wordText?: string;
  wordStyle?: "outline" | "glassy";
  wordDotColor?: string;
  wordZone?: 1 | 2; // 1 = Top-Left, 2 = Bottom-Right
  /** Horizontal position (% of container width, where 50 is center) */
  x: number;
  /** Vertical position (% of container height, where 50 is center) */
  y: number;
  /** Horizontal velocity (% per frame) */
  vx: number;
  /** Vertical velocity (% per frame) */
  vy: number;
  sizeW: number;
  sizeH: number;
  rotation: number;
  rotationSpeed: number;
  hitAt: number | null;
  respawnAt: number | null;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                                */
/* ------------------------------------------------------------------ */
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const PARTICLE_COLORS = [
  "#ff0033",
  "#ff2d55",
  "#ff4b5f",
  "#ff8a00",
  "#ffffff",
  "#ffd700",
];

const DEFAULT_SYSTEM_WORDS = [
  { text: "J4FN SQUAD", style: "outline" },
  { text: "CLUTCH TIME", style: "glassy", dot: "#ff0033" },
  { text: "GG EZ", style: "outline" },
  { text: "MELTDOWN", style: "glassy", dot: "#00ff66" },
  { text: "AIM BOT", style: "glassy", dot: "#ffffff" },
  { text: "GAME ON", style: "outline" },
];

const DEFAULT_FLOATING_GAMES: Game[] = [
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

function spawnParticles(cx: number, cy: number, isMobile: boolean): Particle[] {
  const count = isMobile ? 7 : 14;
  return Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 * i) / count + rand(-0.4, 0.4);
    const speed = isMobile ? rand(1.5, 4) : rand(2.5, 7);
    return {
      id: Date.now() * 1000 + i,
      x: cx,
      y: cy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: 1,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      size: isMobile ? rand(1.5, 4) : rand(3, 8),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export interface FloatingGameLogosProps {
  games: Game[];
  className?: string;
}

export const FloatingGameLogos: React.FC<FloatingGameLogosProps> = ({
  games,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const itemsRef = useRef<FloatingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const domRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const rafRef = useRef<number>(0);
  const [items, setItems] = useState<FloatingItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [active, setActive] = useState(true);

  // Custom settings loaded dynamically from public API
  const [customFloatingGames, setCustomFloatingGames] = useState<Game[]>([]);
  const [customFloatingWords, setCustomFloatingWords] = useState<Array<{ text: string; style: string; dot?: string }>>([]);

  /* ---------- Responsive Screen Detection ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint is 1024px
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------- Activation gating: pause RAF when off-screen or tab hidden ---------- */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = containerRef.current;
    if (!el) return;

    let inView = true;
    let visible = !document.hidden;
    const apply = () => setActive(inView && visible);

    const onVisibility = () => {
      visible = !document.hidden;
      apply();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          inView = entries.some((e) => e.isIntersecting);
          apply();
        },
        { rootMargin: "100px" }
      );
      observer.observe(el);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
    };
  }, []);

  /* ---------- Load Dynamic Settings Override ---------- */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { settings: {} }))
      .then((data: { settings?: Record<string, string> }) => {
        if (cancelled) return;

        const fg = data.settings?.["hero.floatingGames"];
        const fw = data.settings?.["hero.floatingWords"];

        if (fg) {
          try {
            const parsed = JSON.parse(fg);
            if (Array.isArray(parsed)) setCustomFloatingGames(parsed);
          } catch { }
        }
        if (fw) {
          try {
            const parsed = JSON.parse(fw);
            if (Array.isArray(parsed)) setCustomFloatingWords(parsed);
          } catch { }
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Initialise items when games, custom settings, or isMobile changes ---------- */
  useEffect(() => {
    // 1. Resolve Games list: Use custom settings if available, otherwise fall back to premium defaults
    const activeGames = customFloatingGames.length > 0 ? customFloatingGames : DEFAULT_FLOATING_GAMES;

    // 2. Resolve Words list: Use custom settings if available, otherwise fall back to J4FN defaults
    const activeWords = customFloatingWords.length > 0 ? customFloatingWords : DEFAULT_SYSTEM_WORDS;

    // Generate Game Logo items
    const gameItems: FloatingItem[] = activeGames.map((game) => {
      const startX = isMobile ? rand(18, 82) : rand(10, 90);
      const startY = isMobile ? rand(18, 82) : rand(-10, 95);

      return {
        id: `game-${game.id}`,
        type: "game",
        game,
        x: startX,
        y: startY,
        vx: rand(0.02, 0.045) * (Math.random() > 0.5 ? 1 : -1),
        vy: rand(0.02, 0.045) * (Math.random() > 0.5 ? 1 : -1),
        sizeW: isMobile ? rand(30, 36) : rand(44, 58),
        sizeH: isMobile ? rand(30, 38) : rand(44, 58),
        rotation: rand(-15, 15),
        rotationSpeed: rand(-0.015, 0.015),
        hitAt: null,
        respawnAt: null,
      };
    });

    let zone1Count = 0;
    let zone2Count = 0;

    // Generate Sci-Fi Word Capsule items
    const N = activeWords.length;
    const wordItems: FloatingItem[] = activeWords.map((w, idx) => {
      const zone = idx < N / 2 ? 1 : 2;

      let startX = 0;
      let startY = 0;
      let rotation = 0;
      if (zone === 1) {
        // Zone 1: Top-Left
        const idxInZone = zone1Count++;
        startX = isMobile ? 8 + idxInZone * 2.5 : 8;
        startY = isMobile ? 12 + idxInZone * 10 : 12 + idxInZone * 8;
        rotation = 0;
      } else {
        // Zone 2: Bottom-Right
        const idxInZone = zone2Count++;
        startX = isMobile ? 92 - idxInZone * 2.5 : 92;
        startY = isMobile ? 62 + idxInZone * 10 : 82 + idxInZone * 8;
        rotation = 0;
      }

      const width = isMobile
        ? w.text.length * 4.8 + 24
        : w.text.length * 6.5 + 46;

      return {
        id: `word-${idx}`,
        type: "word",
        wordText: w.text,
        wordStyle: w.style as "outline" | "glassy",
        wordDotColor: w.dot,
        wordZone: zone,
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        sizeW: width,
        sizeH: isMobile ? 22 : 30,
        rotation,
        rotationSpeed: 0,
        hitAt: null,
        respawnAt: null,
      };
    });

    itemsRef.current = [...gameItems, ...wordItems];
    setItems(itemsRef.current.map((item) => ({ ...item })));
  }, [games, customFloatingGames, customFloatingWords, isMobile]);

  /* ---------- Animation loop ---------- */
  useEffect(() => {
    if (!active) return;
    let running = true;

    const tick = () => {
      if (!running) return;
      const now = Date.now();

      // Bounds check: tight concentric ring bounds on mobile, wide screens on PC
      const minX = isMobile ? 18 : -10;
      const maxX = isMobile ? 82 : 110;
      const minY = isMobile ? 18 : -20;
      const maxY = isMobile ? 82 : 110;

      // 1. Update Physics States & Direct DOM Styling
      itemsRef.current.forEach((logo) => {
        // Hit state: wait 700ms then respawn
        if (logo.hitAt !== null) {
          if (now - logo.hitAt > 700) {
            if (logo.type === "game") {
              logo.x = isMobile ? rand(18, 82) : 50;
              logo.y = isMobile ? rand(18, 82) : 50;
              const ejectAngle = rand(0, Math.PI * 2);
              const ejectSpeed = isMobile ? rand(0.015, 0.03) : rand(0.04, 0.07);
              logo.vx = Math.cos(ejectAngle) * ejectSpeed;
              logo.vy = Math.sin(ejectAngle) * ejectSpeed;
            }
            logo.hitAt = null;
            logo.respawnAt = now;
          }
        } else {
          // Physics movement for active game elements
          if (logo.type === "game") {
            logo.x += logo.vx;
            logo.y += logo.vy;
            logo.rotation += logo.rotationSpeed;

            // Soft organic steering forces
            logo.vx += rand(-0.0005, 0.0005);
            logo.vy += rand(-0.0005, 0.0005);

            const speed = Math.sqrt(logo.vx * logo.vx + logo.vy * logo.vy);
            const maxSpeed = 0.09;
            const minSpeed = 0.02;
            if (speed > maxSpeed) {
              logo.vx = (logo.vx / speed) * maxSpeed;
              logo.vy = (logo.vy / speed) * maxSpeed;
            } else if (speed < minSpeed) {
              logo.vx = (logo.vx / speed) * minSpeed;
              logo.vy = (logo.vy / speed) * minSpeed;
            }

            // Soft boundaries bounce
            if (logo.x < minX) {
              logo.x = minX;
              logo.vx = Math.abs(logo.vx) * 0.8;
            } else if (logo.x > maxX) {
              logo.x = maxX;
              logo.vx = -Math.abs(logo.vx) * 0.8;
            }

            if (logo.y < minY) {
              logo.y = minY;
              logo.vy = Math.abs(logo.vy) * 0.8;
            } else if (logo.y > maxY) {
              logo.y = maxY;
              logo.vy = -Math.abs(logo.vy) * 0.8;
            }
          }
        }

        // Respawn timer cleanup
        if (logo.respawnAt !== null) {
          if (now - logo.respawnAt > 900) {
            logo.respawnAt = null;
          }
        }

        // Compute direct inline style values
        const isHit = logo.hitAt !== null;
        const isRespawning = logo.respawnAt !== null;
        const respawnProgress = isRespawning
          ? Math.min(1, (now - logo.respawnAt!) / 900)
          : 1;
        const easedProgress = isRespawning
          ? 1 - Math.pow(1 - respawnProgress, 3)
          : 1;

        const inRobotZone = logo.type === "game" && logo.x > 32 && logo.x < 68 && logo.y > 18 && logo.y < 92;
        const robotZoneOpacity = inRobotZone ? 0 : 1;

        const scale = isHit ? 0 : isRespawning ? easedProgress * 0.85 + 0.15 : 1;
        const opacity = isHit ? 0 : 0.9 * easedProgress * robotZoneOpacity;
        const pointerEvents = (isHit || inRobotZone) ? "none" : "auto";

        const el = domRefs.current[logo.id];
        if (el) {
          el.style.left = `${logo.x}%`;
          el.style.top = `${logo.y}%`;
          el.style.transform = `translate(-50%, -50%) rotate(${logo.rotation}deg) scale(${scale})`;
          el.style.opacity = opacity.toString();
          el.style.pointerEvents = pointerEvents;
        }
      });

      // 2. Update Particles array
      const lifeDecay = isMobile ? 0.05 : 0.03;
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + (isMobile ? 0.1 : 0.18), // slight gravity
          life: p.life - lifeDecay,
        }))
        .filter((p) => p.life > 0);

      // 3. Render Particles on high-fidelity `<canvas>` with device pixel scaling
      const canvas = canvasRef.current;
      if (canvas && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);

        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          canvas.style.width = `${w}px`;
          canvas.style.height = `${h}px`;
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.scale(dpr, dpr);
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, w, h);
          particlesRef.current.forEach((p) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            // Draw a high-tech neon glowing aura around the particle
            ctx.shadowBlur = p.size * 3.5;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.restore();
          });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile, active]);

  /* ---------- Click Shoot handler ---------- */
  const handleShoot = useCallback((logoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const logo = itemsRef.current.find((l) => l.id === logoId);
    if (!logo || logo.hitAt !== null) return;

    logo.hitAt = Date.now();

    // Spawn burst particles at click coordinates
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    particlesRef.current.push(...spawnParticles(cx, cy, isMobile));
  }, [isMobile]);

  /* ---------- Touch Shoot Event Listeners (Prevent Passive Listener Warnings) ---------- */
  useEffect(() => {
    const activeItems = items;
    const currentDomRefs = domRefs.current;
    const handlers: { [id: string]: (e: TouchEvent) => void } = {};

    activeItems.forEach((logo) => {
      const el = currentDomRefs[logo.id];
      if (!el) return;

      const btn = el.querySelector("button");
      if (!btn) return;

      const handler = (e: TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();

        const logoItem = itemsRef.current.find((l) => l.id === logo.id);
        if (!logoItem || logoItem.hitAt !== null) return;

        logoItem.hitAt = Date.now();

        // Get touch coordinates
        const touch = e.touches[0];
        const cx = touch.clientX - rect.left;
        const cy = touch.clientY - rect.top;
        particlesRef.current.push(...spawnParticles(cx, cy, isMobile));
      };

      handlers[logo.id] = handler;
      btn.addEventListener("touchstart", handler, { passive: false });
    });

    return () => {
      activeItems.forEach((logo) => {
        const el = currentDomRefs[logo.id];
        if (!el) return;
        const btn = el.querySelector("button");
        const handler = handlers[logo.id];
        if (btn && handler) {
          btn.removeEventListener("touchstart", handler);
        }
      });
    };
  }, [items, isMobile]);

  if (customFloatingGames.length === 0 && DEFAULT_FLOATING_GAMES.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 15 }}
      aria-hidden="true"
    >
      {/* High-fidelity graphics canvas for particle explosion drawing */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
        style={{ zIndex: 10 }}
      />

      {/* Floating items container */}
      {items.map((logo) => {
        const inRobotZone = logo.type === "game" && logo.x > 32 && logo.x < 68 && logo.y > 18 && logo.y < 92;
        const robotZoneOpacity = inRobotZone ? 0 : 1;
        const initialOpacity = 0.9 * robotZoneOpacity;
        const initialPointerEvents = inRobotZone ? "none" : "auto";

        return (
          <div
            key={logo.id}
            ref={(el) => {
              domRefs.current[logo.id] = el;
            }}
            className="absolute"
            style={{
              left: `${logo.x}%`,
              top: `${logo.y}%`,
              transform: `translate(-50%, -50%) rotate(${logo.rotation}deg) scale(1)`,
              opacity: initialOpacity,
              width: logo.sizeW,
              height: logo.sizeH,
              pointerEvents: initialPointerEvents,
              transition: "none", // Prevent CSS transitions from fighting the direct DOM frame updates
            }}
          >
            {logo.type === "word" ? (
              /* High-Tech Sci-Fi Text Badge matching Spline UI capsules */
              <button
                onClick={(e) => handleShoot(logo.id, e)}
                className="relative w-full h-full rounded-full flex items-center justify-center px-2.5 sm:px-4 font-mono font-black tracking-[0.16em] sm:tracking-[0.24em] text-[7px] sm:text-[9px] uppercase cursor-crosshair group select-none transition-all duration-300"
                style={
                  logo.wordStyle === "glassy"
                    ? {
                      background: "rgba(10, 10, 10, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      boxShadow: `
                          0 0 16px rgba(255,255,255,0.03),
                          0 4px 12px rgba(0,0,0,0.35),
                          inset 0 1px 4px rgba(255,255,255,0.12)
                        `,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "#e5e5e5",
                      borderRadius: "9999px",
                    }
                    : {
                      background: "rgba(255, 0, 51, 0.05)",
                      border: "1px solid rgba(255, 0, 51, 0.45)",
                      boxShadow: `
                          0 0 16px rgba(255,0,51,0.12),
                          inset 0 0 8px rgba(255,0,51,0.03)
                        `,
                      color: "#ff2d55",
                      textShadow: "0 0 6px rgba(255, 45, 85, 0.4)",
                      borderRadius: "9999px",
                    }
                }
                aria-label={`Shoot ${logo.wordText}`}
              >
                {/* Glowing status indicator dot inside Glassy Badge */}
                {logo.wordStyle === "glassy" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full mr-2 shrink-0 animate-pulse"
                    style={{
                      backgroundColor: logo.wordDotColor || "#ff0033",
                      boxShadow: `0 0 8px ${logo.wordDotColor || "#ff0033"}`,
                    }}
                  />
                )}

                <span className="leading-none">{logo.wordText}</span>

                {/* Hover glow outline ring */}
                <span
                  className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{
                    border: logo.wordStyle === "glassy"
                      ? "1px solid rgba(255,255,255,0.4)"
                      : "1px solid rgba(255,0,51,0.7)",
                    boxShadow: logo.wordStyle === "glassy"
                      ? "0 0 12px rgba(255,255,255,0.25)"
                      : "0 0 12px rgba(255,0,51,0.4)",
                  }}
                />

                {/* Target crosshair SVG centered on hover */}
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 22 22"
                    fill="none"
                    className="drop-shadow-[0_0_6px_rgba(255,0,51,0.9)]"
                  >
                    <circle cx="11" cy="11" r="9" stroke="#ff0033" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                    <line x1="11" y1="1" x2="11" y2="5" stroke="#ff0033" strokeWidth="1.5" />
                    <line x1="11" y1="17" x2="11" y2="21" stroke="#ff0033" strokeWidth="1.5" />
                    <line x1="1" y1="11" x2="5" y2="11" stroke="#ff0033" strokeWidth="1.5" />
                    <line x1="17" y1="11" x2="21" y2="11" stroke="#ff0033" strokeWidth="1.5" />
                  </svg>
                </span>
              </button>
            ) : (
              /* Glassy Ball Game Logo */
              <button
                onClick={(e) => handleShoot(logo.id, e)}
                className="relative w-full h-full rounded-full cursor-crosshair group animate-pulse-slow"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.2), rgba(255,0,51,0.06) 50%, rgba(0,0,0,0.2) 100%)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  boxShadow: `
                    0 0 24px rgba(255,0,51,0.25),
                    0 4px 16px rgba(0,0,0,0.15),
                    inset 0 -4px 14px rgba(0,0,0,0.25),
                    inset 0 2px 10px rgba(255,255,255,0.15)
                  `,
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
                aria-label={`Shoot ${logo.game?.name}`}
              >
                {/* Glass highlight arc */}
                <span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    top: "8%",
                    left: "18%",
                    width: "45%",
                    height: "28%",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 100%)",
                    borderRadius: "50%",
                    filter: "blur(1px)",
                  }}
                />

                {/* Logo image centered inside the ball */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.game?.logoUrl}
                  alt={logo.game?.name}
                  className="absolute rounded-full object-cover"
                  style={{
                    top: "15%",
                    left: "15%",
                    width: "70%",
                    height: "70%",
                    filter: "drop-shadow(0 0 6px rgba(255,0,51,0.35))",
                  }}
                  draggable={false}
                />

                {/* Hover glow ring */}
                <span
                  className="absolute -inset-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{
                    border: "2px solid rgba(255,0,51,0.5)",
                    boxShadow:
                      "0 0 20px rgba(255,0,51,0.5), inset 0 0 14px rgba(255,0,51,0.12)",
                  }}
                />

                {/* Crosshair on hover */}
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    className="drop-shadow-[0_0_6px_rgba(255,0,51,0.9)]"
                  >
                    <circle cx="11" cy="11" r="9" stroke="#ff0033" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                    <line x1="11" y1="17" x2="11" y2="21" stroke="#ff0033" strokeWidth="1.5" />
                    <line x1="1" y1="11" x2="5" y2="11" stroke="#ff0033" strokeWidth="1.5" />
                    <line x1="17" y1="11" x2="21" y2="11" stroke="#ff0033" strokeWidth="1.5" />
                    <circle cx="11" cy="11" r="2" fill="#ff0033" opacity="0.6" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
