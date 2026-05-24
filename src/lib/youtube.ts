const API_KEY = process.env.YOUTUBE_API_KEY?.trim();
const DEFAULT_CHANNEL_ID = "UCcCp0B0bypJE4EJjwq8u2lQ";
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID?.trim() || DEFAULT_CHANNEL_ID;
const CHANNEL_HANDLE = normalizeHandle(
  process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || "@JustForFun-BoYs"
);
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;

type ThumbnailMap = Record<
  string,
  { url: string; width?: number; height?: number }
>;

interface YouTubeErrorResponse {
  error?: { message?: string };
}

interface ChannelItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    customUrl?: string;
    publishedAt?: string;
    thumbnails?: ThumbnailMap;
    country?: string;
  };
  statistics?: {
    viewCount?: string;
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
    videoCount?: string;
  };
  brandingSettings?: { image?: { bannerExternalUrl?: string } };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

interface ChannelResponse extends YouTubeErrorResponse {
  items?: ChannelItem[];
}

interface PlaylistItem {
  snippet?: {
    publishedAt?: string;
    title?: string;
    description?: string;
    thumbnails?: ThumbnailMap;
    resourceId?: { videoId?: string };
  };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
}

interface PlaylistItemsResponse extends YouTubeErrorResponse {
  items?: PlaylistItem[];
}

interface VideoDetailsItem {
  id: string;
  snippet?: {
    publishedAt?: string;
    title?: string;
    description?: string;
    thumbnails?: ThumbnailMap;
    liveBroadcastContent?: string;
  };
  contentDetails?: { duration?: string };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
    actualEndTime?: string;
    scheduledStartTime?: string;
  };
}

interface VideosResponse extends YouTubeErrorResponse {
  items?: VideoDetailsItem[];
}

export interface ApiVideo {
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

export interface YouTubePayload {
  source: "youtube" | "fallback";
  fetchedAt: string;
  message?: string;
  stats: typeof fallbackStats;
  videos: ApiVideo[];
}

export const fallbackStats = {
  subscribers: "--",
  videos: "--",
  views: "--",
  title: "Just For Fun BoYs",
  customUrl: CHANNEL_HANDLE,
  description:
    "Sri Lankan gaming channel for funny gameplay, clutch moments, variety games, and weekend community streams.",
  avatar: "",
  banner: "",
  channelId: CHANNEL_ID || "",
  channelUrl: CHANNEL_URL,
  publishedAt: "",
  country: "",
};

/**
 * Fetches a fresh payload directly from the YouTube Data API.
 * Falls back to the RSS feed if the API call fails (still costs 0 quota).
 * NEVER call this from the user-facing route — it's only for the cron refresher.
 */
export async function fetchFreshYouTubePayload(): Promise<YouTubePayload> {
  try {
    if (!API_KEY) {
      return await fallbackPayload(
        "Missing YOUTUBE_API_KEY. Add it to .env to enable live YouTube data."
      );
    }

    const channel = await getChannel();
    const stats = mapChannelStats(channel);
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    const videos = uploadsPlaylistId
      ? await getLatestUploadVideos(uploadsPlaylistId)
      : [];

    return {
      source: "youtube",
      fetchedAt: new Date().toISOString(),
      stats,
      videos,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch YouTube data.";
    const cleanMessage = stripHtml(message);
    console.error("YouTube fetch error:", cleanMessage);
    return await fallbackPayload(cleanMessage);
  }
}

async function getChannel() {
  const channelById = CHANNEL_ID
    ? await fetchYouTube<ChannelResponse>("channels", {
        part: "snippet,statistics,brandingSettings,contentDetails",
        id: CHANNEL_ID,
      })
    : null;

  if (channelById?.items?.[0]) return channelById.items[0];

  const channelByHandle = await fetchYouTube<ChannelResponse>("channels", {
    part: "snippet,statistics,brandingSettings,contentDetails",
    forHandle: CHANNEL_HANDLE.replace(/^@/, ""),
  });

  const channel = channelByHandle.items?.[0];
  if (!channel) {
    throw new Error(
      `No YouTube channel found for ${CHANNEL_ID || CHANNEL_HANDLE}.`
    );
  }
  return channel;
}

async function getLatestUploadVideos(uploadsPlaylistId: string) {
  const playlistItems = await fetchYouTube<PlaylistItemsResponse>(
    "playlistItems",
    {
      part: "snippet,contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: "6",
    }
  );

  const orderedIds =
    playlistItems.items
      ?.map(
        (item) =>
          item.contentDetails?.videoId || item.snippet?.resourceId?.videoId
      )
      .filter((id): id is string => Boolean(id)) || [];

  if (orderedIds.length === 0) return [];

  const videoDetails = await fetchYouTube<VideosResponse>("videos", {
    part: "snippet,contentDetails,statistics,liveStreamingDetails",
    id: orderedIds.join(","),
  });

  const detailMap = new Map(
    (videoDetails.items || []).map((item) => [item.id, item])
  );

  return orderedIds
    .map((id) => detailMap.get(id))
    .filter((item): item is VideoDetailsItem => Boolean(item))
    .map(mapVideoDetails);
}

async function fetchYouTube<T extends YouTubeErrorResponse>(
  endpoint: string,
  params: Record<string, string | undefined>
) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.searchParams.set("key", API_KEY || "");

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as T;

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message || `YouTube ${endpoint} request failed.`
    );
  }
  return data;
}

function mapChannelStats(channel: ChannelItem) {
  const snippet = channel.snippet;
  const statistics = channel.statistics;
  const customUrl = formatHandle(snippet?.customUrl || CHANNEL_HANDLE);

  return {
    subscribers: statistics?.hiddenSubscriberCount
      ? "Hidden"
      : formatCompactNumber(statistics?.subscriberCount),
    videos: formatCompactNumber(statistics?.videoCount),
    views: formatCompactNumber(statistics?.viewCount),
    title: snippet?.title || fallbackStats.title,
    customUrl,
    description: snippet?.description || fallbackStats.description,
    avatar: getBestThumbnail(snippet?.thumbnails),
    banner: channel.brandingSettings?.image?.bannerExternalUrl || "",
    channelId: channel.id,
    channelUrl: `https://www.youtube.com/${customUrl}`,
    publishedAt: snippet?.publishedAt || "",
    country: snippet?.country || "",
  };
}

function mapVideoDetails(item: VideoDetailsItem): ApiVideo {
  return {
    id: item.id,
    title: item.snippet?.title || "Untitled video",
    description: item.snippet?.description || "",
    thumbnail: getBestThumbnail(item.snippet?.thumbnails),
    publishedAt:
      item.liveStreamingDetails?.actualStartTime ||
      item.liveStreamingDetails?.scheduledStartTime ||
      item.snippet?.publishedAt ||
      "",
    duration: formatDuration(item.contentDetails?.duration),
    views: formatCompactNumber(item.statistics?.viewCount),
    likes: formatCompactNumber(item.statistics?.likeCount),
    comments: formatCompactNumber(item.statistics?.commentCount),
    url: `https://www.youtube.com/watch?v=${item.id}`,
    isLive:
      item.snippet?.liveBroadcastContent === "live" ||
      Boolean(
        item.liveStreamingDetails?.actualStartTime &&
          !item.liveStreamingDetails.actualEndTime
      ),
  };
}

function getBestThumbnail(thumbnails?: ThumbnailMap) {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    ""
  );
}

function formatCompactNumber(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: parsed >= 1000 ? 1 : 0,
  }).format(parsed);
}

function formatDuration(duration?: string) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration || "");
  if (!match) return "LIVE";
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function normalizeHandle(handle: string) {
  const trimmed = handle.replace(/^https:\/\/www\.youtube\.com\//, "");
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function formatHandle(customUrl: string) {
  const cleaned = customUrl.replace(/^https:\/\/www\.youtube\.com\//, "");
  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

async function getRssFallbackVideos(): Promise<ApiVideo[]> {
  const feedUrl = new URL("https://www.youtube.com/feeds/videos.xml");
  feedUrl.searchParams.set("channel_id", CHANNEL_ID);

  const response = await fetch(feedUrl, { cache: "no-store" });
  if (!response.ok) return [];

  const xml = await response.text();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

  return entries
    .slice(0, 6)
    .map((entry): ApiVideo => {
      const id = decodeXml(extractTag(entry, "yt:videoId"));
      return {
        id,
        title: decodeXml(extractTag(entry, "title")) || "Untitled video",
        description: decodeXml(extractTag(entry, "media:description")),
        thumbnail:
          extractAttribute(entry, "media:thumbnail", "url") ||
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        publishedAt: decodeXml(extractTag(entry, "published")),
        duration: "--",
        views: "--",
        likes: "--",
        comments: "--",
        url: `https://www.youtube.com/watch?v=${id}`,
        isLive: false,
      };
    })
    .filter((video) => Boolean(video.id));
}

function extractTag(entry: string, tag: string) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(
    `<${escapedTag}>([\\s\\S]*?)<\\/${escapedTag}>`
  ).exec(entry);
  return match?.[1] || "";
}

function extractAttribute(entry: string, tag: string, attribute: string) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedAttribute = attribute.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  const match = new RegExp(
    `<${escapedTag}[^>]*\\s${escapedAttribute}="([^"]*)"`,
    "i"
  ).exec(entry);
  return match?.[1] || "";
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function fallbackPayload(message: string): Promise<YouTubePayload> {
  const videos = await getRssFallbackVideos().catch(() => [] as ApiVideo[]);
  return {
    source: "fallback",
    fetchedAt: new Date().toISOString(),
    message,
    stats: fallbackStats,
    videos,
  };
}
