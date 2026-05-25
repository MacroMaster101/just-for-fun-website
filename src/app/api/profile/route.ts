import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "avatars";

/** GET — return the current user's profile, creating it on first access. */
export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      name:
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        null,
      avatarUrl:
        (user.user_metadata?.avatar_url as string | undefined) ||
        (user.user_metadata?.picture as string | undefined) ||
        null,
    },
    update: {},
  });

  return NextResponse.json({ profile });
}

/** PATCH — update the current user's editable profile fields. */
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
 * DELETE — wipe the current user's account. Removes:
 *   1. Every file under `avatars/<userId>/` in Supabase Storage
 *   2. The Profile row (cascades to Favorite rows via the Prisma relation)
 *   3. The auth.users row via the service-role admin client, which signs
 *      every active session out at the same time
 *
 * Refuses to delete admin accounts so an admin doesn't accidentally lock
 * themselves out — they must remove themselves from the AdminEmail
 * allowlist (or change NEXT_PUBLIC_ADMIN_EMAIL) first.
 */
export async function DELETE() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Block admin self-delete.
  const email = user.email?.toLowerCase().trim() ?? "";
  const rootAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdmin && email === rootAdmin) {
    return NextResponse.json(
      { error: "Root admin cannot be deleted from the UI. Update NEXT_PUBLIC_ADMIN_EMAIL first." },
      { status: 403 }
    );
  }
  if (email) {
    const isListedAdmin = await prisma.adminEmail.findUnique({
      where: { email },
    });
    if (isListedAdmin) {
      return NextResponse.json(
        { error: "Admin accounts must be removed from the allowlist before deletion." },
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

  // 1. Best-effort: clean out the user's avatar folder. Don't fail the
  //    whole request if storage is flaky — auth deletion still proceeds.
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

  // 2. Delete the Profile row. The Favorite -> Profile relation has
  //    onDelete: Cascade so favorites disappear automatically. Use
  //    deleteMany to no-op cleanly if the row doesn't exist.
  try {
    await prisma.profile.deleteMany({ where: { id: user.id } });
  } catch (err) {
    console.error("Profile delete failed:", err);
    return NextResponse.json(
      { error: "Failed to delete profile data." },
      { status: 500 }
    );
  }

  // 3. Delete the auth.users row. This invalidates all sessions for the
  //    user; the client should immediately treat itself as signed out.
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
