import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Join" };

export default function JoinPage() {
  redirect("/enroll");
}
