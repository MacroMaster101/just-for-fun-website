import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !data.user.email) return false;

  const email = data.user.email.toLowerCase().trim();
  const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim();
  if (rootAdminEmail && email === rootAdminEmail) return true;

  const match = await prisma.adminEmail.findUnique({ where: { email } });
  return !!match;
}

interface SquadMemberInput {
  name?: unknown;
  role?: unknown;
  avatarUrl?: unknown;
  favoriteGames?: unknown;
  signatureAgent?: unknown;
  twitchUrl?: unknown;
  cpu?: unknown;
  gpu?: unknown;
  ram?: unknown;
  monitor?: unknown;
  mouse?: unknown;
  bio?: unknown;
  combatStyle?: unknown;
  sortOrder?: unknown;
}

function normalizeInput(raw: SquadMemberInput) {
  const str = (v: unknown, fallback = "") =>
    typeof v === "string" ? v.trim() : fallback;
  const games = Array.isArray(raw.favoriteGames)
    ? raw.favoriteGames
        .map((g) => (typeof g === "string" ? g.trim() : ""))
        .filter((g) => g.length > 0)
    : [];

  return {
    name: str(raw.name),
    role: str(raw.role),
    avatarUrl: str(raw.avatarUrl),
    favoriteGames: games,
    signatureAgent: str(raw.signatureAgent),
    twitchUrl: typeof raw.twitchUrl === "string" && raw.twitchUrl.trim()
      ? raw.twitchUrl.trim()
      : null,
    cpu: str(raw.cpu),
    gpu: str(raw.gpu),
    ram: str(raw.ram),
    monitor: str(raw.monitor),
    mouse: str(raw.mouse),
    bio: str(raw.bio),
    combatStyle: str(raw.combatStyle),
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : 0,
  };
}

/**
 * Hardcoded fallback trio that originally lived in SquadRoster.tsx. Seeded
 * into the DB the first time an admin opens the Squad tab so editors have
 * something to edit instead of starting from an empty roster.
 */
const DEFAULT_SQUAD: Array<Omit<
  Parameters<typeof prisma.squadMember.create>[0]["data"],
  "id"
>> = [
  {
    name: "Kavisha (GGEZ)",
    role: "Founder / Main Duelist",
    avatarUrl:
      "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=400&q=80",
    favoriteGames: ["Valorant", "Valheim", "GTA V"],
    signatureAgent: "Jett / Reyna",
    twitchUrl: "https://www.twitch.tv/justforfunggez",
    cpu: "AMD Ryzen 7 7800X3D",
    gpu: "NVIDIA RTX 4070 Ti Super",
    ram: "32GB DDR5 6000MHz",
    monitor: "ASUS ROG 240Hz IPS",
    mouse: "Logitech G Pro X Superlight 2",
    bio: "Started Just For Fun to capture hilarious gaming sessions with the crew. Always clutching the 1v5 or dying in the first 5 seconds. No in-between.",
    combatStyle: "Aggressive / W-Key Warrior",
    sortOrder: 0,
  },
  {
    name: "Chathu (Sniper)",
    role: "Co-Founder / Main Sentinel",
    avatarUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
    favoriteGames: ["Valorant", "Battlefield V", "Rust"],
    signatureAgent: "Chamber / Cypher",
    twitchUrl: null,
    cpu: "Intel Core i7-14700K",
    gpu: "NVIDIA RTX 4070",
    ram: "32GB DDR5 5600MHz",
    monitor: "BenQ ZOWIE 240Hz",
    mouse: "Razer DeathAdder V3 Pro",
    bio: "The calm mastermind of the squad. Can hit cross-map sniper shots but will somehow get lost in a straight hallway. Holds down sites like a fortress.",
    combatStyle: "Calculated / Tactical",
    sortOrder: 1,
  },
  {
    name: "Prabhash (Survival)",
    role: "Co-Builder / Survival Specialist",
    avatarUrl:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80",
    favoriteGames: ["Valheim", "Minecraft", "GTA V"],
    signatureAgent: "Omen / Sage",
    twitchUrl: null,
    cpu: "AMD Ryzen 5 7600X",
    gpu: "NVIDIA RTX 4060 Ti",
    ram: "16GB DDR5 5200MHz",
    monitor: "MSI Optix 144Hz Curved",
    mouse: "HyperX Pulsefire Haste",
    bio: "Architect of our epic Valheim fortresses. Spends 20 hours building a perfect house only for it to be smashed by a troll. Best support gamer ever.",
    combatStyle: "Defensive / Architect",
    sortOrder: 2,
  },
];

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // Auto-seed: if the roster is empty, drop in the built-in trio so the
    // editor doesn't open to a blank page. Mirrors the music auto-bootstrapper.
    const count = await prisma.squadMember.count();
    if (count === 0) {
      try {
        await prisma.squadMember.createMany({ data: DEFAULT_SQUAD });
      } catch (e) {
        console.error("Failed to seed default squad:", e);
      }
    }

    const members = await prisma.squadMember.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ members });
  } catch (error) {
    console.error("GET Squad Error:", error);
    return NextResponse.json({ error: "Failed to load squad" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    const body = await request.json();
    const data = normalizeInput(body);
    if (!data.name || !data.role) {
      return NextResponse.json(
        { error: "Name and role are required." },
        { status: 400 }
      );
    }
    const member = await prisma.squadMember.create({ data });
    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    console.error("POST Squad Error:", error);
    return NextResponse.json({ error: "Failed to add squad member" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    const body = await request.json();
    const { id, ...rest } = body as { id?: unknown } & SquadMemberInput;
    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Member id is required." }, { status: 400 });
    }
    const data = normalizeInput(rest);
    if (!data.name || !data.role) {
      return NextResponse.json(
        { error: "Name and role are required." },
        { status: 400 }
      );
    }
    const member = await prisma.squadMember.update({ where: { id }, data });
    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("PATCH Squad Error:", error);
    return NextResponse.json({ error: "Failed to update squad member" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }
    const { id } = await request.json();
    if (typeof id !== "string" || !id) {
      return NextResponse.json({ error: "Member id is required." }, { status: 400 });
    }
    await prisma.squadMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Squad Error:", error);
    return NextResponse.json({ error: "Failed to delete squad member" }, { status: 500 });
  }
}
