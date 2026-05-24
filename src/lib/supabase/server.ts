import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads/writes auth cookies via Next's cookies() API.
 */
export const supabaseServer = async () => {
  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll throws if called from a Server Component — middleware
          // handles session refresh, so this is safe to ignore.
        }
      },
    },
  });
};
