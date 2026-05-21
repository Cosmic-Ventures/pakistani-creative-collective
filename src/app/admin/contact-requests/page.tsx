import type { Metadata } from "next";
import { db } from "@/lib/db";
import { forwardContactRequest, updateContactRequestStatus } from "@/lib/admin-actions";

export const metadata: Metadata = { title: "Contact Requests · Admin" };
export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-amber-400 bg-amber-950/40 border-amber-700/40",
  FORWARDED: "text-blue-400 bg-blue-950/40 border-blue-700/40",
  ACCEPTED: "text-emerald-400 bg-emerald-950/40 border-emerald-700/40",
  DECLINED: "text-red-400 bg-red-950/40 border-red-700/40",
  UNAVAILABLE: "text-stone-400 bg-stone-800 border-stone-700",
};

export default async function ContactRequestsPage() {
  const requests = await db.contactRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creative: { select: { firstName: true, lastName: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-6">Contact Requests</h2>

      {requests.length === 0 && <p className="text-stone-500 text-sm">No contact requests yet.</p>}

      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-white">
                  Request for {r.creative.firstName} {r.creative.lastName}
                </h3>
                <p className="text-sm text-stone-400">
                  From: {r.organization ?? r.user.name ?? r.user.email}
                </p>
                <p className="text-xs text-stone-600">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status]}`}>
                {r.status}
              </span>
            </div>

            <div className="text-sm text-stone-400 space-y-2 mb-4">
              <div><span className="text-stone-600">Project: </span>{r.projectDesc}</div>
              <div><span className="text-stone-600">Looking for: </span>{r.lookingFor}</div>
            </div>

            {r.adminNotes && (
              <p className="text-xs text-stone-500 mb-3">Notes: {r.adminNotes}</p>
            )}

            <div className="flex gap-2 flex-wrap">
              {r.status === "PENDING" && (
                <form action={async () => { "use server"; await forwardContactRequest(r.id); }}>
                  <button className="text-sm bg-blue-700 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                    Forward to Creative
                  </button>
                </form>
              )}
              {["PENDING", "FORWARDED"].includes(r.status) && (
                <>
                  <form action={async () => { "use server"; await updateContactRequestStatus(r.id, "ACCEPTED"); }}>
                    <button className="text-sm bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                      Mark Accepted
                    </button>
                  </form>
                  <form action={async () => { "use server"; await updateContactRequestStatus(r.id, "DECLINED"); }}>
                    <button className="text-sm bg-stone-800 hover:bg-red-900/60 border border-stone-700 text-stone-300 px-4 py-1.5 rounded-lg transition-colors">
                      Mark Declined
                    </button>
                  </form>
                  <form action={async () => { "use server"; await updateContactRequestStatus(r.id, "UNAVAILABLE"); }}>
                    <button className="text-sm text-stone-500 hover:text-stone-300 transition-colors px-2">
                      Unavailable
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
