import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedYouTubePayload } from "@/lib/youtubeCache";

// Dynamic for the same reason as /api/youtube: reading the YouTube cache can
// start a background refresh, which can't run inside a static re-render.
// Edge-cached for 60s via Cache-Control instead of ISR.
export const dynamic = "force-dynamic";
const CACHE_HEADERS = { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" };

/**
 * Public stream schedule. Two sources merged into one response:
 *   - `slots` — manual recurring slots from the SiteSetting-style admin
 *     CRUD. The "this is what we stream every week" rhythm.
 *   - `upcomingStreams` — auto-pulled from the cached YouTube payload
 *     (eventType=upcoming). One-off scheduled streams the channel owner
 *     created on YouTube itself.
 * Empty both → homepage shows a "Coming soon" placeholder.
 */
export async function GET() {
  try {
    const [slots, payload] = await Promise.all([
      prisma.streamSlot.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      }),
      getCachedYouTubePayload().then((r) => r.payload).catch(() => null),
    ]);

    return NextResponse.json(
      {
        slots,
        upcomingStreams: payload?.upcomingStreams ?? [],
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error("GET public schedule failed:", error);
    return NextResponse.json({ slots: [], upcomingStreams: [] });
  }
}
