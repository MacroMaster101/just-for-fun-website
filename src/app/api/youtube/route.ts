import { NextResponse } from "next/server";
import { getCachedYouTubePayload } from "@/lib/youtubeCache";

// Dynamic (not ISR): a stale cache starts a background refresh via after(),
// and the YouTube/RSS fetches inside it are rejected during a static
// re-render ("Dynamic server usage"). Visitors are still served from
// Vercel's edge cache through the Cache-Control header below.
export const dynamic = "force-dynamic";

export async function GET() {
  const { payload, cachedAt } = await getCachedYouTubePayload();

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
      "X-YT-Cached-At": cachedAt?.toISOString() ?? "none",
    },
  });
}
