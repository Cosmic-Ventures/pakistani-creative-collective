/**
 * One-off cleanup after the July 2026 QA/testing round, run before capturing
 * final handoff screenshots. Removes QA test artifacts from the shared DB,
 * resets the free demo account to its documented UNPAID state, and normalizes
 * experienceLevel values to the short tier names (see shortExperienceLevel).
 * Run: npx tsx scripts/final-cleanup.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function shortExperienceLevel(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

async function main() {
  // 1. QA test creatives/applications (both the approved one and the rejected duplicate)
  const qaCreatives = await db.creative.findMany({
    where: { email: { startsWith: "testina.qatest" } },
    select: { id: true, slug: true, email: true, status: true },
  });
  for (const c of qaCreatives) {
    console.log(`Deleting QA creative ${c.slug} (${c.email}, ${c.status})`);
    await db.creative.delete({ where: { id: c.id } });
  }

  // 2. QA community post (its comments/reactions go with it via relation cascade)
  const qaPosts = await db.post.findMany({
    where: { title: { startsWith: "QA test post" } },
    select: { id: true, title: true },
  });
  for (const p of qaPosts) {
    console.log(`Deleting QA post "${p.title}"`);
    await db.comment.deleteMany({ where: { postId: p.id } });
    await db.reaction.deleteMany({ where: { postId: p.id } });
    await db.post.delete({ where: { id: p.id } });
  }

  // 3. QA comment left on a real seeded post
  const qaComments = await db.comment.findMany({
    where: { body: { startsWith: "QA test comment" } },
    select: { id: true },
  });
  for (const c of qaComments) {
    console.log(`Deleting QA comment ${c.id}`);
    await db.comment.delete({ where: { id: c.id } });
  }

  // 4. QA contact request
  const qaRequests = await db.contactRequest.findMany({
    where: { message: { contains: "QA test submission" } },
    select: { id: true },
  });
  for (const r of qaRequests) {
    console.log(`Deleting QA contact request ${r.id}`);
    await db.contactRequest.delete({ where: { id: r.id } });
  }

  // 5. Reset free@demo.test to its documented purpose: the UNPAID demo account.
  //    Clearing the Stripe linkage means any later webhook for the sandbox
  //    subscription matches no user and is a no-op.
  const freeReset = await db.user.updateMany({
    where: { email: "free@demo.test" },
    data: {
      role: "UNPAID",
      stripeCustomerId: null,
      stripeSubId: null,
      subStatus: null,
      subCurrentPeriodEnd: null,
    },
  });
  console.log(`Reset free@demo.test to UNPAID (${freeReset.count} row)`);

  // 6. Normalize any remaining long-form experienceLevel values
  const longLevels = await db.creative.findMany({
    where: { experienceLevel: { contains: "(" } },
    select: { id: true, slug: true, experienceLevel: true },
  });
  for (const c of longLevels) {
    const next = shortExperienceLevel(c.experienceLevel ?? "");
    console.log(`Normalizing ${c.slug}: "${c.experienceLevel}" -> "${next}"`);
    await db.creative.update({ where: { id: c.id }, data: { experienceLevel: next } });
  }

  console.log("Cleanup done.");
}

main().finally(() => db.$disconnect());
