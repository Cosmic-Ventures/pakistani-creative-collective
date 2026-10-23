import Link from "next/link";

export type SpotlightCreative = {
  slug: string;
  firstName: string;
  lastName: string;
  headshot: string | null;
  location: string | null;
  roles: string[];
  experienceLevel: string | null;
  bio: string;
};

/**
 * This month's spotlight, kept small so the Community Dashboard itself is on
 * screen without scrolling (10/22 round). One compact card per featured creative;
 * the full profile is a click away.
 */
export default function SpotlightProfile({ creatives }: { creatives: SpotlightCreative[] }) {
  if (creatives.length === 0) return null;
  return (
    <section className="mb-8 rounded-3xl bg-brand-green border border-white/70 shadow-xl shadow-black/40 p-4 sm:p-5 text-brand-cream">
      <h2 className="font-heading font-bold text-lg mb-3 px-1">This month&apos;s spotlight</h2>
      <div className={`grid gap-3 ${creatives.length > 1 ? "md:grid-cols-2" : ""}`}>
        {creatives.map((c) => {
          const name = `${c.firstName} ${c.lastName}`;
          return (
            <Link
              key={c.slug}
              href={`/directory/${c.slug}`}
              className="flex gap-4 items-start rounded-2xl border border-white/40 p-4 hover:border-white transition-colors"
            >
              {c.headshot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.headshot} alt={name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-brand-mint/40 flex items-center justify-center text-brand-green font-heading font-bold text-xl shrink-0">
                  {c.firstName[0]}
                  {c.lastName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-heading font-bold text-xl leading-tight">{name}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {c.location && (
                    <span className="text-[11px] uppercase font-semibold bg-[#FFE08A] text-brand-green px-2.5 py-0.5 rounded-full">
                      {c.location}
                    </span>
                  )}
                  {c.experienceLevel && (
                    <span className="text-[11px] uppercase font-semibold bg-brand-cream text-brand-green px-2.5 py-0.5 rounded-full">
                      {c.experienceLevel}
                    </span>
                  )}
                  {c.roles.slice(0, 2).map((r) => (
                    <span key={r} className="text-[11px] uppercase font-semibold bg-brand-mint text-brand-green px-2.5 py-0.5 rounded-full">
                      {r}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-brand-cream/80 mt-2 line-clamp-2">{c.bio}</p>
                <p className="text-xs font-semibold underline underline-offset-2 mt-2">View full profile →</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
