/**
 * Idempotent seed for local/demo use. Safe to re-run — everything upserts by a
 * stable natural key (user email, creative slug).
 *
 * Run with:  npm run seed
 *
 * Seeds:
 *  - one PAID demo account (paid@demo.test / password123) for viewing full profiles
 *  - one UNPAID demo account (free@demo.test / password123)
 *  - one ADMIN demo account (admin@demo.test / password123) for the admin panel
 *  - the founder profile (Aneesa Khan) matching the brand mockup, plus a few
 *    sample creatives so the directory grid isn't empty.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  await db.user.upsert({
    where: { email: "paid@demo.test" },
    update: { role: "PAID" },
    create: { email: "paid@demo.test", passwordHash, name: "Paid Demo", role: "PAID" },
  });
  await db.user.upsert({
    where: { email: "free@demo.test" },
    update: { role: "UNPAID" },
    create: { email: "free@demo.test", passwordHash, name: "Free Demo", role: "UNPAID" },
  });
  await db.user.upsert({
    where: { email: "admin@demo.test" },
    update: { role: "ADMIN" },
    create: { email: "admin@demo.test", passwordHash, name: "Admin Demo", role: "ADMIN" },
  });

  // Founder profile — content mirrors the brand mockup exactly.
  await db.creative.upsert({
    where: { slug: "aneesa-khan" },
    update: {},
    create: {
      slug: "aneesa-khan",
      status: "APPROVED",
      firstName: "Aneesa",
      lastName: "Khan",
      pronouns: "she/her",
      location: "NJ/NYC",
      roles: ["Director", "Writer", "Producer"],
      experienceLevel: "Established Creative",
      bio: "Aneesa Khan is a Pakistani-American filmmaker, producer, and writer who has worked in film and television since age 15. A Northwestern University alumna, she has held roles at HUM TV, Blumhouse Productions, and Women in Entertainment, working across Pakistan, Qatar, Canada, the UK, and the US. Her debut film, The Girl With Anklets, won Best Cinematography at the Pakistani Film Festival Australia 2021. She went on to write, direct, and produce Criteria Kya Hai?, which screened at ten festivals in 2024, and served as associate producer on Mirrors, starring Deepti Gupta (The Pitt) and Academy Award nominee Paul Raci (Sound of Metal). In 2025, she founded Aneesa Talks, a film and media consulting company, and is currently producing her first feature, The Hermit. Her work is dedicated to amplifying underrepresented voices and building production environments where creative teams feel safe, respected, and represented.",
      headshot: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      mediums: ["Short Film", "Feature Film", "Music Video", "Screenplay", "Media PR"],
      languages: ["English", "Urdu"],
      availability: "Selective – Packed 2026 slate",
      education: "B.S. Communications, Northwestern University (Qatar)",
      website: "aneesakhan.com",
      publicLink: "aneesatalks.com",
      instagram: "aneesatalks",
      linkedin: "aneesakhan",
      vimeo: "https://youtube.com/@aneesatalks",
      ratePublic: true,
      rateStructure: "Project-based fee",
      rateRange: "Project-based fee",
      collaborationPreferences: "Any experience level",
      preferredProjectTypes: ["Narrative Fiction", "Documentary"],
      travel: "Will travel/open to international work",
      workSamples: [
        {
          title: "Criteria Kya Hai?",
          medium: "Short Film",
          year: "2023",
          role: "Director, Writer, Producer",
          link: "https://youtube.com/watch?v=dQw4w9WgXcQ",
        },
        {
          title: "The Girl With Anklets",
          medium: "Short Film",
          year: "2021",
          role: "Director",
          link: "https://vimeo.com/",
        },
      ],
      email: "aneesa@aneesatalks.com",
    },
  });

  const samples = [
    {
      slug: "zain-malik",
      firstName: "Zain",
      lastName: "Malik",
      pronouns: "he/him",
      location: "Lahore",
      roles: ["Director of Photography", "Camera Operator"],
      experienceLevel: "Developing Professional",
      bio: "Zain Malik is a Lahore-based cinematographer specializing in naturalistic narrative work and music videos, with credits across independent features and regional streaming series.",
      mediums: ["Feature Film", "Music Video"],
      languages: ["Urdu", "Punjabi", "English"],
      availability: "Available now",
      website: "zainmalikdp.com",
      publicLink: "zainmalikdp.com",
      email: "zain@demo.test",
    },
    {
      slug: "sara-ahmed",
      firstName: "Sara",
      lastName: "Ahmed",
      pronouns: "she/her",
      location: "London",
      roles: ["Composer", "Musician"],
      experienceLevel: "Accomplished Professional",
      bio: "Sara Ahmed is a composer and multi-instrumentalist scoring documentary and narrative film, blending South Asian classical instrumentation with contemporary electronic textures.",
      mediums: ["Documentary", "Feature Film"],
      languages: ["English", "Urdu"],
      availability: "Selectively available",
      website: "saraahmedmusic.com",
      publicLink: "saraahmedmusic.com",
      email: "sara@demo.test",
    },
    {
      slug: "bilal-rana",
      firstName: "Bilal",
      lastName: "Rana",
      pronouns: "he/him",
      location: "Toronto",
      roles: ["Film Editor", "Colorist"],
      experienceLevel: "Veteran Creative",
      bio: "Bilal Rana is a Toronto-based editor and colorist with over a decade of post-production experience on festival features, branded content, and broadcast documentary.",
      mediums: ["Feature Film", "Documentary"],
      languages: ["English", "Urdu", "Hindi"],
      availability: "Available in 1–3 months",
      website: "bilalrana.tv",
      publicLink: "bilalrana.tv",
      email: "bilal@demo.test",
    },
  ];

  for (const s of samples) {
    await db.creative.upsert({
      where: { slug: s.slug },
      update: {},
      create: { status: "APPROVED", ...s },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
