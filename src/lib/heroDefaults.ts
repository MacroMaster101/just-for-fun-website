/**
 * Shared defaults for hero section content that's admin-editable via
 * SiteSetting rows. Both the public Hero component and the admin Site
 * Settings tab read from here so they never drift out of sync.
 */

/** Items shown in the scrolling marquee strip at the bottom of the hero
 *  when no `hero.marqueeItems` SiteSetting row exists. */
export const DEFAULT_MARQUEE: string[] = [
  "Valorant",
  "Valheim",
  "GTA V",
  "Battlefield",
  "Minecraft",
  "Co-op Survival",
  "Weekend Streams",
];

/**
 * Parses the raw `hero.marqueeItems` SiteSetting value (a JSON-stringified
 * `string[]`) into a clean array. Returns [] for missing/empty/malformed
 * input — callers decide whether to fall back to DEFAULT_MARQUEE.
 */
export function parseMarqueeItems(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.every((s) => typeof s === "string" && s.trim().length > 0)
    ) {
      return parsed as string[];
    }
  } catch {
    // fall through
  }
  return [];
}
