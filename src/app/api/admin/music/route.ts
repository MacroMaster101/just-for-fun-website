import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

// Helper function to verify administrator permission
async function verifyAdmin() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return false;

  const email = data.user.email.toLowerCase().trim();
  const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();

  if (rootAdminEmail && email === rootAdminEmail) {
    return true;
  }

  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return !!match;
}

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const tracks = await prisma.musicTrack.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tracks }, { status: 200 });
  } catch (error) {
    console.error("GET Music Tracks Error:", error);
    return NextResponse.json({ error: "Failed to load music tracks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { title, youtubeId } = await request.json();
    if (!title || !youtubeId) {
      return NextResponse.json({ error: "Title and YouTube Video ID are required." }, { status: 400 });
    }

    const cleanYoutubeId = youtubeId.trim();
    const cleanTitle = title.trim();

    // Check if video ID already exists
    const existing = await prisma.musicTrack.findUnique({
      where: { youtubeId: cleanYoutubeId },
    });

    if (existing) {
      return NextResponse.json({ error: "This YouTube video is already registered." }, { status: 400 });
    }

    // If this is the first track, make it active by default
    const count = await prisma.musicTrack.count();
    const shouldBeActive = count === 0;

    const newTrack = await prisma.musicTrack.create({
      data: {
        title: cleanTitle,
        youtubeId: cleanYoutubeId,
        isActive: shouldBeActive,
      },
    });

    return NextResponse.json({ success: true, track: newTrack }, { status: 201 });
  } catch (error) {
    console.error("POST Music Track Error:", error);
    return NextResponse.json({ error: "Failed to add music track" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Track ID is required." }, { status: 400 });
    }

    // Set all tracks to inactive
    await prisma.musicTrack.updateMany({
      data: { isActive: false },
    });

    // Set the selected track to active
    const activeTrack = await prisma.musicTrack.update({
      where: { id },
      data: { isActive: true },
    });

    return NextResponse.json({ success: true, track: activeTrack }, { status: 200 });
  } catch (error) {
    console.error("PATCH Music Track Error:", error);
    return NextResponse.json({ error: "Failed to activate music track" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Track ID is required." }, { status: 400 });
    }

    // Check if the track being deleted is currently active
    const track = await prisma.musicTrack.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found." }, { status: 404 });
    }

    await prisma.musicTrack.delete({
      where: { id },
    });

    // If the deleted track was active, set the most recent track to active
    if (track.isActive) {
      const nextTrack = await prisma.musicTrack.findFirst({
        orderBy: { createdAt: "desc" },
      });
      if (nextTrack) {
        await prisma.musicTrack.update({
          where: { id: nextTrack.id },
          data: { isActive: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Music track deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("DELETE Music Track Error:", error);
    return NextResponse.json({ error: "Failed to delete music track" }, { status: 500 });
  }
}
