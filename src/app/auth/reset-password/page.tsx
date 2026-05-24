"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Supabase puts the recovery token into the URL hash; the JS client
  // picks it up and creates a session. We just confirm a session exists.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      // Give the supabase client a tick to process the URL hash.
      await new Promise((r) => setTimeout(r, 50));
      const { data } = await supabase().auth.getSession();
      if (!cancelled) setHasSession(!!data.session);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/"), 1800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060606] px-4">
      <div className="auth-surface w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c0c] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff0033]/15 text-[#ff4b5f]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h1 className="font-display text-xl font-black uppercase tracking-wide text-white">
              Reset Password
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff2d55]">
              Set a new password
            </p>
          </div>
        </div>

        {hasSession === null ? (
          <p className="flex items-center gap-2 text-sm text-neutral-400">
            <Loader2 size={14} className="animate-spin" /> Verifying reset link...
          </p>
        ) : hasSession === false ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            This reset link is invalid or has expired. Request a new one from
            the sign-in screen.
          </p>
        ) : done ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            ✓ Password updated. Redirecting...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                New Password
              </span>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                Confirm Password
              </span>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  title={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_18px_rgba(255,0,51,0.4)] disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Updating
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
