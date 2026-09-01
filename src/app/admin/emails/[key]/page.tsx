import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { defaultContent, getTemplateDef } from "@/lib/email-templates";
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  return { title: `${getTemplateDef(key)?.name ?? "Email"} · Admin` };
}

export default async function EmailTemplatePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const def = getTemplateDef(key);
  if (!def) notFound();

  const stored = await db.emailTemplate.findUnique({ where: { key } });

  return (
    <EmailTemplateEditor
      def={def}
      content={
        stored
          ? { subject: stored.subject, preheader: stored.preheader, body: stored.body }
          : defaultContent(def)
      }
      isEdited={Boolean(stored)}
      editedBy={stored?.updatedBy ?? null}
      editedAt={stored ? stored.updatedAt.toLocaleString() : null}
    />
  );
}
