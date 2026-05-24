import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * OAuth callback. Google/Facebook redirect here with a `code` query param
 * after the user consents. We exchange it for a session, then redirect
 * the user to `next` (default `/`).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  // Check for error parameters sent by Supabase/OAuth provider
  const error = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code");
  const errorDescription = url.searchParams.get("error_description");

  if (error || errorCode || errorDescription) {
    console.error("OAuth callback error:", error, errorDescription);
    const msg = errorDescription || error || "Authentication failed";
    return NextResponse.redirect(
      `${url.origin}/?auth_error=${encodeURIComponent(msg)}`
    );
  }

  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("OAuth callback error during exchange:", error.message);
      return NextResponse.redirect(
        `${url.origin}/?auth_error=${encodeURIComponent(error.message)}`
      );
    }
  }

  return NextResponse.redirect(`${url.origin}${next}`);
}
