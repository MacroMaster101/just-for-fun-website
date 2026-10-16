import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";
import { safeAvatarUrl } from "@/lib/avatar";

export const dynamic = "force-dynamic";

const MAX_NAME_LENGTH = 60;

const metadataName = (value: unknown): string | null =>
  typeof value === "string" && value.trim()
    ? value.trim().slice(0, MAX_NAME_LENGTH)
    : null;

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

    // Best-effort viewer lookup so an anonymous author still recognises
    // their own review. Everyone else must never see the real user id —
    // it is the same id the public Crew Wall shows next to a name.
    let viewerId: string | null = null;
    try {
      const supabase = await supabaseServer();
      const { data } = await supabase.auth.getUser();
      viewerId = data.user?.id ?? null;
    } catch {
      // Anonymous viewers are fine.
    }

    const enrichedRatings = ratings.map(({ likedBy, ...r }) => {
      // Never publish who liked a review, only how many and whether the
      // viewer did. likedBy holds real user ids.
      const likes = {
        likeCount: likedBy.length,
        likedByMe: viewerId !== null && likedBy.includes(viewerId),
      };
      if (r.isAnonymous) {
        const anonId = r.userId === viewerId ? r.userId : `anon-${r.id}`;
        return {
          ...r,
          ...likes,
          userId: anonId,
          profile: {
            id: anonId,
            name: "Anonymous Operator",
            avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(r.id.slice(0, 8))}`,
          },
        };
      }
      return {
        ...r,
        ...likes,
        profile: r.profile && {
          ...r.profile,
          avatarUrl: safeAvatarUrl(r.profile.avatarUrl),
        },
      };
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
        // user_metadata is user-editable from the browser; cap its length.
        name:
          metadataName(user.user_metadata?.full_name) ||
          metadataName(user.user_metadata?.name),
        avatarUrl:
          safeAvatarUrl(user.user_metadata?.avatar_url) ||
          safeAvatarUrl(user.user_metadata?.picture),
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
        // isFlagged is left alone: only an admin can clear a flag (admin
        // ratings PATCH), otherwise authors could re-save to remove it.
      },
    });

    // likedBy holds other users' ids; the author only needs the count.
    const { likedBy, ...ownRating } = pageRating;
    return NextResponse.json(
      { success: true, rating: { ...ownRating, likeCount: likedBy.length } },
      { status: 200 }
    );
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
