"use client";

import React, { useState } from "react";
import { Mail, Lock, User, X, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "signup" | "recover">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        if (error) throw error;
        setSuccess("Success! Please check your email for the confirmation link.");
      } else {
        // Recovery
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) throw error;
        setSuccess("Password reset link has been sent to your email.");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred during authentication.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md animate-[float_0.3s_ease-out]">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative z-10 text-center mb-6">
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            {mode === "login" && "Welcome Back! 🎮"}
            {mode === "signup" && "Join the Adventure! ✨"}
            {mode === "recover" && "Reset Password 🔑"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {mode === "login" && "Login to continue your gaming journey"}
            {mode === "signup" && "Create your account and start gaming"}
            {mode === "recover" && "We'll send you a password recovery link"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              <span>{success}</span>
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {mode !== "recover" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("recover")}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl py-3 font-semibold text-sm hover:from-violet-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : mode === "login" ? "Login" : mode === "signup" ? "Sign Up" : "Send Reset Link"}
          </button>
        </form>

        <div className="relative z-10 text-center mt-6 text-xs text-slate-400">
          {mode === "login" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-cyan-400 font-bold hover:underline transition-all"
              >
                Sign Up
              </button>
            </p>
          ) : mode === "signup" ? (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-cyan-400 font-bold hover:underline transition-all"
              >
                Login
              </button>
            </p>
          ) : (
            <button
              onClick={() => setMode("login")}
              className="text-cyan-400 font-bold hover:underline transition-all"
            >
              ← Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
