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
  featured: boolean;
  featuredUntil?: Date | null;
  // paid fields (undefined when not paid)
  roles?: string[];
  experienceLevel?: string | null;
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
      className={`group block bg-stone-900 border rounded-xl p-5 hover:border-emerald-700 hover:bg-stone-800/80 transition-all ${
        active ? "border-amber-700/60" : "border-stone-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-emerald-300 font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex flex-col items-end gap-1">
          {active && (
            <span className="text-xs bg-amber-900/40 border border-amber-700/50 text-amber-400 px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
          {isPaid && member.availability && (
            <span className="text-xs text-stone-500">{member.availability}</span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors leading-tight">
        {name}
        {member.pronouns && (
          <span className="ml-2 text-xs text-stone-500 font-normal">({member.pronouns})</span>
        )}
      </h3>

      {isPaid && member.roles && member.roles.length > 0 && (
        <p className="text-sm text-stone-400 mt-1">{member.roles.slice(0, 3).join(", ")}</p>
      )}
      {isPaid && member.mediums && member.mediums.length > 0 && (
        <p className="text-xs text-stone-500 mt-0.5">{member.mediums.slice(0, 2).join(", ")}</p>
      )}

      {!isPaid && (
        <p className="text-sm text-stone-500 mt-1 line-clamp-2">{member.bio}</p>
      )}

      {isPaid && member.experienceLevel && (
        <span className="inline-block mt-3 text-xs bg-stone-800 border border-stone-700 text-stone-400 px-2 py-0.5 rounded">
          {member.experienceLevel}
        </span>
      )}

      {!isPaid && member.publicLink && (
        <span className="inline-block mt-2 text-xs text-emerald-500">
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
    if (!isPaid) return [];
    const set = new Set<string>();
    members.forEach((m) => m.roles?.forEach((r) => r && set.add(r)));
    return Array.from(set).sort();
  }, [members, isPaid]);

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
            className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-300 focus:outline-none focus:border-emerald-600 text-sm"
          >
            <option value="">All Roles</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-300 focus:outline-none focus:border-emerald-600 text-sm"
          >
            <option value="">All Levels</option>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-300 focus:outline-none focus:border-emerald-600 text-sm"
          >
            <option value="">All Availability</option>
            {avails.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      <p className="text-stone-500 text-sm mb-5">
        {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        {isPaid ? " found" : " in the directory"}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-500">No members match your search.</div>
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
