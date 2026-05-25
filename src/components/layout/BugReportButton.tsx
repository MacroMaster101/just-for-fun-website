"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Bug, CheckCircle2, Send, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

type SubmitState = "idle" | "sending" | "sent" | "error";

export const BugReportButton = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const userName = useMemo(
    () =>
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined) ||
      user?.email?.split("@")[0] ||
      "",
    [user]
  );

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const body = document.body;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setStatus("idle");
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;

    const name = user ? userName || "Logged-in user" : guestName.trim() || "Anonymous";
    const email = user?.email || guestEmail.trim();

    if (!email) {
      setError("Add an email so we can follow up if we need more info.");
      return;
    }

    setStatus("sending");
    setError(null);

    const pageUrl = typeof window !== "undefined" ? window.location.href : "Unknown page";
    const message = [
      "[BUG REPORT]",
      `Summary: ${summary.trim()}`,
      "",
      details.trim(),
      "",
      `Page: ${pageUrl}`,
      `Browser: ${typeof navigator !== "undefined" ? navigator.userAgent : "Unknown"}`,
      `Reporter: ${user ? "Logged in" : "Guest"}`,
    ].join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send bug report.");

      setStatus("sent");
      setSummary("");
      setDetails("");
      if (!user) {
        setGuestName("");
        setGuestEmail("");
      }
      setTimeout(() => close(), 1800);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send bug report.");
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[90] group">
        <div className="pointer-events-none absolute bottom-full right-0 mb-3 translate-y-1 whitespace-nowrap rounded-full border border-white/10 bg-[#0a0a0a]/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white opacity-0 shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          Report a bug
          <span className="absolute right-5 top-full h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-white/10 bg-[#0a0a0a]/95" />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#0a0a0a]/90 text-white shadow-[0_0_24px_rgba(255,0,51,0.35),0_14px_32px_rgba(0,0,0,0.4)] backdrop-blur transition hover:scale-105 hover:border-[#ff0033]/70 hover:bg-[#ff0033] focus:outline-none focus:ring-2 focus:ring-[#ff0033]/50"
          aria-label="Report a bug"
        >
          <Bug size={22} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="auth-surface relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
            <button
              type="button"
              onClick={close}
              className="video-modal-close absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0a0a0a] text-white transition hover:bg-[#ff0033]"
              aria-label="Close bug report"
            >
              <X size={17} />
            </button>

            <div className="mb-5 pr-12">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#ff0033]/35 bg-[#ff0033]/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#ff4b5f]">
                <Bug size={13} /> Bug Report
              </div>
              <h2 className="font-display text-2xl font-black uppercase text-white">
                Found Something Broken?
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Send the issue straight to the admin inbox with the current page attached.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!user && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Name"
                    placeholder="Anonymous"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                  <Input
                    label="Email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
              )}

              <Input
                label="Quick Summary"
                required
                placeholder="Example: video modal won't close"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />

              <Textarea
                label="What Happened?"
                required
                placeholder="Tell us what you clicked, what you expected, and what went wrong."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="min-h-[150px]"
              />

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-950/40 p-3 text-xs text-rose-300">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {status === "sent" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>Bug report sent. Thank you.</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={status === "sending" || status === "sent"}
                fullWidth
                glow
                className="gap-2 py-3"
              >
                {status === "sending" ? "Sending..." : "Send Bug Report"}
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
