import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

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

interface GameInput {
  name?: unknown;
  logoUrl?: unknown;
  sortOrder?: unknown;
}

function normalize(raw: GameInput) {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v.trim() : fallback;
  return {
    name: str(raw.name).slice(0, 60),
    logoUrl: str(raw.logoUrl),
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 0,
  };
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const games = await prisma.game.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ games });
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const data = normalize(await request.json().catch(() => ({})));
  if (!data.name) {
    return NextResponse.json({ error: "Game name is required." }, { status: 400 });
  }
  const game = await prisma.game.create({ data });
  return NextResponse.json({ success: true, game }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { id?: unknown } & GameInput;
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Game id is required." }, { status: 400 });
  }
  const data = normalize(body);
  if (!data.name) {
    return NextResponse.json({ error: "Game name is required." }, { status: 400 });
  }
  const game = await prisma.game.update({ where: { id: body.id }, data });
  return NextResponse.json({ success: true, game });
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Game id is required." }, { status: 400 });
  }
  await prisma.game.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
