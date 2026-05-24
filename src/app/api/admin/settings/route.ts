import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function verifyAdmin(): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return null;
  const email = data.user.email.toLowerCase().trim();
  const rootAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdmin && email === rootAdmin) return email;
  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return match ? email : null;
}

/** Allowed keys + per-key validation. Reject anything not in this list so
 *  the table can't be used as a free-form key/value dumping ground.
 *  An empty value means "clear the override" — the consumer falls back to
 *  the hardcoded default. We handle that in PATCH by deleting the row
 *  rather than upserting an empty string. */
const ALLOWED_KEYS: Record<string, (v: string) => string | null> = {
  "hero.splineScene": (v) => {
    if (v === "") return null; // empty = clear override; handled below
    if (!/^https:\/\/[a-z0-9.-]+\.spline\.design\/.+\.splinecode$/i.test(v)) {
      return "Must be a https://*.spline.design/...splinecode URL.";
    }
    return null;
  },
};

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  const rows = await prisma.siteSetting.findMany();
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return NextResponse.json({ settings });
}

/** PATCH body: `{ key: string, value: string }`. Upserts the row. */
export async function PATCH(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key.trim() : "";
  const value = typeof body.value === "string" ? body.value.trim() : "";

  const validator = ALLOWED_KEYS[key];
  if (!validator) {
    return NextResponse.json(
      { error: `Unknown setting key '${key}'.` },
      { status: 400 }
    );
  }
  const validationError = validator(value);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Empty value clears the override — delete the row so the consumer
  // falls back to its built-in default. Deleting a non-existent row
  // throws, so guard with deleteMany.
  if (value === "") {
    await prisma.siteSetting.deleteMany({ where: { key } });
    return NextResponse.json({ success: true, setting: null });
  }

  const updated = await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
  return NextResponse.json({ success: true, setting: updated });
}
