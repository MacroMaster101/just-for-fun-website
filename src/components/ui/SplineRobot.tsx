"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <RobotPlaceholder />,
});

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

interface SplineRobotProps {
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
  scene = ROBOT_SCENE,
  className = "",
  delay = 400,
}: SplineRobotProps) => {
  const [mountScene, setMountScene] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Skip the 3D scene entirely on very small viewports or low-end devices.
    if (typeof window === "undefined") return;
    const w = window as WindowWithIdle;
    const isSmall = window.matchMedia("(max-width: 640px)").matches;
    const lowMem =
      "deviceMemory" in navigator &&
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory! < 4;
    if (isSmall || lowMem) return;

    let idleHandle: IdleHandle | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timeoutHandle = setTimeout(() => setMountScene(true), delay);
    };

    if (typeof w.requestIdleCallback === "function") {
      idleHandle = w.requestIdleCallback(schedule, { timeout: 2000 });
    } else {
      // Fallback: wait for first paint + delay
      timeoutHandle = setTimeout(() => setMountScene(true), delay + 600);
    }

    return () => {
      if (idleHandle !== null && w.cancelIdleCallback)
        w.cancelIdleCallback(idleHandle);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    };
  }, [delay]);

  return (
    <div className={`relative h-full w-full ${className}`}>
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
            <Spline scene={scene} onLoad={() => setLoaded(true)} />
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
