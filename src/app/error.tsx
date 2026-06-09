"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

/**
 * Route-level error boundary. Catches render/runtime errors thrown by any
 * page or component below the root layout and shows a recoverable fallback
 * instead of a blank screen. The layout (fonts, providers) stays mounted.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to monitoring; stripped from prod console by removeConsole.
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#ff0033]/30 bg-[#ff0033]/10 text-[#ff4b5f]">
        <AlertTriangle size={28} />
      </div>
      <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
        Something glitched
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-400">
        An unexpected error knocked this section offline. Try reloading — if it
        keeps happening, head back to base.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-neutral-600">
          Ref: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(255,0,51,0.35)] transition hover:shadow-[0_0_28px_rgba(255,0,51,0.55)]"
        >
          <RotateCcw size={15} /> Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-neutral-300 transition hover:border-white/20 hover:text-white"
        >
          <Home size={15} /> Home
        </Link>
      </div>
    </main>
  );
}
