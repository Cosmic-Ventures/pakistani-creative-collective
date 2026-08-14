import type { Metadata } from "next";
import { LegalPage, Section, List } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms under which the Pakistani Creative Collective may be used.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="13 August 2026"
      intro="These terms cover your use of the Pakistani Creative Collective (“the PCC”), a curated directory of Pakistani creatives operated by Aneesa Talks LLC. By creating an account, applying to the directory, or subscribing, you agree to them."
    >
      <Section heading="Who can use the PCC">
        <p>
          You must be at least 16 and able to enter into a binding agreement. Directory listings are
          for individual creative professionals; if you are applying on behalf of someone else, you
          need their permission.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          Keep your login details to yourself and let us know promptly if you think someone else has
          access to your account. You are responsible for activity that happens under it.
        </p>
      </Section>

      <Section heading="Directory listings">
        <List
          items={[
            "Being listed in the directory is free, and always will be.",
            "The directory is curated. We review every application individually and may decline one at our discretion — a decline is not a judgement of your work.",
            "The information you provide must be accurate, and yours to share. Please keep it up to date if it changes materially.",
            "We may edit a listing for clarity, formatting or length, and may remove or hide a listing that breaches these terms or gives us credible cause for concern.",
          ]}
        />
      </Section>

      <Section heading="Membership and billing">
        <List
          items={[
            "Browsing basic profiles is free. Full profiles, search filters, the Community Dashboard and contact requests require a paid membership.",
            "Memberships are offered on a monthly or yearly basis and renew automatically until cancelled. The current price is always shown on the subscription page before you pay.",
            "You can cancel at any time from your account. Access continues to the end of the period you have already paid for, and we do not provide partial refunds for unused time.",
            "If we change the price, existing members will be told in advance and the new price applies from the next renewal.",
            "Payments are processed by Stripe and subject to its terms.",
          ]}
        />
      </Section>

      <Section heading="Contact requests">
        <p>
          Members do not contact each other directly. Requests are submitted through a profile,
          reviewed by Aneesa Talks, and forwarded to the creative, who decides whether to respond.
          Nobody is obliged to reply, and we cannot guarantee a response, an introduction, or any
          outcome from one.
        </p>
      </Section>

      <Section heading="Community Dashboard">
        <p>
          Posts are reviewed before going live; comments appear immediately and are moderated on a
          report-and-remove basis. We may remove any post or comment, and may suspend commenting for
          members whose contributions are repeatedly removed. Posts in the “Available for Work” and
          “Seeking Collaborators” categories expire automatically once the date you set has passed.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <p>You agree not to:</p>
        <List
          items={[
            "Misrepresent your identity, experience or credits, or post another person's work as your own.",
            "Harass, threaten, defame or discriminate against anyone.",
            "Use the directory to send bulk or unsolicited marketing, or to scrape, copy or resell member information.",
            "Post unlawful, misleading or infringing content, or attempt to disrupt or gain unauthorised access to the platform.",
          ]}
        />
        <p>
          Credible reports of misconduct may result in a profile being removed from the directory.
        </p>
      </Section>

      <Section heading="Your content">
        <p>
          You keep ownership of everything you submit. You grant us permission to host and display it
          on the platform as part of the directory, and to show it in accordance with the visibility
          tiers described in our Privacy Policy. Using your profile materials in promotional posts is
          a separate, optional consent you give during the application and can withdraw at any time.
        </p>
      </Section>

      <Section heading="Our content">
        <p>
          The PCC name, branding and the design of the platform belong to Aneesa Talks LLC. Please do
          not copy or reuse them without permission.
        </p>
      </Section>

      <Section heading="No guarantees">
        <p>
          The PCC is a directory and an introduction service. We do not employ members, vet the
          commercial terms of any engagement, or guarantee work, hiring outcomes, income, or the
          conduct of anyone you meet through the platform. Any engagement you enter into is between
          you and the other party. The platform is provided on an “as is” basis, and we do not
          guarantee uninterrupted or error-free availability.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Aneesa Talks LLC is not liable for indirect or
          consequential losses, lost profits, or lost opportunities arising from your use of the
          platform. Nothing in these terms excludes liability that cannot lawfully be excluded.
        </p>
      </Section>

      <Section heading="Ending your use">
        <p>
          You can close your account or ask for your listing to be removed at any time. We may suspend
          or terminate access where these terms have been breached, or where we have credible cause
          for concern about the safety of the community.
        </p>
      </Section>

      <Section heading="Changes to these terms">
        <p>
          We may update these terms as the platform develops. If a change is material we will notify
          members by email, and continuing to use the PCC after that means you accept the updated
          terms.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of the jurisdiction in which Aneesa Talks LLC is
          established, and any dispute will be dealt with by the courts of that jurisdiction.
        </p>
      </Section>
    </LegalPage>
  );
}
