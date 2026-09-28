import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** POST — Flag a page rating. */
export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      ratingId?: string;
    } | null;

    if (!body || !body.ratingId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const review = await prisma.pageRating.findUnique({
      where: { id: body.ratingId },
      select: { id: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.pageRating.update({
      where: { id: body.ratingId },
      data: { isFlagged: true },
      select: { id: true },
    });

    // Never echo the review row back: it contains the author's real userId,
    // which would de-anonymize anonymous reviews (the same id is shown next
    // to names on the public Crew Wall).
    return NextResponse.json({
      success: true,
      message: "Review flagged successfully",
    });
  } catch (error) {
    console.error("POST Flag Rating Error:", error);
    return NextResponse.json({ error: "Failed to flag review" }, { status: 500 });
  }
}
