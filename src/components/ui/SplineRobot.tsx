"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <RobotPlaceholder />,
});

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

interface SplineRobotProps {
  scene?: string;
  className?: string;
}

export const SplineRobot = ({ scene = ROBOT_SCENE, className = "" }: SplineRobotProps) => {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Suspense fallback={<RobotPlaceholder />}>
        <Spline scene={scene} />
      </Suspense>
      {/* Hide Spline watermark logo */}
      <div className="absolute bottom-3 right-3 h-12 w-40 bg-[#0a0a0a]" aria-hidden />
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
