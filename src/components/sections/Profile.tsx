"use client";

import React, { useState } from "react";
import { Trophy, Heart, Video, Edit2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface ProfileFormProps {
  user: User;
}

const ProfileForm = ({ user }: ProfileFormProps) => {
  const [name, setName] = useState(user.user_metadata?.name || "");
  const [bio, setBio] = useState(user.user_metadata?.bio || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update Supabase User Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name,
          bio,
          avatarUrl: user.user_metadata?.avatarUrl || "",
        },
      });

      if (authError) throw authError;

      // 2. Update PostgreSQL Database
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name,
          bio,
          avatarUrl: user.user_metadata?.avatarUrl || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to sync to database.");

      setSuccess("Profile saved and synchronized successfully!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <section id="profile" className="relative py-24 bg-[#060606] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-red-600/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-red-500">👤</span> User Profile
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Manage your gaming channel account and profile info
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Left Column: Avatar & Metadata */}
          <div className="lg:col-span-5 space-y-6 animate-fade-in-up">
            <Card className="p-8 border border-white/5 bg-[#111111]/40 backdrop-blur-sm flex flex-col items-center text-center space-y-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-white text-3xl font-display font-black shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                  {name ? name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="space-y-1.5 w-full">
                <h3 className="font-display font-bold text-white text-lg truncate">
                  {name || user.email?.split("@")[0]}
                </h3>
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  Member Since: {memberSince}
                </p>
              </div>

              {/* Achievements details */}
              <div className="w-full grid grid-cols-3 gap-2 border-t border-white/5 pt-6 text-center">
                <div className="space-y-1">
                  <div className="text-red-400 flex justify-center">
                    <Video size={16} />
                  </div>
                  <div className="text-white font-black text-sm">12</div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
                    Watched
                  </div>
                </div>

                <div className="space-y-1 border-x border-white/5">
                  <div className="text-orange-400 flex justify-center">
                    <Heart size={16} />
                  </div>
                  <div className="text-white font-black text-sm">4</div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
                    Favorites
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-amber-500 flex justify-center">
                    <Trophy size={16} />
                  </div>
                  <div className="text-white font-black text-sm">Pro</div>
                  <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">
                    Rank
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="lg:col-span-7">
            <Card className="p-8 border border-white/10 bg-[#111111]/60 backdrop-blur-md">
              <form onSubmit={handleSave} className="space-y-5">
                <h3 className="font-display font-bold text-white text-base tracking-wide flex items-center gap-2">
                  <Edit2 size={16} className="text-red-500" /> Edit Profile Details
                </h3>

                {success && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-xs text-emerald-300">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-950/40 border border-red-500/20 p-4 text-xs text-red-300">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Input
                  label="Display Username"
                  required
                  placeholder="Enter username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Textarea
                  label="Bio / Description"
                  placeholder="Tell us about yourself, your favorite games, rank, or playstyle..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                />
                <div className="text-right text-[10px] text-neutral-500 font-semibold">
                  {bio.length}/500 characters
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    glow
                    className="px-6 py-2.5 text-xs"
                  >
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Profile = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <ProfileForm user={user} />;
};
