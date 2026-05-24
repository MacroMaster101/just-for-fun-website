import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Auto-Bootstrapper: Seed the default music track if no tracks exist yet
    const trackCount = await prisma.musicTrack.count();
    if (trackCount === 0) {
      try {
        await prisma.musicTrack.create({
          data: {
            title: "Default Synthwave Theme",
            youtubeId: "h7MYJghRWt0",
            isActive: true,
          },
        });
      } catch (e) {
        console.error("Failed to seed default music track:", e);
      }
    }

    const activeTrack = await prisma.musicTrack.findFirst({
      where: { isActive: true },
    });
    
    if (activeTrack) {
      return NextResponse.json({ youtubeId: activeTrack.youtubeId, title: activeTrack.title }, { status: 200 });
    }
    
    // Default fallback if no tracks are registered/active
    return NextResponse.json({ youtubeId: "h7MYJghRWt0", title: "Default Synthwave Theme" }, { status: 200 });
  } catch (error) {
    console.error("GET Active Music Error:", error);
    return NextResponse.json({ youtubeId: "h7MYJghRWt0", title: "Default Synthwave Theme" }, { status: 200 });
  }
}
