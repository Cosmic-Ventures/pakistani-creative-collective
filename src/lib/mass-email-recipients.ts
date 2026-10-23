import { db } from "./db";
import type { MassEmailRecipient } from "./mass-email-constants";

export function toFirstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] || "there";
}

/**
 * Everyone in one segment — no auth check, so only call it from code that has already
 * authorised the caller (an admin action, or the scheduled-send job). Deduped isn't needed here (a segment is one
 * source table) — dedup happens later, across segments, when a send is
 * actually resolved from selected ids.
 */
export async function segmentRecipients(segmentId: string): Promise<MassEmailRecipient[]> {
  switch (segmentId) {
    case "unpaid-users":
    case "paid-users": {
      const role = segmentId === "paid-users" ? "PAID" : "UNPAID";
      const users = await db.user.findMany({ where: { role }, select: { id: true, email: true, name: true } });
      return users.map((u) => ({
        id: `user:${u.id}`,
        email: u.email,
        firstName: toFirstName(u.name),
        name: u.name ?? u.email,
        detail: role,
      }));
    }
    case "all-users": {
      const users = await db.user.findMany({ select: { id: true, email: true, name: true, role: true } });
      return users.map((u) => ({
        id: `user:${u.id}`,
        email: u.email,
        firstName: toFirstName(u.name),
        name: u.name ?? u.email,
        detail: u.role,
      }));
    }
    case "creative-pending":
    case "creative-approved":
    case "creative-rejected":
    case "creative-inactive":
    case "creative-flagged": {
      const status = segmentId.slice("creative-".length).toUpperCase() as
        | "PENDING"
        | "APPROVED"
        | "REJECTED"
        | "INACTIVE"
        | "FLAGGED";
      const creatives = await db.creative.findMany({
        where: { status },
        select: { id: true, email: true, firstName: true, lastName: true, status: true },
      });
      return creatives.map((c) => ({
        id: `creative:${c.id}`,
        email: c.email,
        firstName: c.firstName,
        name: `${c.firstName} ${c.lastName}`,
        detail: c.status,
      }));
    }
    case "incomplete-drafts": {
      // Signed up, started the enroll form, saved progress, and never came
      // back to submit it — the audience the client has previously had us
      // nudge by hand-run script. A draft survives even for someone who since
      // finished a *different* application, so exclude anyone who now has a
      // linked Creative.
      const drafts = await db.enrollmentDraft.findMany({
        include: { user: { include: { creative: { select: { id: true } } } } },
      });
      return drafts
        .filter((d) => !d.user.creative)
        .map((d) => ({
          id: `user:${d.user.id}`,
          email: d.user.email,
          firstName: toFirstName(d.user.name),
          name: d.user.name ?? d.user.email,
          detail: "draft saved",
        }));
    }
    default:
      return [];
  }
}
