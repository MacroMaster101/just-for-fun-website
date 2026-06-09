import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** POST — Toggle like (heart) status on a review for the logged-in user. */
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
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // You can't heart your own review.
    if (review.userId === user.id) {
      return NextResponse.json(
        { error: "You can't heart your own review." },
        { status: 403 }
      );
    }

    // Toggle the user's ID in the likedBy array
    const updatedLikedBy = [...review.likedBy];
    const index = updatedLikedBy.indexOf(user.id);

    if (index > -1) {
      // Remove like
      updatedLikedBy.splice(index, 1);
    } else {
      // Add like
      updatedLikedBy.push(user.id);
    }

    const updated = await prisma.pageRating.update({
      where: { id: body.ratingId },
      data: { likedBy: updatedLikedBy },
    });

    return NextResponse.json({ success: true, likedBy: updated.likedBy }, { status: 200 });
  } catch (error) {
    console.error("POST Toggle Rating Like Error:", error);
    return NextResponse.json({ error: "Failed to update like status" }, { status: 500 });
  }
}
