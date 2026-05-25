"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <RobotPlaceholder />,
});

/** Built-in default. Overridden at runtime by Hero passing the value from
 *  the `hero.splineScene` SiteSetting row, so admins can swap the model
 *  without a redeploy. The default keeps the site working on a fresh DB. */
const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

interface SplineRobotProps {
  /** Spline scene URL ending in `.splinecode`. Falls back to the built-in
   *  default when undefined/empty. */
  scene?: string;
  className?: string;
  /** Extra delay (ms) after idle before mounting. Defaults to 400. */
  delay?: number;
}

type IdleHandle = number;
type WindowWithIdle = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => IdleHandle;
  cancelIdleCallback?: (h: IdleHandle) => void;
};

export const SplineRobot = ({
  scene,
  className = "",
  delay = 400,
}: SplineRobotProps) => {
  // Treat empty string and undefined identically — both fall back to default.
  const resolvedScene = scene && scene.trim() ? scene : ROBOT_SCENE;
  // 3-step gating to keep the page snappy:
  //   1. inView  — true once the robot container actually scrolls into view
  //   2. mountScene — true once we've also waited for idle + delay after #1
  // The user can never see Spline before #1 anyway, so loading the ~3MB
  // WebGL bundle before that is wasted bandwidth + a parser stall.
  const [inView, setInView] = useState(false);
  const [mountScene, setMountScene] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver: trip `inView` the first time the container
  // enters the viewport (with 200px margin so it warms up just before
  // it's actually visible). Then disconnect — we don't need to track
  // exits, the iframe stays mounted once shown.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") {
      // Old browser fallback — skip the gating, treat as in view immediately.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (typeof window === "undefined") return;
    const w = window as WindowWithIdle;

    // Skip on truly low-memory devices — Spline can crash there.
    const lowMem =
      "deviceMemory" in navigator &&
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory! < 2;
    if (lowMem) return;

    // Mobile gets a longer mount delay so the rest of the page is interactive
    // before the WebGL scene kicks in.
    const isSmall = window.matchMedia("(max-width: 640px)").matches;
    const mountDelay = isSmall ? delay + 800 : delay;

    let idleHandle: IdleHandle | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timeoutHandle = setTimeout(() => setMountScene(true), mountDelay);
    };

    if (typeof w.requestIdleCallback === "function") {
      idleHandle = w.requestIdleCallback(schedule, { timeout: 2500 });
    } else {
      // Fallback: wait for first paint + delay
      timeoutHandle = setTimeout(() => setMountScene(true), mountDelay + 600);
    }

    return () => {
      if (idleHandle !== null && w.cancelIdleCallback)
        w.cancelIdleCallback(idleHandle);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [delay, inView]);

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      {/* Placeholder is always rendered underneath. Once Spline loads,
          it fades in on top — placeholder fades out via opacity. */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      >
        <RobotPlaceholder />
      </div>

      {mountScene && (
        <Suspense fallback={null}>
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          >
            <Spline scene={resolvedScene} onLoad={() => setLoaded(true)} />
          </div>
        </Suspense>
      )}
    </div>
  );
};

const RobotPlaceholder = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="relative">
      <div className="h-32 w-32 animate-spin rounded-full border-4 border-[#ff0033]/20 border-t-[#ff0033]" />
      <div className="absolute inset-0 flex items-center justify-center text-4xl">🤖</div>
    </div>
  </div>
);
