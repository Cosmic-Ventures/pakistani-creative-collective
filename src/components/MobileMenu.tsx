"use client";

import { usePathname } from "next/navigation";

/**
 * The phone version of the header navigation: a menu button that drops the same
 * links down in a column. A plain <details>, so it works without JavaScript; keyed
 * on the pathname so it closes itself after you tap a link (the header lives in the
 * root layout and never remounts on its own).
 */
export default function MobileMenu({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <details key={pathname} className="md:hidden relative group">
      <summary
        aria-label="Menu"
        className="list-none cursor-pointer select-none w-11 h-11 grid place-items-center rounded-lg text-brand-cream hover:bg-brand-cream/10 [&::-webkit-details-marker]:hidden"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path className="group-open:hidden" d="M4 7h16M4 12h16M4 17h16" />
          <path className="hidden group-open:block" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </summary>
      <div className="absolute right-0 top-12 w-64 rounded-2xl border border-white/60 bg-brand-green shadow-xl shadow-black/40 p-2 flex flex-col text-base">
        {children}
      </div>
    </details>
  );
}
