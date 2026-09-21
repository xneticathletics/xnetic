# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Repository layout

This is a monorepo with three separate apps sharing one Supabase backend:

- **Root** — the mobile app: React Native / Expo (SDK 54), TypeScript. Source in `src/`.
- **`web/`** — club-admin panel, Vite + React 19 + React Router + Tailwind. Separate Vercel project, separate `node_modules`.
- **`website/`** — public marketing site, Vite + React 19 + Tailwind. Separate Vercel project.
- **`supabase/`** — Postgres migrations (`migrations/`), Edge Functions (`functions/`, Deno).

`tsconfig.json` at the root excludes `web`/`website` — they typecheck independently.

## Commands

Mobile (run from repo root):
- `npx expo start` / `--android` / `--ios` / `--web` — dev server
- `npx tsc --noEmit -p .` — typecheck (pre-existing unrelated errors show under `supabase/functions/**` since those are Deno, not part of this tsconfig — filter them out, e.g. `| grep -v "^supabase/functions/"`)
- `npx --yes eas-cli build --platform ios --profile preview --non-interactive` — EAS build. On this Windows/Git-Bash setup, plain `npx eas ...` fails to resolve; use `npx --yes eas-cli` instead. `preview` = standalone build, no Metro/dev-client needed; `development` needs a dev-client connection.
- `npx --yes eas-cli env:list --environment production --environment preview` / `env:set --name X --value Y --environment ... --visibility plaintext --non-interactive` — EAS Environment Variables (what cloud builds actually read — separate from the local `.env` file, which only affects local `expo start`).

`web/` and `website/` (run from within each directory):
- `npm run dev`, `npm run build` (`tsc -b && vite build` — **`tsc --noEmit` alone can pass while this fails**, always verify with the real build before deploying), `npm run lint` (oxlint), `npm run preview`
- Deploying: git push to `main` auto-deploys via Vercel's GitHub integration (Root Directory is set per-project to `web`/`website` for this). For a one-off redeploy from the CLI *without* a new commit, `vercel --prod` run from inside the subfolder fails (`Root Directory "web" does not exist` — it double-applies the subfolder). Use `vercel redeploy <existing-deployment-url> --target production` instead, which rebuilds from the linked git commit.

Supabase:
- `npx --yes supabase db push` — apply new migrations to the linked project (currently the Frankfurt project, `eu-central-1`)
- `npx --yes supabase functions deploy [name] --use-api` — deploy Edge Function(s); `--use-api` bundles server-side, avoiding the local Docker dependency
- `npx --yes supabase secrets set NAME=value` — Edge Function secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `SETUP_SECRET`); **secret values can't be read back** once set (`secrets list` only returns hashes)
- New migration files: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`, timestamp must sort after the latest existing one

## Architecture

### Multi-tenant auth & authorization

Every table carries `club_id`; **Postgres RLS is the real authorization layer**, not client-side checks. Roles: `super_admin` (platform-wide, no club), `club_admin`, `coach`, `parent`, `athlete`. A `coach` can additionally be a **branch coordinator** (`is_branch_coordinator()`) — treated as an admin scoped to their own branch; this is the intended default for new features touching branch-level data, not a narrower ad-hoc permission set.

RLS policies read the caller's club/role from **custom JWT claims** (`current_club_id()` → `auth.jwt() ->> 'club_id'`, `current_user_role()` → `auth.jwt() ->> 'app_role'`), populated by the Postgres function `public.custom_access_token_hook`. That hook only fires if it's wired up in **Authentication → Hooks → Customize Access Token** on the Supabase dashboard — a project-level setting that lives outside any migration/schema dump. Symptom if it's ever missing on a project (e.g. after cloning/migrating to a new Supabase project): password login succeeds silently, a session is issued, but every RLS-gated query returns empty and the app just sits on the login screen with no visible error.

`public.users` is the app's own user profile table, linked to Supabase's `auth.users` via `users.auth_user_id`. Client code fetches the current app user via `src/lib/api/currentUser.ts` (`getCurrentAppUserId`/`getCurrentClubId`, memoized in-module — reset with `resetCurrentUserCache()` on sign-out). Login accepts email, phone, or a plain username; `src/lib/loginIdentifier.ts` (`resolveLoginEmail`) synthesizes a fake `tel<digits>@…`/`usr<name>@…` address for phone/username logins since Supabase Auth only understands email — `describeLoginIdentifier` reverses this for display.

### Base schema predates tracked migrations

The original tables (`users`, `athletes`, `clubs`, `groups`, etc.) were created directly via the SQL editor before migration tracking started — they do **not** exist in `supabase/migrations/`, which only has `ALTER`s from ~2026-09 onward. `supabase db push` alone cannot bring up a fresh project; a full schema clone needs a `pg_dump --schema-only` from an existing project. Several other things also live outside migrations entirely and need manual/scripted recreation on a new project: `storage.objects` RLS policies (reconstructible from `pg_policies`), `pg_cron`/`pg_net` extensions and the `cron.job` rows (the actual `cron.schedule(...)` calls are in the migration files that introduced each scheduled job — grep for `cron.schedule`), Edge Function secrets, and the Auth Hook + Attack Protection (CAPTCHA) dashboard settings mentioned above.

### App gating sequence (`src/navigation/RootNavigator.tsx`)

After session restore, screens are gated in a fixed order before reaching the real app (`RoleTabs`): force password change → (club_admin only) subscription status (`pending_review`/blocked states show `SubscriptionPendingScreen`) → (coach only) onboarding completion → consent (KVKK/health/photo/liability — all roles except `super_admin`) → maintenance mode (checked earlier, blocks everyone but `super_admin`). Each gate is its own `useEffect` keyed off the previous one resolving; don't reorder without tracing the dependent-state chain.

### Navigation quirk: don't add custom `animation` inside any native-stack (history, not current architecture)

`Sosyal`/`Mağaza`/`Etkinlik` used to be fake tabs — a `CustomTabBar` (`RoleTabs.tsx`) tabPress redirect that PUSHED `SocialFeed`/`Shop`/`ShopManage`/`EventsList`/`EventsManage` onto `HomeStack`'s native-stack, forcing them through native-stack's push transition (slide-in) even though they were meant to feel like instant tab switches. Two separate attempts to fix the slide with a custom `animation` (`"none"`, then `"fade"`) each broke back-button/gesture reliability on screens pushed from them, "worked once then failed" — a known-fragile interaction between native-stack v7 + react-native-screens + the New Architecture. **Root-cause fix (2026-09-17):** these three are now genuine `Tab.Screen`s, each with its own nested native-stack (`SocialStack.tsx`/`ShopStack.tsx`/`EventsStack.tsx`), exactly like `Mesajlar`/`Profil` always were — bottom-tabs' own tab-switch has no transition animation at all, so the screens open instantly with zero `animation` override anywhere. `Mağaza`/`Etkinlik` pick their management-vs-view-only initial screen via `initialRouteName` passed into `ShopStack`/`EventsStack` from `RoleTabs.tsx`. The underlying lesson still stands for any *other* native-stack in this app: don't give a custom `animation` to a screen that has children pushed on top of it without thorough, repeated back-nav testing — this is what broke twice before the redesign.

### `src/lib/api/*.ts` conventions

One file per domain, thin wrappers around `supabase-js` calls (no separate service/repository layer). When a screen or API function needs multiple independent pieces of data, they must be fetched in one `Promise.all` — several real perf bugs in this codebase were exactly this: a function awaiting query A, then only *after* it resolved starting query B/C that never actually depended on A's result (a hidden sequential "waterfall" hiding inside code that looked parallel at the call site). When merging, don't destructure-and-throw across combined `{data, error}` results — check each `.error` individually. Conversely, don't collapse a genuine dependency (e.g. `getCurrentAppUserId()` then a query filtered by that id) — only merge calls that are truly independent.

### Asistan = uygulamanın kullanma kılavuzu (tek kaynaktan üretilir)

Asistan sekmesi (`src/screens/AIScreen.tsx`) gerçek bir LLM değil; kılavuz girişleri üzerinde çalışan bir arama motoru (`src/lib/assistantSearch.ts`). **Kaynak `scripts/manual/*.js`'tir** — `src/lib/assistantManualData.ts` ve `docs/kilavuz/*.md` (rol bazlı kullanma kılavuzları) `node scripts/build-manual.js` ile ÜRETİLİR, elle düzenlenmez. Yeni bir özellik ya da ekran eklendiğinde/değiştiğinde ilgili girişi `scripts/manual/`'a ekle/güncelle ve betiği çalıştır; betik arama motorunu 3000+ soruyla test eder ve bir örnek soru kendi girişini bulamazsa hata verir. Rol harfleri: A=yönetici, K=koordinatör, C=antrenör, P=veli, S=sporcu, X=süper admin (bir girişin `roles` alanı kimlerin görebileceğini belirler; gerçek yetkileri kodla teyit et, tahmin etme). `samples.js` her rol için TAM 20 örnek soru içerir; `holdout.js` motorun görmediği cümlelerle dürüst bir genelleme ölçümü verir (şu an ilk cevap ≈%61, ilk 3 öneri ≈%86).

### Everything is in Turkish

UI strings, code comments, commit messages, and the user's own communication are all Turkish — match that when adding comments or commit messages in this repo.
