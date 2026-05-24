"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  ExternalLink,
  Eye,
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

type VideoItem = YTVideo;

export const LatestVideos = () => {
  const yt = useYouTube();
  const videos = yt.videos;
  const loading = yt.loading;
  const error = yt.error;
  const message = yt.message;
  const source = yt.source;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return videos;
    return videos.filter((video) => video.title.toLowerCase().includes(query));
  }, [searchQuery, videos]);

  return (
    <section id="latest" className="relative overflow-hidden bg-[#060606] py-24">
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
              Fresh videos from Just For Fun BoYs, pulled through the local YouTube API route.
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
            {filteredVideos.map((video) => (
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
                  <span className="absolute bottom-2 right-2 rounded bg-black/90 px-2 py-1 text-[11px] font-black text-white">
                    {video.isLive ? "LIVE" : video.duration}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-white transition group-hover:text-[#ff4b5f]">
                      {video.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">
                      {video.description || "Watch the full video on the Just For Fun BoYs channel."}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/[0.92] p-4 backdrop-blur-sm">
          <div className="relative grid w-full max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-[#181818] shadow-[0_0_50px_rgba(0,0,0,0.75)] lg:grid-cols-12">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/80 p-2 text-neutral-300 transition hover:bg-[#ff0033] hover:text-white"
              aria-label="Close video"
            >
              <X size={18} />
            </button>

            <div className="aspect-video bg-black lg:col-span-8 lg:aspect-auto lg:min-h-[520px]">
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full min-h-[260px] w-full lg:min-h-[520px]"
              />
            </div>

            <aside className="flex flex-col justify-between border-t border-white/10 p-6 lg:col-span-4 lg:border-l lg:border-t-0">
              <div>
                <span className="rounded-full bg-[#ff0033]/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#ff4b5f]">
                  Theater Mode
                </span>
                <h3 className="mt-4 text-xl font-black leading-tight text-white">
                  {selectedVideo.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-400">
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
                className="mt-8 inline-flex"
              >
                <Button fullWidth glow className="gap-2">
                  Open on YouTube <ExternalLink size={15} />
                </Button>
              </a>
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
  <div className="mx-auto max-w-lg rounded-lg border border-white/10 bg-[#181818] p-8 text-center">
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
