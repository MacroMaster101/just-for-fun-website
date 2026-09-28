# Security Policy

## Supported versions

Only the live site at [j4fn.site](https://j4fn.site), deployed from the `main` branch, is supported. Fixes are made on `dev` and released to `main`.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report it privately through GitHub instead:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Describe the issue, the affected page or API route, and steps to reproduce.

You can expect an acknowledgement within a few days. Once the issue is confirmed, a fix will be prepared on `dev`, released to `main`, and the advisory published after the fix is live.

## Scope

In scope: the website, its API routes (`/api/*`), and authentication flows.

Out of scope: third-party services the site uses (Supabase, Vercel, YouTube, Discord), denial-of-service testing, and social engineering.
