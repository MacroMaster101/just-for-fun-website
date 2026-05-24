import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return false;

  const email = data.user.email.toLowerCase().trim();
  const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdminEmail && email === rootAdminEmail) return true;

  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return !!match;
}

interface SquadMemberInput {
  name?: unknown;
  role?: unknown;
  avatarUrl?: unknown;
  favoriteGames?: unknown;
  signatureAgent?: unknown;
  twitchUrl?: unknown;
  cpu?: unknown;
  gpu?: unknown;
  ram?: unknown;
  monitor?: unknown;
  mouse?: unknown;
  bio?: unknown;
  combatStyle?: unknown;
  sortOrder?: unknown;
}

function normalizeInput(raw: SquadMemberInput) {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v.trim() : fallback;
  const games = Array.isArray(raw.favoriteGames)
    ? raw.favoriteGames
        .map((g) => (typeof g === "string" ? g.trim() : ""))
        .filter((g) => g.length > 0)
    : [];

  return {
    name: str(raw.name),
    role: str(raw.role),
    avatarUrl: str(raw.avatarUrl),
    favoriteGames: games,
    signatureAgent: str(raw.signatureAgent),
    twitchUrl: typeof raw.twitchUrl === "string" && raw.twitchUrl.trim()
      ? raw.twitchUrl.trim()
      : null,
    cpu: str(raw.cpu),
    gpu: str(raw.gpu),
    ram: str(raw.ram),
    monitor: str(raw.monitor),
    mouse: str(raw.mouse),
    bio: str(raw.bio),
    combatStyle: str(raw.combatStyle),
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 0,
  };
}

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    const members = await prisma.squadMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ members });
  } catch (error) {
    console.error("GET Squad Error:", error);
    return NextResponse.json({ error: "Failed to load squad" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    const body = await request.json();
    const data = normalizeInput(body);
    if (!data.name || !data.role) {
      return NextResponse.json(
        { error: "Name and role are required." },
        { status: 400 }
      );
    }
    const member = await prisma.squadMember.create({ data });
    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    console.error("POST Squad Error:", error);
    return NextResponse.json({ error: "Failed to add squad member" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    const body = await request.json();
    const { id, ...rest } = body as { id?: unknown } & SquadMemberInput;
    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Member id is required." }, { status: 400 });
    }
    const data = normalizeInput(rest);
    if (!data.name || !data.role) {
      return NextResponse.json(
        { error: "Name and role are required." },
        { status: 400 }
      );
    }
    const member = await prisma.squadMember.update({ where: { id }, data });
    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("PATCH Squad Error:", error);
    return NextResponse.json({ error: "Failed to update squad member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    const { id } = await request.json();
    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Member id is required." }, { status: 400 });
    }
    await prisma.squadMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Squad Error:", error);
    return NextResponse.json({ error: "Failed to delete squad member" }, { status: 500 });
  }
}
