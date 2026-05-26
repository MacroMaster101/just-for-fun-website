import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Helper function to verify administrator permission
async function verifyAdmin() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return null;

  const email = data.user.email.toLowerCase().trim();
  const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();

  if (rootAdminEmail && email === rootAdminEmail) {
    try {
      await prisma.adminEmail.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    } catch (e) {
      console.error("Failed to seed root admin on check:", e);
    }
    return email;
  }

  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return match ? email : null;
}

/** GET — Retrieve all detailed ratings (admin view with email information). */
export async function GET() {
  try {
    const adminEmail = await verifyAdmin();
    if (!adminEmail) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const ratings = await prisma.pageRating.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ ratings }, { status: 200 });
  } catch (error) {
    console.error("GET Admin Ratings Error:", error);
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}

/** PATCH — Dismiss flags on a specific review. */
export async function PATCH(request: Request) {
  try {
    const adminEmail = await verifyAdmin();
    if (!adminEmail) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as {
      ratingId?: string;
    } | null;

    if (!body || !body.ratingId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const review = await prisma.pageRating.findUnique({
      where: { id: body.ratingId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const updated = await prisma.pageRating.update({
      where: { id: body.ratingId },
      data: { isFlagged: false },
    });

    return NextResponse.json({ success: true, rating: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH Admin Rating Error:", error);
    return NextResponse.json({ error: "Failed to update rating status" }, { status: 500 });
  }
}

/** DELETE — Delete any review as an admin. */
export async function DELETE(request: Request) {
  try {
    const adminEmail = await verifyAdmin();
    if (!adminEmail) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const body = (await request.json().catch(() => null)) as {
      ratingId?: string;
    } | null;

    if (!body || !body.ratingId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    await prisma.pageRating.delete({
      where: { id: body.ratingId },
    });

    return NextResponse.json({ success: true, message: "Review deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Admin Rating Error:", error);
    return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 });
  }
}
