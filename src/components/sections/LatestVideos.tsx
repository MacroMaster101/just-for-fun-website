"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Youtube } from "@/components/ui/Icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

export const LatestVideos = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch("/api/youtube");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          setVideos(data.videos);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error loading videos:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <section id="latest" className="relative py-24 bg-slate-950 overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-600/5 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-violet-600/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight flex items-center justify-center gap-3">
            <span className="text-violet-500">🎬</span> Latest Videos
          </h2>
          <p className="text-slate-400 text-sm tracking-wider uppercase font-semibold">
            Check out the newest content and don&apos;t forget to subscribe!
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-cyan-500 mx-auto rounded-full mt-4" />
        </div>

        {/* Video Grid */}
        {loading ? (
          /* Loading Skeleton State */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, idx) => (
              <Card key={idx} className="border border-white/5 bg-slate-900/40 p-4 space-y-4">
                <div className="aspect-video bg-slate-800 rounded-xl animate-pulse" />
                <div className="space-y-2.5">
                  <div className="h-4 bg-slate-800 rounded-full w-5/6 animate-pulse" />
                  <div className="h-3 bg-slate-800 rounded-full w-1/2 animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          /* Error State with Fallback Alert */
          <div className="text-center max-w-md mx-auto py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto text-2xl">
              ⚠️
            </div>
            <h3 className="font-display font-bold text-white text-lg">
              Couldn&apos;t load videos
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We had trouble reaching the YouTube servers. You can view all our videos directly on the channel.
            </p>
            <a
              href="https://www.youtube.com/channel/UCcCp0B0bypJE4EJjwq8u2lQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button glow className="gap-2">
                <Youtube size={16} /> Open YouTube Channel
              </Button>
            </a>
          </div>
        ) : (
          /* Normal Video Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <Card
                key={video.id}
                hoverEffect
                className="group border border-white/5 bg-slate-900/30 overflow-hidden flex flex-col h-full"
              >
                {/* Thumbnail Area with Hover Overlay */}
                <div className="relative aspect-video overflow-hidden bg-slate-950 border-b border-white/5">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-500 hover:scale-110 active:scale-95 transition-all"
                    >
                      <Play size={20} className="fill-white ml-0.5" />
                    </a>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5 flex flex-col justify-between flex-grow space-y-4">
                  <h3
                    className="font-display font-bold text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-violet-400 transition-colors"
                    dangerouslySetInnerHTML={{ __html: video.title }}
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {new Date(video.publishedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      Watch <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* View All CTA */}
        {!error && !loading && (
          <div className="text-center mt-16">
            <a
              href="https://www.youtube.com/channel/UCcCp0B0bypJE4EJjwq8u2lQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="lg" className="gap-2">
                View All Videos <Youtube size={16} />
              </Button>
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
