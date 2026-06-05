@AGENTS.md

# Warit Academy — Project Brief for Claude/Agents

Online course platform (Thai). Students sign up → buy with PromptPay → watch
videos. Admins create courses → upload videos. Blue/white theme. Instructor
persona: "วริศ ฤทธิ์มานะ" (biology tutor).

- **Live:** https://warit-project01.vercel.app
- **Repo:** github.com/naphawich/warit-project01 (PUBLIC — never commit secrets here)

## Tech stack

Next.js 16 (App Router + Turbopack) · TypeScript · Tailwind v4 (CSS-first
`@theme`) · **shadcn/ui on base-ui (NOT Radix)** · motion · lucide-react ·
font Prompt · Zustand (cart) + React Context (auth) · Supabase (DB/Auth/Storage)
· Omise PromptPay (TEST mode) · Resend (email) · Cloudflare R2 (video) ·
Vercel (host, region `sin1`, auto-deploy on push to `master`).

## ⚠️ Codebase rules — break these and the build fails

1. **base-ui, not Radix.** A button-that-is-a-link uses
   `<Button render={<Link href="/" />} nativeButton={false}>`. **Never `asChild`.**
   Accordion has no `type="single"` prop.
2. **Supabase never auto-grants.** New table/sequence → `GRANT` to both
   `authenticated` and `service_role`, or inserts fail (`permission denied` /
   sequence errors). Tables also need adding to the `supabase_realtime`
   publication by hand for Realtime to fire.
3. **Ownership checks need an admin bypass** (`profile.is_admin`) — otherwise
   the admin can't preview their own uploaded course.
4. **Static + DB course merge.** Static courses = ids 1-9 in `src/lib/data.ts`.
   Admin-created courses = ids ≥ 100 in the `courses` table. Any lookup must
   cover both via `mergeCourses()` / `loadCourseById()` in `src/lib/courses-db.ts`.
   This blind spot has bitten admin/learn/my-courses/seed pages repeatedly.
5. **Next.js 16:** route `params` is a `Promise` — `await` it. API routes using
   Node libs (AWS SDK, Resend, Omise) need `export const runtime = "nodejs"`.
6. Always `npm run build` before commit. Commit messages end with
   `Co-Authored-By: Claude ...`. Only push when asked; we push to `master`.

## Database (Supabase project `tlajijzveeztnfbbwaho`, Tokyo region)

`profiles` (has `is_admin`, trigger blocks self-escalation) · `orders` +
`order_items` · `user_courses` (entitlements) · `courses` (admin-made, id≥100) ·
`chapters` · `lessons` (`video_storage_key` → R2) · `course_previews` ·
`lesson_progress` (table exists, no code uses it yet). Storage buckets:
`avatars`, `course-thumbnails`. All have RLS + grants + indexes applied.

## Key files

`lib/data.ts` static catalog + Course type · `lib/courses-db.ts` static/DB merge
· `lib/auth-context.tsx` AuthProvider (user/profile/ownedCourseIds; split
`authLoading` vs `entitlementsLoading`) · `lib/use-user.ts` + `lib/use-ownership.ts`
read from context · `lib/auth-server.ts` (`authenticateRequest`, `adminClient`) ·
`lib/admin-server.ts` (`authenticateAdmin`) · `lib/r2-server.ts` (R2 multipart +
signed URLs) · `lib/email-server.ts` (Resend, fail-safe).

## State that lives OUTSIDE the repo (files can't show this)

- **`.env.local`** (gitignored) holds all secrets: Supabase url/publishable/
  service_role, Omise pkey/skey (test), Resend key, R2 account/access/secret/
  bucket, optional OMISE_WEBHOOK_SECRET. **The same vars must also be set in
  Vercel** (dashboard) — changing them requires a manual Redeploy.
- **Supabase dashboard:** schema, RLS, data, "Confirm email" toggle.
- **Omise dashboard:** TEST mode; webhook → `…/api/webhooks/omise`.
- **Cloudflare R2:** bucket `warit-videos`; CORS allows Vercel+localhost,
  ExposeHeaders incl. ETag/Content-Range, MaxAge 86400.
- **Resend:** sender is `onboarding@resend.dev` → can only email the account
  owner until a custom domain is verified.
- SQL migrations under `supabase/migrations/*.sql` are **already applied** to
  the live DB (don't re-apply blindly — check first).

## Status

Done: home/auth/cart/payment/learn/profile, Vercel deploy, Resend receipts,
avatar+thumbnail storage, R2 video upload (multipart + signed URL), admin
authoring (create course + chapters + lessons + preview clips).

Pending / paused:
- **3.3 Custom domain + Cloudflare CDN** (paused) — buy a `.com` (~฿355/yr).
  Goal: cache video at the edge (5-10× faster) + verify Resend domain to unlock
  email to anyone. Biggest lever for the known "video loads slow" issue.
- **3.4 Omise live KYC** (pending) — personal KYC to take real payments.
- Email currently only reaches the Resend account owner; Supabase "Confirm
  email" is OFF (was hitting the free SMTP rate limit).

## How we work

Claude edits locally → `npm run build` → commit → push → Vercel auto-deploys
(~2 min) → user tests on production. User handles: signing up services,
setting Vercel env vars, testing as a real user. For DB/dashboard changes a
Claude with the Supabase MCP can act directly; a plain file-reading agent
cannot — it can only read code and must ask the user to run DB/env steps.
