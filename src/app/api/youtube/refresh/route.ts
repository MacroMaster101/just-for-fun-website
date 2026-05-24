import { NextResponse, type NextRequest } from "next/server";
import { refreshYouTubeCache } from "@/lib/youtubeCache";

// Don't cache the refresh endpoint itself — it must always run.
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET?.trim();

function isAuthorized(req: NextRequest): boolean {
  if (!CRON_SECRET) {
    // If no secret is configured, refuse in production.
    return process.env.NODE_ENV !== "production";
  }
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${CRON_SECRET}`) return true;
  // Manual trigger: /api/youtube/refresh?key=<CRON_SECRET>
  const key = req.nextUrl.searchParams.get("key");
  return key === CRON_SECRET;
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { ok, payload, skipped, reason } = await refreshYouTubeCache();
  return NextResponse.json({
    ok,
    skipped: skipped ?? false,
    reason: reason ?? null,
    source: payload.source,
    fetchedAt: payload.fetchedAt,
    videoCount: payload.videos.length,
    message: payload.message ?? null,
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
