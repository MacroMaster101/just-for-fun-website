import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

/**
 * Public list of games shown in the hero marquee strip. Empty array =
 * the homepage falls back to the text-only DEFAULT_MARQUEE.
 */
export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ games });
  } catch (error) {
    console.error("GET public games failed:", error);
    return NextResponse.json({ games: [] });
  }
}
