import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Admin access is granted by email, so the email must be one the user has
 * actually proven they own. Without this check anyone could sign up with
 * email + password using the admin's address and — if the Supabase project
 * ever allows unconfirmed sign-ins — be treated as an administrator.
 */
export function verifiedEmail(user: User | null): string | null {
  if (!user?.email) return null;
  if (!user.email_confirmed_at) return null;
  return user.email.toLowerCase().trim();
}

/** True when `email` is the root admin or on the AdminEmail allowlist. */
export async function isAdminEmail(email: string): Promise<boolean> {
  const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdminEmail && email === rootAdminEmail) {
    // Proactively ensure the root admin exists in the DB roster.
    try {
      await prisma.adminEmail.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    } catch (e) {
      console.error("Failed to seed root admin on check:", e);
    }
    return true;
  }

  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return !!match;
}

/**
 * Verifies the caller is an administrator and returns their email if so.
 * Returns null when the caller is not signed in, has not verified their
 * email, or is not on the admin allowlist.
 */
export async function verifyAdmin(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const email = verifiedEmail(data.user);
  if (!email) return null;
  return (await isAdminEmail(email)) ? email : null;
}
