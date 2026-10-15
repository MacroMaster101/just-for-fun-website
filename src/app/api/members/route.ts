import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listAuthUsers } from "@/lib/authUsers";
import { safeAvatarUrl } from "@/lib/avatar";

// Public data only, so cache it: this keeps anonymous traffic from
// hammering the service-role listUsers API on every request.
export const revalidate = 300;

const MAX_NAME_LENGTH = 60;

/**
 * Public Crew Wall feed. Returns recent non-admin profiles for the
 * homepage "CREW WALL" section. Admins (the root admin from env + every
 * email in the AdminEmail allowlist) are filtered out so the wall only
 * surfaces real community members.
 *
 * Profiles whose auth.users entry is gone are hidden here; deleting them
 * happens in the daily cron (pruneOrphanProfiles), never on a public
 * request.
 *
 * Response shape kept tiny on purpose — `id` is the auth.users.id, used
 * by the client to deterministically derive a DiceBear fallback avatar
 * when no real avatarUrl has been uploaded.
 */
export async function GET() {
  try {
    const [adminRows, rootAdmin, rows, authList] = await Promise.all([
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

    // Only hide profiles missing from auth.users when we have the full
    // list; otherwise members past the listing cap would vanish too. If
    // the service-role call failed, trust the Profile table.
    const authUsers = authList?.users ?? null;
    const liveAuthIds = authList?.complete ? authList.users : null;

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
          name: (
            r.name?.trim() ||
            auth?.name ||
            deriveNameFromEmail(email) ||
            "Anonymous"
          ).slice(0, MAX_NAME_LENGTH),
          avatarUrl:
            safeAvatarUrl(r.avatarUrl) || safeAvatarUrl(auth?.avatarUrl) || "",
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
