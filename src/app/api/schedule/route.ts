import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCachedYouTubePayload } from "@/lib/youtubeCache";

export const revalidate = 60;

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

    return NextResponse.json({
      slots,
      upcomingStreams: payload?.upcomingStreams ?? [],
    });
  } catch (error) {
    console.error("GET public schedule failed:", error);
    return NextResponse.json({ slots: [], upcomingStreams: [] });
  }
}
