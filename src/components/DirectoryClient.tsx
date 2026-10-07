"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MEDIUMS } from "@/lib/enroll-constants";

type Member = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  pronouns?: string | null;
  bio: string;
  publicLink?: string | null;
  location?: string | null;
  roles: string[];
  experienceLevel?: string | null;
  featured: boolean;
  featuredUntil?: Date | null;
  // filterable by everyone
  mediums?: string[];
  // paid-only fields (undefined when not paid)
  languages?: string[];
  availability?: string | null;
  preferredProjectTypes?: string[];
  rateStructure?: string | null;
  rateRange?: string | null;
  ratePublic?: boolean;
  headshot?: string | null;
};

function isFeaturedActive(m: Member) {
  return m.featured && (!m.featuredUntil || new Date(m.featuredUntil) > new Date());
}

function MemberCard({ member, isPaid }: { member: Member; isPaid: boolean }) {
  const initials = `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`;
  const name = `${member.firstName} ${member.lastName}`.trim();
  const active = isFeaturedActive(member);

  return (
    <Link
      href={`/directory/${member.slug}`}
      className={`group block bg-brand-green text-brand-cream border rounded-xl p-5 hover:border-brand-mint hover:shadow-md transition-all ${
        active ? "border-brand-mint" : "border-brand-cream/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {member.headshot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.headshot}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border border-brand-cream/20 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-brand-cream font-semibold text-sm shrink-0">
            {initials}
          </div>
        )}
        <div className="flex flex-col items-end gap-1">
          {active && (
            <span className="text-xs bg-brand-mint text-brand-green px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
          {isPaid && member.availability && (
            <span className="text-xs text-brand-cream/60">{member.availability}</span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-brand-cream leading-tight">
        {name}
        {member.pronouns && (
          <span className="ml-2 text-xs text-brand-cream/60 font-normal">({member.pronouns})</span>
        )}
      </h3>

      {member.location && <p className="text-xs text-brand-cream/60 mt-0.5">{member.location}</p>}

      {member.roles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {member.roles.slice(0, 3).map((r) => (
            <span key={r} className="text-xs bg-brand-mint text-brand-green px-2 py-0.5 rounded-full">
              {r}
            </span>
          ))}
        </div>
      )}

      {isPaid && member.mediums && member.mediums.length > 0 && (
        <p className="text-xs text-brand-cream/60 mt-1.5">{member.mediums.slice(0, 2).join(", ")}</p>
      )}

      {!isPaid && (
        <p className="text-sm text-brand-cream/80 mt-2 line-clamp-2">{member.bio}</p>
      )}

      {member.experienceLevel && (
        <span className="inline-block mt-3 text-xs bg-brand-cream/10 border border-brand-cream/20 text-brand-cream px-2 py-0.5 rounded">
          {member.experienceLevel}
        </span>
      )}
    </Link>
  );
}

export default function DirectoryClient({
  members,
  isPaid,
}: {
  members: Member[];
  isPaid: boolean;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [availFilter, setAvailFilter] = useState("");
  const [mediumFilter, setMediumFilter] = useState("");

  const roles = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.roles?.forEach((r) => r && set.add(r)));
    return Array.from(set).sort();
  }, [members]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.location && set.add(m.location));
    return Array.from(set).sort();
  }, [members]);

  const levels = useMemo(() => {
    if (!isPaid) return [];
    const set = new Set<string>();
    members.forEach((m) => m.experienceLevel && set.add(m.experienceLevel));
    return Array.from(set).sort();
  }, [members, isPaid]);

  const avails = useMemo(() => {
    if (!isPaid) return [];
    const set = new Set<string>();
    members.forEach((m) => m.availability && set.add(m.availability));
    return Array.from(set).sort();
  }, [members, isPaid]);

  // Medium options come from the canonical enrollment list rather than only from
  // what members happen to have selected, so Fashion/Art/Music (08/08 round) and
  // every other medium are always offered. Values present on records but no
  // longer in the canonical list (e.g. the legacy "Fashion/Costume") are unioned
  // in so existing profiles stay reachable.
  const mediums = useMemo(() => {
    const set = new Set<string>(MEDIUMS);
    members.forEach((m) => m.mediums?.forEach((med) => med && set.add(med)));
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      if (isPaid && q && !name.includes(q) && !m.roles?.join(" ").toLowerCase().includes(q)) return false;
      if (mediumFilter && !m.mediums?.includes(mediumFilter)) return false;
      if (locationFilter && m.location !== locationFilter) return false;
      if (roleFilter && !m.roles?.includes(roleFilter)) return false;
      if (isPaid && levelFilter && m.experienceLevel !== levelFilter) return false;
      if (isPaid && availFilter && m.availability !== availFilter) return false;
      return true;
    });
  }, [members, query, roleFilter, locationFilter, levelFilter, availFilter, mediumFilter, isPaid]);

  const selectCls = "bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown focus:outline-none focus:border-brand-green text-sm";

  return (
    <div>
      {/* Role, medium, and location: available to everyone (10/02 round).
          Name/keyword search, experience level, and work-for-hire availability
          are member-only filters. */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        {isPaid && (
          <input
            type="search"
            placeholder="Search by name or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-[200px] bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm"
          />
        )}
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectCls}>
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={mediumFilter} onChange={(e) => setMediumFilter(e.target.value)} className={selectCls}>
          <option value="">All Mediums</option>
          {mediums.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className={selectCls}>
          <option value="">All Locations</option>
          {locations.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        {isPaid && (
          <>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className={selectCls}>
              <option value="">All Experience Levels</option>
              {levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)} className={selectCls}>
              <option value="">All Work for Hire Availability</option>
              {avails.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </>
        )}
      </div>

      <p className="text-brand-brown/60 text-sm mb-5">
        {filtered.length} member{filtered.length !== 1 ? "s" : ""} found
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-brand-brown/50">No members match your search.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} isPaid={isPaid} />
          ))}
        </div>
      )}
    </div>
  );
}
