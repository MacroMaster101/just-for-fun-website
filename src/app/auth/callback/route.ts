import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { authErrorCode } from "@/lib/authErrors";

export const dynamic = "force-dynamic";

/**
 * Only allow same-site relative paths for the post-login redirect. Without
 * this, `?next=@evil.com` or `?next=//evil.com` would turn the callback
 * into an open redirect to an attacker-controlled site.
 */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }
  return next;
}

/**
 * OAuth callback. Google/Facebook redirect here with a `code` query param
 * after the user consents. We exchange it for a session, then redirect
 * the user to `next` (default `/`).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  // Check for error parameters sent by Supabase/OAuth provider
  const error = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  if (error || errorCode || errorDescription) {
    console.error("OAuth callback error:", error, errorDescription);
    // Pass a fixed code, not the provider's text, so crafted links can't
    // put arbitrary messages in the sign-in modal.
    const reason = authErrorCode(errorCode, error, errorDescription);
    return NextResponse.redirect(`${url.origin}/?auth_error=${reason}`);
  }

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth callback error during exchange:", error.message);
      return NextResponse.redirect(
        `${url.origin}/?auth_error=${authErrorCode(error.code, error.message)}`
      );
    }
  }

  return NextResponse.redirect(`${url.origin}${next}`);
}
