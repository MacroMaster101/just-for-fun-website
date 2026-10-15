import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { refreshYouTubeCache } from "@/lib/youtubeCache";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth/admin";
import { pruneOrphanProfiles } from "@/lib/authUsers";

// Don't cache the refresh endpoint itself — it must always run.
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET?.trim();
// Minimum gap between refreshes that actually hit YouTube. Anything more
// frequent returns the existing cached payload without spending quota.
const MIN_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

/** Constant-time comparison so the secret can't be recovered via timing. */
function secretEquals(candidate: string, secret: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isCronSecretMatch(req: NextRequest): boolean {
  if (!CRON_SECRET) {
    // If no secret is configured, refuse in production.
    return process.env.NODE_ENV !== "production";
  }
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>. Only the
  // header is accepted: secrets in the query string end up in access logs
  // and browser history.
  const auth = (req.headers.get("authorization") || "").trim();
  const match = /^bearer\s+(.+)$/i.exec(auth);
  return !!match && secretEquals(match[1].trim(), CRON_SECRET);
}

/**
 * Confirms the caller is an authenticated admin via the Supabase session
 * cookie. Used so the in-app admin dashboard can trigger a refresh without
 * shipping the CRON_SECRET to the browser bundle.
 */
async function isAuthorizedAdmin(): Promise<boolean> {
  try {
    return !!(await verifyAdmin());
  } catch {
    return false;
  }
}

/** Caller must already be authorized (see GET/POST below). */
async function handle(req: NextRequest) {
  // Rate limit: refuse to call YouTube more than once per MIN_REFRESH_INTERVAL_MS,
  // unless ?force=1 is passed. Protects quota even if the secret leaks or an
  // external cron is misconfigured.
  const force = req.nextUrl.searchParams.get("force") === "1";
  if (!force) {
    try {
      const existing = await prisma.youTubeCache.findUnique({
        where: { key: "main" },
        select: { updatedAt: true },
      });
      if (existing) {
        const age = Date.now() - existing.updatedAt.getTime();
        if (age < MIN_REFRESH_INTERVAL_MS) {
          return NextResponse.json({
            ok: true,
            skipped: true,
            reason: "rate-limited",
            ageMs: age,
            nextAllowedMs: MIN_REFRESH_INTERVAL_MS - age,
          });
        }
      }
    } catch (err) {
      console.error("Rate-limit check failed:", err);
      // Don't block the refresh on a DB read failure — fall through.
    }
  }

  const { ok, payload, skipped, reason } = await refreshYouTubeCache({ force });
  return NextResponse.json({
    ok,
    skipped: skipped ?? false,
    reason: reason ?? null,
    source: payload.source,
    fetchedAt: payload.fetchedAt,
    videoCount: payload.videos.length,
    message: payload.message ?? null,
  });
}

const unauthorized = () =>
  NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

/**
 * GET is the Vercel Cron entry point and only accepts the cron secret, so
 * a cross-site link can't ride an admin's session cookie into a refresh.
 * The daily run also prunes orphaned profiles.
 */
export async function GET(req: NextRequest) {
  if (!isCronSecretMatch(req)) return unauthorized();

  try {
    const result = await pruneOrphanProfiles();
    if (result.skipped) console.warn("Orphan profile prune skipped:", result.skipped);
  } catch (err) {
    console.error("Orphan profile prune failed:", err);
  }

  return handle(req);
}

/**
 * POST is used by the admin dashboard's "sync" button. The Supabase
 * session cookie is SameSite=Lax, so it isn't sent on cross-site POSTs.
 */
export async function POST(req: NextRequest) {
  if (!isCronSecretMatch(req) && !(await isAuthorizedAdmin())) {
    return unauthorized();
  }
  return handle(req);
}
