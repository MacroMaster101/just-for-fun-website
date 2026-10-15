#!/usr/bin/env node
// Builds the Supabase Auth email templates in supabase/templates/.
//
//   node scripts/build-email-templates.mjs
//
// Each .html file is pasted into Supabase → Authentication → Emails →
// Templates (the matching subject line is in supabase/templates/README.md).
// The {{ .Variable }} placeholders are Supabase's Go-template variables and
// are filled in by Supabase when the email is sent.
//
// One email follows the reader's theme: light by default (inline styles,
// which every client supports) with a prefers-color-scheme: dark override
// for Apple Mail, iOS Mail and Outlook. Gmail applies its own dark mode.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "templates");

const LOGO = "https://j4fn.site/logo-mark.png";
const YOUTUBE = "https://www.youtube.com/@JustForFun-BoYs";
const DISCORD = "https://discord.gg/jzcNVPGx3h";
const SITE = "{{ .SiteURL }}";

const SANS = "'Space Grotesk','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const DISPLAY = "'Orbitron','Arial Black',Arial,sans-serif";
const MONO = "'JetBrains Mono',Consolas,'Courier New',monospace";

// Light palette is inline; the dark palette is applied through classes.
const L = { bg: "#f4f4f6", card: "#ffffff", text: "#111114", muted: "#5b5b66", border: "#e4e4e9", soft: "#f6f6f8", red: "#e0002b", redText: "#c40026" };
const D = { bg: "#0b0b0c", card: "#161618", text: "#f3f3f5", muted: "#a5a5ae", border: "#2a2a30", soft: "#1e1e22", red: "#ff1f4b", redText: "#ff5c7a" };

const DARK_CSS = `
  body,.e-bg{background:${D.bg}!important}
  .e-card{background:${D.card}!important;border-color:${D.border}!important}
  .e-text{color:${D.text}!important}
  .e-muted{color:${D.muted}!important}
  .e-soft{background:${D.soft}!important;border-color:${D.border}!important}
  .e-line{border-color:${D.border}!important}
  .e-btn{background:${D.red}!important}
  .e-link{color:${D.redText}!important}
  .e-ghost{border-color:${D.border}!important;color:${D.text}!important}`;

// ---------- layout ----------

const layout = ({ preheader, body, why }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@900&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
<title>Just For Fun</title>
<style>
  :root{color-scheme:light dark;supported-color-schemes:light dark}
  a{text-decoration:none}
  @media (max-width:480px){.e-pad{padding:28px 22px!important}.e-h1{font-size:22px!important}}
  @media (prefers-color-scheme:dark){${DARK_CSS}}
</style>
</head>
<body class="e-bg" style="margin:0;padding:0;background:${L.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="e-bg" bgcolor="${L.bg}" style="background:${L.bg};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

<tr><td align="center" style="padding:0 0 22px;">
  <a href="${SITE}" style="text-decoration:none;">
  <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="padding-right:10px;"><img src="${LOGO}" width="36" height="36" alt="Just For Fun" style="display:block;border:0;width:36px;height:36px;"></td>
    <td class="e-text" style="font-family:${DISPLAY};font-size:15px;font-weight:900;letter-spacing:.08em;color:${L.text};">JUST FOR FUN</td>
  </tr></table></a>
</td></tr>

<tr><td class="e-card" bgcolor="${L.card}" style="background:${L.card};border:1px solid ${L.border};border-radius:16px;">
  <div class="e-pad" style="padding:36px 36px 32px;">${body}</div>
</td></tr>

<tr><td align="center" style="padding:24px 16px 0;">
  <p style="margin:0 0 10px;font-family:${SANS};font-size:13px;">
    <a class="e-link" href="${YOUTUBE}" style="color:${L.redText};font-weight:700;">YouTube</a>
    <span class="e-muted" style="color:${L.muted};">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>
    <a class="e-link" href="${DISCORD}" style="color:${L.redText};font-weight:700;">Discord</a>
    <span class="e-muted" style="color:${L.muted};">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>
    <a class="e-link" href="${SITE}" style="color:${L.redText};font-weight:700;">j4fn.site</a>
  </p>
  <p class="e-muted" style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${L.muted};">${why}<br>Questions? Reply to this email and a real person will answer.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;

// ---------- building blocks ----------

const icon = (emoji) => `<div style="font-size:30px;line-height:1;margin:0 0 14px;">${emoji}</div>`;

const h1 = (text, align = "left") =>
  `<h1 class="e-text e-h1" style="margin:0 0 12px;font-family:${SANS};font-size:24px;line-height:1.3;font-weight:700;color:${L.text};text-align:${align};">${text}</h1>`;

const p = (text, { align = "left", mb = 24 } = {}) =>
  `<p class="e-muted" style="margin:0 0 ${mb}px;font-family:${SANS};font-size:16px;line-height:1.6;color:${L.muted};text-align:${align};">${text}</p>`;

const strong = (text) => `<strong class="e-text" style="color:${L.text};">${text}</strong>`;

// Full-width, 48px-tall button: easy to tap on phones.
const button = (label, href) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td class="e-btn" align="center" bgcolor="${L.red}" style="background:${L.red};border-radius:12px;">
    <a href="${href}" style="display:block;padding:15px 20px;font-family:${SANS};font-size:16px;font-weight:700;line-height:18px;color:#ffffff;text-decoration:none;border-radius:12px;">${label}</a>
  </td>
</tr></table>`;

const ghostButton = (label, href) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;"><tr>
  <td align="center" style="border-radius:12px;">
    <a class="e-ghost" href="${href}" style="display:block;padding:14px 20px;font-family:${SANS};font-size:15px;font-weight:700;color:${L.text};text-decoration:none;border:1px solid ${L.border};border-radius:12px;">${label}</a>
  </td>
</tr></table>`;

// Backup link for when the button is blocked or doesn't open.
const fallback = (href) => `
<p class="e-muted" style="margin:22px 0 6px;font-family:${SANS};font-size:13px;line-height:1.5;color:${L.muted};">Button not working? Copy and paste this link into your browser:</p>
<p style="margin:0;font-family:${MONO};font-size:12px;line-height:1.5;word-break:break-all;"><a class="e-link" href="${href}" style="color:${L.redText};">${href}</a></p>`;

const note = (text) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;"><tr>
  <td class="e-soft" style="background:${L.soft};border:1px solid ${L.border};border-radius:12px;padding:14px 16px;font-family:${SANS};font-size:13px;line-height:1.55;">
    <span class="e-muted" style="color:${L.muted};">${text}</span>
  </td>
</tr></table>`;

const codeBox = (code) => `
<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 26px;"><tr>
  <td class="e-soft" align="center" style="background:${L.soft};border:1px solid ${L.border};border-radius:14px;padding:18px 26px;">
    <span class="e-text" style="font-family:${MONO};font-size:34px;font-weight:700;letter-spacing:10px;color:${L.text};">${code}</span>
  </td>
</tr></table>`;

const detailRows = (rows) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px;">
${rows.map(([k, v]) => `  <tr>
    <td class="e-muted e-line" style="padding:10px 12px 10px 0;border-bottom:1px solid ${L.border};font-family:${SANS};font-size:13px;color:${L.muted};width:38%;">${k}</td>
    <td class="e-text e-line" style="padding:10px 0;border-bottom:1px solid ${L.border};font-family:${SANS};font-size:14px;font-weight:700;color:${L.text};word-break:break-all;">${v}</td>
  </tr>`).join("\n")}
</table>`;

// Shared tail for every security notice (style F).
const securityActions = `
${p(`${strong("Wasn't you?")} Secure your account now: go to j4fn.site, choose <em>Sign in</em> &rarr; <em>Forgot password</em>, and set a new password.`, { mb: 16 })}
${button("Secure my account", SITE)}
${ghostButton("Contact us", `${SITE}/#contact`)}`;

const EXPIRY = "1 hour"; // Supabase default email link/OTP expiry (Auth → Providers → Email).
const WHY_ACCOUNT = "You're receiving this because this address was used at j4fn.site.";
const WHY_SECURITY = "This is a security notice for your Just For Fun account. We send these to keep it safe.";

// ---------- templates ----------

const templates = [
  {
    file: "confirm-signup.html",
    dashboard: "Authentication → Confirm sign up",
    style: "A",
    subject: "Confirm your email for Just For Fun",
    html: layout({
      preheader: "One step left: confirm your email to finish setting up your account.",
      why: WHY_ACCOUNT,
      body: `
${h1("Confirm your email")}
${p("Thanks for joining Just For Fun! Tap the button below to confirm this is your email address and finish setting up your account.")}
${button("Confirm my email", "{{ .ConfirmationURL }}")}
${fallback("{{ .ConfirmationURL }}")}
${note(`This link expires in ${EXPIRY}. Didn't sign up? You can ignore this email and no account will be created.`)}`,
    }),
  },
  {
    file: "invite-user.html",
    dashboard: "Authentication → Invite user",
    style: "A",
    subject: "You're invited to join Just For Fun",
    html: layout({
      preheader: "You've been invited to the Just For Fun crew. Accept to create your account.",
      why: WHY_ACCOUNT,
      body: `
${icon("🎮")}
${h1("You're invited to the crew!")}
${p("Someone from Just For Fun invited you to create an account. Accept the invite to set up your account and join the community.")}
${button("Accept invite", "{{ .ConfirmationURL }}")}
${fallback("{{ .ConfirmationURL }}")}
${note(`This invite link expires in ${EXPIRY}. Not expecting this? You can safely ignore it.`)}`,
    }),
  },
  {
    file: "magic-link.html",
    dashboard: "Authentication → Magic link or OTP",
    style: "A",
    subject: "Your Just For Fun sign-in link",
    html: layout({
      preheader: "Tap to sign in to Just For Fun. No password needed.",
      why: "You're receiving this because a sign-in was requested for this address at j4fn.site.",
      body: `
${h1("Sign in to Just For Fun")}
${p("Tap the button below to sign in. No password needed.")}
${button("Sign me in", "{{ .ConfirmationURL }}")}
${fallback("{{ .ConfirmationURL }}")}
${note(`This link works once and expires in ${EXPIRY}. Didn't try to sign in? Ignore this email; your account is still safe.`)}`,
    }),
  },
  {
    file: "change-email.html",
    dashboard: "Authentication → Change email address",
    style: "A",
    subject: "Confirm your new email for Just For Fun",
    html: layout({
      preheader: "Confirm the change to your Just For Fun email address.",
      why: WHY_ACCOUNT,
      body: `
${h1("Confirm your new email")}
${p("You asked to change the email address on your Just For Fun account.", { mb: 18 })}
${detailRows([["Current email", "{{ .Email }}"], ["New email", "{{ .NewEmail }}"]])}
${button("Confirm email change", "{{ .ConfirmationURL }}")}
${fallback("{{ .ConfirmationURL }}")}
${note(`This link expires in ${EXPIRY}. Didn't ask for this? Ignore this email and your email address stays the same.`)}`,
    }),
  },
  {
    file: "reset-password.html",
    dashboard: "Authentication → Reset password",
    style: "A",
    subject: "Reset your Just For Fun password",
    html: layout({
      preheader: "Tap to choose a new password for your Just For Fun account.",
      why: "You're receiving this because a password reset was requested for this address at j4fn.site.",
      body: `
${icon("🔑")}
${h1("Reset your password")}
${p("We got a request to reset the password for your Just For Fun account. Tap the button below to choose a new one.")}
${button("Choose a new password", "{{ .ConfirmationURL }}")}
${fallback("{{ .ConfirmationURL }}")}
${note(`This link works once and expires in ${EXPIRY}. Didn't ask for a reset? Ignore this email; your password won't change.`)}`,
    }),
  },
  {
    file: "reauthentication.html",
    dashboard: "Authentication → Reauthentication",
    style: "C",
    subject: "Your Just For Fun verification code: {{ .Token }}",
    html: layout({
      preheader: "Your Just For Fun verification code is {{ .Token }}",
      why: "You're receiving this because a sensitive change was requested on your Just For Fun account.",
      body: `
${h1("Your verification code", "center")}
${p("Enter this code on j4fn.site to confirm it's really you before making a sensitive change.", { align: "center" })}
${codeBox("{{ .Token }}")}
${note(`This code works once and expires in ${EXPIRY}. We'll never ask for it by phone, chat or DM. Didn't request it? Ignore this email and change your password if you're worried.`)}`,
    }),
  },
  {
    file: "password-changed.html",
    dashboard: "Security → Password changed",
    style: "F",
    subject: "Your Just For Fun password was changed",
    html: layout({
      preheader: "The password on your Just For Fun account was just changed.",
      why: WHY_SECURITY,
      body: `
${icon("🔒")}
${h1("Your password was changed")}
${p("The password for your Just For Fun account was just changed. If this was you, there's nothing else to do.", { mb: 18 })}
${detailRows([["Account", "{{ .Email }}"]])}
${securityActions}`,
    }),
  },
  {
    file: "email-changed.html",
    dashboard: "Security → Email address changed",
    style: "F",
    subject: "Your Just For Fun email address was changed",
    html: layout({
      preheader: "The email address on your Just For Fun account was changed.",
      why: WHY_SECURITY,
      body: `
${icon("✉️")}
${h1("Your email address was changed")}
${p("The email address on your Just For Fun account was just changed. If this was you, there's nothing else to do.", { mb: 18 })}
${detailRows([["Old email", "{{ .OldEmail }}"], ["New email", "{{ .Email }}"]])}
${securityActions}`,
    }),
  },
  {
    file: "identity-linked.html",
    dashboard: "Security → Sign-in method linked",
    style: "F",
    subject: "A new sign-in method was added to your Just For Fun account",
    html: layout({
      preheader: "A new way to sign in was linked to your Just For Fun account.",
      why: WHY_SECURITY,
      body: `
${icon("🔗")}
${h1("New sign-in method added")}
${p("A new way to sign in was just linked to your Just For Fun account. If this was you, there's nothing else to do.", { mb: 18 })}
${detailRows([["Account", "{{ .Email }}"], ["Sign-in method", "{{ .Provider }}"]])}
${securityActions}`,
    }),
  },
  // The site doesn't use phone sign-in or MFA yet, so these four never
  // trigger today. They're branded anyway so nothing goes out unstyled
  // if those features are added later.
  {
    file: "identity-unlinked.html",
    dashboard: "Security → Sign-in method removed",
    style: "F",
    subject: "A sign-in method was removed from your Just For Fun account",
    html: layout({
      preheader: "A way to sign in was removed from your Just For Fun account.",
      why: WHY_SECURITY,
      body: `
${icon("🔗")}
${h1("Sign-in method removed")}
${p("A way to sign in was just removed from your Just For Fun account. If this was you, there's nothing else to do.", { mb: 18 })}
${detailRows([["Account", "{{ .Email }}"], ["Sign-in method", "{{ .Provider }}"]])}
${securityActions}`,
    }),
  },
  {
    file: "phone-changed.html",
    dashboard: "Security → Phone number changed",
    style: "F",
    subject: "Your Just For Fun phone number was changed",
    html: layout({
      preheader: "The phone number on your Just For Fun account was changed.",
      why: WHY_SECURITY,
      body: `
${icon("📱")}
${h1("Your phone number was changed")}
${p("The phone number on your Just For Fun account was just changed. If this was you, there's nothing else to do.", { mb: 18 })}
${detailRows([["Account", "{{ .Email }}"], ["Old number", "{{ .OldPhone }}"], ["New number", "{{ .Phone }}"]])}
${securityActions}`,
    }),
  },
  {
    file: "mfa-added.html",
    dashboard: "Security → MFA method added",
    style: "F",
    subject: "Two-factor sign-in was added to your Just For Fun account",
    html: layout({
      preheader: "A two-factor sign-in method was added to your Just For Fun account.",
      why: WHY_SECURITY,
      body: `
${icon("🛡️")}
${h1("Two-factor sign-in added")}
${p("A new two-factor sign-in method was just added to your Just For Fun account. Your account is now better protected. If this was you, there's nothing else to do.", { mb: 18 })}
${detailRows([["Account", "{{ .Email }}"], ["Method", "{{ .FactorType }}"]])}
${securityActions}`,
    }),
  },
  {
    file: "mfa-removed.html",
    dashboard: "Security → MFA method removed",
    style: "F",
    subject: "Two-factor sign-in was removed from your Just For Fun account",
    html: layout({
      preheader: "A two-factor sign-in method was removed from your Just For Fun account.",
      why: WHY_SECURITY,
      body: `
${icon("🛡️")}
${h1("Two-factor sign-in removed")}
${p("A two-factor sign-in method was just removed from your Just For Fun account. If this was you, there's nothing else to do.", { mb: 18 })}
${detailRows([["Account", "{{ .Email }}"], ["Method", "{{ .FactorType }}"]])}
${securityActions}`,
    }),
  },
];

// ---------- write ----------

mkdirSync(OUT_DIR, { recursive: true });
for (const t of templates) writeFileSync(join(OUT_DIR, t.file), t.html);

const readme = `# Supabase Auth email templates

Generated by \`node scripts/build-email-templates.mjs\`. Don't edit the HTML
files by hand: change the script and re-run it.

To install one: Supabase → Authentication → Emails → Templates → pick the
template → set the **Subject**, switch the body to **Source**, paste the
file's contents, then **Save changes**.

Style A = Simple & Clear, C = Code, F = Security notice. Every email follows
the reader's light or dark mode.

| Supabase template | File | Subject | Style |
| --- | --- | --- | --- |
${templates.map((t) => `| ${t.dashboard} | \`${t.file}\` | \`${t.subject}\` | ${t.style} |`).join("\n")}

Security notices also need their toggle switched on in the same Emails page.
The site doesn't use phone sign-in or MFA, so Phone number changed and the two
MFA notices never trigger today; they're branded so nothing goes out unstyled
if those features are added. Check each template's variable chips in the
dashboard match the placeholders used here.

Link expiry in the copy says 1 hour, matching Supabase's default email
OTP expiry (Authentication → Sign In / Providers → Email). Update
\`EXPIRY\` in the script if you change that setting.
`;
writeFileSync(join(OUT_DIR, "README.md"), readme);

console.log(`Wrote ${templates.length} templates to ${OUT_DIR}`);
export { templates };
