import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_BYTES = 150 * 1024 * 1024; // 150 MB — allows large music tracks (e.g. 1-hour lofi mix)
const ALLOWED_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
]);
const BUCKET = "sound-clips";

async function verifyAdmin() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return false;
  const email = data.user.email.toLowerCase().trim();
  const rootAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdmin && email === rootAdmin) return true;
  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return !!match;
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    const title = formData?.get("title");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (typeof title !== "string" || !title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Audio file too large (max ${MAX_BYTES / 1024 / 1024} MB).` },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported audio type. Use MP3, WAV, OGG, or WebM." },
        { status: 400 }
      );
    }

    const ext =
      file.type.includes("wav") ? "wav"
        : file.type.includes("ogg") ? "ogg"
        : file.type.includes("webm") ? "webm"
        : "mp3";
    
    const trackId = crypto.randomUUID();
    const path = `music/${trackId}.${ext}`;

    let admin;
    try {
      admin = supabaseAdmin();
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }

    // Auto-create bucket if missing
    try {
      const { data: buckets, error: listError } = await admin.storage.listBuckets();
      if (!listError && buckets) {
        const hasBucket = buckets.some((b) => b.id === BUCKET);
        if (!hasBucket) {
          await admin.storage.createBucket(BUCKET, { public: true });
        }
      }
    } catch (err) {
      console.error("Auto-bucket verification failed:", err);
    }

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });
    if (uploadErr) {
      console.error("Music track upload failed:", uploadErr.message);
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    const audioUrl = pub.publicUrl;

    const count = await prisma.musicTrack.count();
    const shouldBeActive = count === 0;

    const newTrack = await prisma.musicTrack.create({
      data: {
        id: trackId,
        title: title.trim(),
        youtubeId: audioUrl, // Save Supabase public audio url inside youtubeId
        isActive: shouldBeActive,
      },
    });

    return NextResponse.json({ success: true, track: newTrack }, { status: 201 });
  } catch (error) {
    console.error("POST Music Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload and create music track" }, { status: 500 });
  }
}
