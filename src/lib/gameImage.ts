import { hostMatches } from "@/lib/hostMatches";

/**
 * RAWG game art is stored at full resolution (often several MB). Its CDN
 * serves resized copies under /media/resize/<width>/-/…, so small logo
 * bubbles only download a few KB. Other URLs are returned unchanged.
 */
// RAWG only serves these widths; any other value redirects and fails to load.
const RAWG_WIDTHS = [80, 200, 420, 640];

export function gameImageUrl(url: string | null | undefined, width = 200): string {
  if (!url) return "";
  if (!hostMatches(url, "media.rawg.io")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/media/") && !parsed.pathname.startsWith("/media/resize/")) {
      const size = RAWG_WIDTHS.find((w) => w >= width) ?? RAWG_WIDTHS[RAWG_WIDTHS.length - 1];
      parsed.pathname = parsed.pathname.replace("/media/", `/media/resize/${size}/-/`);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
