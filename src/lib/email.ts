import { rootAdminEmail } from "@/lib/auth/admin";

/**
 * Transactional email via Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 * Plain fetch, no SDK. The API key can only send mail through Resend and
 * can be revoked on its own, unlike a Gmail app password.
 *
 * Env:
 *   RESEND_API_KEY       required to send; without it sending is skipped
 *   EMAIL_FROM           verified sender, e.g. "Just For Fun <noreply@j4fn.site>"
 *   CONTACT_INBOX_EMAIL  where contact alerts go and where users' replies
 *                        land; falls back to ADMIN_EMAIL
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Just For Fun <noreply@j4fn.site>";
const SEND_TIMEOUT_MS = 10_000;

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/** Inbox for contact alerts, and the reply-to on outgoing replies. */
export const contactInbox = (): string | null =>
  process.env.CONTACT_INBOX_EMAIL?.trim() || rootAdminEmail();

/**
 * Send one email. Returns true when Resend accepted it, false when email
 * isn't configured or the send failed (the failure is logged). Never
 * throws, so callers can treat email as best-effort.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set; skipping email:", message.subject);
    return false;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Resend rejected email:", res.status, detail);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend request failed:", err);
    return false;
  }
}
