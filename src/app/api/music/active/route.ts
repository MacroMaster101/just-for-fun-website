import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_VOLUME = 35;
const QUERY_TIMEOUT_MS = 3000;

function parseVolume(value?: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return DEFAULT_VOLUME;
  return Math.min(100, Math.max(0, parsed));
}

export async function GET() {
  try {
    const query = Promise.all([
      prisma.musicTrack.findFirst({
        where: { isActive: true },
      }),
      prisma.siteSetting.findUnique({
        where: { key: "music.volume" },
      }),
    ]).catch((error) => {
      console.error("GET Active Music DB Error:", error);
      return null;
    });

    const result = await Promise.race([
      query,
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), QUERY_TIMEOUT_MS)
      ),
    ]);
    const [activeTrack, volumeSetting] = result ?? [null, null];
    const volume = parseVolume(volumeSetting?.value);

    if (activeTrack) {
      return NextResponse.json(
        { youtubeId: activeTrack.youtubeId, title: activeTrack.title, volume },
        { status: 200 }
      );
    }

    // Default fallback if no tracks are registered/active
    return NextResponse.json({ youtubeId: "h7MYJghRWt0", title: "Default Synthwave Theme", volume }, { status: 200 });
  } catch (error) {
    console.error("GET Active Music Error:", error);
    return NextResponse.json(
      { youtubeId: "h7MYJghRWt0", title: "Default Synthwave Theme", volume: DEFAULT_VOLUME },
      { status: 200 }
    );
  }
}
