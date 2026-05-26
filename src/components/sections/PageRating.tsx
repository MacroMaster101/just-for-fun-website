"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Sparkles,
  Lock,
  CheckCircle2,
  Trash2,
  Flag,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { resolveAvatarUrl } from "@/lib/avatar";

interface Rating {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  isFlagged: boolean;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface Stats {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

const formatRelativeTime = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const PageRating = () => {
  const { user } = useAuth();
  
  // API State
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<Stats>({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Form State
  const [ratingInput, setRatingInput] = useState(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // UI State
  const [visibleCount, setVisibleCount] = useState(6);

  // Toast Helper
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Fetch all ratings
  const fetchRatings = async (showSilently = false) => {
    if (!showSilently) setLoading(true);
    try {
      const res = await fetch("/api/ratings", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRatings(data.ratings || []);
      setStats(
        data.stats || {
          average: 0,
          total: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        }
      );
    } catch {
      showToast("Failed to load ratings. Please reload.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Find if logged-in user has already submitted a review
  const userReview = useMemo(() => {
    if (!user) return null;
    return ratings.find((r) => r.userId === user.id) || null;
  }, [ratings, user]);

  // Sync composer state with existing review when it mounts/updates
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (userReview) {
      setRatingInput(userReview.rating);
      setCommentInput(userReview.comment);
      setIsAnonymous(userReview.isAnonymous || false);
    } else {
      setRatingInput(5);
      setCommentInput("");
      setIsAnonymous(false);
    }
  }, [userReview]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Submit/Update review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rating: ratingInput, 
          comment: commentInput, 
          isAnonymous: isAnonymous 
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      showToast(userReview ? "Your review has been updated!" : "Thanks for rating the site!", "success");
      await fetchRatings(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user's own review
  const handleDelete = async () => {
    if (!user || !userReview) return;
    if (!confirm("Are you sure you want to withdraw your review?")) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/ratings", { method: "DELETE" });
      if (!res.ok) throw new Error();

      showToast("Review withdrawn successfully.", "info");
      setRatingInput(5);
      setCommentInput("");
      await fetchRatings(true);
    } catch {
      showToast("Failed to delete review. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Flag/Report a review
  const handleFlag = async (reviewId: string) => {
    if (!user) {
      showToast("Please sign in to report reviews.", "error");
      return;
    }
    if (!confirm("Report this review for inappropriate content or spam?")) return;

    setFlaggingId(reviewId);
    try {
      const res = await fetch("/api/ratings/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratingId: reviewId }),
      });
      if (!res.ok) throw new Error();

      showToast("Review reported for moderation. Thanks!", "success");
      await fetchRatings(true);
    } catch {
      showToast("Failed to report review.", "error");
    } finally {
      setFlaggingId(null);
    }
  };

  // Calculate percentage for distribution bars
  const getPercentage = (count: number) => {
    if (stats.total === 0) return 0;
    return Math.round((count / stats.total) * 100);
  };

  // Trigger Auth Modal open via global window event if available
  const triggerAuthModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-auth-modal"));
    }
  };

  const visibleRatings = useMemo(() => {
    return ratings.slice(0, visibleCount);
  }, [ratings, visibleCount]);

  return (
    <div className="relative z-10 mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-12 border-b border-white/5 pb-6">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-[#ff4b5f] flex items-center gap-2 mb-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#ff0033] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff0033]" />
          </span>
          Community Hub
        </p>
        <h2 className="flex flex-wrap items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          <Star
            size={28}
            className="text-[#ff0033] fill-[#ff0033]/20 drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]"
          />
          Page Ratings & Reviews
        </h2>
        <p className="text-neutral-400 text-xs sm:text-sm tracking-wider uppercase font-semibold mt-1">
          See what other enlisted operators say about our gaming space, and leave your own rating!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Aggregates & Composer */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Aggregate Stats Card */}
          <Card glow className="p-6 border-white/10">
            <div className="flex items-center gap-6">
              <div className="text-center shrink-0">
                <span className="block text-5xl font-black text-white leading-none drop-shadow-[0_0_15px_rgba(255,0,51,0.3)]">
                  {stats.average > 0 ? stats.average.toFixed(1) : "0.0"}
                </span>
                <div className="flex items-center justify-center gap-0.5 mt-2 text-[#ffb800]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={`${
                        i < Math.round(stats.average)
                          ? "fill-[#ffb800] text-[#ffb800]"
                          : "text-neutral-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="block text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-1.5">
                  {stats.total} Reviews
                </span>
              </div>

              <div className="flex-1 space-y-2 border-l border-white/5 pl-6">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = stats.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
                  const percent = getPercentage(count);
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-neutral-400 w-3 text-right">{stars}</span>
                      <Star size={11} className="text-[#ffb800] fill-[#ffb800] shrink-0" />
                      <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/[0.03]">
                        <div
                          className="h-full bg-gradient-to-r from-[#ff0033] to-[#ff4b5f] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,0,51,0.5)]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="font-mono text-neutral-500 text-[10px] w-8 text-right font-bold">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Composer Card */}
          <Card className="p-6 border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff0033]/5 to-transparent rounded-full -mr-8 -mt-8" />
            
            {!user ? (
              // Lock overlay for unauthenticated users
              <div className="relative text-center py-8 px-4 space-y-4">
                <div className="inline-flex p-3 rounded-full bg-[#ff0033]/10 border border-[#ff0033]/20 text-[#ff4b5f] animate-pulse">
                  <Lock size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                    Operator Access Restricted
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                    You must enlist in the J4FN squad or sign in to rate the website and share your review.
                  </p>
                </div>
                <Button
                  variant="outline"
                  glow
                  size="sm"
                  onClick={triggerAuthModal}
                  className="gap-2 mt-2"
                >
                  <Sparkles size={13} /> Sign In / Enlist Now
                </Button>
              </div>
            ) : (
              // Interactive Composer form
              <form onSubmit={handleSubmit} className="space-y-5 relative">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-[#ff4b5f]" />
                    {userReview ? "Modify Your Review" : "Rate the HQ"}
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {userReview
                      ? "Update your stars or review text below."
                      : "Select star count and write an optional review."}
                  </p>
                </div>

                {/* Rating Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                    Star Score
                  </label>
                  <div className="flex items-center gap-2 py-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starVal = i + 1;
                      const isLight = hoveredStar !== null ? starVal <= hoveredStar : starVal <= ratingInput;
                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => setHoveredStar(starVal)}
                          onMouseLeave={() => setHoveredStar(null)}
                          onClick={() => setRatingInput(starVal)}
                          className="p-1 rounded transition-all duration-200 active:scale-90 hover:scale-110 cursor-pointer"
                          aria-label={`Rate ${starVal} Stars`}
                        >
                          <Star
                            size={28}
                            strokeWidth={1.5}
                            className={`transition-all duration-300 ${
                              isLight
                                ? "text-[#ffb800] fill-[#ffb800] drop-shadow-[0_0_10px_rgba(255,184,0,0.65)] scale-110"
                                : "text-neutral-700 hover:text-neutral-400 fill-transparent"
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="font-mono text-xs font-black text-[#ffb800] ml-2">
                      {hoveredStar !== null ? hoveredStar : ratingInput} / 5
                    </span>
                  </div>
                </div>

                {/* Comment Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      Review Comment
                    </label>
                    <span className="font-mono text-[9px] text-neutral-500">
                      {commentInput.length} / 500
                    </span>
                  </div>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Write your review here... (Optional)"
                    className="w-full rounded-xl border border-white/10 bg-[#0c0c0c] px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30 resize-none font-semibold transition"
                  />
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#0c0c0c]/40 backdrop-blur-md relative overflow-hidden group select-none">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      🕵️ Anonymous Review
                    </span>
                    <span className="text-[8px] text-neutral-500 font-semibold normal-case">
                      Mask your profile details and generate a random JFF DiceBear avatar.
                    </span>
                  </div>
                  
                  {/* Cyber Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`relative w-9 h-5 rounded-full border transition-all duration-300 flex items-center p-0.5 cursor-pointer ${
                      isAnonymous 
                        ? "bg-[#ff0033]/20 border-[#ff0033] shadow-[0_0_10px_rgba(255,0,51,0.2)]" 
                        : "bg-neutral-900 border-white/10"
                    }`}
                  >
                    <div 
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                        isAnonymous 
                          ? "bg-[#ff0033] shadow-[0_0_8px_rgba(255,0,51,0.85)] translate-x-4" 
                          : "bg-neutral-600 translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/5">
                  <Button
                    type="submit"
                    variant="aurora"
                    glow
                    fullWidth
                    disabled={submitting}
                    className="gap-2 text-xs py-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Saving Review...
                      </>
                    ) : userReview ? (
                      "Update Review"
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                  
                  {userReview && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="py-2.5 px-4 rounded-full border border-red-500/10 bg-red-950/10 text-[#ff4b5f] hover:bg-[#ff0033]/20 hover:border-[#ff0033] hover:text-white transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 text-xs font-bold"
                    >
                      <Trash2 size={13} /> Withdraw
                    </button>
                  )}
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Right Column: Review Wall list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-[#ff0033]" />
              User Reviews Wall ({ratings.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRatings(true)}
              className="text-[10px] py-1 px-2.5 gap-1.5 border-[#ff0033]/30 hover:border-[#ff0033] text-[#ff0033] hover:bg-[#ff0033]/10 dark:border-[#ff0033]/30 dark:hover:border-[#ff0033] dark:text-[#ff4b5f] dark:hover:bg-[#ff0033]/20 shadow-[0_0_12px_rgba(255,0,51,0.05)] transition-all duration-300 flex items-center"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Refresh Wall
            </Button>
          </div>

          {loading ? (
            // Loading Skeleton
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 border-white/5 animate-pulse flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/[0.04] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 bg-white/[0.04] rounded" />
                    <div className="h-2 w-16 bg-white/[0.03] rounded" />
                    <div className="h-2.5 w-full bg-white/[0.02] rounded pt-2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : ratings.length === 0 ? (
            // Empty State
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#ff0033]/10 text-[#ff4b5f]">
                <Star size={18} />
              </div>
              <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                No Reviews Yet
              </h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Be the first operator to leave a review and make your mark on the wall!
              </p>
            </div>
          ) : (
            // Reviews List
            <div className="space-y-3">
              {visibleRatings.map((review) => {
                const avatarSrc = resolveAvatarUrl(review.profile?.avatarUrl, review.profile?.id);
                const letter = (review.profile?.name || "?").charAt(0).toUpperCase();
                const isOwn = user?.id === review.userId;
                return (
                  <Card
                    key={review.id}
                    className={`p-4 border-white/5 hover:border-white/10 transition-colors flex gap-4 relative overflow-hidden group/card ${
                      isOwn ? "border-l-2 border-l-[#ff0033]/60 bg-white/[0.01]" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative h-10 w-10 rounded-full border border-white/10 bg-[#0c0c0c] overflow-hidden shrink-0 flex items-center justify-center">
                      {review.profile?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-display font-black text-xs text-white">
                          {letter}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            {review.profile?.name || "Enlisted Operator"}
                            {isOwn && (
                              <span className="text-[9px] font-black uppercase bg-[#ff0033]/15 text-[#ff4b5f] border border-[#ff0033]/30 px-1.5 py-0.5 rounded-full tracking-wider">
                                You
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center text-[#ffb800] gap-0.5">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star
                                  key={idx}
                                  size={10}
                                  className={`${
                                    idx < review.rating ? "fill-[#ffb800] text-[#ffb800]" : "text-neutral-800"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-mono text-[9px] text-neutral-500 font-semibold uppercase">
                              {formatRelativeTime(review.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Flag Actions */}
                        {!isOwn && (
                          <div className="shrink-0 flex items-center">
                            {review.isFlagged ? (
                              <span
                                className="text-[9px] font-black uppercase text-rose-400 bg-rose-950/20 border border-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"
                                title="Review is under moderation"
                              >
                                <Flag size={8} className="fill-rose-400" /> Flagged
                              </span>
                            ) : (
                              <button
                                onClick={() => handleFlag(review.id)}
                                disabled={flaggingId === review.id}
                                className="p-1.5 rounded-md text-neutral-600 border border-transparent hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition cursor-pointer disabled:opacity-50"
                                title="Report review"
                              >
                                {flaggingId === review.id ? (
                                  <Loader2 size={12} className="animate-spin text-neutral-400" />
                                ) : (
                                  <Flag size={12} />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {review.comment ? (
                        <p className="mt-3 text-xs leading-relaxed text-neutral-300 font-medium">
                          {review.comment}
                        </p>
                      ) : (
                        <p className="mt-3 text-[10px] leading-relaxed text-neutral-600 font-mono italic">
                          No comment provided.
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}

              {/* Show More Button */}
              {ratings.length > visibleCount && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="gap-2 text-[11px] px-5 py-2"
                  >
                    <ChevronDown size={14} /> Show More Reviews
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Toast Alert Notification Overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className={`rounded-xl border px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider ${
            toastMessage.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/20 text-emerald-400"
              : toastMessage.type === "error"
              ? "bg-rose-950/80 border-rose-500/20 text-[#ff4b5f]"
              : "bg-blue-950/80 border-blue-500/20 text-blue-400"
          }`}>
            {toastMessage.type === "success" ? (
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
            ) : toastMessage.type === "error" ? (
              <AlertTriangle size={14} className="shrink-0 text-[#ff4b5f]" />
            ) : (
              <Sparkles size={14} className="shrink-0 text-blue-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};
