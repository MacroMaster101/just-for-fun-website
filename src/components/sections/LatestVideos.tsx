"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  ExternalLink,
  Eye,
  Heart,
  Play,
  Search,
  ThumbsUp,
  X,
} from "lucide-react";
import Image from "next/image";
import { Youtube } from "@/components/ui/Icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TiltCard } from "@/components/ui/TiltCard";
import { CursorSpotlight } from "@/components/ui/CursorSpotlight";
import { useYouTube, type YTVideo } from "@/components/providers/YouTubeProvider";
import { useFavorites } from "@/components/auth/useFavorites";

type VideoItem = YTVideo;

const INITIAL_VISIBLE = 9;
const PAGE_SIZE = 9;

type FilterKey = string; // "all" | "live" | "game:<label>" | "playlist:<id>"

export const LatestVideos = () => {
  const yt = useYouTube();
  const videos = yt.videos;
  const playlists = yt.playlists;
  const loading = yt.loading;
  const error = yt.error;
  const message = yt.message;
  const source = yt.source;
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  // Track the (filter, query) tuple we last paginated against so we can reset
  // visibleCount during render when either changes — no effect cascade needed.
  const [paginationKey, setPaginationKey] = useState("all|");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const { isFavorited, toggle, signedIn } = useFavorites();

  useEffect(() => {
    if (!selectedVideo || typeof window === "undefined") return;

    const body = document.body;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    window.dispatchEvent(
      new CustomEvent("jff:video-theater", { detail: { open: true } })
    );

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      window.dispatchEvent(
        new CustomEvent("jff:video-theater", { detail: { open: false } })
      );
    };
  }, [selectedVideo]);

  // Build the filter chip list from the data we actually have.
  const filterChips = useMemo(() => {
    const chips: Array<{ key: FilterKey; label: string; count: number }> = [
      { key: "all", label: "All", count: videos.length },
    ];

    const liveCount = videos.filter((v) => v.isLive).length;
    if (liveCount > 0) {
      chips.push({ key: "live", label: "Live", count: liveCount });
    }

    // Auto-detected game tags — aggregate counts across videos.
    const gameCounts = new Map<string, number>();
    for (const v of videos) {
      for (const tag of v.gameTags || []) {
        gameCounts.set(tag, (gameCounts.get(tag) || 0) + 1);
      }
    }
    const sortedGames = [...gameCounts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
    for (const [label, count] of sortedGames) {
      chips.push({ key: `game:${label}`, label, count });
    }

    // YouTube playlists — show only ones that actually contain a video we have.
    const playlistVideoCounts = new Map<string, number>();
    for (const v of videos) {
      for (const pid of v.playlistIds || []) {
        playlistVideoCounts.set(pid, (playlistVideoCounts.get(pid) || 0) + 1);
      }
    }
    const playlistsWithVideos = playlists
      .map((p) => ({ ...p, visibleCount: playlistVideoCounts.get(p.id) || 0 }))
      .filter((p) => p.visibleCount > 0)
      .sort((a, b) => b.visibleCount - a.visibleCount);
    for (const p of playlistsWithVideos) {
      chips.push({
        key: `playlist:${p.id}`,
        label: p.title,
        count: p.visibleCount,
      });
    }

    return chips;
  }, [videos, playlists]);

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let list = videos;
    if (activeFilter === "live") {
      list = list.filter((v) => v.isLive);
    } else if (activeFilter.startsWith("game:")) {
      const game = activeFilter.slice("game:".length);
      list = list.filter((v) => (v.gameTags || []).includes(game));
    } else if (activeFilter.startsWith("playlist:")) {
      const pid = activeFilter.slice("playlist:".length);
      list = list.filter((v) => (v.playlistIds || []).includes(pid));
    }

    if (query) {
      list = list.filter((video) =>
        video.title.toLowerCase().includes(query)
      );
    }
    return list;
  }, [searchQuery, activeFilter, videos]);

  // Reset pagination whenever the filter or query changes so users always
  // start at the top of a fresh list — done during render to avoid the
  // cascading-render hit of a useEffect.
  const currentKey = `${activeFilter}|${searchQuery.trim().toLowerCase()}`;
  if (currentKey !== paginationKey) {
    setPaginationKey(currentKey);
    setVisibleCount(INITIAL_VISIBLE);
  }

  const visibleVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;
  const canCollapse = visibleCount > INITIAL_VISIBLE && filteredVideos.length > INITIAL_VISIBLE;

  const handleShowLess = () => {
    setVisibleCount(INITIAL_VISIBLE);
    // Scroll the section back into view so the user isn't stranded at the
    // bottom of the page after the grid shrinks.
    if (typeof document !== "undefined") {
      document.getElementById("latest")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="latest" className="relative overflow-hidden bg-[#060606] py-20 sm:py-24">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#060606_0%,#0c0c0c_48%,#060606_100%)]" />
      <CursorSpotlight color="rgba(255, 0, 51, 0.18)" size={500} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff0033]/60 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6">
        <div className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.26em] text-[#ff4b5f]">
              YouTube Feed
            </p>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              Latest Uploads
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-neutral-400">
              Fresh videos from Just For Fun, pulled live from YouTube.
            </p>
          </div>

          {!error && !loading && videos.length > 0 && (
            <div className="relative w-full md:w-80">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
              />
              <input
                type="text"
                placeholder="Search videos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-white/10 bg-[#181818] py-3 pl-11 pr-4 text-sm font-semibold text-white placeholder:text-neutral-500 focus:border-[#ff0033] focus:outline-none focus:ring-1 focus:ring-[#ff0033]/30"
              />
            </div>
          )}
        </div>

        {!error && !loading && videos.length > 0 && filterChips.length > 1 && (
          <div className="mb-8 -mx-5 sm:mx-0">
            <div className="flex items-center gap-2 overflow-x-auto px-5 pb-2 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {filterChips.map((chip) => {
                const active = activeFilter === chip.key;
                return (
                  <button
                    key={chip.key}
                    onClick={() => setActiveFilter(chip.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition sm:shrink ${
                      active
                        ? "border-[#ff0033] bg-[#ff0033]/15 text-[#ff4b5f] shadow-[0_0_18px_rgba(255,0,51,0.18)]"
                        : "border-white/10 bg-[#181818] text-neutral-400 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                        active
                          ? "bg-[#ff0033]/25 text-[#ff4b5f]"
                          : "bg-white/5 text-neutral-500"
                      }`}
                    >
                      {chip.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, idx) => (
              <Card key={idx} className="border-white/10 bg-[#181818] p-3">
                <div className="aspect-video animate-pulse rounded-lg bg-white/10" />
                <div className="space-y-3 p-3">
                  <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/10" />
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <FeedState
            icon={<AlertCircle size={24} />}
            title="Could not reach the local API"
            body="The page could not load the YouTube route. Try again after the dev server is running."
          />
        ) : videos.length === 0 ? (
          <FeedState
            icon={<Youtube size={26} />}
            title={source === "youtube" ? "No uploads returned yet" : "YouTube API key needed"}
            body={
              message ||
              "Add YOUTUBE_API_KEY to .env so the site can pull channel stats and latest uploads."
            }
          />
        ) : filteredVideos.length === 0 ? (
          <FeedState
            icon={<Search size={24} />}
            title="No matches"
            body="Try a different search term for the latest uploads."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleVideos.map((video) => (
              <TiltCard key={video.id} max={8} scale={1.02} className="rounded-lg">
              <Card
                hoverEffect
                className="group flex h-full cursor-pointer flex-col border-white/10 bg-[#181818] shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video overflow-hidden bg-black">
                  <Image
                    src={video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                    alt={video.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/45" />
                  <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full bg-[#ff0033] text-white opacity-0 shadow-[0_0_26px_rgba(255,0,51,0.45)] transition group-hover:scale-100 group-hover:opacity-100">
                    <Play size={24} className="ml-1 fill-white" />
                  </div>
                  <span className="absolute bottom-2 right-2 rounded bg-black/90 px-2 py-1 text-[11px] font-black text-[#ffffff] image-overlay-badge">
                    {video.isLive ? "LIVE" : video.duration}
                  </span>
                  {signedIn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle("video", video.id, video.title);
                      }}
                      aria-label={
                        isFavorited("video", video.id)
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white transition hover:bg-[#ff0033] hover:text-white"
                    >
                      <Heart
                        size={14}
                        className={
                          isFavorited("video", video.id)
                            ? "fill-[#ff0033] text-[#ff0033]"
                            : ""
                        }
                      />
                    </button>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-white transition group-hover:text-[#ff4b5f]">
                      {video.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">
                      {video.description || "Watch the full video on the Just For Fun channel."}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <Eye size={13} /> {video.views}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp size={13} /> {video.likes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> {formatDate(video.publishedAt)}
                    </span>
                  </div>
                </div>
              </Card>
              </TiltCard>
            ))}
          </div>
        )}

        {!loading && !error && (hasMore || canCollapse) && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {hasMore && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    setVisibleCount((c) =>
                      Math.min(c + PAGE_SIZE, filteredVideos.length)
                    )
                  }
                  className="gap-2"
                >
                  See more
                </Button>
              )}
              {canCollapse && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleShowLess}
                  className="gap-2"
                >
                  Show less
                </Button>
              )}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
              Showing {visibleVideos.length} of {filteredVideos.length}
            </span>
          </div>
        )}

        <div className="mt-14 text-center">
          <a
            href="https://www.youtube.com/@JustForFun-BoYs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="outline" size="lg" className="gap-2">
              Visit Channel <Youtube size={17} />
            </Button>
          </a>
        </div>
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/[0.92] p-3 backdrop-blur-sm sm:p-5">
          <div className="auth-surface relative grid w-full max-w-[min(1500px,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-white/10 bg-[#181818] shadow-[0_0_50px_rgba(0,0,0,0.75)] sm:max-w-[min(1500px,calc(100vw-2.5rem))] lg:h-[min(84dvh,760px)] lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
            <button
              onClick={() => setSelectedVideo(null)}
              className="video-modal-close absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#0a0a0a] text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition hover:border-[#ff0033]/60 hover:bg-[#ff0033] hover:text-white"
              aria-label="Close video"
            >
              <X size={18} />
            </button>

            <div className="flex min-h-0 items-center bg-black">
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>

            <aside className="min-h-0 overflow-y-auto border-t border-white/10 p-5 lg:border-l lg:border-t-0 lg:p-6">
              <div className="flex min-h-full flex-col">
                <div className="pr-9 lg:pr-0">
                  <span className="rounded-full bg-[#ff0033]/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#ff4b5f]">
                    Theater Mode
                  </span>
                  <h3 className="mt-4 text-xl font-black leading-tight text-white">
                    {selectedVideo.title}
                  </h3>
                  <p className="mt-3 max-h-44 overflow-y-auto pr-2 text-sm leading-6 text-neutral-400 lg:max-h-[32dvh]">
                    {selectedVideo.description || "Open this video on YouTube for the full description, comments, and playlist context."}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-bold text-neutral-400">
                    <StatPill icon={<Eye size={14} />} label="Views" value={selectedVideo.views} />
                    <StatPill icon={<ThumbsUp size={14} />} label="Likes" value={selectedVideo.likes} />
                    <StatPill
                      icon={<Calendar size={14} />}
                      label="Published"
                      value={formatDate(selectedVideo.publishedAt)}
                    />
                    <StatPill
                      icon={<Play size={14} />}
                      label="Length"
                      value={selectedVideo.isLive ? "Live" : selectedVideo.duration}
                    />
                  </div>
                </div>

                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex lg:mt-auto lg:pt-6"
                >
                  <Button fullWidth glow className="gap-2">
                    Open on YouTube <ExternalLink size={15} />
                  </Button>
                </a>
              </div>
            </aside>
          </div>
        </div>
      )}
    </section>
  );
};

const FeedState = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-[#181818] p-6 text-center sm:p-8">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ff0033]/14 text-[#ff4b5f]">
      {icon}
    </div>
    <h3 className="font-display text-lg font-black uppercase text-white">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-neutral-400">{body}</p>
  </div>
);

const StatPill = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border border-white/10 bg-black/30 p-3">
    <div className="flex items-center gap-2 text-[#ff4b5f]">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
        {label}
      </span>
    </div>
    <p className="mt-2 font-display text-lg font-black text-white">{value || "--"}</p>
  </div>
);

function formatDate(value: string) {
  if (!value) return "--";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
