"use client";

import { useActionState, useState, useTransition } from "react";
import { MASS_EMAIL_DEF, renderTemplate, sampleValues } from "@/lib/email-templates";
import { sendMassEmailTestAction, type MassEmailResult } from "@/lib/mass-email-actions";
import { saveScheduledEmail, type ScheduledEmailResult } from "@/lib/scheduled-email-actions";
import type { MassEmailSegment } from "@/lib/mass-email-constants";

const inputCls =
  "w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-stone-500";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5";

export type ScheduledEmailInitial = {
  id?: string;
  name: string;
  segmentId: string;
  subject: string;
  preheader: string;
  body: string;
  sendAtEastern: string; // datetime-local value
};

export default function ScheduledEmailForm({
  initial,
  segments,
}: {
  initial: ScheduledEmailInitial;
  segments: MassEmailSegment[];
}) {
  const [state, action, saving] = useActionState<ScheduledEmailResult, FormData>(saveScheduledEmail, null);
  const [testPending, startTest] = useTransition();
  const [testNotice, setTestNotice] = useState<MassEmailResult | null>(null);
  // Controlled so a validation error never wipes what was typed (AGENTS.md gotcha #6).
  const [v, setV] = useState(initial);
  const set = (k: keyof ScheduledEmailInitial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  const preview = renderTemplate(
    MASS_EMAIL_DEF,
    { subject: v.subject, preheader: v.preheader, body: v.body },
    sampleValues(MASS_EMAIL_DEF)
  );

  function sendTest() {
    const fd = new FormData();
    fd.set("subject", v.subject);
    fd.set("preheader", v.preheader);
    fd.set("body", v.body);
    setTestNotice(null);
    startTest(async () => setTestNotice(await sendMassEmailTestAction(null, fd)));
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <form action={action} className="space-y-4">
        {v.id && <input type="hidden" name="id" value={v.id} />}
        <div>
          <label className={labelCls}>Name (just for you)</label>
          <input name="name" value={v.name} onChange={set("name")} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Send at (Eastern time)</label>
            <input type="datetime-local" name="sendAt" value={v.sendAtEastern} onChange={set("sendAtEastern")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Send to</label>
            <select name="segmentId" value={v.segmentId} onChange={set("segmentId")} className={inputCls}>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Subject</label>
          <input name="subject" value={v.subject} onChange={set("subject")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Preview line</label>
          <input name="preheader" value={v.preheader} onChange={set("preheader")} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Body</label>
          <textarea name="body" value={v.body} onChange={set("body")} rows={16} className={`${inputCls} font-mono`} />
          <p className="text-xs text-stone-500 mt-1">
            Use {"{{firstName}}"} for the recipient&apos;s first name and [Button text →](https://…) for a button.
          </p>
        </div>

        {state && "error" in state && <p className="text-sm text-red-400">{state.error}</p>}
        {state && "ok" in state && <p className="text-sm text-emerald-400">{state.message}</p>}
        {testNotice && (
          <p className={`text-sm ${"error" in testNotice ? "text-red-400" : "text-emerald-400"}`}>
            {"error" in testNotice ? testNotice.error : testNotice.message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button name="intent" value="schedule" disabled={saving}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg">
            Schedule it
          </button>
          <button name="intent" value="draft" disabled={saving}
            className="bg-stone-700 hover:bg-stone-600 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg">
            Save as draft
          </button>
          <button type="button" onClick={sendTest} disabled={testPending}
            className="border border-stone-600 text-stone-300 hover:text-white text-sm px-5 py-2 rounded-lg">
            {testPending ? "Sending…" : "Send me a test"}
          </button>
        </div>
      </form>

      <div>
        <p className={labelCls}>Preview</p>
        <p className="text-xs text-stone-500 mb-2">Subject: {preview.subject || "—"}</p>
        <iframe title="Preview" sandbox="" srcDoc={preview.html} className="w-full h-[70vh] rounded-xl bg-white border border-stone-800" />
      </div>
    </div>
  );
}
