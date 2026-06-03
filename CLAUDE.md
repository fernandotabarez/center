# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Mi Centro** — PWA mobile-first (Spanish UI) to manage habits, tasks, payments, and goals. Next.js 15 App Router + Supabase, deployed free on Vercel. Domain language is Spanish: routes and tables use `habitos`, `tareas`, `pagos`, `objetivos`, `ajustes`.

## Commands

```bash
npm run dev      # local dev → http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # next lint
```

No test framework configured. Env: copy `.env.example` → `.env.local`. See README.md for full Supabase/Vercel/Resend/VAPID deploy steps.

## Architecture

**Data flow is entirely Server Actions + Supabase** — there is no separate REST API layer (except the cron route). Client components call `'use server'` functions in `lib/actions/*` directly.

### Supabase client triad (`lib/supabase/`)
- `server.ts` → `createClient()` for Server Components, Server Actions, route handlers. Reads cookies via `next/headers`. Uses anon key (RLS enforced).
- `client.ts` → browser client.
- `admin.ts` → `createAdminClient()` uses the **service_role** key (no cookies, bypasses RLS, enables `auth.admin`). Only for server-to-server contexts with no user session (the cron route). Never expose to the browser.
- `middleware.ts` → `updateSession()` refreshes the auth cookie and redirects unauthenticated users to `/login`.
  - **Gotcha:** there is currently **no root `middleware.ts`** wiring `updateSession`, so this redirect logic is NOT active. Auth is enforced per-action by the `getUser()` guard, not by middleware. If you add route-level protection, create `middleware.ts` at repo root that calls `updateSession`.

### Server Action convention (`lib/actions/{habits,tasks,payments,goals,settings}.ts`)
Every mutating action follows this exact shape — match it:
```ts
'use server'
export async function doThing(...) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return            // auth guard — every action has it
  await supabase.from('table')...
  revalidatePath('/relevant-route')  // revalidate every page showing this data
}
```
`user_id` is set from the authenticated `user.id`, never trusted from input.

### Security model
All tables have **Row Level Security** (`supabase/migrations/001_initial.sql`) with policy `auth.uid() = user_id`. Each user reads/writes only their own rows. The anon-key client relies on RLS. **Server-to-server code with no user session (the cron) MUST use `createAdminClient()`** — the anon client returns zero rows under RLS when there's no authenticated user, and `auth.admin.*` requires the service_role key.

### Habit ↔ Goal linking (non-obvious coupling)
`toggleHabitToday` in `lib/actions/habits.ts` does more than log a habit: if the habit has `linked_goal_id` and the linked goal is `goal_type: 'numeric'`, toggling adjusts the goal's `current_value` by `contributes_amount` (delta + on done, − on undo) and auto-marks the goal `completed` when `target_value` is reached. Changes to habit toggling must keep goal progress in sync.

### Cron / notifications (`app/api/cron/daily-summary/route.ts`)
- Single Vercel cron (`vercel.json`, `0 11 * * *` UTC = 08:00 Montevideo UTC-3).
- Authenticated by `Authorization: Bearer ${CRON_SECRET}` header — returns 401 otherwise.
- Sends Web Push (`lib/push.ts`, VAPID via `web-push`) and/or Resend email per user based on `user_settings.notif_push` / `notif_email`.
- Push subscription is stored as a JSON **string** in `user_settings.push_subscription` (parse before use).
- Service Worker lives at `public/sw.js`; PWA manifest at `public/manifest.json`.

## Types & conventions
- All shared types in `types/index.ts`. Enums encode domain states: `Task.status` (`backlog|today|in_progress|done`) drives the Kanban; `Habit.frequency` (`daily|weekly|weekly_flex|monthly`) drives streak/consistency math in `getHabitsWithStats`.
- Path alias `@/*` → repo root (`tsconfig.json`).
- TypeScript `strict: false` — code does not assume strict null checks.
- Dates handled with `date-fns`; formatted as `'yyyy-MM-dd'` strings for DB date columns. Spanish locale (`date-fns/locale/es`) used for user-facing labels.
- Styling: Tailwind CSS, `clsx` + `tailwind-merge` for class composition.

## Route groups (`app/`)
- `(auth)/login` — magic-link / password login.
- `(app)/{dashboard,habitos,tareas,pagos,objetivos,estadisticas,ajustes}` — main app, shares `AppShell` layout (sidebar + bottom nav in `components/layout/`).
- `auth/callback` — Supabase OAuth callback.
- `api/cron/daily-summary`, `api/push` — route handlers.

Components mirror feature folders under `components/` (`habitos/`, `tareas/`, etc.); shared primitives in `components/ui/`.
