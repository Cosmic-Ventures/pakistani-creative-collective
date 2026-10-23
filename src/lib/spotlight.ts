import { db } from "./db";

const select = {
  slug: true, firstName: true, lastName: true, headshot: true,
  location: true, roles: true, experienceLevel: true, bio: true,
} as const;

/** This month's spotlight: everyone currently featured, else the founder's profile. */
export async function getSpotlights() {
  const featured = await db.creative.findMany({
    where: {
      status: "APPROVED",
      featured: true,
      OR: [{ featuredUntil: null }, { featuredUntil: { gt: new Date() } }],
    },
    orderBy: { updatedAt: "asc" },
    take: 4,
    select,
  });
  if (featured.length) return featured;
  return db.creative.findMany({ where: { slug: "aneesa-khan", status: "APPROVED" }, select });
}
