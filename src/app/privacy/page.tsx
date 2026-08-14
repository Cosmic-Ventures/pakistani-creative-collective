import type { Metadata } from "next";
import { LegalPage, Section, List } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How the Pakistani Creative Collective collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="13 August 2026"
      intro="The Pakistani Creative Collective (“the PCC”) is a curated directory of Pakistani creatives, operated by Aneesa Talks LLC. Keeping members' contact details private is central to how the platform works, so this page explains plainly what we collect, what is visible to whom, and what control you have over it."
    >
      <Section heading="Information we collect">
        <p>Depending on how you use the platform, we may collect:</p>
        <List
          items={[
            <>
              <strong>Account details</strong> — your name and email address, and a securely hashed
              version of your password. We never store your password itself.
            </>,
            <>
              <strong>Application details</strong> — everything you submit when applying to the
              directory: biography, professional roles, mediums, experience level, headshot, work
              samples and portfolio links, languages, availability, rate information, education and
              training, union or guild memberships, professional references, equipment, phone number
              and address.
            </>,
            <>
              <strong>Payment details</strong> — subscriptions are processed by Stripe. Card numbers
              are handled entirely by Stripe and never reach our servers; we retain only a customer
              reference and your subscription status.
            </>,
            <>
              <strong>Content you post</strong> — Community Dashboard posts, comments and reactions,
              and any contact requests you send or receive.
            </>,
            <>
              <strong>Technical information</strong> — a single sign-in cookie that keeps you logged
              in, plus standard server logs kept by our hosting provider.
            </>,
          ]}
        />
      </Section>

      <Section heading="What is public, and what is not">
        <p>
          This is the part most members care about, so to be explicit — a directory profile has three
          tiers of visibility:
        </p>
        <List
          items={[
            <>
              <strong>Visible to anyone:</strong> your name, pronouns, location, professional roles,
              experience level and biography.
            </>,
            <>
              <strong>Visible to paying members only:</strong> your headshot, work samples, notable
              achievements, languages, availability, preferred project types, previous collaborators,
              social and portfolio links, and your rate range if you have chosen to share it.
            </>,
            <>
              <strong>Never shown publicly, and never shared with other members:</strong> your email
              address, phone number, home address, professional references, education and training
              details, union or guild memberships, equipment list, and any rate information you have
              not opted to display.
            </>,
          ]}
        />
        <p>
          Members cannot contact each other directly through the platform. Every contact request is
          reviewed by Aneesa Talks and forwarded to you, and you decide whether to respond.
        </p>
      </Section>

      <Section heading="How we use your information">
        <List
          items={[
            "To review your application and, if approved, publish your directory profile.",
            "To operate the platform: signing you in, running searches, and handling contact requests.",
            "To take payment for memberships and manage subscriptions.",
            "To send service messages — application updates, contact requests, and notices about your posts or account.",
            "To keep the directory accurate and safe, including reviewing reports of misconduct.",
          ]}
        />
        <p>
          We do not sell your personal information, and we do not use it for advertising or share it
          with advertisers.
        </p>
      </Section>

      <Section heading="Who processes your information">
        <p>
          We use a small number of service providers to run the platform. They process data on our
          instructions only:
        </p>
        <List
          items={[
            <><strong>Supabase</strong> — database hosting.</>,
            <><strong>Vercel</strong> — application hosting.</>,
            <><strong>Stripe</strong> — subscription payments.</>,
            <><strong>Resend</strong> — transactional email delivery.</>,
          ]}
        />
        <p>
          We may also disclose information where we are legally required to, or where it is necessary
          to protect the rights and safety of our members.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          You can ask us to give you a copy of the information we hold about you, correct anything
          inaccurate, delete your information, restrict or object to how we use it, or provide it in a
          portable format. Where we rely on your consent — for example, to use your profile materials
          in promotional posts — you can withdraw it at any time.
        </p>
        <p>
          Approved members can edit much of their profile directly from their account dashboard. For
          anything else, email{" "}
          <a href="mailto:pcc@aneesatalks.com" className="text-black underline underline-offset-2 hover:no-underline">
            pcc@aneesatalks.com
          </a>{" "}
          and we will respond within a reasonable period. You may also complain to your local data
          protection authority.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          We keep your profile and account information for as long as you are listed in the directory
          or hold an account. If your application is unsuccessful, or you ask us to remove your
          profile, we delete the information we no longer need, apart from anything we must retain for
          legal, accounting or fraud-prevention reasons.
        </p>
      </Section>

      <Section heading="International transfers">
        <p>
          The PCC is a global directory, and our service providers operate internationally, so your
          information may be processed outside the country you live in. Where that happens we rely on
          appropriate safeguards offered by those providers.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          We use one essential cookie, which keeps you signed in. We do not use advertising or
          third-party tracking cookies. Clearing it simply signs you out.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          The platform is intended for working creative professionals and is not directed at children.
          We do not knowingly collect information from anyone under 16.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          We may update this page as the platform develops. If a change materially affects how we use
          your information, we will let members know by email.
        </p>
      </Section>
    </LegalPage>
  );
}
