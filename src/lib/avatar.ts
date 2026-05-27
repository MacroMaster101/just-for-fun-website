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
