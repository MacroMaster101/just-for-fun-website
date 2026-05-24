import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
