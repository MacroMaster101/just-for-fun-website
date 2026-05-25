import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";
import { getCachedYouTubePayload } from "@/lib/youtubeCache";

export const dynamic = "force-dynamic";

async function verifyAdmin(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return null;
  const email = data.user.email.toLowerCase().trim();
  const rootAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdmin && email === rootAdmin) return email;
  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return match ? email : null;
}

interface StreamSlotInput {
  day?: unknown;
  title?: unknown;
  time?: unknown;
  description?: unknown;
  icon?: unknown;
  featured?: unknown;
  sortOrder?: unknown;
}

function normalize(raw: StreamSlotInput) {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v.trim() : fallback;
  return {
    day: str(raw.day).toUpperCase().slice(0, 6),
    title: str(raw.title),
    time: str(raw.time),
    description: str(raw.description),
    icon: str(raw.icon, "🎮"),
    featured: raw.featured === true,
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 0,
  };
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  // Same two sources the public /api/schedule merges, so the admin can
  // see exactly what visitors are seeing — manual slots they edit AND
  // upcoming streams auto-pulled from YouTube during the cron refresh.
  // Also surfaces fetchedAt so the admin knows how stale the YouTube
  // pull is and whether to hit Sync Cache.
  const [slots, payload] = await Promise.all([
    prisma.streamSlot.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    getCachedYouTubePayload()
      .then((r) => ({ payload: r.payload, cachedAt: r.cachedAt }))
      .catch(() => ({ payload: null, cachedAt: null as Date | null })),
  ]);

  return NextResponse.json({
    slots,
    upcomingStreams: payload.payload?.upcomingStreams ?? [],
    youtubeCachedAt: payload.cachedAt?.toISOString() ?? null,
  });
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const data = normalize(await request.json().catch(() => ({})));
  if (!data.day || !data.title || !data.time) {
    return NextResponse.json(
      { error: "Day, title, and time are required." },
      { status: 400 }
    );
  }
  // Clear other "featured" rows if this one is featured — only one
  // headline slot at a time.
  const slot = await prisma.$transaction(async (tx) => {
    if (data.featured) {
      await tx.streamSlot.updateMany({ data: { featured: false } });
    }
    return tx.streamSlot.create({ data });
  });
  return NextResponse.json({ success: true, slot }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { id?: unknown } & StreamSlotInput;
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Slot id is required." }, { status: 400 });
  }
  const data = normalize(body);
  if (!data.day || !data.title || !data.time) {
    return NextResponse.json(
      { error: "Day, title, and time are required." },
      { status: 400 }
    );
  }
  const id = body.id;
  const slot = await prisma.$transaction(async (tx) => {
    if (data.featured) {
      // Unfeature every other row before promoting this one.
      await tx.streamSlot.updateMany({
        where: { NOT: { id } },
        data: { featured: false },
      });
    }
    return tx.streamSlot.update({ where: { id }, data });
  });
  return NextResponse.json({ success: true, slot });
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Slot id is required." }, { status: 400 });
  }
  await prisma.streamSlot.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
