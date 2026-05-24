import { NextResponse } from "next/server";
import { getCachedYouTubePayload } from "@/lib/youtubeCache";

// 15 min Next ISR + 1 h SWR on top of the Postgres cache.
export const revalidate = 900;

export async function GET() {
  const { payload, cachedAt } = await getCachedYouTubePayload();

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "s-maxage=900, stale-while-revalidate=3600",
      "X-YT-Cached-At": cachedAt?.toISOString() ?? "none",
    },
  });
}
