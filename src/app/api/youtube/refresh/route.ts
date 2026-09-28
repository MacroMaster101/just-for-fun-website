import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { refreshYouTubeCache } from "@/lib/youtubeCache";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/auth/admin";

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
  const stripQuotes = (s: string) => s.replace(/^["']|["']$/g, "").trim();

  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  // Be lenient: case-insensitive scheme, trimmed, strip accidental quotes.
  const auth = (req.headers.get("authorization") || "").trim();
  if (auth) {
    const match = /^bearer\s+(.+)$/i.exec(auth);
    if (match && secretEquals(stripQuotes(match[1]), CRON_SECRET)) return true;
    // Some cron services send the raw secret without "Bearer ".
    if (secretEquals(stripQuotes(auth), CRON_SECRET)) return true;
  }
  // Manual trigger: /api/youtube/refresh?key=<CRON_SECRET>
  const key = req.nextUrl.searchParams.get("key");
  if (key && secretEquals(stripQuotes(key), CRON_SECRET)) return true;
  return false;
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

async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (isCronSecretMatch(req)) return true;
  return await isAuthorizedAdmin();
}

async function handle(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

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

  const { ok, payload, skipped, reason } = await refreshYouTubeCache();
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

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
