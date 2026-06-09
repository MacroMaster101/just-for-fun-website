import Link from "next/link";
import { Home, Ghost } from "lucide-react";

/**
 * 404 page. Rendered for any unmatched route. Styled to match the J4FN
 * dark/red theme so a mistyped URL doesn't drop the user onto Next's
 * default bare page.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#ff0033]/30 bg-[#ff0033]/10 text-[#ff4b5f]">
        <Ghost size={28} />
      </div>
      <p className="font-display text-6xl font-black tracking-tight text-white sm:text-8xl">
        404
      </p>
      <h1 className="mt-2 font-display text-lg font-extrabold uppercase tracking-[0.2em] text-[#ff4b5f]">
        Signal Lost
      </h1>
      <p className="mt-3 max-w-md text-sm text-neutral-400">
        This sector doesn&apos;t exist on the J4FN grid. The page may have been
        moved, deleted, or never deployed.
      </p>
      <Link
        href="/"
        className="mt-8 flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(255,0,51,0.35)] transition hover:shadow-[0_0_28px_rgba(255,0,51,0.55)]"
      >
        <Home size={15} /> Return to base
      </Link>
    </main>
  );
}
