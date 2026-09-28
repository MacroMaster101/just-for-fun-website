<div align="center">

<img src=".github/assets/logo.png" alt="Just For Fun logo" width="120" />

# Just For Fun

**The official web hub for the Just For Fun (J4FN) Sri Lankan gaming crew.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.3-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Storage-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2d3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![CI](https://github.com/MacroMaster101/just-for-fun-website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MacroMaster101/just-for-fun-website/actions/workflows/ci.yml)

[**Live site**](https://j4fn.site) · [YouTube](https://www.youtube.com/@JustForFun-BoYs) · [Report a bug](https://github.com/MacroMaster101/just-for-fun-website/issues) · [Security](SECURITY.md)

</div>

---

## 🎮 About the project

Just For Fun is the home base for a crew of Sri Lankan gamers who stream chaotic matches, clutch plays, and weekend chaos on YouTube. The site pulls the channel's uploads and streams in live, shows off the squad, and gives the community ways to join in: a challenge slot machine that posts to Discord, a soundboard, highlight submissions, reviews, and a crew wall.

Behind the public page sits a full admin control room for managing everything without touching code: messages, squad members, schedule, music, sounds, highlights, games, merch, and site settings.

## ✨ Features

- 🤖 **3D hero** with a Spline robot scene, floating game logos, and HUD-style word capsules.
- 📺 **Live YouTube hub** with channel stats, latest uploads, playlists, game filters, upcoming-stream detection, and PostgreSQL caching.
- 🧑‍🚀 **Squad roster** with roles, favourite games, hardware specs, bios, and avatars.
- 🔊 **Highlights & Sound Arena** with synth sounds, uploaded clips, and community highlight submissions (reviewed by admins).
- 🎰 **Challenge Slot** that rolls a random gaming penalty and posts the result to Discord.
- ⭐ **Page ratings & Crew Wall** with optional anonymous reviews and live member presence.
- 🛍️ **Creator Shop** with merch cards, cart simulation, and a live / coming-soon toggle.
- 🔐 **Accounts** via Supabase Auth (Google, Discord, email): profiles, avatars, favourites, notifications, password reset, and account deletion.
- 🛠️ **Admin control room** at `/admin` for all site content.
- 📐 **Fluid layout** that scales from small phones up to large monitors.

## 🧰 Tech stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Lucide icons |
| 3D | Spline (`@splinetool/react-spline`) |
| Auth & storage | Supabase Auth + Storage (`@supabase/ssr`) |
| Database | PostgreSQL on Supabase |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Email | Nodemailer (Gmail SMTP) |
| Hosting | Vercel, with a daily cron for the YouTube cache |
| CI & security | GitHub Actions, CodeQL, Dependabot |

## 🚀 Getting started

### Prerequisites

- Node.js 20 or newer (CI uses 24) and npm
- A Supabase project (database, auth, storage)
- A YouTube Data API key

### 1. Install

```bash
git clone https://github.com/MacroMaster101/just-for-fun-website.git
cd just-for-fun-website
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Postgres pooler URL (runtime) and direct URL (schema changes) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase client config |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for admin uploads and account deletion |
| `YOUTUBE_API_KEY` / `YOUTUBE_CHANNEL_ID` / `YOUTUBE_CHANNEL_HANDLE` | YouTube Data API sync |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Root admin account |
| `CRON_SECRET` | Protects `/api/youtube/refresh` |
| `SMTP_USER` / `SMTP_PASS` | Contact form and reply emails |
| `RAWG_API_KEY` | Game search in the admin panel |
| `DISCORD_CHALLENGE_WEBHOOK_URL` | Challenge Slot → Discord posts |

### 3. Set up the database

```bash
npx prisma db push --url "$DIRECT_URL"
```

Use the direct (session) connection for schema changes, since the transaction pooler can't run them.

Then lock the tables away from Supabase's public Data API. Run [`prisma/security/lock-down-data-api.sql`](prisma/security/lock-down-data-api.sql) in the Supabase SQL Editor, and re-run it whenever `db push` adds new tables. The app only accesses these tables through Prisma, so this changes nothing for the site.

### 4. Create storage buckets

Create these **public** buckets in Supabase Storage: `avatars`, `squad-avatars`, `game-logos`, `highlights`, and `sound-clips` (auto-created on the first admin audio upload if missing).

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the `NEXT_PUBLIC_ADMIN_EMAIL` account (verified email required) and visit `/admin`.

## 🕹️ Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run lint` | Run ESLint |
| `npm run build` | Generate the Prisma client and build for production |
| `npm start` | Serve the production build |

## 🎛️ Admin control room

| Route | Manages |
| --- | --- |
| `/admin#command` | Platform status and quick links |
| `/admin#inbox` | Contact messages and replies |
| `/admin#admins` | Admin email allowlist |
| `/admin#cache` | Manual YouTube cache refresh |
| `/admin#music` | Background music |
| `/admin#squad` | Squad members and avatars |
| `/admin#schedule` | Stream schedule |
| `/admin#sounds` | Soundboard clips |
| `/admin#highlights` | Highlight review queue |
| `/admin#settings` | Hero scene, floating games/words, volume, shop status |
| `/admin#games` | Game list and logos |
| `/admin#merch` | Shop products |

## 📡 YouTube cache

`/api/youtube/refresh` (GET or POST) refreshes the cached channel data. Vercel Cron calls it daily with `Authorization: Bearer <CRON_SECRET>`; signed-in admins can also trigger it from the dashboard. To protect API quota, it refreshes at most once every 15 minutes unless `?force=1` is passed.

## 🌿 Branch workflow

```text
feature/*  ──PR──▶  dev  ──PR──▶  main  ──▶  j4fn.site (Vercel)
```

`main` and `dev` are protected: changes land only through pull requests that pass CI (lint, typecheck, build, `npm audit`) and CodeQL, and only `dev` can be merged into `main`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## 🛡️ Security

- Admin routes require a signed-in user with a **verified** email on the admin allowlist.
- The Supabase service-role key is only used server-side, after authorization.
- App tables have row level security enabled and no Data API grants, so the public anon key can't read or write them directly.
- Uploads are limited by size and file type; public inputs are validated and escaped.
- A strict Content Security Policy and security headers are enforced in production.
- Dependabot and CodeQL watch every change.

Found a vulnerability? Please report it privately, as described in [SECURITY.md](SECURITY.md).

## 📄 License

Channel branding, media, squad details, and visual identity belong to the Just For Fun crew. If you reuse the application code, keep third-party licenses intact and remove all J4FN brand assets and secrets.

<div align="center">
  <sub>Built for chaotic wins, funny fails, and weekend stream energy. ⚡</sub>
</div>
