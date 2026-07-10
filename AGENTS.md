<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pakistani Creative Collective — agent guide

A curated directory platform for Pakistani creatives in film/music/media. Next.js 16 (App Router, Server Actions) + Prisma 6 + PostgreSQL (Supabase). This section captures what isn't obvious from the code so future iterations don't re-learn it the hard way.

## Source of truth for design

The visual design is defined by two Canva files (the client's, exported via the Canva MCP):
- **Website Outline** (`DAGzexW9K88`) — page-by-page mockups: brand page, public profile, paid profile (×2), contact request form (×2), logos, brand illustrations.
- **PCC 4X4 Logo** (`DAHFARWKmCA`) — the brand asset pack (textured green backgrounds, the black logo lockup with crescent+star divider, white line-art illustrations).

To re-view them: use the Canva MCP `export-design` (format `png`) then download the returned URLs and Read them as images. `docs/SPEC.md` is the written workflow spec; the PDF in `docs/` is gitignored (too large — 43 MB).

When the client says "match the design," they mean **components, shapes, layout, and spacing**, not just colors/fonts. Pull the mockups and compare side-by-side in the browser.

## Brand system (already wired up — don't reinvent)

Tokens live in `src/app/globals.css` (`@theme`). Use the utility classes, never raw hexes:
- `brand-green #294D3D` · `brand-brown #2A1511` · `brand-cream #FFFCF9` · `brand-mint #91D2A6`
- Headings: `font-heading` (the `.font-heading` class adds the spec's tight tracking). Spec font is **Garet** (licensed, not on Google Fonts) — substituted with **Plus Jakarta Sans extrabold**. Headings are **UPPERCASE** (`uppercase`) per the brand.
- Body: `font-body` (DM Sans).
- Logo: `src/components/Logo.tsx` (`variant="dark"|"light"`), backed by PNGs in `public/brand/`. Source assets in `media/`.

Recurring layout idioms from the mockups:
- Profile pages = **rounded cards (`rounded-3xl`) floating on the textured green background** (`/brand/hero-bg.png` via `<Image fill>` + `bg-brand-green`). White identity card, mint biography card, on-green detail columns.
- Pills are `rounded-full`, uppercase, two styles: **mint fill / green text** and **green fill / cream text**.
- The **admin panel is intentionally a separate dark theme** (`bg-stone-950` wrapper in `src/app/admin/layout.tsx`) — it is an internal tool, not brand-facing. If you change the global body theme, re-check admin contrast.

## Gotchas that have actually bitten us

1. **`"use server"` files can only export async functions.** Exporting a plain constant (e.g. a dropdown options array) from an action file silently breaks at runtime in the client bundle (`X.map is not a function`) while still type-checking and building fine. Put shared constants in a plain module — see `src/lib/contact-request-constants.ts` imported by both the action and `ContactRequestForm.tsx`.

2. **Supabase direct host is IPv6-only.** `db.<ref>.supabase.co` won't resolve from IPv4-only networks. Use the **pooler** string: `postgresql://postgres.<ref>:<pw>@aws-<N>-<region>.pooler.supabase.com:5432/postgres`. The pooler node index (`aws-0`, `aws-1`, …) isn't predictable — grab the exact string from the dashboard's Connect → pooling view.

3. **Prisma CLI reads `.env`; Next.js reads `.env.local`.** Keep `DATABASE_URL` in sync across both. Standalone scripts (like the seed) need `import "dotenv/config"` at the top to pick up `.env`.

4. **The DB is the client's live production Supabase.** Any write/delete to it is gated by the permission system and needs explicit user approval — including the `npm run seed` script (run `npx tsx prisma/seed.ts` only after the user OKs it). Never work around a denial.

5. **Mock mode for launch.** Stripe and Resend are feature-flagged via `isStripeConfigured` (`src/lib/stripe.ts`) and `isResendConfigured` (`src/lib/email.ts`). With no keys set, `/subscribe` shows a "simulate payment" demo button and emails no-op. See `docs/HANDOFF.md` for what the client must provide to go live.

6. **`useActionState` resets uncontrolled form fields after *any* action run, success or error.** A `<form action={formAction}>` built on `useActionState` will silently clear every field the user typed the instant a server action returns — including on a validation error, which reads to the user as "the form ate my 10 minutes of typing." Fix is to make every field controlled by local `useState` (not derived from the action's returned `state` — that only updates post-submission and doesn't need to, since the controlled value already survived the round-trip). See `EnrollForm.tsx`/`ContactRequestForm.tsx`. For "reset the form on success" (e.g. clearing a composer after a successful post), don't `setState` inside a `useEffect` watching `state` — that trips the `react-hooks/set-state-in-effect` lint rule and causes an extra render pass. Instead compare against a `useState`-held "last handled state" *during render* and adjust then (React's sanctioned pattern for this) — see `NewPostForm.tsx`.

7. **`prisma migrate dev` refuses to run at all in this environment** ("non-interactive... not supported" — same with `--create-only`, piped stdin doesn't help). To add a migration: `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > migration.sql` (no shadow DB needed), hand-create the `prisma/migrations/<timestamp>_<name>/migration.sql` file with that output, then `prisma migrate deploy` to apply it. Redirect the diff command's stdout only (`> file`, not `2>&1 | tee file`) — Prisma's own startup warnings go to stderr and will corrupt the SQL file if captured too.

8. **The Supabase pooler is in session mode, which caps concurrent clients low.** A single `Promise.all([...16 independent Prisma queries...])` can exhaust it outright (`FATAL: max clients reached in session mode`) even though each query is trivial — session mode holds one backend connection per concurrently-open client, unlike transaction-mode pooling. For a batch of independent reads (e.g. a dashboard's worth of counts), use `db.$transaction([...])` instead of `Promise.all([...])` — it runs the batch over one connection. Caveat: `$transaction`'s batch typing is less precise than `Promise.all`'s for `groupBy` with `_count: true`/`_count: {_all: true}` (widens to a loose union instead of the real aggregate shape) — pull those specific calls out as separate standalone `await`s rather than fighting the types.

9. **`User` (a login) and `Creative` (a directory listing) are deliberately separate models with no required link** — most creatives (all the seed samples except one) have no login at all, and most paid `User`s aren't necessarily a listed creative. Anything that needs "the logged-in member's own profile" (Community Dashboard posts/comments/reactions pulling name+role) resolves it via the *nullable* `Creative.userId` — if it's null for that session, the person is a paid subscriber but not (yet) a linked creative, and posting/commenting/reacting should be blocked with a message to that effect rather than assumed to work. Don't add a `NOT NULL` here without deliberately deciding every `User` must have a `Creative` (they shouldn't — a company just hiring talent has no reason to be listed).

## Dev workflow

**Use pnpm, not npm, for everything in this repo** (install/build/dev/test) — see the deployment section below for why. `pnpm-lock.yaml` is the lockfile of record; there is no `package-lock.json`.

- **Seed demo data:** `pnpm seed` (idempotent upsert; runs `tsx prisma/seed.ts`). Creates `paid@demo.test` / `free@demo.test` / `admin@demo.test` (password `password123`) and the Aneesa Khan founder profile + sample creatives. Use the paid account to view full profiles, the free account for the locked/public view, the admin account for `/admin`.
- **Tests:** `pnpm test` (Vitest). One file per user flow under `tests/`, testing server actions with mocked `@/lib/db`, `@/lib/email`, `@/lib/stripe`, `@/lib/session`, `next/navigation`. Mock objects referenced inside `vi.mock()` factories must use `vi.hoisted()`; mocked async fns must return resolved promises (code calls `.catch()` on them).
- **Browser verify:** the preview server (`.claude/launch.json` → `pcc-dev`) is the way to catch the two classes of bug that build/typecheck miss — the `"use server"` export bug and theme/contrast regressions. Always screenshot real pages after a redesign.
- **Admin access:** use the seeded `admin@demo.test`, or promote a real user with SQL `UPDATE "User" SET role='ADMIN' WHERE email=...` (needs user approval).

## Deployment (Vercel) — read this before redeploying

The project is linked to Vercel team `cosmic-ventures` ("Cosmic Engineering"), project `pakistani-creative-collective`, deployed from `vercel.json`'s `experimentalServices` block (auto-detected by `vercel link`; the project's dashboard "Framework Preset" is set to **services**, not plain Next.js — don't "fix" `vercel.json` back to a bare `buildCommand`/`installCommand`, it'll fail with `Project framework is set to "services", but no services are declared`). Production URL: `https://pakistani-creative-collective.vercel.app`. Deploy with `npx vercel deploy --prod` (or `--force` to skip the build cache when debugging a build issue).

**Getting the first deploy green took ~10 failed attempts. In order, the actual root causes were:**

1. **Vercel's `npm install` silently skipped `devDependencies`** (NODE_ENV=production-related npm behavior) — only ~143 packages installed instead of the full set. Surfaced as a sequence of "module not found" build errors for whatever devDependency was needed next: `@tailwindcss/postcss`, then `@types/react`/`@types/node`, then `puppeteer-core` (pulled in by the TS build checking `scripts/screenshots.ts`, a dev-only file that has no business being typechecked as part of the app — fixed properly via `tsconfig.build.json` + `next.config.ts`'s `typescript.tsconfigPath`, not by moving it to dependencies).
   **Fix: use pnpm.** `pnpm install` doesn't have this failure mode — it installs devDependencies regardless of `NODE_ENV`. This is now baked into `vercel.json`'s `installCommand`/`buildCommand`. If a future deploy fails with a "cannot find module" error for something that's clearly a deps problem, check `vercel.json` hasn't drifted back to npm before debugging anything else.

2. **`PrismaClientInitializationError: could not locate the Query Engine`, despite the engine file genuinely being present in the deployment** (confirmed by temporarily adding a diagnostic page that did `fs.readdirSync` + an actual `db.creative.count()` call — the file existed, the query still failed). Root cause: the schema used Prisma 6's newer `prisma-client` generator with a **custom output path** (`src/generated/prisma`). Next's bundler (Turbopack) only auto-externalizes `@prisma/client` by name from its default `node_modules` location (it's on Next's built-in `serverExternalPackages` list) — a custom output path is just ordinary app source to Next, so it gets bundled/relocated, and the generated client's runtime computation of "where's my engine binary" ends up pointing somewhere that doesn't match where the file actually landed. `outputFileTracingIncludes` and `output: "standalone"` do **not** fix this (tried both, neither helped — don't waste time re-trying them).
   **Fix: use the legacy `prisma-client-js` generator with no custom `output`** (the schema's `generator client` block is just `provider = "prisma-client-js"` + `binaryTargets = ["native", "rhel-openssl-3.0.x"]` now). It installs into `node_modules/@prisma/client`, which Next leaves completely unbundled, sidestepping the whole class of bug. Import as `import { PrismaClient } from "@prisma/client"` / `import type { UserRole } from "@prisma/client"`, not from `@/generated/prisma/...`.

3. **`the URL must start with the protocol postgresql://`** even though `DATABASE_URL` was set in Vercel — because `.env.local` quotes its values (`DATABASE_URL="postgresql://..."`), and a naive `cut -d= -f2-` when copying the value into `vercel env add` carried the literal quote character into the stored env var. **Always strip surrounding quotes when copying `.env*` values into `vercel env add`** (e.g. `sed 's/^KEY=//; s/^"//; s/"$//'`), and sanity-check with `echo "${VALUE:0:15}"` before piping it in.

4. **`.env.local`'s `SESSION_SECRET` was a literal placeholder string** (`"generate-a-32-char-secret-here"`), never actually replaced with a real value during initial setup. Caught while fixing #3. Generate a real one for any env (`openssl rand -base64 32`) — never deploy with a checked-in-looking placeholder secret, local dev included.

**General lesson:** when a Vercel deploy fails, get the *exact* runtime error from `npx vercel logs <url> --json | grep error`, don't assume the first plausible-sounding fix is the real one — three of the four bugs above produced misleading or generic-sounding error text. If a fix doesn't change the error message or the failure point at all after redeploying, that's a strong signal to revert it and look elsewhere rather than stacking more workarounds on top.
