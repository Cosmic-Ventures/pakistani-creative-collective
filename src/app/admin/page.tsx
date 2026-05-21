import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [
    pendingApps,
    totalApproved,
    totalPaid,
    pendingContacts,
    pendingFeatures,
  ] = await Promise.all([
    db.creative.count({ where: { status: "PENDING" } }),
    db.creative.count({ where: { status: "APPROVED" } }),
    db.user.count({ where: { role: "PAID" } }),
    db.contactRequest.count({ where: { status: "PENDING" } }),
    db.featureRequest.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { label: "Pending Applications", value: pendingApps, href: "/admin/applications", urgent: pendingApps > 0 },
    { label: "Approved Creatives", value: totalApproved, href: "/admin/applications" },
    { label: "Paid Subscribers", value: totalPaid, href: "/admin/analytics" },
    { label: "Pending Contact Requests", value: pendingContacts, href: "/admin/contact-requests", urgent: pendingContacts > 0 },
    { label: "Pending Feature Requests", value: pendingFeatures, href: "/admin/feature-requests", urgent: pendingFeatures > 0 },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-6">Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, href, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`bg-stone-900 border rounded-xl p-5 hover:border-stone-600 transition-colors ${
              urgent ? "border-amber-700/60" : "border-stone-800"
            }`}
          >
            <p className={`text-3xl font-bold mb-1 ${urgent ? "text-amber-400" : "text-white"}`}>
              {value}
            </p>
            <p className="text-sm text-stone-400">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
