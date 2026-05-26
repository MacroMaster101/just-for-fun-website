import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Admin reads are user-specific and write-heavy; never serve a cached response.
export const dynamic = "force-dynamic";

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

    const cleanYoutubeId = extractYoutubeId(String(youtubeId).trim());
    if (!cleanYoutubeId) {
      return NextResponse.json(
        { error: "Could not parse a YouTube video ID. Paste a youtube.com/watch?v=… URL, a youtu.be/… URL, or just the 11-character ID." },
        { status: 400 }
      );
    }
    const cleanTitle = String(title).trim();

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

    // Atomic switch: clear all `isActive` flags and set the target row in a
    // single transaction so a concurrent reader can't see an intermediate
    // state where zero rows are active. Also returns the fresh list so the
    // client can render the new state without a second GET round-trip
    // (which previously raced the pooled-connection commit on Supabase).
    const tracks = await prisma.$transaction(async (tx) => {
      await tx.musicTrack.updateMany({ data: { isActive: false } });
      await tx.musicTrack.update({ where: { id }, data: { isActive: true } });
      return tx.musicTrack.findMany({ orderBy: { createdAt: "desc" } });
    });

    return NextResponse.json({ success: true, tracks }, { status: 200 });
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

    // If it's an uploaded track (stored as http URL), delete it from Supabase storage
    if (track.youtubeId && track.youtubeId.startsWith("http")) {
      try {
        const urlObj = new URL(track.youtubeId);
        const pathParts = urlObj.pathname.split("/sound-clips/");
        if (pathParts.length > 1) {
          const storagePath = decodeURIComponent(pathParts[1]);
          const admin = supabaseAdmin();
          await admin.storage.from("sound-clips").remove([storagePath]);
        }
      } catch (err) {
        console.error("Failed to delete music track from Supabase storage:", err);
      }
    }

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

/**
 * Extracts a YouTube video id from any common input format:
 *   - 11-char id as-is (aHGSiXwiA-g)
 *   - youtu.be short link (https://youtu.be/aHGSiXwiA-g?si=...)
 *   - youtube.com/watch?v=... (with or without extra params)
 *   - youtube.com/embed/... or youtube.com/shorts/...
 * Returns null if no valid id can be parsed.
 */
function extractYoutubeId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Already an id?
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // Try URL parsing.
  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const vParam = url.searchParams.get("v");
      if (vParam && /^[A-Za-z0-9_-]{11}$/.test(vParam)) return vParam;

      // /embed/ID or /shorts/ID or /live/ID
      const match = url.pathname.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
      if (match) return match[1];
    }
  } catch {
    // Not a URL — fall through.
  }

  // Last resort: find an 11-char id anywhere in the string.
  const loose = trimmed.match(/[A-Za-z0-9_-]{11}/);
  return loose ? loose[0] : null;
}
