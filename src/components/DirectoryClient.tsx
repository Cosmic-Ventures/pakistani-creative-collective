"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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
  // paid-only fields (undefined when not paid)
  mediums?: string[];
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
      className={`group block bg-white border rounded-xl p-5 hover:border-brand-green/60 hover:shadow-md transition-all ${
        active ? "border-brand-mint" : "border-brand-green/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {isPaid && member.headshot ? (
          <img
            src={member.headshot}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border border-brand-green/20 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-mint/30 border border-brand-mint flex items-center justify-center text-brand-green font-semibold text-sm shrink-0">
            {initials}
          </div>
        )}
        <div className="flex flex-col items-end gap-1">
          {active && (
            <span className="text-xs bg-brand-mint/30 border border-brand-mint text-brand-green px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
          {isPaid && member.availability && (
            <span className="text-xs text-brand-brown/50">{member.availability}</span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-brand-green group-hover:text-brand-green/70 transition-colors leading-tight">
        {name}
        {member.pronouns && (
          <span className="ml-2 text-xs text-brand-brown/50 font-normal">({member.pronouns})</span>
        )}
      </h3>

      {member.location && <p className="text-xs text-brand-brown/50 mt-0.5">{member.location}</p>}

      {member.roles.length > 0 && (
        isPaid ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {member.roles.slice(0, 3).map((r) => (
              <span key={r} className="text-xs bg-brand-mint/20 border border-brand-mint/60 text-brand-green px-2 py-0.5 rounded-full">
                {r}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-brown/70 mt-1">{member.roles.join(", ")}</p>
        )
      )}

      {isPaid && member.mediums && member.mediums.length > 0 && (
        <p className="text-xs text-brand-brown/50 mt-1.5">{member.mediums.slice(0, 2).join(", ")}</p>
      )}

      {!isPaid && (
        <p className="text-sm text-brand-brown/60 mt-2 line-clamp-2">{member.bio}</p>
      )}

      {member.experienceLevel && (
        <span className="inline-block mt-3 text-xs bg-brand-green/5 border border-brand-green/20 text-brand-green/80 px-2 py-0.5 rounded">
          {member.experienceLevel}
        </span>
      )}

      {!isPaid && member.publicLink && (
        <span className="inline-block mt-2 ml-2 text-xs text-brand-green/70">
          {member.publicLink.replace(/^https?:\/\//, "")}
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
  const [levelFilter, setLevelFilter] = useState("");
  const [availFilter, setAvailFilter] = useState("");

  const roles = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.roles?.forEach((r) => r && set.add(r)));
    return Array.from(set).sort();
  }, [members]);

  const levels = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.experienceLevel && set.add(m.experienceLevel));
    return Array.from(set).sort();
  }, [members]);

  const avails = useMemo(() => {
    if (!isPaid) return [];
    const set = new Set<string>();
    members.forEach((m) => m.availability && set.add(m.availability));
    return Array.from(set).sort();
  }, [members, isPaid]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      if (q && !name.includes(q) && !m.roles?.join(" ").toLowerCase().includes(q)) return false;
      if (roleFilter && !m.roles?.includes(roleFilter)) return false;
      if (levelFilter && m.experienceLevel !== levelFilter) return false;
      if (availFilter && m.availability !== availFilter) return false;
      return true;
    });
  }, [members, query, roleFilter, levelFilter, availFilter]);

  return (
    <div>
      {isPaid && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Search by name or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown placeholder-brand-brown/40 focus:outline-none focus:border-brand-green text-sm"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown focus:outline-none focus:border-brand-green text-sm"
          >
            <option value="">All Roles</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown focus:outline-none focus:border-brand-green text-sm"
          >
            <option value="">All Levels</option>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
            className="bg-white border border-brand-green/20 rounded-lg px-4 py-2.5 text-brand-brown focus:outline-none focus:border-brand-green text-sm"
          >
            <option value="">All Availability</option>
            {avails.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      <p className="text-brand-brown/60 text-sm mb-5">
        {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        {isPaid ? " found" : " in the directory"}
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
