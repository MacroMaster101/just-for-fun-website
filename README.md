# Just For Fun — Gaming Channel Website

The official web hub for the **Just For Fun** Sri Lankan gaming channel: a cyberpunk-styled landing site with live YouTube data, in-app notifications, an admin console for managing the squad / music / inbox, and a persistent ambient music player that survives navigation.

Built on Next.js 16 (App Router + Turbopack), React 19, Supabase, Prisma, Tailwind 4, and a Spline 3D scene for the hero robot.

---

## Features

### Public site

- **Hero with Spline 3D robot.** Loads on idle, mounts a hidden YouTube ambient music iframe at the root layout so audio persists across `/` ↔ `/admin` route changes.
- **YouTube feed (up to 50 videos).** Channel uploads + stats are pulled via the YouTube Data API and cached in Postgres so the user-facing route doesn't burn API quota. Includes auto-detected game tags and YouTube playlist filters, plus a "See more / Show less" reveal pattern.
- **Persistent music disc.** Vinyl-disc styled play/pause button with mechanical tonearm, visualizer bars, hover tooltip + first-visit auto-show tooltip. Play state and playback position survive refresh via `localStorage`. Iframe defends against YouTube's implicit autoplay quirk by sending an explicit `pauseVideo` postMessage when React state says paused.
- **Meet the Squad section.** Reads members from the DB (`/api/squad`, ISR 60s). Falls back to the built-in trio if the table is empty. Editor lives in `/admin → Squad Roster`.
- **Contact form.** Stores the message in Postgres, dispatches an SMTP Gmail alert, and attaches the sender's Supabase `userId` when they're logged in so admin replies can be delivered as in-app notifications later.
- **Auth.** Email/password with strength meter, magic links, password reset, and OAuth (Google, Facebook, Discord).
- **Light/dark/system theme** with a 3-way toggle in the header.
- **Notification bell.** Standalone bell next to the user avatar (logged-in only). Polls every 30s for an unread count, opens a themed dropdown with the user's notifications.

### Admin console (`/admin`, gated)

- **Contact Inbox** — list, read, reply, delete. Reply auto-routes:
  - If the original sender was logged in, the reply becomes a `Notification` row visible in their bell.
  - If they were a guest, the reply gets sent as a Gmail SMTP email to the address they provided.
- **Administration** — manage which emails are on the admin allowlist. Root admin (`NEXT_PUBLIC_ADMIN_EMAIL`) is always allowed and self-seeds on first check.
- **Music Stream** — CRUD for background music tracks. Paste any YouTube URL or 11-char ID (auto-extracts), one track active at a time. Activation is atomic via a single `prisma.$transaction` and propagates to the public player within ~5s.
- **Squad Roster** — full editor for `SquadMember` rows (name, role, avatar URL / upload, favorite games list, signature agent, hardware specs, bio, combat style, sort order). On first open, auto-seeds the hardcoded fallback trio so admins have something to edit.
- **YouTube Cache** — manual "Sync Cache" button that triggers the same refresh endpoint Vercel Cron uses. Authenticates via the admin's Supabase session cookie, so the `CRON_SECRET` never ships to the browser.

### Security

- **Edge proxy** (`src/proxy.ts`) refreshes Supabase JWTs on every matched request and 302-redirects unauthenticated users away from `/admin` before the React tree renders.
- **Security response headers** (set in `next.config.ts`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security` (HSTS, 2y), and a full `Content-Security-Policy-Report-Only` allowing only YouTube / Supabase / Spline / Google Fonts.
- **All admin API routes** check Supabase session + admin allowlist via `verifyAdmin()` on every call.
- **Service-role Supabase client** (`src/lib/supabase/admin.ts`) is server-only and used exclusively for storage writes that need to bypass RLS (squad avatar uploads).
- **No secrets in client bundles** — admin actions authenticate via session cookies, not bearer tokens.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Runtime | [React 19](https://react.dev) |
| Database | PostgreSQL (Supabase or any Postgres) |
| ORM | [Prisma 7](https://www.prisma.io) with the `@prisma/adapter-pg` driver |
| Auth | [Supabase Auth](https://supabase.com/auth) via `@supabase/ssr` |
| Storage | Supabase Storage (`squad-avatars`, `avatars` buckets) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + custom CSS variables for light/dark theming |
| 3D | [Spline](https://spline.design) (`@splinetool/react-spline`) |
| Icons | [Lucide React](https://lucide.dev) |
| Email | [Nodemailer](https://nodemailer.com) (Gmail SMTP) |
| Scheduler | Vercel Cron |

---

## Project structure

```
src/
├── app/                          App Router routes
│   ├── api/
│   │   ├── admin/                Admin-only endpoints (verifyAdmin gated)
│   │   │   ├── check/            "Am I an admin?" boolean
│   │   │   ├── emails/           Admin allowlist CRUD
│   │   │   ├── messages/         Inbox: GET / POST (reply) / DELETE
│   │   │   ├── music/            Music tracks CRUD + atomic activate
│   │   │   └── squad/            Squad CRUD + avatar upload subroute
│   │   ├── contact/              Public contact form submission
│   │   ├── favorites/            User favorites
│   │   ├── music/active/         Public: which track to embed right now
│   │   ├── notifications/        User notifications (GET, PATCH mark-read)
│   │   ├── profile/              User profile + avatar upload
│   │   ├── squad/                Public squad list (ISR 60s)
│   │   └── youtube/              Cached YouTube payload + cron refresh
│   ├── admin/                    Admin dashboard page
│   ├── auth/                     OAuth callback + password reset
│   ├── layout.tsx                Wraps the app with AuthProvider, YouTubeProvider, AmbientPlayer
│   └── page.tsx                  Homepage
├── components/
│   ├── auth/                     AuthModal, UserMenu, NotificationBell, ProfileModal
│   ├── layout/                   Header, Footer, AmbientPlayer
│   ├── providers/                YouTubeProvider context
│   ├── sections/                 Hero, SquadRoster, LatestVideos, etc.
│   ├── theme/                    Theme provider + toggle
│   └── ui/                       Reusable primitives (Button, Card, Badge, …)
├── lib/
│   ├── prisma.ts                 Prisma client with pg adapter
│   ├── supabase/
│   │   ├── admin.ts              Service-role client (server-only)
│   │   ├── client.ts             Browser singleton
│   │   └── server.ts             SSR cookie-bound client
│   ├── youtube.ts                YouTube Data API fetcher
│   └── youtubeCache.ts           Postgres cache + stale-while-revalidate
└── proxy.ts                      Edge proxy (JWT refresh + /admin gate)

prisma/
└── schema.prisma                 Models: ContactMessage, Notification, Profile,
                                   Favorite, AdminEmail, MusicTrack, SquadMember,
                                   YouTubeCache (+ FavoriteKind enum)
```

---

## Getting started

### Prerequisites

- **Node.js 20+**
- A **Postgres database** (Supabase recommended — auth, storage, and DB all in one)
- A **YouTube Data API v3 key** (Google Cloud Console)
- A **Gmail account** with an App Password (for contact form alerts)

### 1. Clone and install

```bash
git clone https://github.com/MacroMaster101/just-for-fun-website.git
cd just-for-fun-website
npm install
```

`postinstall` will run `prisma generate` automatically.

### 2. Configure environment

```bash
cp .env.example .env
```

Then fill in the values. Annotated reference:

```env
# --- Database (PostgreSQL) ---
# Runtime queries go through the transaction pooler (port 6543) — IPv4 friendly for Vercel.
DATABASE_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres"

# DDL (prisma db push / migrate) needs a non-pooled session connection (port 5432).
DIRECT_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"

# --- Supabase Auth & Storage ---
NEXT_PUBLIC_SUPABASE_URL="https://YOURPROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"

# Service-role key — SERVER-ONLY, bypasses RLS. NEVER prefix with NEXT_PUBLIC_.
# Used for admin storage writes (squad avatar uploads).
# Project Settings → API → Legacy anon/service_role API keys → service_role.
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# --- YouTube Data API ---
YOUTUBE_API_KEY="your-youtube-data-api-key"
YOUTUBE_CHANNEL_ID="UCcCp0B0bypJE4EJjwq8u2lQ"
YOUTUBE_CHANNEL_HANDLE="@JustForFun-BoYs"

# --- Cron secret for /api/youtube/refresh ---
# openssl rand -hex 32
CRON_SECRET="your-32-byte-random-hex-string"

# --- Contact form Gmail SMTP forwarder ---
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-gmail-app-password"

# --- Root admin (auto-seeded into AdminEmail on first check) ---
NEXT_PUBLIC_ADMIN_EMAIL="your-email@gmail.com"
```

### 3. Provision Supabase

In your Supabase project dashboard:

- **Storage → New bucket** `squad-avatars` (public). Holds admin-uploaded squad member avatars.
- **Storage → New bucket** `avatars` (public). Holds user-uploaded profile avatars.
- **Authentication → Providers** — enable Email and any OAuth providers you want (Google, Facebook, Discord).
- **Authentication → URL Configuration** — add `http://localhost:3000` to the Site URL list during local dev.

### 4. Push the schema

```bash
npx prisma db push
```

Uses `DIRECT_URL` (port 5432) for the DDL transaction. Required because the transaction pooler can't run multi-statement schema migrations.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in as the `NEXT_PUBLIC_ADMIN_EMAIL` user and navigate to `/admin` to access the console.

---

## NPM scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server (Turbopack) on port 3000 |
| `npm run build` | Run `prisma generate` then `next build` (production build) |
| `npm run start` | Run the built production server |
| `npm run lint` | ESLint over the whole project |

---

## Database schema

The Prisma schema lives in [`prisma/schema.prisma`](prisma/schema.prisma) and contains:

- **`ContactMessage`** — contact form submissions, with `replyText` / `repliedAt` / `repliedBy` columns once an admin replies.
- **`Notification`** — per-user in-app notifications. Created when an admin replies to a logged-in user's message. Indexed on `(userId, readAt)` for fast unread counts.
- **`Profile`** — extends `auth.users` with `name`, `bio`, `avatarUrl`. Application-managed link (no FK to `auth.users`).
- **`Favorite`** — `(userId, kind, itemId)` tuples for video / sound favorites.
- **`AdminEmail`** — allowlist of email addresses with admin permissions.
- **`MusicTrack`** — registered background music YouTube tracks. One `isActive: true` at a time.
- **`SquadMember`** — full editable roster (name, role, avatar, games, agent, hardware specs, bio, combat style, sortOrder).
- **`YouTubeCache`** — single-row `key="main"` cache of the latest YouTube channel + uploads payload.

---

## Deployment (Vercel)

1. Push the repo to GitHub and import the project on Vercel.
2. Set all environment variables from your `.env` in Vercel Project Settings → Environment Variables.
3. The included [`vercel.json`](vercel.json) registers a Vercel Cron that hits `/api/youtube/refresh` daily at 06:00 UTC. The cron must send `Authorization: Bearer ${CRON_SECRET}` — Vercel does this automatically once `CRON_SECRET` is set in env.
4. Update Supabase **Authentication → URL Configuration** to add your production domain.

The proxy and security headers ship automatically — no extra config required.

---

## Security notes

- **`.env` is git-ignored.** Never commit it. If you accidentally do, rotate every secret: regenerate `CRON_SECRET` (`openssl rand -hex 32`), rotate the Supabase service-role key, regenerate the Gmail App Password, and consider the YouTube key compromised.
- **CSP is in Report-Only mode by default.** Browser DevTools console will log violations without breaking the site. Once you're confident nothing legitimate is being blocked, flip the header key in [`next.config.ts`](next.config.ts) from `Content-Security-Policy-Report-Only` to `Content-Security-Policy` to enforce.
- **Root admin self-seeding** — when `NEXT_PUBLIC_ADMIN_EMAIL` signs in, they're added to `AdminEmail` automatically. This means losing access to the root mailbox doesn't lock you out of the admin console (the seeded row persists), but it also means that env var should point at an account you control.

---

## License

This repository hosts the personal website for the Just For Fun gaming channel. All channel branding, logos, and member-related content are property of the channel. The codebase itself is provided as-is for reference.
