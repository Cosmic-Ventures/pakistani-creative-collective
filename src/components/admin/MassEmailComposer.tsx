"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MASS_EMAIL_DEF, renderTemplate, sampleValues } from "@/lib/email-templates";
import { sendMassEmailAction, sendMassEmailTestAction, type MassEmailResult } from "@/lib/mass-email-actions";
import type { MassEmailRecipient, MassEmailSegment } from "@/lib/mass-email-constants";

const inputCls =
  "w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-stone-500";

export default function MassEmailComposer({
  segments,
  activeSegment,
  recipients,
}: {
  segments: MassEmailSegment[];
  activeSegment: string;
  recipients: MassEmailRecipient[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("");

  // Whole segment starts checked — the common case is "email everyone in
  // this group", with deselecting a few the exception, not the other way
  // around.
  const [selected, setSelected] = useState<Set<string>>(() => new Set(recipients.map((r) => r.id)));

  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [body, setBody] = useState("");

  const [sendState, sendAction, sending] = useActionState<MassEmailResult | null, FormData>(
    sendMassEmailAction,
    null
  );
  const [testPending, startTestTransition] = useTransition();
  const [testNotice, setTestNotice] = useState<MassEmailResult | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }, [recipients, filter]);

  const preview = renderTemplate(MASS_EMAIL_DEF, { subject, preheader, body }, sampleValues(MASS_EMAIL_DEF));

  function handleSegmentChange(id: string) {
    router.push(`/admin/mass-email?segment=${id}`);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of visible) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  }

  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  function handleTestSend(formData: FormData) {
    setTestNotice(null);
    startTestTransition(async () => {
      const result = await sendMassEmailTestAction(null, formData);
      setTestNotice(result);
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (selected.size === 0) {
      e.preventDefault();
      return;
    }
    const noun = selected.size === 1 ? "person" : "people";
    if (!confirm(`Send this email to ${selected.size} ${noun}? This can't be undone.`)) {
      e.preventDefault();
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5">
            Segment
          </label>
          <select
            value={activeSegment}
            onChange={(e) => handleSegmentChange(e.target.value)}
            className={inputCls}
          >
            {segments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-500 mt-1">
            {segments.find((s) => s.id === activeSegment)?.description}
          </p>
        </div>

        <div className="border border-stone-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-stone-900 border-b border-stone-800">
            <label className="flex items-center gap-2 text-xs text-stone-300">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(e) => selectAllVisible(e.target.checked)}
              />
              Select all shown
            </label>
            <input
              type="text"
              placeholder="Filter by name or email…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-stone-500 w-48"
            />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-stone-800/60">
            {visible.length === 0 && (
              <p className="text-xs text-stone-600 px-3 py-4">No one matches in this segment.</p>
            )}
            {visible.map((r) => (
              <label
                key={r.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-stone-900/60 cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  <span className="truncate">
                    <span className="text-stone-200">{r.name}</span>{" "}
                    <span className="text-stone-600">{r.email}</span>
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-wide text-stone-500 shrink-0">{r.detail}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="text-xs text-stone-500 -mt-4">
          {selected.size} of {recipients.length} selected. Each person is sent their own copy — no one
          sees who else received it.
        </p>

        <form
          action={sendAction}
          onSubmit={handleSubmit}
          className="space-y-4 border-t border-stone-800 pt-6"
        >
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="recipientIds" value={id} />
          ))}

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
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1.5" htmlFor="body">
              Email body
            </label>
            <textarea
              id="body"
              name="body"
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Hi {{firstName}},\n\n…`}
              className={`${inputCls} font-mono leading-relaxed resize-y`}
            />
            <p className="text-xs text-stone-500 mt-1">
              Use <code className="text-stone-300 bg-stone-800 px-1 rounded">{"{{firstName}}"}</code>. Blank
              line = new paragraph; a line like{" "}
              <code className="text-stone-300 bg-stone-800 px-1 rounded">[Button label](https://…)</code> becomes
              a button.
            </p>
          </div>

          {sendState && "error" in sendState && (
            <p className="text-sm text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-4 py-2">
              {sendState.error}
            </p>
          )}
          {sendState && "ok" in sendState && (
            <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-lg px-4 py-2">
              {sendState.message}
            </p>
          )}
          {testNotice && "error" in testNotice && (
            <p className="text-sm text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-4 py-2">
              {testNotice.error}
            </p>
          )}
          {testNotice && "ok" in testNotice && (
            <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-lg px-4 py-2">
              {testNotice.message}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={sending || selected.size === 0}
              className="bg-stone-100 hover:bg-white disabled:opacity-40 text-stone-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              {sending ? "Sending…" : `Send to ${selected.size}`}
            </button>
            <button
              type="button"
              disabled={testPending}
              onClick={() => {
                const fd = new FormData();
                fd.set("subject", subject);
                fd.set("preheader", preheader);
                fd.set("body", body);
                handleTestSend(fd);
              }}
              className="text-xs font-semibold text-stone-300 border border-stone-700 hover:bg-stone-800 disabled:opacity-50 px-3 py-2.5 rounded-lg"
            >
              {testPending ? "Sending…" : "Send me a test"}
            </button>
          </div>
        </form>
      </div>

      <div className="xl:sticky xl:top-6 self-start w-full">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Live preview</p>
        <p className="text-xs text-stone-500 mb-2">
          Subject: <span className="text-stone-300">{preview.subject || "(empty)"}</span>
        </p>
        <iframe
          title="Mass email preview"
          srcDoc={preview.html}
          className="w-full h-[640px] rounded-lg border border-stone-700 bg-white"
        />
      </div>
    </div>
  );
}
