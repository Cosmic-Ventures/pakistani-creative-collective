"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "@/lib/admin-actions";
import type { UserRole } from "@prisma/client";

const ROLES: UserRole[] = ["UNPAID", "PAID", "ADMIN"];

export function RoleControl({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
}) {
  const [role, setRole] = useState(currentRole);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(next: UserRole) {
    if (next === role) return;
    const previous = role;
    setRole(next);
    setMessage(null);
    startTransition(async () => {
      const result = await setUserRole(userId, next);
      if ("error" in result) {
        setRole(previous);
        setMessage({ text: result.error, isError: true });
      } else {
        setMessage({ text: "Role updated.", isError: false });
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={role}
        disabled={pending || (isSelf && role === "ADMIN")}
        onChange={(e) => handleChange(e.target.value as UserRole)}
        className="bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-stone-600 disabled:opacity-50"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {isSelf && <span className="text-[10px] text-stone-600">This is you</span>}
      {message && (
        <span className={`text-[10px] ${message.isError ? "text-red-400" : "text-emerald-500"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
