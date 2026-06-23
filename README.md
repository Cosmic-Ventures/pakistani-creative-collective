# Pakistani Creative Collective

A curated directory platform for Pakistani creatives in film, music, and media — created by [Aneesa Talks](https://aneesatalks.com). Free public profiles, a paid tier with full profile access and contact requests, an application/review pipeline, and an admin panel.

**Live:** https://pakistani-creative-collective.vercel.app

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack)
- [Prisma 6](https://www.prisma.io) + PostgreSQL ([Supabase](https://supabase.com))
- [Tailwind CSS v4](https://tailwindcss.com)
- [Stripe](https://stripe.com) (subscriptions) and [Resend](https://resend.com) (email) — both run in a safe mocked demo mode until real API keys are configured, see [`docs/HANDOFF.md`](docs/HANDOFF.md)
- [Vitest](https://vitest.dev) for server-action tests

This project uses **pnpm**, not npm — see [`AGENTS.md`](AGENTS.md) for why.

## Getting started

```bash
pnpm install
pnpm exec prisma generate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll need a `.env.local` with at least `DATABASE_URL` and `SESSION_SECRET` set (see `.env.local` for the full list of optional vars — Stripe/Resend/Google Sheets keys). Without `STRIPE_SECRET_KEY`/`RESEND_API_KEY`, those integrations run in demo mode automatically.

To populate the directory with demo data (a couple of sample creatives, plus `paid@demo.test` / `free@demo.test` / `admin@demo.test` login accounts, password `password123`):

```bash
pnpm seed
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run the Vitest suite |
| `pnpm lint` | Run ESLint |
| `pnpm seed` | Seed demo accounts + sample creative profiles |

## Project docs

- [`AGENTS.md`](AGENTS.md) — design system reference, deployment gotchas, and other context for anyone (human or agent) picking up this codebase.
- [`docs/SPEC.md`](docs/SPEC.md) — the original platform/workflow spec.
- [`docs/HANDOFF.md`](docs/HANDOFF.md) / [`docs/HANDOFF.pdf`](docs/HANDOFF.pdf) — client-facing summary of what's built, hosting costs, and what's needed to take Stripe/Resend live.

## Deployment

Deployed to Vercel (team `cosmic-ventures`, project `pakistani-creative-collective`). Deploys are manual via the Vercel CLI — `npx vercel deploy --prod` — not git-triggered. See the "Deployment (Vercel)" section in [`AGENTS.md`](AGENTS.md) before changing build config; getting the first deploy working surfaced several non-obvious issues worth reading first.
