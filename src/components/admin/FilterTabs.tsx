// Shared status/role filter-tab bar for admin list pages. Renders a row of
// pill links, each optionally annotated with a count badge (e.g. "Pending (12)").
// Kept deliberately small — see AGENTS.md's admin dark-theme note, this reuses
// the existing stone-900/stone-800/emerald palette already used across admin
// pages rather than introducing a new one. Two `variant`s preserve the two
// pill styles that already existed pre-extraction (applications/community/users
// used the plain stone style, contact-requests used the emerald-accent style)
// so unifying the markup doesn't quietly reskin either page.

type FilterTab = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

const VARIANTS = {
  stone: {
    wrapper: "flex gap-2 text-sm flex-wrap",
    active: "bg-stone-700 border-stone-600 text-white",
    inactive: "border-stone-800 text-stone-500 hover:text-stone-300",
    countActive: "text-stone-300",
    countInactive: "text-stone-600",
  },
  emerald: {
    wrapper: "flex flex-wrap gap-2 text-xs",
    active: "bg-emerald-700 border-emerald-600 text-white",
    inactive: "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200",
    countActive: "text-emerald-100",
    countInactive: "text-stone-600",
  },
} as const;

export function FilterTabs({
  tabs,
  variant = "stone",
}: {
  tabs: FilterTab[];
  variant?: keyof typeof VARIANTS;
}) {
  const v = VARIANTS[variant];
  const sizeClass = variant === "emerald" ? "px-3 py-1.5" : "px-3 py-1";

  return (
    <div className={v.wrapper}>
      {tabs.map((tab) => (
        <a
          key={tab.href}
          href={tab.href}
          className={`${sizeClass} rounded-full border transition-colors ${tab.active ? v.active : v.inactive}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={tab.active ? v.countActive : v.countInactive}> ({tab.count})</span>
          )}
        </a>
      ))}
    </div>
  );
}
