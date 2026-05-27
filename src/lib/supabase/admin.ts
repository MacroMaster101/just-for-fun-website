import { createClient } from "@supabase/supabase-js";
import { createFetchWithTimeout } from "@/lib/supabase/fetchWithTimeout";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseFetch = createFetchWithTimeout();

/**
 * Service-role Supabase client. BYPASSES RLS — only use in server-side
 * routes that have already verified the caller is an administrator.
 * Throws on import if the service role key is missing so misconfiguration
 * is loud rather than silent.
 */
export function supabaseAdmin() {
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_URL) is not set. Add it to .env."
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: supabaseFetch,
    },
  });
}
