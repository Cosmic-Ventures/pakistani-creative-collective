import type { Metadata } from "next";
import Image from "next/image";
import Logo from "@/components/Logo";
import { GateForm } from "@/components/GateForm";

export const metadata: Metadata = {
  title: "Enter Password",
  description: "The Pakistani Creative Collective is not yet open to the public.",
  // Keep the pre-launch site out of search results entirely.
  robots: { index: false, follow: false },
};

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-brand-green flex items-center overflow-hidden">
      <Image
        src="/brand/pcc-header.png"
        alt=""
        fill
        priority
        className="object-cover pointer-events-none select-none"
      />
      {/* Left-to-right scrim, same as the home hero: the artwork keeps its
          figures on the right, so the copy sits over the clear left side
          instead of on top of them. */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-green via-brand-green/85 to-brand-green/10 pointer-events-none" />

      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-md">
          <Logo variant="square" className="h-20 w-auto mb-8" />
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-brand-cream mb-3">
            Applications are open
          </h1>
          <p className="text-brand-cream/80 text-sm leading-relaxed mb-8">
            The Pakistani Creative Collective isn&apos;t open to the public yet. If you&apos;ve been
            invited to apply, enter the password you were given to reach the application.
          </p>

          <GateForm next={next} />

          <p className="text-brand-cream/50 text-xs mt-8">
            Don&apos;t have the password?{" "}
            <a
              href="mailto:pcc@aneesatalks.com"
              className="text-brand-cream/80 underline underline-offset-2 hover:text-brand-cream"
            >
              Get in touch
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
