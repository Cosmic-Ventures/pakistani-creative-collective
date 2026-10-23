import type { Metadata } from "next";
import Link from "next/link";
import { getDisplayPrices } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "About",
  description: "About the Pakistani Creative Collective: how it works, common questions, and who to contact.",
};

// Bios and photos for the communications assistants weren't supplied (10/22 round):
// add `bio` and `photo` to an entry and the card picks them up with no other change.
const TEAM: { name: string; title: string; bio?: string; photo?: string }[] = [
  { name: "Maham Khurram", title: "Communications Assistant" },
  { name: "Kysah Khokher", title: "Communications Assistant" },
];

export default async function AboutPage() {
  const prices = await getDisplayPrices();
  const faqs = [
    {
      q: "Who can join the Pakistani Creative Collective?",
      a: "Pakistani creatives in film, music, fashion, art, and media, wherever you're based. Every application is reviewed individually.",
    },
    {
      q: "Does it cost anything to be listed?",
      a: "No. Creating a profile and being listed in the directory is free.",
    },
    {
      q: "What does membership include, and what does it cost?",
      a: `Members see full profiles, search with advanced filters, submit contact requests, and use the private Community Dashboard. Membership is ${prices.monthly}/month or ${prices.annual}/year, with discounts available through community partners.`,
    },
    {
      q: "How do I contact a creative?",
      a: "Members submit a contact request. It goes to Aneesa Talks first and is forwarded to the creative, who decides whether to respond. Email addresses and phone numbers are never public.",
    },
    {
      q: "What is the Work For Hire card?",
      a: "It appears on a profile when that creative is open to working and collaborating. It shows how they charge, who they're open to working with, their roles, and whether they travel.",
    },
    {
      q: "Why was my contact request not sent?",
      a: "Creatives choose which experience levels they're open to working with. A request is only sent when your level is one of them.",
    },
    {
      q: "How do I update or remove my profile?",
      a: "You can edit or remove your profile at any time from the My Profile tab in your account.",
    },
    {
      q: "Who do I contact for help?",
      a: "Use the Customer Support tab in your account, or email pcc@aneesatalks.com.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-heading font-bold text-3xl text-brand-green mb-2">About the PCC</h1>
      <p className="text-brand-brown/70 mb-10">
        A curated directory built so Pakistani creatives in film, music, and media can be discovered,
        collaborate across the globe, and get hired. Curated by{" "}
        <a href="https://aneesatalks.com" target="_blank" rel="noopener noreferrer" className="underline text-brand-green">
          Aneesa Talks
        </a>
        .
      </p>

      <h2 className="font-heading font-bold text-2xl text-brand-green mb-4">Frequently asked questions</h2>
      <div className="space-y-3 mb-14">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group bg-white border border-brand-green/10 rounded-2xl px-5 py-4">
            <summary className="cursor-pointer font-semibold text-brand-green list-none flex justify-between gap-4">
              {q}
              <span className="text-brand-green/50 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm text-brand-brown/80 leading-relaxed mt-3">{a}</p>
          </details>
        ))}
      </div>

      <h2 className="font-heading font-bold text-2xl text-brand-green mb-4">Communications team</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        {TEAM.map((m) => (
          <div key={m.name} className="bg-brand-mint rounded-3xl p-6 text-brand-green">
            {m.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.photo} alt={m.name} className="w-24 h-24 rounded-2xl object-cover mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-brand-green/15 flex items-center justify-center font-heading font-bold text-3xl mb-4">
                {m.name.split(" ").map((n) => n[0]).join("")}
              </div>
            )}
            <p className="font-heading font-bold text-xl leading-tight">{m.name}</p>
            <p className="text-xs uppercase font-semibold tracking-wide mt-1 mb-3">{m.title}</p>
            {m.bio && <p className="text-sm leading-relaxed">{m.bio}</p>}
          </div>
        ))}
      </div>
      <p className="text-sm text-brand-brown/60">
        Questions? <Link href="/account?tab=support" className="underline text-brand-green">Contact support</Link>.
      </p>
    </div>
  );
}
