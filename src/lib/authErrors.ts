/**
 * Sign-in errors arrive in the URL (?auth_error=…, or Supabase's
 * error_description). Anyone can craft such a link, so the text is never
 * shown as-is: it is only used to pick one of these fixed messages.
 */
const MESSAGES = {
  admin_required: "Sign in required to access /admin.",
  link_expired:
    "That link has expired or was already used. Please request a new one.",
  access_denied: "Sign-in was cancelled.",
  signin_failed: "Sign-in didn't complete. Please try again.",
} as const;

export type AuthErrorCode = keyof typeof MESSAGES;

export function authErrorCode(...parts: Array<string | null | undefined>): AuthErrorCode {
  const text = parts.filter(Boolean).join(" ").trim().toLowerCase();
  if (text in MESSAGES) return text as AuthErrorCode;
  if (/expired|invalid|already (been )?used|otp/.test(text)) return "link_expired";
  if (/denied|cancel/.test(text)) return "access_denied";
  return "signin_failed";
}

export const authErrorMessage = (...parts: Array<string | null | undefined>): string =>
  MESSAGES[authErrorCode(...parts)];
