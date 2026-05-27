import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const KINDS = new Set(["video", "sound"]);

async function getFavoriteUser(): Promise<{
  user: User | null;
  authUnavailable: boolean;
}> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { user, authUnavailable: false };
  } catch (error) {
    console.warn("Favorites auth check unavailable:", error);
    return { user: null, authUnavailable: true };
  }
}

/** GET — list current user's favorites, optionally filtered by ?kind=video|sound */
export async function GET(request: Request) {
  const { user } = await getFavoriteUser();
  if (!user) {
    return NextResponse.json({ favorites: [] }, { status: 200 });
  }

  const kind = new URL(request.url).searchParams.get("kind");
  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.id,
        ...(kind && KINDS.has(kind) ? { kind: kind as "video" | "sound" } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("GET Favorites Error:", error);
    return NextResponse.json({ favorites: [] }, { status: 200 });
  }
}

/** POST — add a favorite. Body: { kind: "video"|"sound", itemId, itemTitle? } */
export async function POST(request: Request) {
  const { user, authUnavailable } = await getFavoriteUser();
  if (authUnavailable) {
    return NextResponse.json({ error: "auth unavailable" }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { kind?: string; itemId?: string; itemTitle?: string }
    | null;
  if (!body || !body.kind || !body.itemId || !KINDS.has(body.kind)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    // Ensure profile exists (first-favorite-before-profile-load case).
    await prisma.profile.upsert({
      where: { id: user.id },
      create: { id: user.id, email: user.email },
      update: {},
    });

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_kind_itemId: {
          userId: user.id,
          kind: body.kind as "video" | "sound",
          itemId: body.itemId,
        },
      },
      create: {
        userId: user.id,
        kind: body.kind as "video" | "sound",
        itemId: body.itemId,
        itemTitle: body.itemTitle ?? null,
      },
      update: {
        itemTitle: body.itemTitle ?? null,
      },
    });

    return NextResponse.json({ favorite });
  } catch (error) {
    console.error("POST Favorite Error:", error);
    return NextResponse.json({ error: "favorites unavailable" }, { status: 503 });
  }
}

/** DELETE — remove a favorite. Body: { kind, itemId } */
export async function DELETE(request: Request) {
  const { user, authUnavailable } = await getFavoriteUser();
  if (authUnavailable) {
    return NextResponse.json({ error: "auth unavailable" }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { kind?: string; itemId?: string }
    | null;
  if (!body || !body.kind || !body.itemId || !KINDS.has(body.kind)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        kind: body.kind as "video" | "sound",
        itemId: body.itemId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE Favorite Error:", error);
    return NextResponse.json({ error: "favorites unavailable" }, { status: 503 });
  }
}
