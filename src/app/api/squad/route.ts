import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  try {
    const members = await prisma.squadMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    // Parse each member's favorite games (which can be legacy plain text or JSON string containing logoUrl)
    const enrichedMembers = members.map((m) => {
      const favoriteGamesEnriched = (m.favoriteGames || []).map((gameStr) => {
        try {
          if (gameStr.trim().startsWith("{")) {
            const parsed = JSON.parse(gameStr);
            if (parsed && typeof parsed === "object" && parsed.name) {
              return {
                name: parsed.name,
                logoUrl: parsed.logoUrl || "",
              };
            }
          }
        } catch {
          // Ignore parse errors and fall back to legacy string
        }
        return {
          name: gameStr,
          logoUrl: "",
        };
      });

      return {
        ...m,
        favoriteGamesEnriched,
      };
    });

    return NextResponse.json({ members: enrichedMembers });
  } catch {
    return NextResponse.json({ members: [] });
  }
}
