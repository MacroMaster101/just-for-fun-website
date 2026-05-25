import { NextResponse } from "next/server";

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

    const body = (await request.json()) as {
      text?: string;
      game?: string;
      difficulty?: string;
      id?: number;
    };

    const { text, game, difficulty, id } = body;
    if (!text || !game || !difficulty) {
      return NextResponse.json(
        { error: "text, game, and difficulty are required." },
        { status: 400 }
      );
    }

    const difficultyColor: Record<string, number> = {
      Easy: 0x22c55e,
      Medium: 0xeab308,
      Hard: 0xff4b5f,
      IMPOSSIBLE: 0xff0033,
    };

    const payload = {
      username: "Challenge Slot",
      embeds: [
        {
          title: "🎰 New Challenge Locked In",
          description: `**"${text}"**`,
          color: difficultyColor[difficulty] ?? 0xff0033,
          fields: [
            { name: "Game", value: game, inline: true },
            { name: "Difficulty", value: difficulty, inline: true },
            ...(typeof id === "number"
              ? [{ name: "Challenge #", value: String(id).padStart(2, "0"), inline: true }]
              : []),
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
    const message =
      error instanceof Error ? error.message : "Failed to send challenge to Discord.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
