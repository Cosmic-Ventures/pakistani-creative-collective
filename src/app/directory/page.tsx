import type { Metadata } from "next";
import { getMembers } from "@/lib/sheets";
import DirectoryClient from "@/components/DirectoryClient";

export const metadata: Metadata = {
  title: "Directory",
  description:
    "Browse Pakistani creatives in film, music, and media. Filter by profession, location, and more.",
};

export const revalidate = 3600;

export default async function DirectoryPage() {
  const members = await getMembers();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">Member Directory</h1>
        <p className="text-stone-400 mt-2">
          {members.length} verified Pakistani creatives in film, music, and
          media.
        </p>
      </div>
      <DirectoryClient members={members} />
    </div>
  );
}
