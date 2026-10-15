import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiting backed by the RateLimit table, so limits hold
 * across serverless instances. Each check counts one hit for a
 * (bucket, subject) pair in the current window.
 *
 * Fails open: if the database is unreachable (or the table hasn't been
 * pushed yet) the request goes through and the error is logged, so a
 * limiter outage never takes the contact form down with it.
 */

export type RateLimitRule = {
  /** Endpoint/purpose, e.g. "contact". */
  bucket: string;
  /** Who is being counted: a user id, ipSubject(request), or "global". */
  subject: string;
  /** Max hits allowed per window. */
  limit: number;
  windowMs: number;
};

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

// Vercel sets x-forwarded-for itself (client-supplied values are overwritten),
// so the first entry is the real client address.
const clientIp = (request: Request): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip")?.trim() ||
  "unknown";

/** Hashed client IP, so raw addresses never land in the database. */
export const ipSubject = (request: Request): string =>
  `ip_${createHash("sha256").update(clientIp(request)).digest("hex").slice(0, 32)}`;

const PRUNE_PROBABILITY = 0.02;

const pruneExpired = () => {
  prisma.rateLimit
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch((err) => console.error("Rate limit prune failed:", err));
};

const hit = async (rule: RateLimitRule, now: number) => {
  const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
  const expiresAt = new Date(windowStart + rule.windowMs);
  const key = `${rule.bucket}:${rule.subject}:${windowStart}`;
  // Single-field where + matching create lets Prisma use a native
  // INSERT ... ON CONFLICT, so concurrent hits can't race each other.
  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return {
    allowed: row.count <= rule.limit,
    retryAfterSec: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
  };
};

/**
 * Count a hit against every rule. Returns a 429 response if any rule is
 * over its limit, or null when the request may proceed.
 */
export async function rateLimit(
  ...rules: RateLimitRule[]
): Promise<NextResponse | null> {
  const now = Date.now();
  try {
    const results = await Promise.all(rules.map((rule) => hit(rule, now)));
    if (Math.random() < PRUNE_PROBABILITY) pruneExpired();

    const blocked = results.filter((r) => !r.allowed);
    if (blocked.length === 0) return null;

    const retryAfterSec = Math.max(...blocked.map((r) => r.retryAfterSec));
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  } catch (err) {
    console.error("Rate limit check failed (allowing request):", err);
    return null;
  }
}
