import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUSES = new Set(["pending", "approved", "rejected"]);

interface HighlightPatchInput {
  id?: unknown;
  title?: unknown;
  game?: unknown;
  description?: unknown;
  duration?: unknown;
  status?: unknown;
  thumbnailUrl?: unknown;
}

export async function GET(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const where =
    status && STATUSES.has(status)
      ? { status: status as "pending" | "approved" | "rejected" }
      : {};
  const highlights = await prisma.highlight.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ highlights });
}

export async function PATCH(request: Request) {
  const adminEmail = await verifyAdmin();
  if (!adminEmail) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as HighlightPatchInput;
  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "Highlight id is required." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);
  const data: Record<string, unknown> = {};
  const title = str(body.title);
  if (title !== undefined) data.title = title;
  const game = str(body.game);
  if (game !== undefined) data.game = game;
  const description = str(body.description);
  if (description !== undefined) data.description = description;
  const duration = str(body.duration);
  if (duration !== undefined) data.duration = duration;
  const thumbnailUrl = str(body.thumbnailUrl);
  if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;

  if (typeof body.status === "string" && STATUSES.has(body.status)) {
    data.status = body.status;
    data.reviewedBy = adminEmail;
    data.reviewedAt = new Date();
  }

  const highlight = await prisma.highlight.update({
    where: { id: body.id },
    data,
  });
  return NextResponse.json({ success: true, highlight });
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const { id } = await request.json().catch(() => ({}));
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Highlight id is required." }, { status: 400 });
  }
  await prisma.highlight.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
