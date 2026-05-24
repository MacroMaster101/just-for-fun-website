# 🎮 Just For Fun - Official Sri Lankan Gaming Channel Website

Welcome to the official web repository for **Just For Fun Gaming Channel**, a sleek, retro-future cyberpunk landing portal and interactive community site designed for Sri Lankan gaming enthusiasts! 

Built with industry-grade performance, glassmorphic visual excellence, and secure client-server architectures, this site features live YouTube API integrations, Supabase security, custom Web Audio streams, and a physical-simulated mechanical record player.

---

## ✨ Key Features

### 🔐 1. Secured Authentication Portal
*   **Supabase Auth Integration:** High-performance sign-in, account creation, and reset-password flows.
*   **Interactive Complexity Meter:** An emerald-glowing, real-time checklist tracking length, uppercase, lowercase, numbers, and special characters during Sign Up.
*   **Tactile Controls:** Smooth visual password show/hide eye toggles across all entry points.
*   **Automated Form Cleansing:** Instantly purges inputs upon modal toggle or logout to prevent credentials leakage on shared hardware.
*   **Branded "Remember Me":** Customized neon-crimson checkbox that persists session states comfortably.

### 🎵 2. Interactive Vinyl Disc Music Player
*   **3D-Styled CSS Conic Grooves:** Conic gradients (`bg-[conic-gradient(...)]`) simulate physical vinyl record texture and light reflection paths that spin dynamically.
*   **Mechanical Tonearm Stylus:** A realistic metallic silver stylus arm and laser-needle body that physically pivots `20deg` down onto the record when playing, and swings back to rest when paused.
*   **Slide-Out Bouncing Visualizer:** Triple neon-pink visualizer wave bars slide out towards the screen center and bounce to the rhythm only when active.
*   **Hidden YouTube Stream:** Loops the channel's ambient synthwave theme (`https://youtu.be/h7MYJghRWt0`) via a hidden iframe player with a standardized **35%** cozy background volume limit.
*   **Left-Corner Floating Layout:** Anchored at `bottom-4 left-4` with an intelligent left-aligned tooltip to prevent viewport border clipping.

### 📬 3. Fail-Safe Contact Form with SMTP Alerts
*   **Dual-Layer Resiliency:** Forms immediately record incoming name, email, and message inputs inside your PostgreSQL database (`ContactMessage` table) to prevent message loss.
*   **SMTP Gmail Alerts:** Automatically dispatches a beautifully formatted responsive HTML email notification directly to your Gmail address when submissions occur.
*   **One-Click Replies:** Automatically sets the `replyTo` parameter to the submitter's email, enabling you to reply straight from your inbox.
*   **Prefill Assistance:** Detects active Supabase sessions and pre-populates name and email details automatically for logged-in users.

### 📊 4. Cached YouTube Data API Integration
*   **Cron-Driven Caching:** Saves channel payloads, subscribers, and videography to Postgres to prevent YouTube API quota exhaustion.
*   **Vercel Cron / API Refresh:** Periodic background calls refresh the cache dynamically.

---

## 🛠️ Technology Stack

*   **Framework:** [Next.js (App Router)](https://nextjs.org/) utilizing Turbopack compilation.
*   **Database & Auth:** [Supabase Client & Server Client](https://supabase.com/) (PostgreSQL).
*   **Database ORM:** [Prisma ORM](https://www.prisma.io/) using the standard PG Driver Adapter (`@prisma/adapter-pg`).
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom glassmorphism and keyframe animations.
*   **Email Engine:** [NodeMailer](https://nodemailer.com/) (Secure direct SMTP).
*   **Icons:** [Lucide React](https://lucide-react.dev/).

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 🔧 1. Local Environment Configuration
Clone the repository and create your local environment file:
```bash
cp .env.example .env
```

Open `.env` and populate your variables:
```env
# Database Transaction connection pooler (standard Supabase transaction port 6543)
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres"

# Supabase public credentials
NEXT_PUBLIC_SUPABASE_URL="https://yourprojectid.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"

# YouTube Data API configuration
YOUTUBE_API_KEY="your-youtube-data-api-key"
YOUTUBE_CHANNEL_ID="UCcCp0B0bypJE4EJjwq8u2lQ"

# Vercel Cache Cron Secret
CRON_SECRET="your-32-byte-random-string"

# Contact SMTP Email Alert Forwarder
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-gmail-app-password"
```

### 📦 2. Installation
Install project dependencies:
```bash
npm install
```

### 🗃️ 3. Database Migration
Push your schema structures onto your database instance:
```bash
npx prisma db push
```

### 💻 4. Run Development Server
Fire up the local compiler:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view your premium gaming portal!

---

## 🔒 Security Practices
*   **Strict Secrets Ignored:** The local `.env` is explicitly ignored inside `.gitignore` via `.env*`.
*   **No Hardcoded Credentials:** SMTP services and endpoints retrieve all credentials directly from environment variables.
*   **Fail-Safe Architecture:** Third-party errors (like SMTP failures or session load delay) are captured inside try-catch scopes to prevent site compilation blockages or user crashes.
