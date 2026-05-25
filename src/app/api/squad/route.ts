import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  try {
    const members = await prisma.squadMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ members });
  } catch (error) {
    console.error("GET public squad failed:", error);
    return NextResponse.json({ members: [] });
  }
}
