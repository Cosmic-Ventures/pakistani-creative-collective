import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/contact-requests", label: "Contact Requests" },
  { href: "/admin/feature-requests", label: "Feature Requests" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-stone-950 text-stone-100 min-h-[calc(100vh-4rem)]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-xs bg-amber-900/40 border border-amber-700/50 text-amber-400 px-2 py-0.5 rounded">
          Admin
        </span>
        <h1 className="text-xl font-bold text-white">PCC Admin Panel</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <nav className="shrink-0 lg:w-48 flex lg:flex-col gap-1 flex-wrap">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-stone-800 mt-2 pt-2 w-full">
            <Link href="/directory" className="px-3 py-2 rounded-lg text-sm text-stone-600 hover:text-stone-400 transition-colors block">
              ← Back to site
            </Link>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
    </div>
  );
}
