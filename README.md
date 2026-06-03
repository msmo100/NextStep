# NextStep

A job-application tracker — Kanban board, job search against Arbetsförmedlingen,
statistics, and saved searches. Built with React + TypeScript + Vite, backed by
Supabase (auth + Postgres) and deployable to Vercel.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Vercel](https://vercel.com) account for deployment

## 1. Set up Supabase

1. Create a new project at [app.supabase.com](https://app.supabase.com). Pick a
   region close to your users (e.g. EU North for Sweden).
2. Once the project is ready, open **SQL Editor → New query**, paste the contents
   of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
   `applications` and `saved_searches` tables with Row Level Security so each user
   only ever sees their own data.
3. Open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
4. (Optional) Under **Authentication → Providers → Email**, the default flow
   requires users to confirm their email. For quick local testing you can turn
   **"Confirm email"** off so accounts work immediately. Turn it back on for
   production.
5. Under **Authentication → URL Configuration**, set the **Site URL** to your
   deployed URL (and `http://localhost:5173` for local dev) so confirmation /
   redirect links work.

## 2. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

The app runs at http://localhost:5173. Without valid Supabase env vars the login
screen will show a configuration notice instead of authenticating.

## 3. Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project** and import the repo. Vercel auto-detects Vite
   (build command `npm run build`, output `dist`).
3. Under **Settings → Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (same values as `.env.local`).
4. Deploy. [`vercel.json`](vercel.json) rewrites all routes to `index.html` so
   client-side routing (e.g. `/search`, `/statistics`) works on refresh.
5. Add the production URL to Supabase **Authentication → URL Configuration**.

## Environment variables

| Variable                  | Where to find it                          |
| ------------------------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`       | Supabase → Project Settings → API → URL   |
| `VITE_SUPABASE_ANON_KEY`  | Supabase → Project Settings → API → anon key |

> The anon key is safe to expose in the client; data access is protected by Row
> Level Security policies, not by hiding the key.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server                 |
| `npm run build`   | Type-check and build for production  |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |

## Notes

- The weekly application goal is still stored per-browser in `localStorage`
  (it's a personal preference, not shared data). Everything else — applications
  and saved searches — lives in Supabase, scoped per user.
