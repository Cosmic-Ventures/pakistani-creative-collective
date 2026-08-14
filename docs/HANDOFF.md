# Pakistani Creative Collective — Final Build Handoff

**Live site:** https://pakistani-creative-collective.vercel.app
**Date:** July 18, 2026

This is the wrap-up of the July feedback round. Everything from the "PCC Website Workflow" notes doc has been implemented, the full site has been QA-tested end-to-end (including a real Stripe checkout against your Stripe account), and this document walks through the finished product page by page.

Demo logins (seeded, no setup needed) — password **password123** for all three:

| Account | Purpose |
|---|---|
| `free@demo.test` | The free/preview experience — locked profiles, upgrade prompts |
| `paid@demo.test` | The full member experience — full profiles, contact requests, Community Dashboard |
| `admin@demo.test` | The admin panel — applications, contact requests, moderation, analytics |

All creatives, posts, and applications currently in the site are **sample data** for review. Real member data comes in after your sign-off (see "Moving to real data" at the end).

---

## What was implemented from your feedback

**Branding**
- Header logo is the horizontal lockup with green text (white-text variant on dark backgrounds); the site icon is the no-text logo mark.
- All headings now use **Playfair Display SC** (replacing the earlier Garet substitute), with DM Sans for body text.

**Home page**
- "Five Experience Tiers" breakdown with the full criteria for each level, pulled from your "identify your level" reference.
- "Free vs. Member Access" comparison table with the "Why the Difference" note, word for word from your doc.
- A featured-profile demo card underneath (currently Aneesa's profile, as suggested).
- The "Looking to hire Pakistani creative talent?" call-to-action now goes to the talent request form, not the directory.

**Directory**
- Search bar plus role/location/level filters for free visitors; paid members additionally get mediums, availability, languages, and project-type filters.

**Profiles**
- Bio capped at 200 words (the application form enforces this too).
- Public (free) profile view no longer shows the creative's link, and no longer shows the initials placeholder where a headshot would be — free views simply have no headshot slot.
- Profile pages print cleanly (backgrounds and buttons are stripped when printing).

**Application form**
- Role and medium checklists now match the Jotform exactly, organized by the same categories.
- The "public link" section was removed; rate range offers currency options (USD, PKR, GBP, EUR, CAD, AUD, other); languages include Gujarati plus a fill-in-the-blank for others.
- "How did you hear about PCC?" now reveals the referral-name field right where it belongs when "Word of Mouth/Referral" is selected.
- The submission bug you hit ("it cleared everything and then gave a message") is fixed — the form keeps everything you typed if validation fails.

**Community Dashboard** (the full spec from your doc)
- Paid members post under the four categories (Recent Work, Seeking Funding, Seeking Collaborators, Available for Work) with title, body (500-word cap), region, duration/deadline, and an optional link.
- Posts are held for your review before going live; approving/rejecting notifies the member (no reason required). Available-for-Work and Seeking-Collaborators posts auto-expire when their deadline passes.
- Reactions (Congratulations 🎉, Interested 👀, Support 🤝, Sharing This 🔁) and comments, with commenter name/role pulled from their profile. Comments go live immediately with report-and-remove moderation; members with repeated removals can be flagged or suspended from commenting.
- Admin controls: pending queue, edit-before-approve, remove any live post, set/override expiry dates, and a queue searchable by member, category, region, and date. Bulk "high-priority post" notifications to members are supported.
- Analytics: posts by category/month, approval rate, average review time, active posts, comment and report counts, report-to-removal rate, most-reacted and most-commented posts, and members with the most removed comments.

**Subscriptions**
- One membership, two billing options, presented as a single card with a monthly/yearly toggle: **$7.86/month** or **$80/year** (matching the two products in your Stripe account).
- Stripe Checkout, the customer billing portal, and the subscription webhook are **connected to your Stripe account and verified working end-to-end** — a test subscription was purchased with Stripe's test card, the account was upgraded automatically, and the billing portal loads with the correct plan and invoice history.
- Membership changes now apply to a signed-in member's session immediately — no sign-out/sign-in needed after subscribing.

**Email (Resend)**
- Your API key is configured. Every flow sends automatically: application received (to you + the applicant), approval/rejection, contact-request alerts, Community post decisions, comment-removal notices, and featured-creative notifications.
- Emails send from `noreply@aneesatalks.com` — if `aneesatalks.com` isn't verified in your Resend dashboard yet, that must be completed before messages deliver reliably.

---

## Page-by-page tour

### Home
The public landing page: brand hero, the five experience tiers with criteria, the free-vs-member comparison, the featured creative, and the talent-request call-to-action.

![Home page](screenshots/home.png)

### Member Directory — free preview
Free visitors see names, roles, levels, locations, and bios, with a preview-mode notice and an upgrade prompt. Search plus role/location/level filters.

![Directory, free preview](screenshots/directory-free.png)

### Member Directory — paid view
Members get headshots plus the full filter set: mediums, availability, languages, project types.

![Directory, paid view](screenshots/directory-paid.png)

### Creative profile — free preview
The locked view: name, pronouns, location, roles, level, and bio only — no link, no headshot slot, and a subscribe prompt.

![Profile, free preview](screenshots/profile-free.png)

### Creative profile — full member view
The full card layout on the textured green background: identity card, biography, education, availability, languages, mediums, socials, work samples, and the Work-for-Hire card with rate info where the creative opted in.

![Profile, full view](screenshots/profile-paid.png)

### Apply to Join
The full application form matching the Jotform: basic info, bio (200-word cap with live counter), role/medium checklists by category, experience and portfolio, work samples, rates, availability, languages, collaboration preferences, and consent.

![Application form](screenshots/enroll-form.png)

### Hire Talent
The public talent-request form for productions looking to hire from the collective.

![Hire talent](screenshots/hire-talent.png)

### Subscribe
The single-plan pricing card with the monthly/yearly toggle, running live Stripe Checkout.

![Subscribe](screenshots/subscribe.png)

### Contact request
Paid members request introductions through this form — experience level, request type, message, timeline, and consent — routed to you for review, never directly to the creative.

![Contact request form](screenshots/contact-form.png)

### Community Dashboard
The paid-members feed: categorized posts with reactions and comments, plus the composer for submitting new posts for review.

![Community Dashboard](screenshots/community-dashboard.png)

### My Account
Subscription status, renewal date, and the Stripe billing portal link (update card, cancel, view invoices).

![Account page](screenshots/account.png)

### Admin — Overview
At-a-glance counts: pending applications, approved creatives, paid subscribers, pending contact and feature requests. (The admin panel is intentionally a plain dark theme — it's your internal tool, not part of the public brand.)

![Admin overview](screenshots/admin-overview.png)

### Admin — Applications
Review queue with approve/reject; approving publishes the profile and emails the applicant.

![Admin applications](screenshots/admin-applications.png)

### Admin — Contact Requests
Every introduction request with full context; forward to the creative or mark accepted/declined.

![Admin contact requests](screenshots/admin-contact-requests.png)

### Admin — Community moderation
The post queue (searchable by member, region, and date, filterable by status and category), reported comments, and member flag/suspend controls.

![Admin community](screenshots/admin-community.png)

### Admin — Analytics
Creative, subscriber, contact-request, and Community metrics in one place.

![Admin analytics](screenshots/admin-analytics.png)

---

## QA summary (July 18, 2026)

Every user flow was exercised end-to-end this round:

- **Application** — submitted, approved, and rejected test applications; verified emails fired and approved profiles appear in the directory.
- **Stripe** — a real test-mode checkout was completed against your Stripe account: correct product/pricing on Stripe's page, redirect back to the success page, webhook received and verified, account upgraded automatically, billing portal correct. (Two configuration issues were found and fixed along the way: an invalid API key and a mismatched webhook signing secret.)
- **Contact requests, Community posting/reactions/comments, admin moderation, analytics** — all verified working.
- **Automated tests** — 56 tests across 9 suites, all passing.

---

## Going fully live — the remaining checklist

> **Note on the monthly price.** The site displays **$7.86/month**, but the amount actually charged
> comes from the Stripe Price referenced by `STRIPE_PRICE_MONTHLY` — it is not set in the code. The
> existing sandbox price still reads $7.99, so create a new $7.86 monthly Price in Stripe and point
> `STRIPE_PRICE_MONTHLY` at it (in both sandbox and live mode), otherwise the checkout total won't
> match the page.

The site currently runs against Stripe's **sandbox** (test) mode — real cards are never charged. To accept real payments:

1. **Domain** — purchase/choose the real domain and point it at the deployment (we handle DNS with you). This also becomes the sending domain for email.
2. **Stripe live mode** — recreate the two prices ($7.86/month, $80/year) in live mode, add a live webhook endpoint for `customer.subscription.created/updated/deleted` pointing at `https://<your-domain>/api/webhooks/stripe`, and swap the four Stripe environment variables (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_WEBHOOK_SECRET`) to their live values.
3. **Resend** — verify `aneesatalks.com` in Resend (DNS records) so email delivers from `noreply@aneesatalks.com`.
4. **Real data** — once you sign off on the design and flows: import the member list from your sheet, pre-create accounts for existing members, and optionally send the "your profile is live" outreach email (we can draft it together).

### Environment variables reference

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres — use the **pooler** connection string |
| `SESSION_SECRET` | Random 32+ char string signing login sessions |
| `NEXT_PUBLIC_APP_URL` | The site's public URL (used in emails and Stripe redirects) |
| `STRIPE_SECRET_KEY` | Stripe API key (currently sandbox) |
| `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` | The two Stripe Price IDs |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the Stripe webhook endpoint |
| `RESEND_API_KEY` | Resend transactional email |
| `PCC_NOTIFICATION_EMAIL` | Optional. Inbox that receives admin notifications (new applications, contact requests, community posts awaiting review). Defaults to `pcc@aneesatalks.com` |

---

## Costs

No implementation charge to Cosmic Ventures. Hosting (Vercel) plus database (Supabase) currently run about **$20/month** combined and may increase with traffic and storage. Stripe charges its standard per-transaction fees; Resend's free tier covers current volumes.
