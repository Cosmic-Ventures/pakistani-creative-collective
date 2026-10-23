# Draft: founding-member premium access email

Send from **Admin → Mass Email**, segment **Applications: approved**, using the fields below. Send yourself a test first. Each person gets an individual email, so recipients never see each other.

**Subject:** Your temporary premium access to the PCC

**Preview line:** Explore the full platform until November 14 and tell us what you think.

**Body:**

```
Hi {{firstName}},

Because you're one of the first people enrolled in the Pakistani Creative Collective, we're giving you temporary premium access to the platform, free, until November 14.

Between now and then, please explore everything: the member directory and other creatives' full profiles, the Community Dashboard, and the contact request flow. Tell us what works and what doesn't. Your feedback will shape the platform before we open applications to the public on November 14.

You'll find a Customer Support tab in your account dashboard. Use it for questions, comments, or anything that looks wrong.

After November 14, membership is $6/month or $60/year, with discounts available through community partners. You don't need to do anything now. Nothing will be charged.

[Sign in and explore →]({{siteUrl}}/auth/signin)

Thank you for being part of this from the beginning.
```

**Check before sending**
- Prices: the call said "$6 a month" and "I think we said 60 a year". Confirm both. The site itself reads prices from Stripe.
- The site is still behind the password gate until November 14. Members will need the gate password, or the email needs to include it.
- Access applies to approved creatives whose login is linked to their profile. Approved creatives with no login can't use it until they sign up.
