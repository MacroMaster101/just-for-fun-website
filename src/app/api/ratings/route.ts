import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET — Retrieve all ratings with user profiles, and rating stats/aggregates. */
export async function GET() {
  try {
    const ratings = await prisma.pageRating.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const totalCount = ratings.length;
    let sum = 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const r of ratings) {
      sum += r.rating;
      const star = r.rating as 1 | 2 | 3 | 4 | 5;
      if (star >= 1 && star <= 5) {
        distribution[star]++;
      }
    }

    const averageRating = totalCount > 0 ? parseFloat((sum / totalCount).toFixed(2)) : 0;

    const enrichedRatings = ratings.map((r) => {
      if (r.isAnonymous) {
        const seed = r.userId.slice(0, 8);
        return {
          ...r,
          profile: {
            id: r.userId,
            name: "Anonymous Operator",
            avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`,
          },
        };
      }
      return r;
    });

    return NextResponse.json({
      ratings: enrichedRatings,
      stats: {
        average: averageRating,
        total: totalCount,
        distribution,
      },
    });
  } catch (error) {
    console.error("GET Public Ratings Error:", error);
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}

/** POST — Submit or update the logged-in user's rating. */
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
      rating?: number;
      comment?: string;
      isAnonymous?: boolean;
    } | null;

    if (!body || typeof body.rating !== "number") {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const ratingVal = Math.floor(body.rating);
    if (ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5 stars" }, { status: 400 });
    }

    const commentVal = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) : "";

    // Proactively ensure they have a Profile row (id = user.id)
    // so we don't hit foreign key constraint violations
    await prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        name:
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          null,
        avatarUrl:
          (user.user_metadata?.avatar_url as string | undefined) ||
          (user.user_metadata?.picture as string | undefined) ||
          null,
      },
      update: {},
    });

    const pageRating = await prisma.pageRating.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        rating: ratingVal,
        comment: commentVal,
        isAnonymous: !!body?.isAnonymous,
      },
      update: {
        rating: ratingVal,
        comment: commentVal,
        isAnonymous: !!body?.isAnonymous,
        isFlagged: false, // Reset flag if updated
      },
    });

    return NextResponse.json({ success: true, rating: pageRating }, { status: 200 });
  } catch (error) {
    console.error("POST Page Rating Error:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}

/** DELETE — Allow logged-in user to remove their rating. */
export async function DELETE() {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.pageRating.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true, message: "Rating deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Page Rating Error:", error);
    return NextResponse.json({ error: "Failed to delete rating" }, { status: 500 });
  }
}
