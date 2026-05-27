# 🎮 Just For Fun Website ⚡

> **GitHub description:** Official web hub for the Just For Fun Sri Lankan gaming crew, built with Next.js, Supabase, Prisma, YouTube sync, admin tools, and community highlights.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=111)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Storage-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2d3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

Welcome to the official **Just For Fun (J4FN)** gaming crew web hub: a cyberpunk channel site for chaotic streams, clutch clips, community moments, squad profiles, and admin-powered content updates.

Think of it as the crew’s command center: public hype page up front, serious admin controls in the back, and just enough neon to make the database feel like it has RGB.

## 🚀 What It Does

- 🤖 **3D hero experience** with a Spline robot scene, floating game logos, HUD-style word capsules, and interactive particle pops.
- 📺 **Live YouTube hub** with channel stats, latest uploads, playlists, game filters, upcoming stream detection, and PostgreSQL caching.
- 🧑‍🚀 **Crew profiles** for squad members, gaming roles, favorite games, hardware specs, bios, and avatars.
- 🔊 **Highlights & Sound Arena** with browser synth sounds, uploaded sound clips, and community highlight submissions.
- 🎰 **Challenge Slot** that rolls random gaming penalties and can post the result to Discord.
- 🛍️ **Creator Shop mode** with merch cards, cart simulation, live/coming-soon toggle, and admin-managed products.
- 🔐 **Supabase auth** with profiles, avatars, favorites, notification bell, password reset, and account deletion.
- 🛠️ **Admin command center** for messages, admins, YouTube cache, music, squad, schedule, sounds, highlights, settings, games, and merch.

## 🧰 Tech Loadout

| Layer | Gear |
| --- | --- |
| ⚛️ Framework | Next.js 16 App Router |
| 🧩 UI | React 19, Tailwind CSS 4, Lucide icons |
| 🤖 3D | Spline via `@splinetool/react-spline` |
| 🔐 Auth | Supabase Auth via `@supabase/ssr` |
| 🗄️ Database | PostgreSQL through Supabase or Neon |
| 🧠 ORM | Prisma 7 with `@prisma/adapter-pg` |
| 🪣 Storage | Supabase Storage buckets |
| 📬 Email | Nodemailer with Gmail SMTP |
| ▲ Hosting | Vercel-ready config and cron endpoint |

## 🗺️ Project Map

```text
src/
  app/
    admin/                 🎛️ Admin console UI
    api/                   🔌 Public and admin route handlers
    auth/                  🔑 OAuth callback and reset-password pages
    page.tsx               🏠 Public homepage composition
    layout.tsx             🌐 Global providers and shell
  components/
    auth/                  👤 Auth modal, profile, notifications, user menu
    layout/                🧭 Header, footer, music player, utility UI
    providers/             📺 YouTube data provider
    sections/              🧱 Homepage sections
    theme/                 🌓 Theme provider and toggle
    ui/                    ✨ Shared UI components
  lib/
    supabase/              🔐 Browser, server, and service-role clients
    youtube.ts             📡 YouTube Data API fetch/normalization
    youtubeCache.ts        🧊 PostgreSQL cache helpers
    prisma.ts              🗄️ Prisma client singleton
prisma/
  schema.prisma            🧬 Application data model
```

## ⚡ Launch Sequence

### 1. Install dependencies

This repo ships with a `pnpm-lock.yaml`, so **pnpm** is the preferred package manager.

```bash
corepack enable
pnpm install
```

`npm install` also works, but it will not use the checked-in lockfile.

### 2. Configure environment

Copy `.env.example` to `.env`, then fill in your Supabase, database, YouTube, SMTP, RAWG, and Discord values.

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

NEXT_PUBLIC_SUPABASE_URL="https://YOURPROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

YOUTUBE_API_KEY="your-youtube-data-api-key"
YOUTUBE_CHANNEL_ID="UCcCp0B0bypJE4EJjwq8u2lQ"
YOUTUBE_CHANNEL_HANDLE="@JustForFun-BoYs"

SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"

NEXT_PUBLIC_ADMIN_EMAIL="your-admin-email@gmail.com"
CRON_SECRET="your-32-byte-hex-secret"
RAWG_API_KEY="your-rawg-api-key"
DISCORD_CHALLENGE_WEBHOOK_URL="https://discord.com/api/webhooks/XXXX/YYYY"
```

### 3. Sync the database

For quick local development:

```bash
pnpm prisma db push
```

When using Supabase pooler URLs, run schema changes against the direct/session connection instead of the transaction pooler:

```bash
pnpm prisma db push --url "<DIRECT_URL from .env>"
```

### 4. Create Supabase Storage buckets

Create these public buckets in Supabase Storage:

- 🧑 `avatars`
- ⚔️ `squad-avatars`
- 🎮 `game-logos`
- 🔊 `sound-clips` (Auto-created dynamically by the server if missing)
- 🎬 `highlights`

User avatar uploads use the logged-in Supabase client and should be covered by Storage RLS. Admin upload routes use the server-only service role key after admin verification. The `"sound-clips"` bucket features automatic self-healing: if the bucket is missing during an admin audio upload, the backend automatically creates it with public read access.

### 5. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with `NEXT_PUBLIC_ADMIN_EMAIL`, then visit `/admin` to seed and enter the control room.

## 🕹️ Scripts

```bash
pnpm dev      # Start the local Next.js dev server
pnpm lint     # Run ESLint
pnpm build    # Generate Prisma client and build for production
pnpm start    # Start the production server after building
```

## 🎛️ Admin Control Room

- 🧭 `/admin#command` — platform status and quick links
- 📨 `/admin#inbox` — contact messages and admin replies
- 🛡️ `/admin#admins` — admin email allowlist
- 🔄 `/admin#cache` — manual YouTube cache refresh
- 🎵 `/admin#music` — active background music
- 👥 `/admin#squad` — squad members and avatars
- 📅 `/admin#schedule` — recurring stream slots and cached upcoming YouTube streams
- 🔊 `/admin#sounds` — public soundboard clips
- 🎬 `/admin#highlights` — community highlight review queue
- ⚙️ `/admin#settings` — hero scene, floating games, floating words, volume, and shop status
- 🎮 `/admin#games` — public game list and logos
- 🛍️ `/admin#merch` — creator shop products and live status

## 📡 YouTube Cache Pulse

The YouTube cache refresh endpoint accepts both `GET` and `POST`:

```text
/api/youtube/refresh
```

Authorize cron requests with:

```text
Authorization: Bearer <CRON_SECRET>
```

or:

```text
/api/youtube/refresh?key=<CRON_SECRET>
```

Authenticated admins can also trigger refreshes from the dashboard. The endpoint protects YouTube quota by allowing one real refresh every 15 minutes unless `?force=1` is passed.

## 🛡️ Security Shields

- 🔐 Admin API routes verify the current Supabase user email against `NEXT_PUBLIC_ADMIN_EMAIL` or the `AdminEmail` table.
- 🚪 `src/proxy.ts` refreshes auth cookies for selected routes and redirects unauthenticated `/admin` visitors.
- 🧨 Supabase service-role access lives in `src/lib/supabase/admin.ts` and is only used from server route handlers.
- 📦 Upload routes enforce file size and MIME allowlists.
- 🧾 `next.config.ts` currently sends CSP as `Content-Security-Policy-Report-Only`; review browser reports before enforcing it.
- 🙈 `.env` stays private through `.gitignore`; only `.env.example` is committed.

## ✅ Verification

Current project checks:

```bash
pnpm lint
pnpm build
```

Lint currently passes with a few raw `<img>` warnings. The production build generates Prisma Client before compiling Next.js.

## 📌 Review Notes

Recent project review found a few good next upgrades:

- Add rate limiting or bot protection to public write endpoints.
- Align CSP/image domains before enforcing CSP, especially for RAWG-hosted game art.
- Validate merch image URLs against supported Next Image domains or use uploaded Supabase assets.
- Escape user-provided values before interpolating them into HTML emails.

## 📄 License

This repository hosts the official **Just For Fun** gaming crew web hub. Channel branding, media, squad metadata, and visual identity belong to the J4FN crew. Reuse of the application code should preserve third-party licenses and remove private brand assets or secrets before redistribution.

<p align="center">
  🎮 Built for chaotic wins, funny fails, and weekend stream energy. ⚡
</p>
