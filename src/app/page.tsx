import Link from "next/link";

const tiers = [
  { name: "Emerging", years: "0–2 years", color: "text-sky-400" },
  { name: "Developing", years: "2–5 years", color: "text-teal-400" },
  { name: "Mid-Level", years: "5–8 years", color: "text-emerald-400" },
  { name: "Established", years: "8–12 years", color: "text-lime-400" },
  { name: "Veteran / Master", years: "12+ years", color: "text-amber-400" },
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
      <section className="relative overflow-hidden border-b border-stone-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,rgba(16,185,129,0.12),transparent_70%)]"
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase mb-4">
            Pakistani Creative Collective
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight max-w-3xl">
            The networking infrastructure Pakistani creatives have always needed.
          </h1>
          <p className="mt-6 text-lg text-stone-400 max-w-2xl leading-relaxed">
            A curated database of Pakistani talent in film, music, and media —
            searchable, vetted, and built for sustainable global collaboration.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/directory"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Browse the Directory
            </Link>
            <Link
              href="/join"
              className="border border-stone-600 hover:border-stone-400 text-stone-300 hover:text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Apply to Join
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl font-bold text-white mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {howItWorks.map(({ step, title, body }) => (
            <div
              key={step}
              className="bg-stone-900 border border-stone-800 rounded-xl p-6"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-emerald-400 font-bold text-sm mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-800 bg-stone-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl font-bold text-white mb-2">Five experience tiers</h2>
          <p className="text-stone-400 mb-10 text-sm">
            Members are categorized based on professional experience, project count, and achievements.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {tiers.map(({ name, years, color }) => (
              <div
                key={name}
                className="bg-stone-900 border border-stone-800 rounded-lg p-4 text-center"
              >
                <p className={`font-semibold text-sm ${color}`}>{name}</p>
                <p className="text-stone-500 text-xs mt-1">{years}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Looking to hire Pakistani creative talent?
            </h2>
            <p className="text-stone-400 text-sm max-w-lg">
              Submit a talent request and we'll match you with vetted professionals. All requests are screened before matching.
            </p>
          </div>
          <Link
            href="/request"
            className="shrink-0 bg-white text-stone-950 hover:bg-stone-100 font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Submit a Request
          </Link>
        </div>
      </section>
    </>
  );
}
