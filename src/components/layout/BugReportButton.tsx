"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Bug, CheckCircle2, Send, X, ChevronRight } from "lucide-react";
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

  // Collapsed state for sliding the bug button off-screen
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobileRef = useRef(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    const checkMobile = () => window.innerWidth < 1024;
    isMobileRef.current = checkMobile();

    try {
      const saved = window.localStorage.getItem("jff:bug-collapsed");
      if (saved === "true") {
        setIsCollapsed(true);
      } else if (saved === "false") {
        setIsCollapsed(false);
      } else {
        // No saved preference: default to collapsed on mobile, expanded on desktop
        setIsCollapsed(isMobileRef.current);
      }
    } catch {
      setIsCollapsed(isMobileRef.current);
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
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleButtonClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      try {
        window.localStorage.setItem("jff:bug-collapsed", "false");
      } catch {}
    } else {
      setOpen(true);
    }
  };

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
      <div 
        className={`fixed bottom-24 lg:bottom-4 z-[90] group flex items-center scale-90 origin-bottom-right sm:scale-100 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isCollapsed
            ? "right-0 translate-x-[36px] opacity-75 hover:opacity-100 hover:translate-x-[24px]"
            : "right-1 lg:right-8 translate-x-0"
        }`}
      >
        {!isCollapsed && (
          <div className="pointer-events-none absolute bottom-full right-0 mb-3 translate-y-1 whitespace-nowrap rounded-full border border-white/10 bg-[#0a0a0a]/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white opacity-0 shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            Report a bug
            <span className="absolute right-5 top-full h-2 w-2 -translate-y-1 rotate-45 border-b border-r border-white/10 bg-[#0a0a0a]/95" />
          </div>
        )}

        {isCollapsed && (
          <div className="pointer-events-none absolute right-full mr-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 bg-[#0a0a0a]/95 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap hidden lg:block z-50">
            Expand Bug Tracker
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#0a0a0a]" />
          </div>
        )}

        <button
          type="button"
          onClick={handleButtonClick}
          className={`flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#0a0a0a]/90 text-white shadow-[0_0_24px_rgba(255,0,51,0.35),0_14px_32px_rgba(0,0,0,0.4)] backdrop-blur transition hover:scale-105 hover:border-[#ff0033]/70 hover:bg-[#ff0033] focus:outline-none focus:ring-2 focus:ring-[#ff0033]/50 cursor-pointer ${
            isCollapsed ? "shadow-[0_0_15px_rgba(255,0,51,0.4)] border border-[#ff0033]/30" : ""
          }`}
          aria-label={isCollapsed ? "Show bug button" : "Report a bug"}
        >
          <Bug size={22} />
        </button>

        {/* Slide/Hide Toggle Handle (Only visible on hover when expanded, placed just outside the right edge of the bug button) */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(true);
              try {
                window.localStorage.setItem("jff:bug-collapsed", "true");
              } catch {}
            }}
            className="absolute right-full mr-1.5 lg:right-[-26px] lg:mr-0 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a]/95 text-neutral-400 hover:text-white hover:border-[#ff0033]/30 hover:bg-[#ff0033]/20 transition-all duration-300 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100 z-50 cursor-pointer shadow-sm group/collapse"
            aria-label="Hide bug button"
          >
            <ChevronRight size={10} />
            <span className="pointer-events-none absolute left-full ml-2 scale-90 opacity-0 transition-all group-hover/collapse:scale-100 group-hover/collapse:opacity-100 bg-[#0a0a0a] border border-white/10 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg whitespace-nowrap hidden lg:block">
              Collapse Bug Tracker
            </span>
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="auth-surface relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c0c] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.65)] sm:max-h-[calc(100dvh-2rem)] sm:p-6">
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
              <h2 className="font-display text-xl font-black uppercase text-white sm:text-2xl">
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
