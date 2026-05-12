import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join",
  description:
    "Apply to join the Pakistani Creative Collective. All applications are reviewed before acceptance.",
};

const criteria = [
  "You identify as Pakistani or Pakistani diaspora",
  "You work professionally in film, music, or media",
  "You can provide professional references",
  "You agree to PCC's privacy and accountability standards",
];

const tiers = [
  {
    name: "Emerging",
    years: "0–2 years",
    note: "Early career, building your body of work",
    color: "border-sky-700/40 bg-sky-950/20",
    badge: "text-sky-400",
  },
  {
    name: "Developing",
    years: "2–5 years",
    note: "Established credits, consistent work",
    color: "border-teal-700/40 bg-teal-950/20",
    badge: "text-teal-400",
  },
  {
    name: "Mid-Level",
    years: "5–8 years",
    note: "Significant projects, growing reputation",
    color: "border-emerald-700/40 bg-emerald-950/20",
    badge: "text-emerald-400",
  },
  {
    name: "Established",
    years: "8–12 years",
    note: "Strong portfolio, festival selections",
    color: "border-lime-700/40 bg-lime-950/20",
    badge: "text-lime-400",
  },
  {
    name: "Veteran / Master",
    years: "12+ years",
    note: "Recognized industry leader",
    color: "border-amber-700/40 bg-amber-950/20",
    badge: "text-amber-400",
  },
];

export default function JoinPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-3">Join PCC</h1>
      <p className="text-stone-400 mb-10 leading-relaxed">
        The Pakistani Creative Collective is a vetted, invitation-quality
        network. Every application is reviewed by our team before acceptance.
      </p>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 mb-8">
        <h2 className="font-semibold text-white mb-4">Who can apply</h2>
        <ul className="space-y-2">
          {criteria.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-stone-300">
              <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-10">
        <h2 className="font-semibold text-white mb-4">Experience tiers</h2>
        <div className="space-y-3">
          {tiers.map(({ name, years, note, color, badge }) => (
            <div
              key={name}
              className={`border rounded-xl p-4 flex items-center gap-4 ${color}`}
            >
              <div className="shrink-0 w-28">
                <p className={`font-semibold text-sm ${badge}`}>{name}</p>
                <p className="text-stone-500 text-xs">{years}</p>
              </div>
              <p className="text-stone-400 text-sm">{note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-950/40 border border-emerald-900/40 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-3">Ready to apply?</h2>
        <p className="text-stone-400 text-sm mb-6 max-w-md mx-auto">
          The application takes about 15 minutes. Have your portfolio URL,
          professional bio (300–450 words), and three references ready.
        </p>
        <a
          href="https://form.jotform.com/253118193860054"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3 rounded-full transition-colors"
        >
          Start Application →
        </a>
      </div>
    </div>
  );
}
