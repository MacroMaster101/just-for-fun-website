import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Settings are tiny (a few rows). ISR 60s is enough — admin edits propagate
// within a minute, and the public homepage doesn't need to hit the DB on
// every request.
export const revalidate = 60;

/**
 * Public read of the SiteSetting key/value pairs. Returns a flat object
 * `{ [key]: value }`. Missing keys are simply absent — consumers must
 * provide their own fallback default.
 */
export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany();
    const settings: Record<string, string> = {};
    for (const row of rows) settings[row.key] = row.value;
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET settings failed:", error);
    return NextResponse.json({ settings: {} });
  }
}
