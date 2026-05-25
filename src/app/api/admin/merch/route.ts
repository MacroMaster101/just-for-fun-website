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

const GRADES = ["LEGENDARY", "RARE", "COMMON"] as const;
type Grade = (typeof GRADES)[number];

interface MerchInput {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  emoji?: unknown;
  imageUrl?: unknown;
  grade?: unknown;
  sortOrder?: unknown;
}

function normalize(raw: MerchInput) {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v.trim() : fallback;
  const num = (v: unknown, fallback = 0) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  const grade: Grade = GRADES.includes(raw.grade as Grade)
    ? (raw.grade as Grade)
    : "COMMON";
  return {
    name: str(raw.name).slice(0, 80),
    description: str(raw.description).slice(0, 500),
    price: Math.max(0, num(raw.price)),
    emoji: str(raw.emoji, "🛍️").slice(0, 8),
    imageUrl: str(raw.imageUrl),
    grade,
    sortOrder: Math.trunc(num(raw.sortOrder)),
  };
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const items = await prisma.merchItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const data = normalize(await request.json().catch(() => ({})));
  if (!data.name) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }
  const item = await prisma.merchItem.create({ data });
  return NextResponse.json({ success: true, item }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { id?: unknown } & MerchInput;
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  }
  const data = normalize(body);
  if (!data.name) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }
  const item = await prisma.merchItem.update({ where: { id: body.id }, data });
  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Product id is required." }, { status: 400 });
  }
  await prisma.merchItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
