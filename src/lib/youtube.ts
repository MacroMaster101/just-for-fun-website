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
    playlistId?: string;
  };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
}

interface PlaylistItemsResponse extends YouTubeErrorResponse {
  items?: PlaylistItem[];
  nextPageToken?: string;
}

interface PlaylistListItem {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
  };
  contentDetails?: { itemCount?: number };
}

interface PlaylistsResponse extends YouTubeErrorResponse {
  items?: PlaylistListItem[];
  nextPageToken?: string;
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
  /** YouTube playlist IDs this video belongs to. May be empty. */
  playlistIds: string[];
  /** Auto-detected game/category tags from the title. */
  gameTags: string[];
}

export interface ApiPlaylist {
  id: string;
  title: string;
  itemCount: number;
}

export interface YouTubePayload {
  source: "youtube" | "fallback";
  fetchedAt: string;
  message?: string;
  stats: typeof fallbackStats;
  videos: ApiVideo[];
  playlists: ApiPlaylist[];
}

export const fallbackStats = {
  subscribers: "--",
  videos: "--",
  views: "--",
  title: "Just For Fun",
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

    // Fetch channel playlists + memberships, then enrich each video with its playlist ids.
    const { playlists, membership } = await getChannelPlaylistsWithMembership(
      channel.id
    );
    for (const video of videos) {
      video.playlistIds = membership.get(video.id) || [];
    }

    return {
      source: "youtube",
      fetchedAt: new Date().toISOString(),
      stats,
      videos,
      playlists,
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

// Safety ceiling on a single refresh — prevents a runaway loop if the
// channel grows huge or YouTube returns malformed pagination. At ~2KB per
// video this still keeps the cached payload well under 4MB.
const MAX_TOTAL_VIDEOS = 1000;
const PAGE_SIZE = 50;

async function getLatestUploadVideos(uploadsPlaylistId: string) {
  const orderedIds = await collectPlaylistVideoIds(
    uploadsPlaylistId,
    MAX_TOTAL_VIDEOS
  );
  if (orderedIds.length === 0) return [];

  // The videos endpoint accepts up to 50 ids per request — batch them.
  const detailMap = new Map<string, VideoDetailsItem>();
  for (let i = 0; i < orderedIds.length; i += PAGE_SIZE) {
    const batch = orderedIds.slice(i, i + PAGE_SIZE);
    const videoDetails = await fetchYouTube<VideosResponse>("videos", {
      part: "snippet,contentDetails,statistics,liveStreamingDetails",
      id: batch.join(","),
    });
    for (const item of videoDetails.items || []) {
      detailMap.set(item.id, item);
    }
  }

  return orderedIds
    .map((id) => detailMap.get(id))
    .filter((item): item is VideoDetailsItem => Boolean(item))
    .map(mapVideoDetails);
}

/**
 * Walks every page of a playlist and returns the video ids in playlist order,
 * up to `limit`. Stops early if YouTube stops returning a nextPageToken.
 */
async function collectPlaylistVideoIds(
  playlistId: string,
  limit: number
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < limit) {
    const resp: PlaylistItemsResponse = await fetchYouTube<PlaylistItemsResponse>(
      "playlistItems",
      {
        part: "snippet,contentDetails",
        playlistId,
        maxResults: String(PAGE_SIZE),
        pageToken,
      }
    );
    for (const item of resp.items || []) {
      const id =
        item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      if (id) ids.push(id);
      if (ids.length >= limit) break;
    }
    if (!resp.nextPageToken) break;
    pageToken = resp.nextPageToken;
  }

  return ids;
}

/**
 * Fetches every public playlist for the channel plus the full membership for
 * each. Returns the playlist list and a Map keyed by video id giving the
 * playlist ids that video belongs to. Pagination is followed end-to-end so
 * a video sitting deep in a long playlist still resolves correctly.
 */
async function getChannelPlaylistsWithMembership(channelId: string): Promise<{
  playlists: ApiPlaylist[];
  membership: Map<string, string[]>;
}> {
  const membership = new Map<string, string[]>();
  const playlists: ApiPlaylist[] = [];

  let pageToken: string | undefined;
  try {
    do {
      const resp: PlaylistsResponse = await fetchYouTube<PlaylistsResponse>(
        "playlists",
        {
          part: "snippet,contentDetails",
          channelId,
          maxResults: String(PAGE_SIZE),
          pageToken,
        }
      );
      for (const p of resp.items || []) {
        const title = (p.snippet?.title || "").trim();
        if (!p.id || !title) continue;
        playlists.push({
          id: p.id,
          title,
          itemCount: p.contentDetails?.itemCount ?? 0,
        });
      }
      pageToken = resp.nextPageToken;
    } while (pageToken);
  } catch (err) {
    console.warn("Playlist fetch failed:", (err as Error).message);
    return { playlists: [], membership };
  }

  // Safety ceiling per playlist mirrors the uploads ceiling.
  for (const playlist of playlists) {
    try {
      const ids = await collectPlaylistVideoIds(playlist.id, MAX_TOTAL_VIDEOS);
      for (const videoId of ids) {
        const existing = membership.get(videoId);
        if (existing) existing.push(playlist.id);
        else membership.set(videoId, [playlist.id]);
      }
    } catch (err) {
      console.warn(
        `Playlist items fetch failed for ${playlist.id}:`,
        (err as Error).message
      );
    }
  }

  return { playlists, membership };
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
  const title = item.snippet?.title || "Untitled video";
  const description = item.snippet?.description || "";
  return {
    id: item.id,
    title,
    description,
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
    playlistIds: [],
    gameTags: detectGameTags(`${title} ${description}`),
  };
}

/**
 * Maps title/description text to a list of game/category tags via keyword
 * matching. The keys are the canonical display labels; the values are the
 * regex patterns that count as a match. Order does not matter — a video can
 * carry multiple tags.
 */
const GAME_TAG_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "GTA", pattern: /\bgta\b|grand theft auto/i },
  { label: "Minecraft", pattern: /\bminecraft\b|\bmc\b/i },
  { label: "Valorant", pattern: /\bvalorant\b|\bval\b/i },
  { label: "Fortnite", pattern: /\bfortnite\b|\bfn\b/i },
  { label: "PUBG", pattern: /\bpubg\b/i },
  { label: "Call of Duty", pattern: /\bcod\b|call of duty|warzone/i },
  { label: "CS:GO", pattern: /\bcs\s?:?\s?go\b|counter[-\s]?strike|\bcs2\b/i },
  { label: "Apex Legends", pattern: /\bapex\b/i },
  { label: "League of Legends", pattern: /\blol\b|league of legends/i },
  { label: "Dota", pattern: /\bdota\b/i },
  { label: "FIFA", pattern: /\bfifa\b|\bfc\s?\d+/i },
  { label: "Roblox", pattern: /\broblox\b/i },
  { label: "Among Us", pattern: /among us|\bamogus\b/i },
  { label: "Free Fire", pattern: /free fire|\bff\b/i },
  { label: "Rocket League", pattern: /rocket league/i },
  { label: "Elden Ring", pattern: /elden ring/i },
  { label: "Horror", pattern: /\bhorror\b|scary|phasmophobia/i },
  { label: "Stream", pattern: /\bstream\b|live\b/i },
];

function detectGameTags(text: string): string[] {
  const found: string[] = [];
  for (const { label, pattern } of GAME_TAG_PATTERNS) {
    if (pattern.test(text)) found.push(label);
  }
  return found;
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
    .slice(0, MAX_TOTAL_VIDEOS)
    .map((entry): ApiVideo => {
      const id = decodeXml(extractTag(entry, "yt:videoId"));
      const title = decodeXml(extractTag(entry, "title")) || "Untitled video";
      const description = decodeXml(extractTag(entry, "media:description"));
      return {
        id,
        title,
        description,
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
        playlistIds: [],
        gameTags: detectGameTags(`${title} ${description}`),
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
    playlists: [],
  };
}
