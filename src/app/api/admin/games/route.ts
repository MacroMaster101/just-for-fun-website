import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
