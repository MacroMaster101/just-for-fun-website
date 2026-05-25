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

export async function GET(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("RAWG_API_KEY environment variable is not defined.");
    return NextResponse.json(
      { error: "RAWG API Key is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const rawgUrl = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(
      query
    )}&page_size=6`;

    const res = await fetch(rawgUrl);
    if (!res.ok) {
      const errText = await res.text();
      console.error("RAWG API responded with error:", errText);
      return NextResponse.json(
        { error: "Failed to fetch from games database." },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    interface RawgGameResult {
      id: number;
      name: string;
      background_image?: string;
    }

    // Map raw data to a cleaner format for our frontend
    const results = (data.results || []).map((game: RawgGameResult) => ({
      id: game.id,
      name: game.name,
      backgroundImage: game.background_image || "",
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching from RAWG API:", error);
    return NextResponse.json(
      { error: "Internal Server Error fetching games." },
      { status: 500 }
    );
  }
}
