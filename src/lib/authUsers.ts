import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AuthProfile = {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

type AuthMetadata = Record<string, unknown> | null | undefined;

const PER_PAGE = 1000;
// Safety ceiling on how many pages we walk per call (10k users).
const MAX_PAGES = 10;
// Profiles younger than this are never treated as orphans, so a sign-up
// that lands while the user list is being read can't be deleted.
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;

export type AuthUserList = {
  users: Map<string, AuthProfile>;
  /** False when the page ceiling was hit, i.e. some users are missing. */
  complete: boolean;
};

const metadataText = (metadata: AuthMetadata, key: string): string | null => {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

/**
 * Pull live auth.users metadata from Supabase via the service-role client.
 * Returns null if the client is unavailable or a page fails, so callers
 * can fall back to the Profile table.
 */
export async function listAuthUsers(): Promise<AuthUserList | null> {
  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return null;
  }
  const users = new Map<string, AuthProfile>();
  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: PER_PAGE,
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
      if (data.users.length < PER_PAGE) return { users, complete: true };
    }
  } catch (err) {
    console.error("listAuthUsers exception:", err);
    return null;
  }
  return { users, complete: false };
}

/**
 * Delete Profile rows whose auth.users entry was removed outside our API
 * (e.g. from the Supabase dashboard). Deleting a Profile cascades to the
 * user's favorites and ratings, so this refuses to run unless it has the
 * complete user list, and skips recently created profiles. Run from the
 * daily cron, never from a public request.
 */
export async function pruneOrphanProfiles(): Promise<{ deleted: number; skipped?: string }> {
  const authUsers = await listAuthUsers();
  if (!authUsers) return { deleted: 0, skipped: "auth users unavailable" };
  if (!authUsers.complete) return { deleted: 0, skipped: "user list incomplete" };

  const cutoff = new Date(Date.now() - ORPHAN_MIN_AGE_MS);
  const candidates = await prisma.profile.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true },
  });
  const orphans = candidates
    .map((p) => p.id)
    .filter((id) => !authUsers.users.has(id));
  if (orphans.length === 0) return { deleted: 0 };

  const { count } = await prisma.profile.deleteMany({
    where: { id: { in: orphans } },
  });
  return { deleted: count };
}
