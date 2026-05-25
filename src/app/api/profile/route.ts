import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
