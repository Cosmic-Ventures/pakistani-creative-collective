# PCC Build Handoff

**Live site:** https://pakistani-creative-collective.vercel.app

## Cost & billing

There is no charge to Cosmic Ventures for implementation. Ongoing hosting (Vercel) and the database (Supabase) currently run about **$20/month** combined, and that may increase if traffic, storage, or usage scales up.

## Pages to review

Click through these and send feedback on anything that's off. Demo logins (already seeded, no setup needed): **paid@demo.test** / **free@demo.test** / **admin@demo.test**, password **password123** for all three.

**Public — no login needed**
- [Home](https://pakistani-creative-collective.vercel.app/)
- [Directory](https://pakistani-creative-collective.vercel.app/directory) — browse all approved creatives
- [Apply to Join](https://pakistani-creative-collective.vercel.app/enroll) — the public application form

**Sign in as `paid@demo.test` to see the full paid experience**
- [Sign in](https://pakistani-creative-collective.vercel.app/auth/signin)
- [Aneesa Khan's profile](https://pakistani-creative-collective.vercel.app/directory/aneesa-khan) — the full paid view (headshot, education, languages, rate info, etc.); compare against the same page while signed out or signed in as `free@demo.test` to see the locked/public view
- [Request an introduction](https://pakistani-creative-collective.vercel.app/directory/aneesa-khan/request) — link from any profile's "Request Intro" button
- [My Account](https://pakistani-creative-collective.vercel.app/account) — subscription status, billing portal link
- [Subscribe / upgrade](https://pakistani-creative-collective.vercel.app/subscribe) — shown to free accounts; currently in demo mode (see below)

**Admin (internal tool — sign in as `admin@demo.test`)**
- [Admin dashboard](https://pakistani-creative-collective.vercel.app/admin)
- [Applications queue](https://pakistani-creative-collective.vercel.app/admin/applications)
- [Contact requests](https://pakistani-creative-collective.vercel.app/admin/contact-requests)
- [Feature requests](https://pakistani-creative-collective.vercel.app/admin/feature-requests)
- [Analytics](https://pakistani-creative-collective.vercel.app/admin/analytics)

## What we built

The Pakistani Creative Collective platform is a Next.js app with a Postgres database (Supabase), now restyled to match the brand spec (colors, fonts, logo, illustrations) and with the full creative-profile and contact-request experience implemented.

**Public site**
- Home page, member directory (free preview vs. full paid view), individual creative profiles
- Free visitors see: name, role(s), experience level, location, bio, one public link
- Paid subscribers additionally see: headshot, education, languages, mediums, social/portfolio links, primary work sample, and a "Work For Hire" card (rate info, travel, open-to-collaborate preferences)

**Creative application flow**
- Public "Apply to Join" form (free) → admin review queue → approve/reject → applicant gets an email and a live profile

**Contact requests**
- Paid subscribers can request an introduction to a creative via a form matching the spec exactly: requester info, experience level, request type, message, timeline, and consent checkboxes
- Submissions route to the admin panel; admin can forward to the creative or mark accepted/declined

**Subscriptions**
- $30/year early-access rate (pre-launch signups) vs. $50/year standard, enforced server-side
- Stripe Checkout + Billing Portal wired up, but **currently running in a safe demo mode** (see below) since live Stripe keys aren't configured yet

**Admin panel**
- Applications, contact requests, feature requests, and basic analytics — kept on a simple dark theme since it's an internal tool, not part of the public brand spec

**Tests**
- Vitest suite (`npm test`) covering signup/login, enrollment, contact requests, feature requests, all admin moderation actions, and the subscribe/checkout flow — 30 tests, all passing

## Demo mode (no real charges, no real emails yet)

Right now `STRIPE_SECRET_KEY` and `RESEND_API_KEY` are both unset, so:
- The subscribe page shows a "Stripe not configured — demo flow" banner and a "Simulate payment" button instead of real checkout. Clicking it instantly marks the account as paid (no money moves) and shows a success page that says payment was simulated.
- Application/approval/rejection/contact-request emails silently no-op — nothing breaks, the in-app success screens still show, but no email is actually sent.

This means the site is fully demoable end-to-end today without either vendor account.

## What's needed from the client before going live

### Stripe — handles subscription billing
**Used for:** charging the $30/$50 annual subscription, the self-serve billing portal (update card, cancel), and keeping subscription status in sync via webhooks.

To go live:
1. Create a Stripe account (or use an existing one) and switch it to live mode.
2. Create two recurring Prices: $30/year ("early access") and $50/year ("standard").
3. Set these environment variables on the hosting platform:
   - `STRIPE_SECRET_KEY` — from the Stripe dashboard
   - `STRIPE_PRICE_EARLY` / `STRIPE_PRICE_STANDARD` — the two Price IDs from step 2
   - `STRIPE_WEBHOOK_SECRET` — generated when you add a webhook endpoint pointing at `https://<your-domain>/api/webhooks/stripe`, listening for `customer.subscription.created/updated/deleted`
4. Once those are set, the demo banner disappears automatically and real Stripe Checkout takes over — no code changes needed.

### Resend — handles transactional email
**Used for:** notifying the team of new applications and contact requests, and notifying applicants/creatives of approval, rejection, and feature selection.

To go live:
1. Create a Resend account.
2. Verify the sending domain (`aneesatalks.com`) by adding the DNS records Resend provides — this is required before it will deliver mail from `noreply@aneesatalks.com`.
3. Set `RESEND_API_KEY` on the hosting platform.

Once set, every existing email flow activates automatically — no code changes needed.

## Other environment variables already required
- `DATABASE_URL` — Supabase connection string. **Use the pooler connection** (`...pooler.supabase.com:5432`), not the direct `db.<ref>.supabase.co` host — the direct host is IPv6-only and won't resolve from IPv4-only networks/hosts.
- `SESSION_SECRET` — random 32+ character string for signing login sessions
- `NEXT_PUBLIC_APP_URL` — the deployed site's URL (used in email links and Stripe redirect URLs)

## Note on the header font
The spec calls for "Garet" (bold, all-caps, tight letter-spacing) for headers. Garet is a paid/licensed font not available on Google Fonts, so **Plus Jakarta Sans (extrabold)** is substituted as the closest open-license match for now. If the client purchases a Garet license, swapping it in is a small change in `src/app/layout.tsx`.
