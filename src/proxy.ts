import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Runs on every request matched by the `config.matcher` below.
 *
 * Does two jobs:
 *  1. Refreshes the Supabase auth session by touching getUser(), so JWTs
 *     in the user's cookies never expire silently mid-session. The
 *     @supabase/ssr client handles rotating cookies for us.
 *  2. Hard-gates the `/admin` route at the edge — unauthenticated visitors
 *     are 302-redirected to `/` BEFORE the React tree renders, closing the
 *     brief window where the client-side admin check on the page could
 *     reveal the admin UI shell.
 *
 * Note: admin EMAIL allowlist verification still happens in the API routes
 * via verifyAdmin(); this middleware only confirms a logged-in user exists.
 * That keeps the matcher cheap (one getUser() call) and lets the existing
 * per-route checks remain the source of truth for "is this user an admin".
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const searchParams = request.nextUrl.searchParams;

  // 1. Check for the backup/fail-safe bypass query param (?no_redirect=true)
  const hasBypassParam = searchParams.get("no_redirect") === "true";
  const hasBypassCookie = request.cookies.get("bypass_domain_redirect")?.value === "true";

  if (hasBypassParam) {
    const response = NextResponse.next({ request });
    // Set a session cookie to remember the bypass for subsequent page transitions
    response.cookies.set("bypass_domain_redirect", "true", { path: "/" });
    return response;
  }

  // 2. Redirect Vercel default domains to the custom domain (if not bypassed)
  if (host.includes(".vercel.app") && !hasBypassCookie) {
    const url = request.nextUrl.clone();
    url.host = "j4fn.site";
    url.protocol = "https";
    return NextResponse.redirect(url, 301); // 301 Permanent Redirect
  }

  let response = NextResponse.next({ request });

  // Only run the Supabase round-trip when we actually need it: on the page
  // routes that benefit from a refreshed JWT and on the `/admin` gate. For
  // everything else, just pass the request through — no auth validation
  // means no Supabase fetch means no latency / no chance of hanging.
  const pathname = request.nextUrl.pathname;
  const needsAuthCheck =
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth");

  if (!needsAuthCheck) return response;

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // getUser() validates the access token against Supabase and rotates the
    // refresh token if needed. Race it against a hard timeout so a slow or
    // unreachable Supabase doesn't stall every request indefinitely.
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 3000)
    );
    const {
      data: { user },
    } = await Promise.race([userPromise, timeoutPromise]);

    // Hard-gate /admin: if there is no authenticated user at all, send
    // them home with an auth_error param the Header reads to open the
    // sign-in modal. Allowlist verification still happens per-API-route.
    if (pathname.startsWith("/admin") && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      url.searchParams.set("auth_error", "Sign in required to access /admin.");
      return NextResponse.redirect(url);
    }
  } catch (err) {
    // Never let proxy failure break the site. Log and let the request
    // through — downstream API routes will still 403 anyone who tries
    // to do something privileged without a real session.
    console.error("[proxy] auth check failed:", err);
  }

  return response;
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico, icon.png (favicon/icon files)
   * - api/ (API routes, unless you want them redirected as well)
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|api/).*)",
  ],
};
