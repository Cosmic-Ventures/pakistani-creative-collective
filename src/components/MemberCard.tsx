import Link from "next/link";
import type { Member } from "@/lib/sheets";

export default function MemberCard({ member }: { member: Member }) {
  return (
    <Link
      href={`/directory/${member.slug}`}
      className="group block bg-stone-900 border border-stone-800 rounded-xl p-5 hover:border-emerald-700 hover:bg-stone-800/80 transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-emerald-900/60 border border-emerald-700/40 flex items-center justify-center text-emerald-300 font-semibold text-sm shrink-0">
          {member.firstName[0] ?? "?"}
          {member.lastName[0] ?? ""}
        </div>
        {member.location && (
          <span className="text-xs text-stone-500 mt-1">{member.location}</span>
        )}
      </div>

      <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors leading-tight">
        {member.name}
        {member.pronouns && (
          <span className="ml-2 text-xs text-stone-500 font-normal">
            ({member.pronouns})
          </span>
        )}
      </h3>

      {member.profession && (
        <p className="text-sm text-stone-400 mt-1">{member.profession}</p>
      )}

      {member.mediaType && (
        <p className="text-xs text-stone-500 mt-0.5">{member.mediaType}</p>
      )}

      <div className="flex gap-2 mt-3 flex-wrap">
        {member.imdb && (
          <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700">
            IMDb
          </span>
        )}
        {member.instagram && (
          <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700">
            Instagram
          </span>
        )}
        {member.linkedin && (
          <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700">
            LinkedIn
          </span>
        )}
      </div>
    </Link>
  );
}
