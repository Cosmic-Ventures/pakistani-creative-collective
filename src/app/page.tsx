import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/Logo";

const tiers = [
  { name: "Emerging", years: "0–2 years" },
  { name: "Developing", years: "2–5 years" },
  { name: "Mid-Level", years: "5–8 years" },
  { name: "Established", years: "8–12 years" },
  { name: "Veteran / Master", years: "12+ years" },
];

const howItWorks = [
  {
    step: "1",
    title: "Apply to Join",
    body: "Submit your profile through our intake form. Every application is reviewed before acceptance.",
  },
  {
    step: "2",
    title: "Get Matched",
    body: "Organizations submit vetted talent requests. We match them to the right members privately.",
  },
  {
    step: "3",
    title: "Collaborate & Get Hired",
    body: "All communication is routed through PCC for safety and accountability.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-green text-brand-cream">
        <Image
          src="/brand/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover opacity-80 pointer-events-none select-none"
        />
        <Image
          src="/brand/vector-singer.png"
          alt=""
          width={1080}
          height={1080}
          className="hidden lg:block absolute -right-8 bottom-0 w-72 opacity-30 pointer-events-none select-none"
        />
        <Image
          src="/brand/vector-guitarist.png"
          alt=""
          width={1080}
          height={1080}
          className="hidden lg:block absolute right-56 -bottom-6 w-56 opacity-20 pointer-events-none select-none"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          <Logo variant="light" className="h-12 sm:h-14 w-auto mb-8 opacity-95" />
          <h1 className="font-heading font-extrabold uppercase text-4xl sm:text-6xl leading-[1.05] max-w-3xl">
            The networking infrastructure Pakistani creatives have always needed.
          </h1>
          <p className="mt-6 text-lg text-brand-cream/80 max-w-2xl leading-relaxed">
            A curated database of Pakistani talent in film, music, and media —
            searchable, vetted, and built for sustainable global collaboration.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/directory"
              className="bg-brand-mint hover:bg-brand-mint/90 text-brand-green font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Browse the Directory
            </Link>
            <Link
              href="/join"
              className="border border-brand-cream/40 hover:border-brand-cream text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Apply to Join
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-heading font-extrabold uppercase text-2xl text-brand-green mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {howItWorks.map(({ step, title, body }) => (
            <div
              key={step}
              className="bg-white border border-brand-green/10 rounded-xl p-6 shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-brand-green font-bold text-sm mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-brand-green mb-2">{title}</h3>
              <p className="text-brand-brown/70 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-brand-green/10 bg-brand-mint/15">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="font-heading font-extrabold uppercase text-2xl text-brand-green mb-2">Five experience tiers</h2>
          <p className="text-brand-brown/70 mb-10 text-sm">
            Members are categorized based on professional experience, project count, and achievements.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {tiers.map(({ name, years }) => (
              <div
                key={name}
                className="bg-white border border-brand-green/10 rounded-lg p-4 text-center"
              >
                <p className="font-semibold text-sm text-brand-green">{name}</p>
                <p className="text-brand-brown/60 text-xs mt-1">{years}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-brand-green text-brand-cream rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-heading font-extrabold uppercase text-xl mb-2">
              Looking to hire Pakistani creative talent?
            </h2>
            <p className="text-brand-cream/80 text-sm max-w-lg">
              Submit a talent request and we&apos;ll match you with vetted professionals. All requests are screened before matching.
            </p>
          </div>
          <Link
            href="/request"
            className="shrink-0 bg-brand-mint hover:bg-brand-mint/90 text-brand-green font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Submit a Request
          </Link>
        </div>
      </section>
    </>
  );
}
