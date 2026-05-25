"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton — re-creating the client breaks the auth-state subscription.
let cached: SupabaseClient | null = null;

export const supabase = (): SupabaseClient => {
  if (cached) return cached;
  cached = createBrowserClient(url, anon);
  return cached;
};
