import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "avatars";

type AuthMetadata = Record<string, unknown> | null | undefined;

/** GET - return the current user's profile, creating it on first access. */
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const metadata = user.user_metadata as AuthMetadata;
  const metadataName =
    metadataText(metadata, "full_name") || metadataText(metadata, "name");
  const metadataAvatar =
    metadataText(metadata, "avatar_url") || metadataText(metadata, "picture");

  const existing = await prisma.profile.findUnique({ where: { id: user.id } });
  const profile = existing
    ? await prisma.profile.update({
        where: { id: user.id },
        data: {
          email: user.email ?? null,
          name: existing.name?.trim() ? undefined : metadataName,
          avatarUrl: existing.avatarUrl?.trim() ? undefined : metadataAvatar,
        },
      })
    : await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email ?? null,
          name: metadataName,
          avatarUrl: metadataAvatar,
        },
      });

  return NextResponse.json({ profile });
}

function metadataText(metadata: AuthMetadata, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** PATCH - update the current user's editable profile fields. */
export async function PATCH(request: Request) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: string; avatarUrl?: string; bio?: string }
    | null;
  if (!body) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const profile = await prisma.profile.update({
    where: { id: user.id },
    data: {
      name: typeof body.name === "string" ? body.name.slice(0, 60) : undefined,
      avatarUrl:
        typeof body.avatarUrl === "string"
          ? body.avatarUrl.slice(0, 500)
          : undefined,
      bio: typeof body.bio === "string" ? body.bio.slice(0, 500) : undefined,
    },
  });

  return NextResponse.json({ profile });
}

/**
 * DELETE - wipe the current user's account. Removes:
 *   1. Every file under `avatars/<userId>/` in Supabase Storage
 *   2. The Profile row, cascading to Favorite rows via the Prisma relation
 *   3. The auth.users row via the service-role admin client, signing out
 *      every active session at the same time
 *
 * Refuses to delete admin accounts so an admin does not accidentally lock
 * themselves out. They must remove themselves from the AdminEmail allowlist
 * or change NEXT_PUBLIC_ADMIN_EMAIL first.
 */
export async function DELETE() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = user.email?.toLowerCase().trim() ?? "";
  const rootAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdmin && email === rootAdmin) {
    return NextResponse.json(
      {
        error:
          "Root admin cannot be deleted from the UI. Update NEXT_PUBLIC_ADMIN_EMAIL first.",
      },
      { status: 403 }
    );
  }
  if (email) {
    const isListedAdmin = await prisma.adminEmail.findUnique({
      where: { email },
    });
    if (isListedAdmin) {
      return NextResponse.json(
        {
          error:
            "Admin accounts must be removed from the allowlist before deletion.",
        },
        { status: 403 }
      );
    }
  }

  let admin;
  try {
    admin = supabaseAdmin();
  } catch (err) {
    console.error("Service role client unavailable:", err);
    return NextResponse.json(
      { error: "Server is missing service-role credentials." },
      { status: 500 }
    );
  }

  try {
    const { data: files } = await admin.storage
      .from(AVATAR_BUCKET)
      .list(user.id);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from(AVATAR_BUCKET).remove(paths);
    }
  } catch (err) {
    console.error("Avatar cleanup failed (continuing):", err);
  }

  try {
    await prisma.profile.deleteMany({ where: { id: user.id } });
  } catch (err) {
    console.error("Profile delete failed:", err);
    return NextResponse.json(
      { error: "Failed to delete profile data." },
      { status: 500 }
    );
  }

  const { error: authErr } = await admin.auth.admin.deleteUser(user.id);
  if (authErr) {
    console.error("Auth user delete failed:", authErr.message);
    return NextResponse.json(
      { error: "Failed to delete authentication record." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
