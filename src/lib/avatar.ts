/**
 * Deterministic DiceBear avatar URL for a user. Same seed → same avatar
 * forever, so members get a stable identity even before they upload
 * anything. Used everywhere a user avatar is rendered: UserMenu pill,
 * ProfileModal, Crew Wall, etc.
 *
 * The `bottts-neutral` style fits the cyberpunk red theme; backgrounds
 * are forced into the J4FN gradient so every fallback feels on-brand.
 */
export const diceBearAvatar = (seed: string): string =>
  `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=ff0033,b30024,1c1c1c&radius=50`;

// Avatar hosts we render (mirrors the CSP img-src list in next.config.ts).
// Anything else could be a tracking pixel or an arbitrary third-party URL
// that we'd then show on the Crew Wall and forward to Discord.
const AVATAR_HOSTS = ["api.dicebear.com", "cdn.discordapp.com"];
const AVATAR_HOST_SUFFIXES = [".googleusercontent.com"];
const SUPABASE_PUBLIC_STORAGE_PATH = "/storage/v1/object/public/";

const ownSupabaseHost = (): string | null => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
};

/**
 * True when `value` is an https URL on an avatar host we trust. Supabase
 * URLs must point at public storage in *our* project, not any *.supabase.co
 * project an attacker could upload to.
 */
export const isAllowedAvatarUrl = (value: string): boolean => {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (AVATAR_HOSTS.includes(url.hostname)) return true;
    if (AVATAR_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))) {
      return true;
    }
    return (
      url.hostname === ownSupabaseHost() &&
      url.pathname.startsWith(SUPABASE_PUBLIC_STORAGE_PATH)
    );
  } catch {
    return false;
  }
};

/**
 * Return the trimmed avatar URL if it passes `isAllowedAvatarUrl`, else
 * null. Use on anything user-controlled, including Supabase user_metadata,
 * which a signed-in user can set to any value from the browser.
 */
export const safeAvatarUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && isAllowedAvatarUrl(trimmed) ? trimmed : null;
};

/**
 * Resolve the avatar URL to display for a user. Falls back to a
 * deterministic DiceBear avatar when no uploaded/OAuth avatar exists.
 * Pass the auth user id as the seed so the fallback survives across
 * email changes and matches the avatar shown on the public Crew Wall.
 */
export const resolveAvatarUrl = (
  uploaded: string | null | undefined,
  seed: string
): string => {
  const trimmed = (uploaded || "").trim();
  if (trimmed) return trimmed;
  return diceBearAvatar(seed);
};
