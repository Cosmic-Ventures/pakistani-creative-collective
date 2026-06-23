import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const bodyFont = DM_Sans({
  variable: "--font-body-sans",
  subsets: ["latin"],
});

// Closest open-license match to the brand's Garet header font — see globals.css note.
const headingFont = Plus_Jakarta_Sans({
  variable: "--font-heading-sans",
  weight: ["700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Pakistani Creative Collective",
    template: "%s · PCC",
  },
  description:
    "A curated database where Pakistani creatives in film, music, and media can find each other, collaborate across the globe, and get hired.",
  openGraph: {
    siteName: "Pakistani Creative Collective",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-brown font-body antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
