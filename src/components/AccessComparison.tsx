import { FREE_FEATURES, MEMBER_FEATURES } from "@/lib/membership-features";

function Plan({
  title,
  lead,
  items,
  className,
}: {
  title: string;
  lead?: string;
  items: string[];
  className: string;
}) {
  return (
    <div className={`rounded-2xl p-6 sm:p-7 text-black ${className}`}>
      <p className="font-bold text-lg mb-1">{title}</p>
      {lead && <p className="text-sm text-black/60 mb-3">{lead}</p>}
      <ul className={`space-y-2.5 text-sm text-black/80 ${lead ? "" : "mt-3"}`}>
        {items.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-brand-green font-bold shrink-0">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Free vs. member "what's included" — one card each, same type and bullet style. */
export default function AccessComparison() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      <Plan title="Free" items={FREE_FEATURES} className="bg-white border border-brand-green/15" />
      <Plan
        title="Member"
        lead="Everything in Free, plus:"
        items={MEMBER_FEATURES}
        className="bg-brand-mint"
      />
    </div>
  );
}
