import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AuthProfile = {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type AuthMetadata = Record<string, unknown> | null | undefined;

/**
 * Public Crew Wall feed. Returns recent non-admin profiles for the
 * homepage "CREW WALL" section. Admins (the root admin from env + every
 * email in the AdminEmail allowlist) are filtered out so the wall only
 * surfaces real community members.
 *
 * We also cross-check every Profile row against auth.users via the
 * service-role admin client and best-effort delete any orphans whose
 * auth entry has been removed outside our API (e.g. via Supabase
 * dashboard). That keeps stale rows from leaking onto the public wall.
 *
 * Response shape kept tiny on purpose — `id` is the auth.users.id, used
 * by the client to deterministically derive a DiceBear fallback avatar
 * when no real avatarUrl has been uploaded.
 */
export async function GET() {
  try {
    const [adminRows, rootAdmin, rows, authUsers] = await Promise.all([
      prisma.adminEmail.findMany({ select: { email: true } }),
      Promise.resolve(process.env.NEXT_PUBLIC_ADMIN_EMAIL),
      prisma.profile.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      }),
      listAuthUsers(),
    ]);

    const adminEmails = new Set(
      adminRows.map((r) => r.email.toLowerCase().trim())
    );
    if (rootAdmin) adminEmails.add(rootAdmin.toLowerCase().trim());

    // If we have a live auth.users id set, drop any profile that's
    // orphaned. If the service-role call failed, fall back to trusting
    // the Profile table (skip the cross-check) so the wall still renders.
    const liveAuthIds = authUsers ? new Set(authUsers.keys()) : null;
    const orphans = liveAuthIds
      ? rows.filter((r) => !liveAuthIds.has(r.id)).map((r) => r.id)
      : [];

    if (orphans.length > 0) {
      // Fire-and-forget cleanup so the response isn't blocked by it.
      prisma.profile
        .deleteMany({ where: { id: { in: orphans } } })
        .catch((err) => console.error("Orphan profile cleanup failed:", err));
    }

    const members = rows
      .filter((r) => !liveAuthIds || liveAuthIds.has(r.id))
      .filter((r) => {
        const auth = authUsers?.get(r.id);
        const email = (r.email || auth?.email || "").toLowerCase().trim();
        return !email || !adminEmails.has(email);
      })
      .slice(0, 60)
      .map((r) => {
        const auth = authUsers?.get(r.id);
        const email = r.email || auth?.email || null;

        return {
          id: r.id,
          name:
            r.name?.trim() ||
            auth?.name ||
            deriveNameFromEmail(email) ||
            "Anonymous",
          avatarUrl: r.avatarUrl?.trim() || auth?.avatarUrl || "",
          joinedAt: r.createdAt.toISOString(),
        };
      });

    return NextResponse.json({
      members,
      total: members.length,
    });
  } catch (error) {
    console.error("GET /api/members failed:", error);
    return NextResponse.json({ members: [], total: 0 });
  }
}

/**
 * Pull live auth.users metadata from Supabase. Returns null if the
 * service-role client is unavailable so the caller can fall back to the
 * Profile table instead of returning an empty list.
 */
async function listAuthUsers(): Promise<Map<string, AuthProfile> | null> {
  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return null;
  }
  const users = new Map<string, AuthProfile>();
  let page = 1;
  // 1000 is the per-page cap. Loop until we exhaust the pages or hit a
  // safety ceiling of 10k members.
  while (page < 11) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error || !data?.users) {
      console.error("listUsers failed:", error);
      return null;
    }
    for (const u of data.users) {
      const metadata = u.user_metadata as AuthMetadata;
      users.set(u.id, {
        email: u.email ?? null,
        name: metadataText(metadata, "full_name") || metadataText(metadata, "name"),
        avatarUrl:
          metadataText(metadata, "avatar_url") ||
          metadataText(metadata, "picture"),
      });
    }
    if (data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

function metadataText(metadata: AuthMetadata, key: string): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function deriveNameFromEmail(email: string | null): string | null {
  if (!email) return null;
  const local = email.split("@")[0];
  if (!local) return null;
  // Convert "kavisha.lakshan" → "Kavisha Lakshan"
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
