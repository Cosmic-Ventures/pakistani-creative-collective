# 10/02 feedback round: plan

Source: Aneesa's spoken notes (call with Stefan, 10/02). Status: ☑ done in this PR · ☐ deferred.

## 1. Directory page
- ☑ Member cards become dark green (`bg-brand-green`) with cream text, mint role pills.
- ☑ Free viewers see **every photo** (headshot is now selected and rendered for all).
- ☑ Free search limited to **role, medium, location**. The name/keyword box is member-only.

## 2. Individual profile page
- ☑ Biography moves to the **right column**, beside the identity card.
- ☑ Education / Availability / Languages / Medium(s) move **under the identity card** (left column).
- ☑ Social icons ("Connect") sit **inside the identity card, under the website link**.
- ☑ Work samples: **one block per sample** (title, role · medium · year, link), resume style, compact. No "Primary Work Sample" / separate "Role(s)" rows, no big embed.
- ☑ Multiple samples render as a **swipeable carousel** (CSS scroll-snap + arrow buttons). YouTube links get a thumbnail.
- ☑ Free profile view shows the photo too.

## 3. Home page
- ☑ Free vs. Member section rebuilt as the subscribe page's "what's included" style (✓ bullets, two cards).
- ☑ One shared source: `src/lib/membership-features.ts` + `AccessComparison`, used on **home and /subscribe**.
- ☑ Spotlight now looks like a full member profile (identity card, details, biography, work samples) with a description line.
- ☑ Copy trimmed: nothing is repeated down the page (pricing and tier contents appear once).
- ☑ Font rule: inside any box, one font (headings in boxes use the body font).
- ☐ Visual comps (backstage.com, productionhub.com) for further polish: needs a design pass with Aneesa.

## 4. Pricing
- ☑ Fallback display prices → **$5.99/month, $60/year** (~17% saving).
- ☐ **Needs the client:** create the new Stripe Prices and update `STRIPE_PRICE_*` env vars; live prices are read from Stripe.
- ❓ She said both "$6" and "$5.99" for monthly. Used $5.99.

## 5. Not doing yet
- Removing the pre-launch password gate (she'll decide once the home page is final).
- Not re-seeding or writing to the live DB.

## Validation
`tsc`, eslint, vitest, production build, then browser check of `/`, `/directory`, `/directory/<slug>`, `/subscribe` (desktop + phone width).
