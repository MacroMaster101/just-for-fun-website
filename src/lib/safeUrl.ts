/**
 * Returns the trimmed value if it is an http(s) URL or a site-relative path
 * ("/logos/x.png"), otherwise "". Used for links and images that admins
 * type in (Twitch links, game logos, merch images, thumbnails) so values
 * like `javascript:` or `data:` URLs are never stored and rendered.
 */
export function safeLinkUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const { protocol } = new URL(trimmed);
    return protocol === "https:" || protocol === "http:" ? trimmed : "";
  } catch {
    return "";
  }
}
