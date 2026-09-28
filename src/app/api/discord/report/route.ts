import { NextResponse } from "next/server";
import { resolveAvatarUrl } from "@/lib/avatar";
import { CHALLENGES } from "@/lib/challenges";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ANONYMOUS_ACTOR = {
  name: "Anonymous",
  avatarUrl: null as string | null,
};

const getDisplayName = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const getChallengeActor = async () => {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return ANONYMOUS_ACTOR;

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { name: true, avatarUrl: true },
    });

    const name =
      getDisplayName(profile?.name) ||
      getDisplayName(user.user_metadata?.full_name) ||
      getDisplayName(user.user_metadata?.name) ||
      user.email?.split("@")[0] ||
      "Crew Member";

    const uploadedAvatar =
      profile?.avatarUrl ||
      getDisplayName(user.user_metadata?.avatar_url) ||
      getDisplayName(user.user_metadata?.picture);

    return {
      name,
      avatarUrl: resolveAvatarUrl(uploadedAvatar, user.id),
    };
  } catch (error) {
    console.error("Failed to resolve Discord challenge actor:", error);
    return ANONYMOUS_ACTOR;
  }
};

// Posts a Challenge Slot result into Discord via a server-side webhook.
// The webhook URL lives in DISCORD_CHALLENGE_WEBHOOK_URL so it stays off
// the client; client code only POSTs the challenge payload here.
export async function POST(request: Request) {
  try {
    const webhookUrl = process.env.DISCORD_CHALLENGE_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Discord webhook is not configured on the server." },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as { id?: unknown } | null;

    // Only accept a known challenge id and look the content up server-side.
    // Trusting client-sent text would let anyone post arbitrary messages
    // (links, spam, @everyone pings) through our webhook.
    const challenge = CHALLENGES.find((c) => c.id === body?.id);
    if (!challenge) {
      return NextResponse.json({ error: "Unknown challenge." }, { status: 400 });
    }
    const { text, game, difficulty, id } = challenge;

    const difficultyColor: Record<string, number> = {
      Easy: 0x22c55e,
      Medium: 0xeab308,
      Hard: 0xff4b5f,
      IMPOSSIBLE: 0xff0033,
    };

    const actor = await getChallengeActor();

    const payload = {
      // Display names are user-controlled — never let them ping anyone.
      allowed_mentions: { parse: [] },
      username: actor.name,
      ...(actor.avatarUrl ? { avatar_url: actor.avatarUrl } : {}),
      embeds: [
        {
          title: "🎰 New Challenge Locked In",
          description: `**"${text}"**`,
          color: difficultyColor[difficulty] ?? 0xff0033,
          author: {
            name: `${actor.name} pulled the lever`,
            ...(actor.avatarUrl ? { icon_url: actor.avatarUrl } : {}),
          },
          fields: [
            { name: "Pulled By", value: actor.name, inline: true },
            { name: "Game", value: game, inline: true },
            { name: "Difficulty", value: difficulty, inline: true },
            { name: "Challenge #", value: String(id).padStart(2, "0"), inline: true },
          ],
          footer: { text: "Pulled from the JustForFun Challenge Slot" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const detail = await discordRes.text().catch(() => "");
      console.error("Discord webhook returned non-OK:", discordRes.status, detail);
      return NextResponse.json(
        { error: `Discord rejected the message (${discordRes.status}).` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discord report API error:", error);
    return NextResponse.json(
      { error: "Failed to send challenge to Discord." },
      { status: 500 }
    );
  }
}
