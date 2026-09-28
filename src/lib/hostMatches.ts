/**
 * True when `url` (a full URL or an origin) is served from `domain` or one
 * of its subdomains. Compares the parsed hostname — a plain substring check
 * like `url.includes("youtube.com")` would also accept attacker-controlled
 * hosts such as `youtube.com.evil.net` or `evil.net/?youtube.com`.
 */
export function hostMatches(url: string, domain: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return hostname === domain || hostname.endsWith(`.${domain}`);
}
