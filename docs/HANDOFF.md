# Pakistani Creative Collective — Final Build Handoff

**Live site:** https://pcc.aneesatalks.com
**Date:** July 18, 2026

This is the wrap-up of the July feedback round. Everything from the "PCC Website Workflow" notes doc has been implemented, the full site has been QA-tested end-to-end (including a real Stripe checkout against your Stripe account), and this document walks through the finished product page by page.

Demo logins (seeded, no setup needed) — password **password123** for all three. **These must be
deleted before the site goes public** (see the launch checklist) — one of them is an admin account
and the password is written here in plain text:

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
- One membership, two billing options, presented as a single card with a monthly/yearly toggle: **$7.99/month** or **$80/year**, both read live from the Prices in your Stripe account.
- Stripe Checkout, the customer billing portal, and the subscription webhook are **connected to your Stripe account and verified working end-to-end** — a test subscription was purchased with Stripe's test card, the account was upgraded automatically, and the billing portal loads with the correct plan and invoice history.
- Membership changes now apply to a signed-in member's session immediately — no sign-out/sign-in needed after subscribing.

**Email (Resend)**
- Your API key is configured. Every flow sends automatically: application received (to you + the applicant), approval/rejection, contact-request alerts, Community post decisions, comment-removal notices, and featured-creative notifications.
- Emails send from `noreply@aneesatalks.com` — if `aneesatalks.com` isn't verified in your Resend dashboard yet, that must be completed before messages deliver reliably.

---

## September 1 round

**Edit the email wording yourself — Admin → Email Templates**
- Every automatic email that goes to an applicant or member is now editable from the admin panel:
  the subject line, the preview line inboxes show beside it, and the body. There's a live preview
  beside the editor that updates as you type, and a "Send me a test" button that mails the template
  to your own address so you can see how it lands in a real inbox.
- Personal details go in as `{{firstName}}`-style variables — the ones each email can use are
  listed under the editor and inserted automatically when it sends. Anything not on that list is
  refused when you save, so a typo can't go out to a member as literal `{{frstName}}` text.
- Formatting is deliberately simple: a blank line starts a new paragraph, a line like
  `[View your profile →](https://…)` becomes a button, and lines starting `- Label: value` become
  labelled rows. The logo, the green card and the "— Aneesa Talks" sign-off are added for you, so
  an edited email always looks like the others.
- "Restore original" puts any template back to the wording that shipped.
- Not editable, on purpose: the notifications that come to *your* inbox (a new application, a new
  contact request, a post awaiting review) — those are summaries for your own triage. The
  Community announcement email is still written fresh each time on the Community tab.

**Approval email rewritten**
- It now says the applicant has been approved and that they'll be the first to know when the
  directory and subscriptions go live — no links to pages that are still private. When you're ready
  to open those up, the profile link and the subscribe link are both available as variables in the
  template editor, so you can add the buttons back yourself without a code change.

**Forgotten password**
- "Forgot your password?" is on the sign-in page. It emails a link that lasts an hour and works
  once; using it, or asking for a new one, cancels any earlier link. The page says the same thing
  whether or not the address has an account, so it can't be used to find out who's a member.
- If someone was locked out by repeated wrong guesses, completing a reset clears that too.

**Subscription tab visible to you**
- The Subscribe tab now shows in the header when you're signed in as admin, and the page opens
  instead of bouncing you to the directory. It's marked as an admin preview and the purchase button
  is switched off, since your account already has full access.

**Application form — the "Submit does nothing" bug**
- Root cause found and fixed. It was the headshot step, not the submit button: choosing a photo
  opened the crop window, and the photo only counted as uploaded if you pressed "Use this crop".
  Anyone who tapped Cancel — or closed that window — was left with no headshot while the form still
  said "Selected: their-photo.jpg" under a visible preview of their own face. The form then refused
  to submit because the headshot was missing, which from the applicant's side looks exactly like a
  dead button. Reproduced on a phone-sized screen against the live code, then fixed: choosing a
  photo now counts immediately (using the same square framing the crop window opens on), so
  cropping only ever adjusts a photo you already have.
- Nothing was lost. No application was ever half-saved — the ones affected simply never got sent,
  so anyone who gave up will need to come back and submit again.

**Application form — clearer about what needs fixing**
- Submitting with something missing no longer just shows a list: the form jumps to the first
  problem, outlines every affected field in red with a short explanation underneath it, and marks
  the steps that still need attention with a red dot. The list above the submit button is still
  there, and each item jumps straight to its field.
- Email addresses are now checked for shape too, so a typo like `sara@gmail` is caught on the form
  rather than by the server after submitting.
- The whole apply-and-submit path was re-tested end to end: a complete application (including the
  headshot upload) submits, lands in the database with every field intact, and reaches the success
  page.

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

> **Changing a price.** Every price shown on the site — the pricing card, the home page copy, the
> upgrade prompts, the approval email, and the "save ~17%" badge — is read from Stripe at render
> time and cached for an hour. **To change what members pay, change it in Stripe only; nothing needs
> editing in the code.** Stripe Prices are immutable, so create a new Price and point
> `STRIPE_PRICE_MONTHLY` (or `STRIPE_PRICE_ANNUAL`) at it. The site picks the new amount up within
> the hour, and the page can never advertise a figure that differs from what checkout charges.

**Done already:** the custom domain `pcc.aneesatalks.com` is live and is what the site, emails and
Stripe redirects all use; `aneesatalks.com` is verified in Resend, so mail is delivering.

### Blocking — must happen before the public launch

**0. Apply the September 1 database migration.** The email-template editor and the password-reset
flow each need a new table (`EmailTemplate`, `PasswordResetToken`). The migration is written and
committed but has **not** been run against the live Supabase database yet. Run
`npx prisma migrate deploy` with `DIRECT_URL` pointing at the session pooler (see AGENTS.md); it
only adds tables, nothing existing is touched.

This is **not** a blocker for deploying — it's safe to ship the code first and run the migration
whenever suits. Until it's applied, Admin → Email Templates is read-only (it shows every template
and its preview, with a banner explaining why saving is off), "Forgot your password?" says resets
aren't switched on yet and points people at the PCC inbox, and every email keeps sending its
original wording. Verified by dropping both tables and re-checking every page. The moment the
migration runs, both features start working with no redeploy.

**1. Stripe: sandbox → live.** The site runs on Stripe **test** keys today; no real card is ever
charged. Switching over is more than swapping a key:

- Create the two Prices again in **live** mode. Prices don't cross modes, and they're immutable —
  live mode starts empty.
- Add a live webhook for `customer.subscription.created/updated/deleted` pointing at
  `https://pcc.aneesatalks.com/api/webhooks/stripe`. It gets its **own** signing secret.
- Swap all four variables: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`,
  `STRIPE_WEBHOOK_SECRET`.
- **The easy one to miss:** customer and subscription IDs already stored against member accounts are
  *test-mode* objects and mean nothing in live mode — 2 accounts currently carry them. Left in place,
  "Manage Subscription" breaks for those people. Clear `stripeCustomerId`/`stripeSubId` on every
  account at cutover, and re-grant paid access by hand to anyone who genuinely subscribed. Test-mode
  subscriptions do not transfer.

**2. Remove the demo accounts.** `free@demo.test`, `paid@demo.test` and `admin@demo.test` all still
exist with the password `password123` — and that password is written down in this document. The admin
one opens the whole admin panel. Delete them (or rotate the passwords) before the site is public.

**3. Clear the sample data.** 5 sample creatives, 6 community posts and 2 contact requests are demo
content for review, not real members.

**4. Database connection limit.** The Supabase pooler is in **session mode with a 15-client cap**,
which doesn't suit serverless — each concurrent function holds a connection. This already took the
site down once during development: `/` and `/directory` returned 500s with
`FATAL: max clients reached in session mode`. Before real traffic, move to the **transaction-mode**
pooler (port 6543) or raise the pool size. This is the single most likely thing to break on launch day.

**5. Have the policy pages reviewed by a lawyer.** `/privacy` and `/terms` now exist and are linked
from the footer. They're written around what the platform actually collects, who processes it
(Supabase, Vercel, Stripe, Resend) and the three visibility tiers of a profile — but they are a
generic starting point, **not legal advice, and no lawyer has seen them**. Get counsel to review
before launch, particularly the governing-law, liability and refund clauses, and fill in the
jurisdiction that Aneesa Talks LLC is established in.

### Recommended before opening registration widely

- **Email verification on signup** — requested in the 7/23 round and still not built. Without it,
  anyone can register any address, and the enrollment form is a link-anyone-can-open form.
- ~~**Password reset.**~~ Built in the September 1 round — see above.
- **Bot protection on the public forms.** Sign-in is now rate limited (10 failed attempts locks an
  account for 15 minutes), but the enrollment and contact-request forms have no CAPTCHA or
  submission throttle, and the enrollment link is designed to be forwarded around.
- **Session revocation.** Sessions are stateless 30-day JWTs; signing out clears the cookie but
  cannot invalidate a token that has already leaked. Roles are re-read from the database on every
  request, so a demotion takes effect immediately — but a stolen cookie stays usable until it
  expires. A token-version column would close this if it matters to you.
- **Error monitoring.** Nothing reports failures — the 500s above were only noticed because someone
  happened to load the page. A free Sentry tier would cover this.
- **Move headshots out of the database.** They're stored inline as base64 (~123KB per creative). Fine
  for 5 members, wasteful at 200: every directory query that selects the photo drags it along.
  Worth moving to Supabase Storage *before* the bulk import rather than migrating afterwards.
- **Confirm `pcc@aneesatalks.com` actually exists.** Every application, contact request and community
  post notification now routes there; nothing verifies the mailbox is real.
- **Check `SESSION_SECRET` in production** is a real random value — an early setup left a placeholder
  string in one environment.
- **Confirm Supabase backups** are on, now that the data is real.

### Real data

Once the flows are signed off: import the member list from the sheet
(`npx tsx scripts/import-members.ts --csv <export.csv>` — dry run by default, writes nothing without
`--apply`), pre-create accounts for existing members, and optionally send the "your profile is live"
outreach email (we can draft it together).

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
