"use client";

import { useState, useMemo } from "react";
import type { Member } from "@/lib/sheets";
import MemberCard from "./MemberCard";

export default function DirectoryClient({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [professionFilter, setProfessionFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const professions = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.profession) {
        m.profession.split(/[,/]/).forEach((p) => {
          const trimmed = p.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [members]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.location) set.add(m.location.trim());
    });
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) => {
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.profession.toLowerCase().includes(q) &&
        !m.mediaType.toLowerCase().includes(q) &&
        !m.location.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (
        professionFilter &&
        !m.profession.toLowerCase().includes(professionFilter.toLowerCase())
      ) {
        return false;
      }
      if (locationFilter && m.location.trim() !== locationFilter) {
        return false;
      }
      return true;
    });
  }, [members, query, professionFilter, locationFilter]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="search"
          placeholder="Search by name, profession, or location…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
        />
        <select
          value={professionFilter}
          onChange={(e) => setProfessionFilter(e.target.value)}
          className="bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-300 focus:outline-none focus:border-emerald-600 text-sm"
        >
          <option value="">All Professions</option>
          {professions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="bg-stone-900 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-300 focus:outline-none focus:border-emerald-600 text-sm"
        >
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <p className="text-stone-500 text-sm mb-6">
        {filtered.length} member{filtered.length !== 1 ? "s" : ""} found
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-500">
          No members match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
