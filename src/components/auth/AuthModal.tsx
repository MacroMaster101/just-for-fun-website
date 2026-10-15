"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/isValidEmail";
import { getPasswordStrength, isStrongPassword, PASSWORD_RULES } from "@/lib/passwordStrength";
import { useAuth } from "@/components/auth/AuthProvider";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
  initialError?: string | null;
}

type Provider = "google" | "facebook" | "discord";
type AuthMode = "login" | "signup";
// Forgot-password flow: email → code from the email → new password → done.
type ResetStep = "email" | "code" | "password" | "done";

// Supabase rate-limits reset emails per address (60s by default).
const RESEND_COOLDOWN_S = 60;

const RESET_STEPS: Record<Exclude<ResetStep, "done">, { n: number; label: string }> = {
  email: { n: 1, label: "Your email" },
  code: { n: 2, label: "Enter the code" },
  password: { n: 3, label: "New password" },
};

const inputClass =
  "rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none";
const primaryButtonClass =
  "mt-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0033] to-[#ff2d55] px-4 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_0_24px_rgba(255,0,51,0.4)] transition hover:shadow-[0_0_32px_rgba(255,0,51,0.6)] disabled:cursor-not-allowed disabled:opacity-60";
const labelTextClass = "text-[0.625rem] font-black uppercase tracking-[0.2em] text-neutral-500";

const RequirementRow = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-[0.6875rem] leading-tight">
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.5625rem] font-black transition-all ${
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

const PasswordChecklist = ({ password }: { password: string }) => {
  const strength = getPasswordStrength(password);
  return (
    <div className="mt-1 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
      <p className="mb-2 font-black uppercase tracking-wider text-neutral-400 text-[0.5625rem]">
        Password Requirements
      </p>
      <div className="grid grid-cols-1 gap-2">
        {PASSWORD_RULES.map(([key, text]) => (
          <RequirementRow key={key} met={strength[key]} text={text} />
        ))}
      </div>
    </div>
  );
};

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  autoComplete,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  show: boolean;
  onToggle: () => void;
}) => (
  <div className="relative">
    <input
      type={show ? "text" : "password"}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={`w-full ${inputClass} pr-10`}
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
      title={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
);

export const AuthModal = ({
  isOpen,
  onClose,
  initialMode = "login",
  initialError = null,
}: AuthModalProps) => {
  const { user } = useAuth();
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

  const [resetStep, setResetStep] = useState<ResetStep | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Auto-close the modal if the user is already logged in (e.g. after OAuth
  // success). Skipped during the reset flow: verifying the code signs the
  // user in, but they still need to choose a new password.
  useEffect(() => {
    if (isOpen && user && resetStep === null) {
      onClose();
    }
  }, [isOpen, user, resetStep, onClose]);

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
      setResetStep(null);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setResendIn(0);
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

  // Countdown for the "Resend code" button.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const isPasswordStrong = isStrongPassword(password);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleOAuth = async (provider: Provider) => {
    setBusy(true);
    setError(null);
    try {
      // Drop a sentinel so the bfcache guard knows to reload if the user
      // hits the browser back button from the OAuth provider page.
      sessionStorage.setItem("oauth_pending", "1");
      const { error } = await supabase().auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        sessionStorage.removeItem("oauth_pending");
        setBusy(false);
        setError(error.message);
      }
    } catch (err: unknown) {
      sessionStorage.removeItem("oauth_pending");
      setBusy(false);
      setError(err instanceof Error ? err.message : "An unexpected error occurred during OAuth sign in.");
      console.error("OAuth error:", err);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    resetMessages();

    if (!isValidEmail(email)) {
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

  // ---------- forgot password ----------

  const startReset = () => {
    resetMessages();
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetStep("email");
  };

  const exitReset = () => {
    resetMessages();
    setResetStep(null);
    setMode("login");
  };

  const sendResetCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    resetMessages();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      // The email also contains a link to /auth/reset-password as a backup.
      const { error } = await supabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      // Same message whether or not the address has an account, so the
      // form can't be used to check who is registered.
      setInfo(`If an account exists for ${email}, we've sent it a 6-digit code.`);
      setCode("");
      setResendIn(RESEND_COOLDOWN_S);
      setResetStep("code");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send the reset code. Please try again.");
      console.error("Reset code error:", err);
    } finally {
      setBusy(false);
    }
  };

  const verifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    const token = code.replace(/\s+/g, "");
    if (!/^\d{6,10}$/.test(token)) {
      setError("Enter the code from the email.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase().auth.verifyOtp({ email, token, type: "recovery" });
      if (error) {
        setError("That code is wrong or has expired. Check the latest email, or send a new code.");
        return;
      }
      setResetStep("password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not check the code. Please try again.");
      console.error("Verify code error:", err);
    } finally {
      setBusy(false);
    }
  };

  const saveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!isStrongPassword(newPassword)) {
      setError("Password does not meet security standards.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase().auth.updateUser({ password: newPassword });
      if (error) {
        setError(error.message);
        return;
      }
      setResetStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update your password. Please try again.");
      console.error("Update password error:", err);
    } finally {
      setBusy(false);
    }
  };

  const messages = (
    <>
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
    </>
  );

  const busyLabel = (
    <>
      <Loader2 size={16} className="animate-spin" />
      Please wait...
    </>
  );

  const renderReset = () => {
    if (resetStep === "done") {
      return (
        <div className="flex flex-col items-center text-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 mb-4">
            <CheckCircle2 size={30} />
          </div>
          <h2 className="font-display text-2xl font-black uppercase tracking-wide text-white mb-2">
            Password Updated
          </h2>
          <p className="text-sm text-neutral-300 mb-6 max-w-xs leading-relaxed">
            Your new password is saved and you&apos;re signed in. Use it next time you log in.
          </p>
          <button type="button" onClick={onClose} className={`w-full ${primaryButtonClass}`}>
            Continue
          </button>
        </div>
      );
    }

    const step = RESET_STEPS[resetStep as Exclude<ResetStep, "done">];
    return (
      <>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff0033]/15 text-[#ff4b5f]">
              <KeyRound size={20} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-black uppercase tracking-wide text-white">
                Reset Password
              </h2>
              <p className="mt-0.5 text-xs font-bold uppercase tracking-[0.2em] text-[#ff2d55]">
                Step {step.n} of 3 · {step.label}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1 rounded-full transition-colors ${n <= step.n ? "bg-[#ff0033]" : "bg-white/10"}`}
              />
            ))}
          </div>
        </div>

        {resetStep === "email" && (
          <form onSubmit={sendResetCode} className="grid gap-3">
            <p className="text-sm leading-relaxed text-neutral-400">
              Enter the email you signed up with and we&apos;ll send you a 6-digit code to reset your password.
            </p>
            <label className="grid gap-1.5">
              <span className={labelTextClass}>Email</span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>
            {messages}
            <button type="submit" disabled={busy} className={primaryButtonClass}>
              {busy ? busyLabel : "Send Code"}
            </button>
          </form>
        )}

        {resetStep === "code" && (
          <form onSubmit={verifyResetCode} className="grid gap-3">
            <p className="text-sm leading-relaxed text-neutral-400">
              Check <span className="font-bold text-white">{email}</span> for an email from Just For Fun
              and enter the code below. It expires in 1 hour.
            </p>
            <label className="grid gap-1.5">
              <span className={labelTextClass}>Code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={10}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className={`${inputClass} text-center font-mono text-xl tracking-[0.5em]`}
              />
            </label>
            {messages}
            <button type="submit" disabled={busy || code.length < 6} className={primaryButtonClass}>
              {busy ? busyLabel : "Verify Code"}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setResetStep("email");
                }}
                className="text-neutral-400 hover:text-white"
              >
                Use a different email
              </button>
              <button
                type="button"
                disabled={busy || resendIn > 0}
                onClick={() => sendResetCode()}
                className="font-bold text-[#ff4b5f] hover:text-[#ff0033] disabled:cursor-not-allowed disabled:text-neutral-600"
              >
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
            </div>
            <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-[0.6875rem] leading-relaxed text-neutral-500">
              Can&apos;t find it? Check spam or promotions. You can also tap the link in the email instead.
            </p>
          </form>
        )}

        {resetStep === "password" && (
          <form onSubmit={saveNewPassword} className="grid gap-3">
            <p className="text-sm leading-relaxed text-neutral-400">
              Code confirmed. Choose a new password for <span className="font-bold text-white">{email}</span>.
            </p>
            <label className="grid gap-1.5">
              <span className={labelTextClass}>New Password</span>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Create a strong password"
                autoComplete="new-password"
                show={showNewPassword}
                onToggle={() => setShowNewPassword(!showNewPassword)}
              />
            </label>
            <label className="grid gap-1.5">
              <span className={labelTextClass}>Confirm Password</span>
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter password"
                autoComplete="new-password"
                show={showNewPassword}
                onToggle={() => setShowNewPassword(!showNewPassword)}
              />
            </label>
            {newPassword.length > 0 && <PasswordChecklist password={newPassword} />}
            {messages}
            <button
              type="submit"
              disabled={busy || !isStrongPassword(newPassword) || newPassword !== confirmPassword}
              className={primaryButtonClass}
            >
              {busy ? busyLabel : "Save New Password"}
            </button>
          </form>
        )}

        {resetStep !== "password" && (
          <button
            type="button"
            onClick={exitReset}
            className="mt-5 flex w-full items-center justify-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white"
          >
            <ArrowLeft size={12} /> Back to sign in
          </button>
        )}
      </>
    );
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

        {resetStep !== null ? (
          renderReset()
        ) : isSignedUp ? (
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
              className={`w-full ${primaryButtonClass}`}
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

            <div className="my-5 flex items-center gap-3 text-[0.625rem] font-bold uppercase tracking-[0.3em] text-neutral-600">
              <div className="h-px flex-1 bg-white/10" />
              or
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleEmailSubmit} className="grid gap-3">
              {mode === "signup" && (
                <label className="grid gap-1.5">
                  <span className={labelTextClass}>Display Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className={inputClass}
                  />
                </label>
              )}
              <label className="grid gap-1.5">
                <span className={labelTextClass}>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5">
                <span className={`flex items-center justify-between ${labelTextClass}`}>
                  <span>Password</span>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={startReset}
                      className="text-[#ff4b5f] hover:text-[#ff0033]"
                    >
                      Forgot password?
                    </button>
                  )}
                </span>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === "signup" ? "Create a strong password" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />
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
            {mode === "signup" && password.length > 0 && <PasswordChecklist password={password} />}

            {messages}

            <button
              type="submit"
              disabled={busy || (mode === "signup" && !isPasswordStrong)}
              className={primaryButtonClass}
            >
              {busy ? busyLabel : mode === "login" ? "Log In" : "Sign Up"}
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
