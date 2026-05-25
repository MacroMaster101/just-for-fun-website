import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB cap on uploaded clips
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const BUCKET = "highlights";

/**
 * Pull the YouTube video id out of any of:
 *   - bare 11-char id ("ScMzIvxBSi4")
 *   - https://youtu.be/ID
 *   - https://www.youtube.com/watch?v=ID
 *   - https://www.youtube.com/shorts/ID
 *   - https://www.youtube.com/embed/ID
 */
function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "shorts" || p === "embed");
      if (idx >= 0 && parts[idx + 1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[idx + 1])) {
        return parts[idx + 1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** Public list — only approved highlights, newest first. */
export async function GET() {
  try {
    const highlights = await prisma.highlight.findMany({
      where: { status: "approved" },
      orderBy: { reviewedAt: "desc" },
      select: {
        id: true,
        title: true,
        game: true,
        description: true,
        duration: true,
        source: true,
        youtubeId: true,
        videoUrl: true,
        thumbnailUrl: true,
        submittedByName: true,
        submittedByAvatar: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ highlights });
  } catch (err) {
    console.error("GET /api/highlights failed:", err);
    return NextResponse.json({ highlights: [] });
  }
}

/**
 * Submit a new highlight.
 * - Content-Type: application/json → YouTube link submission
 * - Content-Type: multipart/form-data → uploaded video file (field "file")
 *
 * Either way, anonymous submissions are allowed: caller supplies
 * submittedByName when not logged in. Logged-in users get attribution
 * from their Profile automatically.
 */
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  let title = "";
  let game = "";
  let description = "";
  let duration = "";
  let youtubeUrl = "";
  let displayName = "";
  let file: File | null = null;

  if (isMultipart) {
    const form = await request.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
    }
    title = String(form.get("title") ?? "").trim();
    game = String(form.get("game") ?? "").trim();
    description = String(form.get("description") ?? "").trim();
    duration = String(form.get("duration") ?? "").trim();
    youtubeUrl = String(form.get("youtubeUrl") ?? "").trim();
    displayName = String(form.get("submittedByName") ?? "").trim();
    const maybeFile = form.get("file");
    if (maybeFile instanceof File && maybeFile.size > 0) file = maybeFile;
  } else {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    title = str(body.title);
    game = str(body.game);
    description = str(body.description);
    duration = str(body.duration);
    youtubeUrl = str(body.youtubeUrl);
    displayName = str(body.submittedByName);
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!youtubeUrl && !file) {
    return NextResponse.json(
      { error: "Provide a YouTube link or upload a video file." },
      { status: 400 }
    );
  }

  // Attribution defaults — logged-in user > submitted name > "Anonymous".
  let submittedByName = "Anonymous";
  let submittedByAvatar = "";
  if (user) {
    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    submittedByName = profile?.name?.trim() || user.email?.split("@")[0] || "Crew Member";
    submittedByAvatar = profile?.avatarUrl ?? "";
  } else if (displayName) {
    submittedByName = displayName.slice(0, 60);
  }

  // YouTube path — extract id, build canonical thumbnail.
  if (youtubeUrl) {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not parse YouTube link. Paste a full video URL or 11-char id." },
        { status: 400 }
      );
    }
    const highlight = await prisma.highlight.create({
      data: {
        title: title.slice(0, 160),
        game: game.slice(0, 60),
        description: description.slice(0, 500),
        duration: duration.slice(0, 12),
        source: "youtube",
        youtubeId: videoId,
        videoUrl: null,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        status: "pending",
        submittedByUserId: user?.id ?? null,
        submittedByName,
        submittedByAvatar,
      },
    });
    return NextResponse.json({ success: true, highlight }, { status: 201 });
  }

  // File upload path — push to Supabase storage, store public URL.
  if (!file) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: `Video too large (max ${MAX_VIDEO_BYTES / 1024 / 1024} MB).` },
      { status: 400 }
    );
  }
  if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported video type. Use MP4, WebM, or MOV." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = supabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const ext =
    file.type === "video/webm" ? "webm" : file.type === "video/quicktime" ? "mov" : "mp4";
  const ownerSegment = user?.id ?? "anon";
  const path = `${ownerSegment}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });
  if (uploadErr) {
    console.error("Highlight upload failed:", uploadErr.message);
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);

  const highlight = await prisma.highlight.create({
    data: {
      title: title.slice(0, 160),
      game: game.slice(0, 60),
      description: description.slice(0, 500),
      duration: duration.slice(0, 12),
      source: "upload",
      youtubeId: null,
      videoUrl: pub.publicUrl,
      thumbnailUrl: "",
      status: "pending",
      submittedByUserId: user?.id ?? null,
      submittedByName,
      submittedByAvatar,
    },
  });
  return NextResponse.json({ success: true, highlight }, { status: 201 });
}
