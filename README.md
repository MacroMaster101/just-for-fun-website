# 🎮 JUST FOR FUN — Sri Lankan Gaming Crew Web Hub ⚡

<p align="center">
  <img src="https://media.rawg.io/media/games/b11/b11127b9ee3c3701bd15b9af3286d20e.jpg" alt="JFF Gaming" width="100%" style="border-radius: 16px; border: 2px solid #ff0033; box-shadow: 0 0 32px rgba(255, 0, 51, 0.45);" />
</p>

<p align="center">
  <strong>An ultra-premium, cyberpunk-styled 3D landing site and custom administration console for the official Sri Lankan gaming channel. Built with immersive high-tech aesthetics, dynamic database settings, and zero-caching APIs.</strong>
</p>

---

## 🚀 Key Features

### 🌐 public Hub
*   🤖 **3D Interactive Hero**: Framed by elegant, responsive **HUD Console Word Capsules** (`JFF SQUAD`, `CLUTCH TIME`, `GG EZ`, `MELTDOWN`, `AIM BOT`, `GAME ON`) that stay stationary while game logos spin, drift, and bounce dynamically inside concentric orbit rings.
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
  Made with ⚡ and 🎮 by the Just For FunSri Lankan Gaming Crew.
</p>
