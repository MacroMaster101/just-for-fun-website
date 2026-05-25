# 🎮 JUST FOR FUN — Sri Lankan Gaming Hub ⚡

[![Next.js](https://img.shields.io/badge/Next.js-15.0%2B-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Storage-emerald?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-indigo?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

Welcome to the official repository for the **Just For Fun (JFF) Sri Lankan Gaming Crew Web Hub**. This is an ultra-premium, cyberpunk-styled 3D web platform featuring a fully decoupled administrative system settings panel, dynamic HUD console badges, atomic track managers, and persistent music visualizers.

---

## 🚀 Key Features

### 🌐 Public Landing Hub
*   🤖 **3D Interactive Hero**: Framed by elegant, responsive **HUD Console Word Capsules** (`J4FN SQUAD`, `CLUTCH TIME`, `GG EZ`, `MELTDOWN`, `AIM BOT`, `GAME ON`) that stay stationary while game logos spin, drift, and bounce dynamically inside concentric orbit rings.
*   🎯 **Digital Target Interactivity**: Clicks on floating logos and word badges register instantly at `z-index: 15`, producing rich, gravity-driven neon particle explosions. Word pills fade out and reappear exactly in place with no visual jumping.
*   📻 **Persistent Ambient Music Disc**: Seamless HTML vinyl player with physical tonearm animations and real-time audio visualizers. Playback states and track progress survive page transitions and hard refreshes cleanly using `localStorage`.
*   📺 **Auto-Seeded YouTube Feed**: High-performance channel database pulling up to 50 uploads with automated playlist filtering, game tagging, and cron-managed stale-while-revalidate caching.
*   🔔 **Real-Time Notification Hub**: Interactive alert bell next to the user avatar that polls every 30 seconds for unread admin responses and renders a glassy dropdown callout.
*   🎨 **Triple-Mode Themes**: Smooth, high-contrast swapper between Cyberpunk Dark, Sleek Light, and System Default.

### 🎛️ Admin Command Center (`/admin`, gated)
*   ⚙️ **Dynamic Site Settings**: Decoupled control panel to instantly update the Hero Spline 3D Scene URL, custom floating games list (integrated with RAWG Database search & image uploader), and custom sci-fi word capsules.
*   📨 **Smart Contact Inbox**: Full CRUD inbox. Guest replies route directly via SMTP secure Gmail, while registered member replies translate automatically to database `Notification` Bell alerts.
*   🛡️ **Admin Email Allowlist**: Dynamic access gate. The root admin (`NEXT_PUBLIC_ADMIN_EMAIL`) self-seeds automatically on first login.
*   🎵 **Atomic Music Stream**: Real-time CRUD for background visualizer tracks. Paste any URL and activate atomically using a single `prisma.$transaction` block.
*   👥 **Squad Roster CRUD**: Complete dashboard for managing the team cards, avatars, gaming hardware, and signature agents.

---

## 🛠️ Technology Stack

| Layer | Choice |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **Runtime** | [React 19](https://react.dev) |
| **Database** | PostgreSQL (Supabase / Neon) |
| **ORM** | [Prisma 7](https://www.prisma.io) with `@prisma/adapter-pg` |
| **Auth** | [Supabase Auth](https://supabase.com/auth) via `@supabase/ssr` |
| **Storage** | Supabase Storage (`squad-avatars`, `avatars` buckets) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) + Vanilla CSS Variables |
| **3D Rendering**| [Spline](https://spline.design) (`@splinetool/react-spline`) |
| **Mailing** | [Nodemailer](https://nodemailer.com) (Gmail SMTP) |

---

## 📂 Project Architecture

```
src/
├── app/                          App Router paths
│   ├── api/
│   │   ├── admin/                Gated Admin Endpoints
│   │   │   ├── emails/           Allowlist CRUD
│   │   │   ├── messages/         Inbox GET/POST/DELETE
│   │   │   ├── music/            Atomic audio controls
│   │   │   └── squad/            Squad CRUD & avatar uploads
│   │   ├── contact/              SMTP Message Dispatch
│   │   ├── music/active/         Active track fetch
│   │   ├── notifications/        Bell Alert GET/PATCH
│   │   └── youtube/              Cron-triggered feed sync
│   ├── admin/                    Dashboard Panel UI
│   ├── page.tsx                  Public Hub Landing
│   └── layout.tsx                Global Auth/YouTube Contexts
├── components/
│   ├── auth/                     AuthModal, Bell Alert Dropdown, ProfileModal
│   ├── layout/                   Header, Footer, AmbientPlayer Disk
│   ├── sections/                 Hero Robot Scene, SquadRoster, LatestVideos
│   └── ui/                       Card, Button, Badge, GlowSpotlight
└── proxy.ts                      Edge JWT Refresh & Route Guard
```

---

## ⚡ Quick Start

### 1. Clone & Dependencies
```bash
git clone https://github.com/MacroMaster101/just-for-fun-website.git
cd just-for-fun-website
npm install
```

### 2. Configure Environment
Create a `.env` file at the root:
```env
# --- Database (PostgreSQL) ---
DATABASE_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-1-REGION.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.PROJECTREF:PASSWORD@aws-1-REGION.pooler.supabase.com:5432/postgres"

# --- Supabase Auth & Storage ---
NEXT_PUBLIC_SUPABASE_URL="https://YOURPROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# --- YouTube Data API ---
YOUTUBE_API_KEY="your-youtube-data-api-key"
YOUTUBE_CHANNEL_ID="UCcCp0B0bypJE4EJjwq8u2lQ"
YOUTUBE_CHANNEL_HANDLE="@JustForFun-BoYs"

# --- Mail & Admin Config ---
SMTP_USER="justforfun.ggez@gmail.com"
SMTP_PASS="your-16-char-gmail-app-password"
NEXT_PUBLIC_ADMIN_EMAIL="justforfun.ggez@gmail.com"
CRON_SECRET="your-32-byte-cron-hex-secret"
```

### 3. Database Push
```bash
npx prisma db push
```

### 4. Boot Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and log in with your root admin email to gain instant access to `/admin`!

---

## 🛡️ Security Measures
> [!IMPORTANT]
> *   **Edge Level Guarding**: The edge proxy (`src/proxy.ts`) evaluates session JWTs and handles secure 302 redirects away from `/admin` before React even begins rendering.
> *   **Strict CSP Headers**: Configured with a locked-down `Content-Security-Policy` permitting only trusted assets from Google Fonts, YouTube, Spline, and Supabase.
> *   **Atomicity**: Stream transitions are transactional via single DB batch operations, preventing visual players from getting out of sync.

---

## 📄 License
This repository hosts the official personal web hub for the **Sri Lankan Just For Fun** gaming channel. All graphic assets, squad metadata, and channel branding are copyrighted property of JFF. The core software engine is provided as open-source.

---
<p align="center">
  Made with ⚡ and 🎮 by the Just For Fun Sri Lankan Gaming Crew.
</p>
