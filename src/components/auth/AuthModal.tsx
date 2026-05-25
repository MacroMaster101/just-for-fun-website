"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Loader2, Mail, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  initialError?: string | null;
}

type Provider = "google" | "facebook" | "discord";
type AuthMode = "login" | "signup";

const RequirementRow = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-[11px] leading-tight">
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black transition-all ${
        met
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          : "bg-neutral-800 text-neutral-500 border border-neutral-700"
      }`}
    >
      {met ? "✓" : "○"}
    </span>
    <span className={`transition-colors ${met ? "text-neutral-300" : "text-neutral-500"}`}>
      {text}
    </span>
  </div>
);

export const AuthModal = ({
  isOpen,
  onClose,
  initialMode = "login",
  initialError = null,
}: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSignedUp, setIsSignedUp] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      setMode(initialMode);
      setError(initialError || null);
      setInfo(null);
      setShowPassword(false);
      setIsSignedUp(false);
      setEmail("");
      setPassword("");
      setName("");
      setRememberMe(true);
      setBusy(false);
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, initialMode, initialError]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const isEmailValid = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const getPasswordStrength = (pass: string) => {
    return {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      digit: /\d/.test(pass),
      special: /[@$!%*?&_#^+=()[\]{}|;:',.<>/?~-]/.test(pass),
    };
  };

  const strength = getPasswordStrength(password);
  const isPasswordStrong =
    strength.length &&
    strength.uppercase &&
    strength.lowercase &&
    strength.digit &&
    strength.special;

  const handleOAuth = async (provider: Provider) => {
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setBusy(false);
        setError(error.message);
      }
    } catch (err: unknown) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "An unexpected error occurred during OAuth sign in.");
      console.error("OAuth error:", err);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);

    if (!isEmailValid(email)) {
      setError("Please enter a valid email address.");
      setBusy(false);
      return;
    }

    try {
      const client = supabase();
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setError("Your email address is not verified yet. Please check your inbox for the confirmation link.");
          } else {
            setError(error.message);
          }
        } else {
          onClose();
        }
      } else {
        if (!isPasswordStrong) {
          setError("Password does not meet security standards.");
          setBusy(false);
          return;
        }

        const { error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { name: name || undefined },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setError(error.message);
        } else {
          setIsSignedUp(true);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      console.error("Email submit error:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setInfo("Magic link sent. Check your inbox.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred sending the magic link.");
      console.error("Magic link error:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email first, then click Forgot password.");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const { error } = await supabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) setError(error.message);
      else
        setInfo(
          "Password reset link sent. Check your inbox and follow the link to set a new password."
        );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred sending the reset link.");
      console.error("Forgot password error:", err);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="auth-surface relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {isSignedUp ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff0033]/15 text-[#ff4b5f] mb-4">
              <Mail size={30} className="animate-pulse" />
            </div>
            <h2 className="font-display text-2xl font-black uppercase tracking-wide text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-sm text-neutral-300 mb-6 max-w-xs leading-relaxed">
              We&apos;ve sent a verification link to <span className="font-bold text-white">{email}</span>. Please click the link to finish setting up your account.
            </p>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5 text-xs text-neutral-500 mb-6 text-left leading-relaxed">
              💡 <span className="font-bold text-neutral-400">Can&apos;t find the email?</span> Check your spam or promotions folder, or ensure the address was spelled correctly.
            </div>
            <button
              type="button"
              onClick={() => {
                setIsSignedUp(false);
                setMode("login");
                setPassword("");
              }}
              className="w-full rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_24px_rgba(255,0,51,0.4)] transition hover:shadow-[0_0_32px_rgba(255,0,51,0.6)]"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-display text-2xl font-black uppercase tracking-wide text-white">
                {mode === "login" ? "Welcome Back" : "Join the Crew"}
              </h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#ff2d55]">
                {mode === "login" ? "Sign in to your account" : "Create a free account"}
              </p>
            </div>

            {/* OAuth buttons & Divider */}
            <div className="grid gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleOAuth("google")}
                className="flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-neutral-100 disabled:opacity-60"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleOAuth("discord")}
                className="flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#5865f2] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#4752c4] disabled:opacity-60"
              >
                <DiscordIcon />
                Continue with Discord
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">
              <div className="h-px flex-1 bg-white/10" />
              or
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleEmailSubmit} className="grid gap-3">
              {mode === "signup" && (
                <label className="grid gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                    Display Name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
                  />
                </label>
              )}
              <label className="grid gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                  <span>Password</span>
                  {mode === "login" && (
                    <span className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleMagicLink}
                        className="flex items-center gap-1 text-[#ff4b5f] hover:text-[#ff0033]"
                      >
                        <Mail size={10} /> Magic Link
                      </button>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-[#ff4b5f] hover:text-[#ff0033]"
                      >
                        Forgot?
                      </button>
                    </span>
                  )}
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Create a strong password" : "Your password"}
                    className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

            {/* Remember Me Checkbox */}
            {mode === "login" && (
              <div className="flex items-center justify-between text-xs text-neutral-400 mt-1 select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/10 bg-[#0a0a0a] text-[#ff0033] focus:ring-[#ff0033] focus:ring-offset-0 h-4 w-4 accent-[#ff0033]"
                  />
                  Remember me
                </label>
              </div>
            )}

            {/* Password Validation Checklist */}
            {mode === "signup" && password.length > 0 && (
              <div className="mt-1 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
                <p className="mb-2 font-black uppercase tracking-wider text-neutral-400 text-[9px]">
                  Password Requirements
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <RequirementRow met={strength.length} text="At least 8 characters" />
                  <RequirementRow met={strength.uppercase} text="At least one uppercase letter (A-Z)" />
                  <RequirementRow met={strength.lowercase} text="At least one lowercase letter (a-z)" />
                  <RequirementRow met={strength.digit} text="At least one number (0-9)" />
                  <RequirementRow met={strength.special} text="At least one special character (e.g. @$!%*?&)" />
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || (mode === "signup" && !isPasswordStrong)}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_24px_rgba(255,0,51,0.4)] transition hover:shadow-[0_0_32px_rgba(255,0,51,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Please wait...
                </>
              ) : mode === "login" ? (
                "Log In"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-neutral-500">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-bold text-[#ff4b5f] hover:text-[#ff0033]"
            >
              {mode === "login" ? "Join to Sign Up" : "Log In"}
            </button>
          </p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
    />
  </svg>
);

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);
