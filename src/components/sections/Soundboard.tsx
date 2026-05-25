"use client";

import React, { useEffect, useState } from "react";
import {
  Play,
  Volume2,
  ShieldAlert,
  Sparkles,
  Flame,
  Share2,
  Upload,
  Link2,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  DEFAULT_SOUNDS,
  PUBLIC_SOUND_LIMIT,
  type SoundDefinition,
  type SoundType,
} from "@/lib/soundboardDefaults";

interface ApiSound {
  id: string;
  name: string;
  emoji: string;
  source: "synth" | "upload";
  type: string;
  audioUrl: string;
  color: string;
  description: string;
}

interface ApiHighlight {
  id: string;
  title: string;
  game: string;
  description: string;
  duration: string;
  source: "youtube" | "upload";
  youtubeId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string;
  submittedByName: string;
  submittedByAvatar: string;
  createdAt: string;
}

type SubmitMode = "youtube" | "upload";

const SOUND_TYPE_SET = new Set<SoundType>([
  "laser",
  "chime",
  "powerup",
  "fanfare",
  "buzzer",
  "subbass",
]);

export const Soundboard = () => {
  const { user } = useAuth();

  const [sounds, setSounds] = useState<SoundDefinition[]>(DEFAULT_SOUNDS);
  const [highlights, setHighlights] = useState<ApiHighlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);

  const [lovedClips, setLovedClips] = useState<Record<string, boolean>>({});
  const [clipLikes, setClipLikes] = useState<Record<string, number>>({});

  // Submission modal state
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("youtube");
  const [formTitle, setFormTitle] = useState("");
  const [formGame, setFormGame] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formYoutubeUrl, setFormYoutubeUrl] = useState("");
  const [formAnonName, setFormAnonName] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Load sounds + highlights on mount.
  useEffect(() => {
    let active = true;

    const loadSounds = async () => {
      try {
        const res = await fetch("/api/sounds", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { sounds: ApiSound[] };
        if (!active) return;
        if (Array.isArray(data.sounds) && data.sounds.length > 0) {
          setSounds(
            data.sounds.slice(0, PUBLIC_SOUND_LIMIT).map((s) => ({
              id: s.id,
              name: s.name,
              emoji: s.emoji,
              source: s.source === "upload" ? "upload" : "synth",
              type: (SOUND_TYPE_SET.has(s.type as SoundType) ? s.type : "laser") as SoundType,
              audioUrl: s.audioUrl || "",
              color: s.color,
              description: s.description,
            }))
          );
        }
      } catch (err) {
        console.warn("Failed to load sounds:", err);
      }
    };

    const loadHighlights = async () => {
      try {
        const res = await fetch("/api/highlights", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { highlights: ApiHighlight[] };
        if (!active) return;
        setHighlights(Array.isArray(data.highlights) ? data.highlights : []);
      } catch (err) {
        console.warn("Failed to load highlights:", err);
      } finally {
        if (active) setHighlightsLoading(false);
      }
    };

    loadSounds();
    loadHighlights();
    return () => {
      active = false;
    };
  }, []);

  /** Plays an uploaded audio file. Each click creates a fresh Audio element
   *  so rapid taps overlap instead of restarting the same playhead. */
  const playUploadedAudio = (url: string) => {
    if (typeof window === "undefined" || !url) return;
    try {
      const audio = new Audio(url);
      audio.volume = 0.85;
      void audio.play();
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  };

  const triggerSound = (sound: SoundDefinition) => {
    if (sound.source === "upload" && sound.audioUrl) {
      playUploadedAudio(sound.audioUrl);
    } else {
      playSynthesizedSound(sound.type);
    }
  };

  const getAudioContextClass = () =>
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  // Web Audio Synthesizer for high-fidelity custom gaming sound effects
  const playSynthesizedSound = (type: string) => {
    if (typeof window === "undefined") return;
    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return;

    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "laser") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "chime") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880.0, now + 0.1);
        osc.frequency.setValueAtTime(1174.66, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "powerup") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(261.63, now);
        osc.frequency.setValueAtTime(329.63, now + 0.08);
        osc.frequency.setValueAtTime(392.0, now + 0.16);
        osc.frequency.setValueAtTime(523.25, now + 0.24);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === "fanfare") {
        osc.type = "square";
        osc.frequency.setValueAtTime(392.0, now);
        osc.frequency.setValueAtTime(523.25, now + 0.12);
        osc.frequency.setValueAtTime(659.25, now + 0.24);
        osc.frequency.setValueAtTime(783.99, now + 0.36);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === "buzzer") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.65);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);
        osc.start(now);
        osc.stop(now + 0.75);
      } else if (type === "subbass") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.9);
      }
    } catch (e) {
      console.warn("AudioContext failed:", e);
    }
  };

  const handleLoveClip = (clipId: string, initialLikes: number) => {
    const wasLoved = lovedClips[clipId];
    setLovedClips((prev) => ({ ...prev, [clipId]: !wasLoved }));
    setClipLikes((prev) => ({
      ...prev,
      [clipId]: (prev[clipId] ?? initialLikes) + (wasLoved ? -1 : 1),
    }));
  };

  const resetForm = () => {
    setFormTitle("");
    setFormGame("");
    setFormDescription("");
    setFormDuration("");
    setFormYoutubeUrl("");
    setFormAnonName("");
    setFormFile(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const closeSubmit = () => {
    setShowSubmit(false);
    resetForm();
  };

  const handleSubmitHighlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!formTitle.trim()) {
      setSubmitError("Title is required.");
      return;
    }
    if (submitMode === "youtube" && !formYoutubeUrl.trim()) {
      setSubmitError("Paste a YouTube link.");
      return;
    }
    if (submitMode === "upload" && !formFile) {
      setSubmitError("Choose a video file to upload.");
      return;
    }

    setSubmitting(true);
    try {
      let res: Response;
      if (submitMode === "youtube") {
        res = await fetch("/api/highlights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            game: formGame,
            description: formDescription,
            duration: formDuration,
            youtubeUrl: formYoutubeUrl,
            submittedByName: user ? "" : formAnonName,
          }),
        });
      } else {
        const fd = new FormData();
        fd.append("title", formTitle);
        fd.append("game", formGame);
        fd.append("description", formDescription);
        fd.append("duration", formDuration);
        if (formFile) fd.append("file", formFile);
        if (!user && formAnonName) fd.append("submittedByName", formAnonName);
        res = await fetch("/api/highlights", { method: "POST", body: fd });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || "Submission failed.");
        return;
      }
      setSubmitSuccess(
        "Submitted! An admin will review your clip before it appears on the page."
      );
      // Clear form fields but keep success message visible for a moment.
      setFormTitle("");
      setFormGame("");
      setFormDescription("");
      setFormDuration("");
      setFormYoutubeUrl("");
      setFormFile(null);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="arena" className="relative overflow-hidden bg-[#060606] py-20 sm:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/45 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center sm:mb-16">
          <h2 className="flex flex-wrap items-center justify-center gap-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="text-[#ff0033] filter drop-shadow-[0_0_8px_rgba(255,0,51,0.5)]">🔥</span>{" "}
            Highlights &amp; Sound Arena
          </h2>
          <p className="text-neutral-400 text-sm tracking-wider uppercase font-semibold">
            Click to trigger stream audio effects or enjoy community clutch highlights!
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-[#ff0033] via-white to-[#ff4b5f] mx-auto rounded-full mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Stream Soundboard (Synth Audio) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                <Volume2 className="text-[#ff0033]" /> Crew Soundboard
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Synthesized 8-bit sound effects using your browser&apos;s Audio Engine. Perfect for gaming streams!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => triggerSound(sound)}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#181818]/70 p-4 text-center backdrop-blur-md transition-all duration-300 hover:bg-[#202020]/70 active:scale-95 sm:p-5 ${sound.color}`}
                >
                  <span className="text-3xl transition-transform duration-300 group-hover:scale-125">
                    {sound.emoji}
                  </span>
                  <div className="space-y-0.5">
                    <span className="block font-display font-bold text-xs text-white uppercase tracking-wider">
                      {sound.name}
                    </span>
                    <span className="block text-[9px] text-neutral-500 line-clamp-1">
                      {sound.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-[#181818]/60 border border-white/10 rounded-lg p-4 flex items-center gap-3">
              <ShieldAlert className="text-[#ff0033] shrink-0" size={18} />
              <p className="text-[10px] text-neutral-400 leading-normal">
                These soundboards generate sounds on-the-fly inside your browser. Try clicking multiple keys rapidly to create intense, glitchy stream build-ups!
              </p>
            </div>
          </div>

          {/* Right Column: Mini Highlights Arena */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                  <Sparkles className="text-[#ff4b5f]" /> Community Highlights
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Share your clutch plays — submissions show up here after admin review.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowSubmit(true)}
                className="w-full shrink-0 gap-1.5 sm:w-auto"
              >
                <Upload size={12} /> Submit clip
              </Button>
            </div>

            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2 highlights-scroll">
              {highlightsLoading ? (
                <Card className="p-8 border border-white/10 bg-[#181818]/70 text-center text-xs text-neutral-500">
                  Loading highlights…
                </Card>
              ) : highlights.length === 0 ? (
                <Card className="p-8 border border-dashed border-white/10 bg-[#181818]/40 text-center space-y-3">
                  <Sparkles size={28} className="mx-auto text-[#ff4b5f]/70" />
                  <p className="font-display font-bold text-sm text-white">
                    No highlights yet
                  </p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Be the first to share a clutch clip — submissions go to an admin for quick review.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubmit(true)}
                    className="gap-1.5"
                  >
                    <Upload size={12} /> Submit the first clip
                  </Button>
                </Card>
              ) : (
                highlights.map((clip) => {
                  const isLoved = lovedClips[clip.id];
                  const activeLikes = clipLikes[clip.id] ?? 0;
                  const watchUrl =
                    clip.source === "youtube" && clip.youtubeId
                      ? `https://www.youtube.com/watch?v=${clip.youtubeId}`
                      : clip.videoUrl || "#";
                  return (
                    <Card
                      key={clip.id}
                      className="p-4 border border-white/10 bg-[#181818]/70 hover:border-[#ff0033]/25 transition-all duration-300 flex gap-4 items-center"
                    >
                      <div className="relative w-28 aspect-video rounded-lg overflow-hidden border border-white/5 shrink-0 bg-neutral-900 group">
                        {clip.thumbnailUrl ? (
                          <Image
                            src={clip.thumbnailUrl}
                            alt={clip.title}
                            fill
                            sizes="112px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                            <Play size={20} />
                          </div>
                        )}
                        <a
                          href={watchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-[#000]/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Play size={16} className="text-white fill-white" />
                        </a>
                        {clip.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/85 text-[8px] font-bold text-[#ffffff] px-1.5 py-0.5 rounded image-overlay-badge">
                            {clip.duration}
                          </span>
                        )}
                      </div>

                      <div className="flex-grow space-y-2 min-w-0">
                        <div>
                          {clip.game && (
                            <span className="text-[9px] uppercase font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
                              {clip.game}
                            </span>
                          )}
                          <h4 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 leading-snug mt-1.5">
                            {clip.title}
                          </h4>
                          <p className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1.5 truncate">
                            {clip.submittedByAvatar && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={clip.submittedByAvatar}
                                alt=""
                                className="w-3.5 h-3.5 rounded-full object-cover"
                              />
                            )}
                            <span className="truncate">by {clip.submittedByName}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-neutral-500">
                          <button
                            onClick={() => handleLoveClip(clip.id, 0)}
                            className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                              isLoved ? "text-[#ff0033]" : "hover:text-neutral-300"
                            }`}
                          >
                            <Flame size={12} className={isLoved ? "fill-[#ff0033] text-[#ff0033]" : ""} />
                            {activeLikes} Lit
                          </button>

                          <a
                            href={watchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-neutral-300 font-bold"
                          >
                            <Share2 size={12} />
                            Watch
                          </a>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm animate-fade-in sm:p-4">
          <Card
            glass
            className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto border-white/10 bg-[#0c0c0c]/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-fade-in-up sm:max-h-[90vh] sm:p-7"
          >
            <button
              onClick={closeSubmit}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="space-y-5">
              <div>
                <h3 className="font-display font-extrabold text-xl text-white tracking-wide flex items-center gap-2">
                  <Sparkles size={18} className="text-[#ff4b5f]" /> Submit a Highlight
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1">
                  YouTube link or a short video file (mp4/webm/mov, max 50&nbsp;MB). An admin will review before it goes live.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitMode("youtube")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition ${
                    submitMode === "youtube"
                      ? "border-[#ff0033] bg-[#ff0033]/10 text-[#ff4b5f]"
                      : "border-white/10 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Link2 size={13} /> YouTube link
                </button>
                <button
                  type="button"
                  onClick={() => setSubmitMode("upload")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition ${
                    submitMode === "upload"
                      ? "border-[#ff0033] bg-[#ff0033]/10 text-[#ff4b5f]"
                      : "border-white/10 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Upload size={13} /> Upload file
                </button>
              </div>

              <form onSubmit={handleSubmitHighlight} className="space-y-4">
                {submitError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> {submitSuccess}
                  </div>
                )}

                <Input
                  label="Title"
                  required
                  placeholder="e.g. 1v5 Jett Clutch in Ranked"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={160}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Game"
                    placeholder="Valorant"
                    value={formGame}
                    onChange={(e) => setFormGame(e.target.value)}
                    maxLength={60}
                  />
                  <Input
                    label="Duration"
                    placeholder="0:45"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    maxLength={12}
                  />
                </div>

                {submitMode === "youtube" ? (
                  <Input
                    label="YouTube URL"
                    required
                    placeholder="https://youtu.be/ScMzIvxBSi4"
                    value={formYoutubeUrl}
                    onChange={(e) => setFormYoutubeUrl(e.target.value)}
                  />
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                      Video file (mp4 / webm / mov, max 50MB)
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-white/10 file:bg-white/5 file:text-white file:font-bold file:cursor-pointer hover:file:bg-white/10"
                    />
                    {formFile && (
                      <p className="mt-1.5 text-[10px] text-neutral-500 font-mono">
                        {formFile.name} · {(formFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Anything the moderators should know?"
                    className="w-full rounded-lg border border-white/10 bg-[#181818]/80 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30 resize-none"
                  />
                </div>

                {!user && (
                  <Input
                    label="Your name (optional)"
                    placeholder="Leave blank to post anonymously"
                    value={formAnonName}
                    onChange={(e) => setFormAnonName(e.target.value)}
                    maxLength={60}
                  />
                )}

                <div className="flex flex-col-reverse gap-2 border-t border-white/5 pt-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={closeSubmit} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="w-full gap-2 sm:w-auto">
                    {submitting ? "Submitting…" : (
                      <>
                        <Upload size={14} /> Submit for review
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
};
