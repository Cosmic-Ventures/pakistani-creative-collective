/**
 * Guarantees a form submission always says *something* back.
 *
 * `useActionState` only updates `state` when the action resolves. If the call
 * rejects instead — the connection drops, the request exceeds the Server Action
 * body limit, or the action throws for a reason nobody anticipated — `state`
 * stays exactly as it was, so the form renders no banner and the button looks
 * inert. That is the "I clicked Submit and nothing happened" report, and this
 * form has already produced it twice for other reasons (AGENTS.md gotchas #17
 * and #21). Server-side messages alone can't close it, because the failure can
 * happen before or after the server runs.
 *
 * Wrap the action once, and every path ends in a sentence the person can read.
 *
 * A successful submit that redirects reaches the client as a rejection carrying
 * a NEXT_REDIRECT digest — that must propagate, or a saved record would be
 * reported back as a failure.
 *
 * Plain module, not "use server": this runs in the browser, and a "use server"
 * file may only export async functions (AGENTS.md gotcha #1).
 */

type FormAction<S> = (prev: S | null, formData: FormData) => Promise<S>;

/** Next signals routing control-flow by throwing; never swallow those. */
function isNextControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))
  );
}

export function withSubmitFallback<S>(action: FormAction<S>, fallback: S, label = "submit"): FormAction<S> {
  return async (prev, formData) => {
    try {
      return await action(prev, formData);
    } catch (error) {
      if (isNextControlFlow(error)) throw error;
      // Logged so the next report is one log query rather than an inference.
      console.error(`[${label}] failed before a result came back`, error);
      return fallback;
    }
  };
}
