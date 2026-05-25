import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public read of Creator Shop products. Returns an empty array when the
 * table is empty so the public Merch component can flip to its
 * "Coming Soon" panel without throwing.
 */
export async function GET() {
  try {
    const items = await prisma.merchItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/merch failed:", error);
    return NextResponse.json({ items: [] });
  }
}
