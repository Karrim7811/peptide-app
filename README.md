# PeptideTracker

A full-stack peptide, medication, and supplement tracker with AI-powered interaction checking.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — dark theme
- **Supabase** — auth + database + RLS
- **Anthropic Claude** — interaction checker AI

## Features

- Authentication (login / signup, max 20 users)
- AI Interaction Checker powered by Claude
- My Stack — manage peptides, medications, supplements
- Dosing Reminders — time + days of week scheduling
- Dose Log — log doses, view history grouped by date
- Dashboard — overview of stack, today's reminders, recent logs

---

## Setup

### 1. Clone & install

```bash
git clone <repo-url>
cd peptide-app
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the **SQL Editor**, paste and run the contents of `supabase/schema.sql`.
3. Copy your project URL and anon key from **Settings > API**.

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com).

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push your code to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add the environment variables in the Vercel project settings.
4. Deploy — Vercel auto-detects Next.js.

---

## Database Schema

| Table | Description |
|---|---|
| `profiles` | User profiles (auto-created on signup) |
| `stack_items` | Peptides, medications, supplements |
| `reminders` | Dosing schedule reminders |
| `dose_logs` | Dose history log |

All tables have Row Level Security (RLS) enabled — users can only access their own data.

---

## Notes

- This app is for **informational purposes only**.
- Always consult a qualified healthcare provider before making any medical decisions.
- The AI interaction checker uses Claude and may not reflect the latest medical research.
