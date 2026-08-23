"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { getSession } from "./session";

export async function getOwnCreative() {
  const session = await getSession();
  if (!session) return null;
  return db.creative.findFirst({ where: { userId: session.userId } });
}

export type UpdateProfileResult = { error: string } | { success: true };

export async function updateOwnProfile(
  _prev: UpdateProfileResult | null,
  formData: FormData
): Promise<UpdateProfileResult> {
  const session = await getSession();
  if (!session) return { error: "You've been signed out — sign in again to save changes." };

  const creative = await db.creative.findFirst({ where: { userId: session.userId } });
  if (!creative) return { error: "No linked profile to edit." };

  const bio = (formData.get("bio") as string) ?? "";
  if (bio.trim().length === 0) return { error: "Bio can't be empty." };

  // Headshot field submits the existing value untouched unless a new file was
  // picked, so an empty string here means "no photo on file", not "clear it".
  const headshot = (formData.get("headshot") as string) || null;

  await db.creative.update({
    where: { id: creative.id },
    data: {
      headshot,
      pronouns: (formData.get("pronouns") as string) || null,
      location: (formData.get("location") as string) || null,
      bio,
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
  return { success: true };
}
