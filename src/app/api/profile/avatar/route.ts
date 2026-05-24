import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const BUCKET = "avatars";

/**
 * POST a multipart form with field `file` (an image).
 * Uploads to Supabase Storage, returns the public URL, and patches Profile.avatarUrl.
 */
export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use PNG, JPG, WebP, or GIF." },
      { status: 400 }
    );
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  // Path is user-scoped so each user owns their own folder.
  // Storage RLS policies enforce that only the owner can write here.
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadErr) {
    console.error("Avatar upload failed:", uploadErr.message);
    return NextResponse.json(
      { error: uploadErr.message },
      { status: 500 }
    );
  }

  // Public bucket → public URL is deterministic.
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const avatarUrl = pub.publicUrl;

  // Update profile row.
  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email, avatarUrl },
    update: { avatarUrl },
  });

  // Also mirror to Supabase Auth user_metadata so OAuth-derived avatars
  // are overridden everywhere we read from user.user_metadata.
  await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl, picture: avatarUrl },
  });

  return NextResponse.json({ profile, avatarUrl });
}

/** DELETE — clear the avatar back to default (OAuth provider's or initial). */
export async function DELETE() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.update({
    where: { id: user.id },
    data: { avatarUrl: null },
  });

  // Reset user_metadata overrides as well.
  await supabase.auth.updateUser({
    data: { avatar_url: null, picture: null },
  });

  return NextResponse.json({ profile });
}
