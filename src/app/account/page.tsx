import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { logoutAction } from "@/lib/auth-actions";
import { manageSubscriptionPortal } from "@/lib/subscribe-actions";
import { getDisplayPrices } from "@/lib/stripe";
import { toggleProfileBookmark, togglePostBookmark } from "@/lib/bookmark-actions";
import { updateOwnProfile } from "@/lib/profile-actions";
import { SelfManagedHeadshotUpload } from "@/components/HeadshotUpload";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

const TABS = [
  { id: "account", label: "Account" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "profile", label: "My Profile" },
] as const;

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/auth/signin");

  const { tab: rawTab, type: rawType } = await searchParams;
  const tab = TABS.some((t) => t.id === rawTab) ? rawTab! : "account";
  const bookmarkType = rawType === "posts" ? "posts" : "profiles";

  const myCreative = await db.creative.findFirst({ where: { userId: session.userId } });
  const isPaid = user.role === "PAID" || user.role === "ADMIN";
  const prices = await getDisplayPrices();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-heading font-bold text-2xl text-brand-green mb-8">My Account</h1>

      <div className="bg-white rounded-2xl p-2 inline-flex gap-1 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/account?tab=${t.id}`}
            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
              tab === t.id ? "bg-brand-green text-brand-cream" : "text-brand-brown/60 hover:text-brand-brown"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "account" && (
        <>
          <div className="bg-white border border-brand-green/10 rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-brand-green mb-4">Account Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-brown/50">Name</dt>
                <dd className="text-brand-brown/90">{user.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-brown/50">Email</dt>
                <dd className="text-brand-brown/90">{user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-brown/50">Access</dt>
                <dd>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    user.role === "PAID"
                      ? "text-brand-green bg-brand-mint/20 border-brand-mint"
                      : user.role === "ADMIN"
                      ? "text-amber-700 bg-amber-50 border-amber-300"
                      : "text-brand-brown/60 bg-brand-green/5 border-brand-green/15"
                  }`}>
                    {user.role === "PAID" ? "Paid subscriber" : user.role === "ADMIN" ? "Admin" : "Free"}
                  </span>
                </dd>
              </div>
              {user.subCurrentPeriodEnd && (
                <div className="flex justify-between">
                  <dt className="text-brand-brown/50">Subscription renews</dt>
                  <dd className="text-brand-brown/90">{new Date(user.subCurrentPeriodEnd).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            {user.role === "PAID" && user.stripeCustomerId && (
              <form action={manageSubscriptionPortal}>
                <button className="text-sm bg-brand-green/5 hover:bg-brand-green/10 border border-brand-green/20 text-brand-brown/80 px-5 py-2.5 rounded-full transition-colors">
                  Manage Subscription
                </button>
              </form>
            )}
            {user.role === "UNPAID" && (
              <a
                href="/subscribe"
                className="text-sm bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-5 py-2.5 rounded-full transition-colors"
              >
                Subscribe — from {prices.monthly}/month
              </a>
            )}
            <form action={logoutAction}>
              <button className="text-sm text-brand-brown/50 hover:text-brand-brown transition-colors px-2 py-2.5">
                Sign out
              </button>
            </form>
          </div>
        </>
      )}

      {tab === "bookmarks" && (
        <div>
          {!isPaid ? (
            <p className="text-brand-brown/70 text-sm">
              Bookmarking profiles and posts is available to paid members.{" "}
              <a href="/subscribe" className="text-brand-green font-semibold hover:underline">Subscribe →</a>
            </p>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                <Link
                  href="/account?tab=bookmarks&type=profiles"
                  className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors ${
                    bookmarkType === "profiles" ? "bg-brand-mint text-brand-green border-brand-mint" : "border-brand-green/20 text-brand-brown/60 hover:text-brand-brown"
                  }`}
                >
                  Profiles
                </Link>
                <Link
                  href="/account?tab=bookmarks&type=posts"
                  className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors ${
                    bookmarkType === "posts" ? "bg-brand-mint text-brand-green border-brand-mint" : "border-brand-green/20 text-brand-brown/60 hover:text-brand-brown"
                  }`}
                >
                  Posts
                </Link>
              </div>

              {bookmarkType === "profiles" ? <BookmarkedProfiles userId={user.id} /> : <BookmarkedPosts userId={user.id} />}
            </>
          )}
        </div>
      )}

      {tab === "profile" && (
        <div>
          {!myCreative ? (
            <p className="text-brand-brown/70 text-sm">
              You don&apos;t have a linked PCC directory profile yet. If you&apos;ve applied and been
              approved, make sure your application used this account&apos;s email — otherwise{" "}
              <a href="/enroll" className="text-brand-green font-semibold hover:underline">apply to join →</a>
            </p>
          ) : myCreative.status !== "APPROVED" ? (
            <p className="text-brand-brown/70 text-sm">
              Your profile is currently <strong className="text-brand-brown">{myCreative.status.toLowerCase()}</strong> —
              editing is available once it&apos;s approved.
            </p>
          ) : (
            <form action={updateOwnProfile} className="bg-white rounded-2xl p-6 space-y-4">
              {/* Approved members can swap their photo later (08/08 round) —
                  previously the headshot was fixed at application time. */}
              <div>
                <label className="block text-sm text-brand-brown/70 mb-1.5">Profile Headshot</label>
                <SelfManagedHeadshotUpload name="headshot" initialValue={myCreative.headshot ?? ""} />
                <p className="text-xs text-brand-brown/40 mt-1">
                  Image file, up to 8MB. Leave as-is to keep your current photo.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ProfileField label="Pronouns" name="pronouns" defaultValue={myCreative.pronouns ?? ""} />
                <ProfileField label="Public Location" name="location" defaultValue={myCreative.location ?? ""} />
              </div>
              <ProfileTextArea label="Bio" name="bio" required rows={6} defaultValue={myCreative.bio} />
              <ProfileTextArea label="Notable Achievements" name="notableAchievements" rows={2} defaultValue={myCreative.notableAchievements ?? ""} />
              <ProfileTextArea label="Previous Collaborators" name="previousCollaborators" rows={2} defaultValue={myCreative.previousCollaborators ?? ""} />
              <ProfileField label="Current Availability" name="availability" defaultValue={myCreative.availability ?? ""} hint="e.g. a date range, or 'Available now'" />
              <div className="grid grid-cols-2 gap-4">
                <ProfileField label="Website / Portfolio" name="website" defaultValue={myCreative.website ?? ""} />
                <ProfileField label="IMDb" name="imdb" defaultValue={myCreative.imdb ?? ""} />
                <ProfileField label="Instagram" name="instagram" defaultValue={myCreative.instagram ?? ""} />
                <ProfileField label="LinkedIn" name="linkedin" defaultValue={myCreative.linkedin ?? ""} />
              </div>
              <ProfileField label="Vimeo / YouTube" name="vimeo" defaultValue={myCreative.vimeo ?? ""} />
              <button className="bg-brand-green hover:bg-brand-green/90 text-brand-cream font-semibold px-6 py-3 rounded-full transition-colors text-sm">
                Save changes
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileField({ label, name, defaultValue, hint }: { label: string; name: string; defaultValue: string; hint?: string }) {
  return (
    <div>
      <label className="block text-sm text-brand-brown/70 mb-1.5">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown focus:outline-none focus:border-brand-green text-sm"
      />
      {hint && <p className="text-xs text-brand-brown/40 mt-1">{hint}</p>}
    </div>
  );
}

function ProfileTextArea({
  label, name, defaultValue, rows = 3, required,
}: { label: string; name: string; defaultValue: string; rows?: number; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm text-brand-brown/70 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <textarea
        name={name}
        required={required}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown focus:outline-none focus:border-brand-green text-sm resize-none"
      />
    </div>
  );
}

async function BookmarkedProfiles({ userId }: { userId: string }) {
  const bookmarks = await db.bookmark.findMany({
    where: { userId, type: "PROFILE" },
    include: { creative: true },
    orderBy: { createdAt: "desc" },
  });
  const profiles = bookmarks.filter((b) => b.creative);

  if (profiles.length === 0) {
    return <p className="text-brand-brown/50 text-sm">No bookmarked profiles yet. Browse the directory and save profiles you want to find again.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {profiles.map((b) => (
        <div key={b.id} className="bg-white rounded-xl p-5 flex items-start justify-between gap-3">
          <div>
            <Link href={`/directory/${b.creative!.slug}`} className="font-semibold text-brand-green hover:underline">
              {b.creative!.firstName} {b.creative!.lastName}
            </Link>
            {b.creative!.location && <p className="text-xs text-brand-brown/50 mt-0.5">{b.creative!.location}</p>}
          </div>
          <form action={async () => { "use server"; await toggleProfileBookmark(b.creative!.id); }}>
            <button className="text-xs text-brand-brown/40 hover:text-red-500 transition-colors" aria-label="Remove bookmark">✕</button>
          </form>
        </div>
      ))}
    </div>
  );
}

async function BookmarkedPosts({ userId }: { userId: string }) {
  const bookmarks = await db.bookmark.findMany({
    where: { userId, type: "POST" },
    include: { post: { include: { creative: true } } },
    orderBy: { createdAt: "desc" },
  });
  const posts = bookmarks.filter((b) => b.post);

  if (posts.length === 0) {
    return <p className="text-brand-brown/50 text-sm">No bookmarked posts yet. Save posts from the Community Dashboard to find them here.</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((b) => (
        <div key={b.id} className="bg-white rounded-xl p-5 flex items-start justify-between gap-3">
          <div>
            <Link href="/community" className="font-semibold text-brand-green hover:underline">{b.post!.title}</Link>
            <p className="text-xs text-brand-brown/50 mt-0.5">
              {b.post!.creative.firstName} {b.post!.creative.lastName}
            </p>
          </div>
          <form action={async () => { "use server"; await togglePostBookmark(b.post!.id); }}>
            <button className="text-xs text-brand-brown/40 hover:text-red-500 transition-colors" aria-label="Remove bookmark">✕</button>
          </form>
        </div>
      ))}
    </div>
  );
}
