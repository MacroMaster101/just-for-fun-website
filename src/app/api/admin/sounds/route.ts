import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["laser", "chime", "powerup", "fanfare", "buzzer", "subbass"]);

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

interface SoundInput {
  name?: unknown;
  emoji?: unknown;
  source?: unknown;
  type?: unknown;
  audioUrl?: unknown;
  description?: unknown;
  color?: unknown;
  sortOrder?: unknown;
}

function normalize(raw: SoundInput) {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v.trim() : fallback;
  const type = str(raw.type, "laser");
  const source = raw.source === "upload" ? "upload" : "synth";
  return {
    name: str(raw.name).slice(0, 60),
    emoji: str(raw.emoji, "🎮").slice(0, 8),
    source: source as "synth" | "upload",
    type: ALLOWED_TYPES.has(type) ? type : "laser",
    audioUrl: str(raw.audioUrl),
    description: str(raw.description).slice(0, 200),
    color: str(
      raw.color,
      "hover:border-[#ff0033] hover:shadow-[0_0_15px_rgba(255,0,51,0.25)] text-[#ff4b5f]"
    ),
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 0,
  };
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const sounds = await prisma.soundClip.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ sounds });
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const data = normalize(await request.json().catch(() => ({})));
  if (!data.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const sound = await prisma.soundClip.create({ data });
  return NextResponse.json({ success: true, sound }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { id?: unknown } & SoundInput;
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Sound id is required." }, { status: 400 });
  }
  const data = normalize(body);
  if (!data.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const sound = await prisma.soundClip.update({ where: { id: body.id }, data });
  return NextResponse.json({ success: true, sound });
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Sound id is required." }, { status: 400 });
  }
  await prisma.soundClip.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
