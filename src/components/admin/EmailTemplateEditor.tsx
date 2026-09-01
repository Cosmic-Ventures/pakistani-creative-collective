"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import {
  allVariables,
  renderTemplate,
  sampleValues,
  type EmailTemplateDef,
  type TemplateContent,
} from "@/lib/email-templates";
import {
  saveEmailTemplate,
  resetEmailTemplate,
  sendTestEmail,
  type TemplateActionResult,
} from "@/lib/email-template-actions";

const inputCls =
  "w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-stone-500";

export default function EmailTemplateEditor({
  def,
  content,
  isEdited,
  editedBy,
  editedAt,
  migrationPending = false,
}: {
  def: EmailTemplateDef;
  /** What's currently in force — the client's saved copy, or the default. */
  content: TemplateContent;
  isEdited: boolean;
  editedBy: string | null;
  editedAt: string | null;
  /** The EmailTemplate table isn't in this database yet — read-only until it is. */
  migrationPending?: boolean;
}) {
  const [state, formAction, saving] = useActionState<TemplateActionResult | null, FormData>(
    saveEmailTemplate,
    null
  );

  // Controlled, so a validation error doesn't wipe what she just typed
  // (AGENTS.md gotcha #6).
  const [subject, setSubject] = useState(content.subject);
  const [preheader, setPreheader] = useState(content.preheader);
  const [body, setBody] = useState(content.body);

  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  // The preview is rendered from the *unsaved* text by exactly the builders the
  // mailer uses, so what she sees here is what would go out if she saved now.
  const preview = renderTemplate(def, { subject, preheader, body }, sampleValues(def));

  const dirty =
    subject !== content.subject || preheader !== content.preheader || body !== content.body;

  function handleReset() {
    if (!confirm("Restore the original wording for this email? Your edits will be discarded.")) return;
    setNotice(null);
    startTransition(async () => {
      await resetEmailTemplate(def.key);
      // Back to the shipped copy, locally too, so the editor and the preview
      // agree with what the server now has.
      setSubject(def.subject);
      setPreheader(def.preheader);
      setBody(def.body);
      setNotice("Restored the original wording.");
    });
  }

  function handleTestSend() {
    setNotice(null);
    startTransition(async () => {
      const result = await sendTestEmail(def.key);
      setNotice("error" in result ? result.error : result.message);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <Link href="/admin/emails" className="text-xs text-stone-500 hover:text-stone-300">
            ← All emails
          </Link>
          <h2 className="text-lg font-bold text-white mt-1">{def.name}</h2>
          <p className="text-sm text-stone-400 mt-0.5">{def.description}</p>
          <p className="text-xs text-stone-500 mt-1">
            {isEdited
              ? `Edited${editedBy ? ` by ${editedBy}` : ""}${editedAt ? ` · ${editedAt}` : ""}`
              : "Using the original wording."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestSend}
            disabled={pending}
            className="text-xs font-semibold text-stone-300 border border-stone-700 hover:bg-stone-800 disabled:opacity-50 px-3 py-2 rounded-lg"
          >
            Send me a test
          </button>
          {isEdited && !migrationPending && (
            <button
              type="button"
              onClick={handleReset}
              disabled={pending}
              className="text-xs font-semibold text-amber-400 border border-amber-700/50 hover:bg-amber-900/20 disabled:opacity-50 px-3 py-2 rounded-lg"
            >
              Restore original
            </button>
          )}
        </div>
      </div>

      {migrationPending && (
        <p className="text-sm text-amber-300 bg-amber-950/30 border border-amber-700/60 rounded-lg px-4 py-3 mb-4">
          <strong>Read-only for now.</strong> This template needs a one-time database update before
          edits can be saved. Preview and wording below are live; this email is sending its original
          text as normal.
        </p>
      )}

      {notice && (
        <p className="text-sm text-stone-200 bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 mb-4">
          {notice}
        </p>
      )}
      {state && "error" in state && (
        <p className="text-sm text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-4 py-2 mb-4">
          {state.error}
        </p>
      )}
      {state && "ok" in state && !dirty && (
        <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-lg px-4 py-2 mb-4">
          {state.message}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="key" value={def.key} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5" htmlFor="subject">
              Subject line
            </label>
            <input
              id="subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5" htmlFor="preheader">
              Preview text
            </label>
            <input
              id="preheader"
              name="preheader"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-stone-500 mt-1">
              The grey line most inboxes show next to the subject. Not visible in the email itself.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5" htmlFor="body">
              Email body
            </label>
            <textarea
              id="body"
              name="body"
              rows={18}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`${inputCls} font-mono leading-relaxed resize-y`}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !dirty || migrationPending}
              className="bg-stone-100 hover:bg-white disabled:opacity-40 text-stone-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {dirty && <span className="text-xs text-amber-400">Unsaved changes</span>}
          </div>

          <div className="border border-stone-800 rounded-lg p-4 mt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
              Variables you can use
            </p>
            <ul className="space-y-1.5 mb-4">
              {allVariables(def).map((v) => (
                <li key={v.name} className="text-xs text-stone-400">
                  <code className="text-stone-200 bg-stone-800 px-1.5 py-0.5 rounded">{`{{${v.name}}}`}</code>{" "}
                  — {v.description}
                  {v.kind === "block" && " (appears as a quoted panel on its own line)"}
                </li>
              ))}
            </ul>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Formatting</p>
            <ul className="space-y-1.5 text-xs text-stone-400">
              <li>Leave a blank line between paragraphs.</li>
              <li>
                A line on its own like{" "}
                <code className="text-stone-200 bg-stone-800 px-1.5 py-0.5 rounded">
                  [View your profile →](https://…)
                </code>{" "}
                becomes a button.
              </li>
              <li>
                Lines starting with{" "}
                <code className="text-stone-200 bg-stone-800 px-1.5 py-0.5 rounded">- Label: value</code>{" "}
                become mint-labelled detail rows.
              </li>
              <li>The sign-off (&ldquo;— Aneesa Talks&rdquo;) and the logo are added automatically.</li>
            </ul>
          </div>
        </form>

        <div className="xl:sticky xl:top-6 self-start w-full">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">
            Live preview
          </p>
          <p className="text-xs text-stone-500 mb-2">
            Subject: <span className="text-stone-300">{preview.subject}</span>
          </p>
          <iframe
            title="Email preview"
            // The preview is generated locally from the text in the boxes — no
            // network, no mail sent — so it updates as she types.
            srcDoc={preview.html}
            className="w-full h-[640px] rounded-lg border border-stone-700 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
