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

## Dev workflow

- **Seed demo data:** `npm run seed` (idempotent upsert). Creates `paid@demo.test` / `free@demo.test` (password `password123`) and the Aneesa Khan founder profile + sample creatives. Use the paid account to view full profiles, the free account for the locked/public view.
- **Tests:** `npm test` (Vitest). One file per user flow under `tests/`, testing server actions with mocked `@/lib/db`, `@/lib/email`, `@/lib/stripe`, `@/lib/session`, `next/navigation`. Mock objects referenced inside `vi.mock()` factories must use `vi.hoisted()`; mocked async fns must return resolved promises (code calls `.catch()` on them).
- **Browser verify:** the preview server (`.claude/launch.json` → `pcc-dev`) is the way to catch the two classes of bug that build/typecheck miss — the `"use server"` export bug and theme/contrast regressions. Always screenshot real pages after a redesign.
- **Admin access:** no seed admin. Promote a user with SQL `UPDATE "User" SET role='ADMIN' WHERE email=...` (needs user approval).
