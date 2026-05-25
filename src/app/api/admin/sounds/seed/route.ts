import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";
import { DEFAULT_SOUNDS } from "@/lib/soundboardDefaults";

export const dynamic = "force-dynamic";

async function verifyAdmin(): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return false;
  const email = data.user.email.toLowerCase().trim();
  const rootAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdmin && email === rootAdmin) return true;
  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return !!match;
}

/**
 * Copies the built-in DEFAULT_SOUNDS into the SoundClip table. Idempotent:
 * inserts only the defaults whose name isn't already present, so calling
 * this a second time after we add new defaults will "top up" the missing
 * ones without duplicating the originals.
 */
export async function POST() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const existing = await prisma.soundClip.findMany({ select: { name: true } });
  const taken = new Set(existing.map((s) => s.name));
  const missing = DEFAULT_SOUNDS.filter((s) => !taken.has(s.name));

  if (missing.length === 0) {
    return NextResponse.json({ success: true, inserted: 0, skipped: existing.length });
  }

  const startOrder = await prisma.soundClip.count();
  const created = await prisma.soundClip.createMany({
    data: missing.map((s, i) => ({
      name: s.name,
      emoji: s.emoji,
      source: s.source,
      type: s.type,
      audioUrl: s.audioUrl,
      description: s.description,
      color: s.color,
      sortOrder: startOrder + i,
    })),
  });

  return NextResponse.json({
    success: true,
    inserted: created.count,
    skipped: existing.length,
  });
}
