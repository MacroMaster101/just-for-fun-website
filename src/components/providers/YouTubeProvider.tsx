"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface YTVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  views: string;
  likes: string;
  comments: string;
  url: string;
  isLive: boolean;
}

export interface YTStats {
  subscribers: string;
  videos: string;
  views: string;
  title: string;
  customUrl: string;
  description: string;
  avatar: string;
  banner: string;
  channelUrl: string;
}

export interface YTData {
  stats: YTStats | null;
  videos: YTVideo[];
  source: "youtube" | "fallback";
  message: string;
  loading: boolean;
  error: boolean;
}

const initial: YTData = {
  stats: null,
  videos: [],
  source: "fallback",
  message: "",
  loading: true,
  error: false,
};

const YouTubeContext = createContext<YTData>(initial);

// Module-level cache: survives StrictMode double-invoke and re-renders.
let cachedPromise: Promise<YTData> | null = null;
let cachedAt = 0;
const TTL_MS = 5 * 60 * 1000;

const fetchYouTube = (): Promise<YTData> => {
  const now = Date.now();
  if (cachedPromise && now - cachedAt < TTL_MS) return cachedPromise;

  cachedAt = now;
  cachedPromise = fetch("/api/youtube")
    .then((r) => {
      if (!r.ok) throw new Error("fetch failed");
      return r.json();
    })
    .then(
      (data): YTData => ({
        stats: data.stats ?? null,
        videos: Array.isArray(data.videos) ? data.videos : [],
        source: data.source === "youtube" ? "youtube" : "fallback",
        message: data.message || "",
        loading: false,
        error: false,
      })
    )
    .catch((): YTData => {
      // Don't cache failures — let the next consumer retry.
      cachedPromise = null;
      return { ...initial, loading: false, error: true };
    });

  return cachedPromise as Promise<YTData>;
};

export const YouTubeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setData] = useState<YTData>(initial);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchYouTube().then((d) => {
      if (mounted.current) setData(d);
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <YouTubeContext.Provider value={data}>{children}</YouTubeContext.Provider>
  );
};

export const useYouTube = () => useContext(YouTubeContext);
