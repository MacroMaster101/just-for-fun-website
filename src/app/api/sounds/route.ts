import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

/**
 * Public soundboard feed. Empty DB → the consumer falls back to
 * DEFAULT_SOUNDS in src/lib/soundboardDefaults.ts so the homepage never
 * renders an empty grid on a fresh install.
 */
export async function GET() {
  try {
    const sounds = await prisma.soundClip.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ sounds });
  } catch (err) {
    console.error("GET /api/sounds failed:", err);
    return NextResponse.json({ sounds: [] });
  }
}
