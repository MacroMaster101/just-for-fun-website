import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public Crew Wall feed. Returns recent non-admin profiles for the
 * homepage "CREW WALL" section. Admins (the root admin from env + every
 * email in the AdminEmail allowlist) are filtered out so the wall only
 * surfaces real community members.
 *
 * Response shape kept tiny on purpose — `id` is the auth.users.id, used
 * by the client to deterministically derive a DiceBear fallback avatar
 * when no real avatarUrl has been uploaded.
 */
export async function GET() {
  try {
    const [adminRows, rootAdmin] = await Promise.all([
      prisma.adminEmail.findMany({ select: { email: true } }),
      Promise.resolve(process.env.NEXT_PUBLIC_ADMIN_EMAIL),
    ]);

    const adminEmails = new Set(
      adminRows.map((r) => r.email.toLowerCase().trim())
    );
    if (rootAdmin) adminEmails.add(rootAdmin.toLowerCase().trim());

    // Pull a generous window so we can filter admins client-side without
    // burning a join. Cap the final list at 60 for the wall.
    const rows = await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const members = rows
      .filter((r) => !r.email || !adminEmails.has(r.email.toLowerCase().trim()))
      .slice(0, 60)
      .map((r) => ({
        id: r.id,
        name: r.name?.trim() || deriveNameFromEmail(r.email) || "Anonymous",
        avatarUrl: r.avatarUrl || "",
        joinedAt: r.createdAt.toISOString(),
      }));

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
