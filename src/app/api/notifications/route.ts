import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET — return the current user's notifications (newest first) plus an
 * unread count. We cap at 50 newest so the bell dropdown stays bounded
 * even for chatty admins.
 */
export async function GET() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const userId = data.user.id;
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

/**
 * PATCH — mark notifications as read. Body shape:
 *   { id: string }     — mark a single notification read
 *   { all: true }      — mark every unread notification read
 */
export async function PATCH(request: Request) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = data.user.id;

  const body = await request.json().catch(() => ({}));
  const now = new Date();

  if (body.all === true) {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ success: true });
  }

  if (typeof body.id === "string" && body.id) {
    // Scope to the caller — never let a user mark someone else's row read.
    await prisma.notification.updateMany({
      where: { id: body.id, userId },
      data: { readAt: now },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Provide `id` or `all: true`." }, { status: 400 });
}
