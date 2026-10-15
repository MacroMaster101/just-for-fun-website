import { prisma } from "@/lib/prisma";
import {
  fetchFreshYouTubePayload,
  fallbackStats,
  type YouTubePayload,
} from "@/lib/youtube";

const CACHE_KEY = "main";
// Marker row written when a refresh fails (quota exceeded, API error,
// missing key). Lives in the same table so every serverless instance sees it.
const FAILED_REFRESH_KEY = "main:last-failed-refresh";
// Soft TTL — if a cache hit is older than this, the user-facing route
// triggers a background refresh (stale-while-revalidate). The cron job is
// the primary refresher; this is a safety net.
const STALE_AFTER_MS = 60 * 60 * 1000; // 1 hour
// After a failed refresh, non-forced refreshes wait this long before trying
// again. A failed refresh keeps the old cache (so it stays "stale"), and
// without this every request on every instance retried, spending 100+
// quota units each time until the daily quota ran out.
const RETRY_AFTER_FAILURE_MS = 60 * 60 * 1000; // 1 hour

const emptyPayload: YouTubePayload = {
  source: "fallback",
  fetchedAt: new Date(0).toISOString(),
  message: "Cache is empty. Run /api/youtube/refresh.",
  stats: fallbackStats,
  videos: [],
  playlists: [],
  upcomingStreams: [],
};

let backgroundRefreshInFlight = false;

/**
 * Reads the cached YouTube payload from Postgres.
 * If the cache is empty, fetches synchronously and writes it (cold start).
 * If the cache is stale, returns it immediately and triggers a background refresh.
 * NEVER throws — always returns a usable payload.
 */
export async function getCachedYouTubePayload(): Promise<{
  payload: YouTubePayload;
  cachedAt: Date | null;
  fromCache: boolean;
}> {
  try {
    const row = await prisma.youTubeCache.findUnique({
      where: { key: CACHE_KEY },
    });

    if (!row) {
      // Cold start — populate synchronously so the first visitor gets real data.
      const fresh = await fetchFreshYouTubePayload();
      await writeCache(fresh);
      return { payload: fresh, cachedAt: new Date(), fromCache: false };
    }

    const payload = row.payload as unknown as YouTubePayload;
    const cachedAt = row.updatedAt;
    const age = Date.now() - cachedAt.getTime();

    if (age > STALE_AFTER_MS) {
      // Stale — return immediately and refresh in the background.
      triggerBackgroundRefresh();
    }
    return { payload, cachedAt, fromCache: true };
  } catch (err) {
    console.error("YouTube cache read failed:", err);
    return { payload: emptyPayload, cachedAt: null, fromCache: false };
  }
}

/**
 * Fetches fresh data from YouTube and overwrites the cache row.
 * Used by the cron-triggered /api/youtube/refresh endpoint.
 *
 * Safety: if the fresh fetch returned a fallback (quota exceeded, network
 * error, missing API key), we keep the existing cached payload instead of
 * overwriting it with empty/degraded data — UNLESS the cache is also empty
 * or itself a fallback, in which case writing the new fallback is fine.
 *
 * A failure also starts a backoff: until RETRY_AFTER_FAILURE_MS has passed,
 * non-forced refreshes return the cached payload without calling YouTube.
 * `force` (admin "sync now", cron with ?force=1) skips the backoff.
 */
export async function refreshYouTubeCache({ force = false }: { force?: boolean } = {}): Promise<{
  ok: boolean;
  payload: YouTubePayload;
  skipped?: boolean;
  reason?: string;
}> {
  if (!force) {
    try {
      const failure = await recentRefreshFailure();
      if (failure) {
        return {
          ok: true,
          payload: (await readCachedPayload()) ?? emptyPayload,
          skipped: true,
          reason: `Backing off after a failed refresh: ${failure}`,
        };
      }
    } catch (err) {
      console.error("Refresh backoff check failed:", err);
    }
  }

  const fresh = await fetchFreshYouTubePayload();

  if (fresh.source === "fallback") {
    await recordRefreshFailure(fresh.message).catch((err) =>
      console.error("Recording refresh failure failed:", err)
    );
    try {
      const existingPayload = await readCachedPayload();
      if (existingPayload && existingPayload.source === "youtube") {
        console.warn(
          "YouTube refresh returned fallback; keeping previous good cache.",
          fresh.message
        );
        return {
          ok: true,
          payload: existingPayload,
          skipped: true,
          reason: fresh.message || "fallback returned",
        };
      }
    } catch (err) {
      console.error("Cache read during refresh failed:", err);
    }
  } else {
    await prisma.youTubeCache
      .deleteMany({ where: { key: FAILED_REFRESH_KEY } })
      .catch((err) => console.error("Clearing refresh failure failed:", err));
  }

  try {
    await writeCache(fresh);
    return { ok: true, payload: fresh };
  } catch (err) {
    console.error("YouTube cache write failed:", err);
    return { ok: false, payload: fresh };
  }
}

async function readCachedPayload(): Promise<YouTubePayload | null> {
  const row = await prisma.youTubeCache.findUnique({ where: { key: CACHE_KEY } });
  return (row?.payload as unknown as YouTubePayload | undefined) ?? null;
}

/** The last failure's message if a refresh failed within the backoff window. */
async function recentRefreshFailure(): Promise<string | null> {
  const row = await prisma.youTubeCache.findUnique({
    where: { key: FAILED_REFRESH_KEY },
  });
  if (!row || Date.now() - row.updatedAt.getTime() > RETRY_AFTER_FAILURE_MS) {
    return null;
  }
  const message = (row.payload as { message?: unknown } | null)?.message;
  return typeof message === "string" && message ? message : "refresh failed";
}

async function recordRefreshFailure(message: string | undefined) {
  const payload = { message: message || "refresh failed", at: new Date().toISOString() };
  await prisma.youTubeCache.upsert({
    where: { key: FAILED_REFRESH_KEY },
    create: { key: FAILED_REFRESH_KEY, payload },
    update: { payload },
  });
}

async function writeCache(payload: YouTubePayload) {
  await prisma.youTubeCache.upsert({
    where: { key: CACHE_KEY },
    create: {
      key: CACHE_KEY,
      payload: payload as unknown as object,
    },
    update: {
      payload: payload as unknown as object,
    },
  });
}

function triggerBackgroundRefresh() {
  if (backgroundRefreshInFlight) return;
  backgroundRefreshInFlight = true;
  refreshYouTubeCache()
    .catch((err) => console.error("Background refresh failed:", err))
    .finally(() => {
      backgroundRefreshInFlight = false;
    });
}
