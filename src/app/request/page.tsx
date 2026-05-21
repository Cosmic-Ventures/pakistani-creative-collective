import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Hire Talent" };

// Public talent request page redirects to directory — paid users submit requests per-profile
export default function RequestPage() {
  redirect("/directory");
}
