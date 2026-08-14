"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getSession } from "./session";

export async function getOwnCreative() {
  const session = await getSession();
  if (!session) return null;
  return db.creative.findFirst({ where: { userId: session.userId } });
}

export async function updateOwnProfile(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in.");

  const creative = await db.creative.findFirst({ where: { userId: session.userId } });
  if (!creative) throw new Error("No linked profile to edit.");

  // Headshot field submits the existing value untouched unless a new file was
  // picked, so an empty string here means "no photo on file", not "clear it".
  const headshot = (formData.get("headshot") as string) || null;

  await db.creative.update({
    where: { id: creative.id },
    data: {
      headshot,
      pronouns: (formData.get("pronouns") as string) || null,
      location: (formData.get("location") as string) || null,
      bio: formData.get("bio") as string,
      notableAchievements: (formData.get("notableAchievements") as string) || null,
      previousCollaborators: (formData.get("previousCollaborators") as string) || null,
      availability: (formData.get("availability") as string) || null,
      website: (formData.get("website") as string) || null,
      imdb: (formData.get("imdb") as string) || null,
      instagram: (formData.get("instagram") as string) || null,
      linkedin: (formData.get("linkedin") as string) || null,
      vimeo: (formData.get("vimeo") as string) || null,
    },
  });

  revalidatePath("/account");
  revalidatePath(`/directory/${creative.slug}`);
}
