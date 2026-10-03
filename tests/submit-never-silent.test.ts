import { describe, it, expect, vi, beforeEach } from "vitest";
import { withSubmitFallback } from "@/lib/submit-fallback";

// The guarantee: a submission never resolves to "nothing". Either the action
// returns a result, or the caller gets a readable fallback — never a rejection
// that leaves useActionState's `state` untouched and the form silent.
describe("withSubmitFallback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes a normal result straight through", async () => {
    const guarded = withSubmitFallback(async () => ({ success: true }) as const, { error: "fallback" } as never);
    await expect(guarded(null, new FormData())).resolves.toEqual({ success: true });
  });

  it("passes a server-side error result through unchanged", async () => {
    const guarded = withSubmitFallback(async () => ({ error: "Bio must be at least 100 characters" }), { error: "fallback" });
    await expect(guarded(null, new FormData())).resolves.toEqual({ error: "Bio must be at least 100 characters" });
  });

  it("turns a rejection into a readable message instead of silence", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const guarded = withSubmitFallback(
      async () => { throw new Error("Failed to fetch"); },
      { error: "We couldn't reach the server." }
    );
    await expect(guarded(null, new FormData())).resolves.toEqual({ error: "We couldn't reach the server." });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("re-throws Next's redirect so a successful submit still navigates", async () => {
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;replace;/enroll/success;307;" });
    const guarded = withSubmitFallback(async () => { throw redirectError; }, { error: "fallback" });
    await expect(guarded(null, new FormData())).rejects.toBe(redirectError);
  });

  it("re-throws notFound() control flow too", async () => {
    const nf = Object.assign(new Error("NEXT_NOT_FOUND"), { digest: "NEXT_NOT_FOUND" });
    const guarded = withSubmitFallback(async () => { throw nf; }, { error: "fallback" });
    await expect(guarded(null, new FormData())).rejects.toBe(nf);
  });

  it("does not mistake an ordinary error carrying a digest-like field for control flow", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const odd = Object.assign(new Error("boom"), { digest: "SOMETHING_ELSE" });
    const guarded = withSubmitFallback(async () => { throw odd; }, { error: "fallback" });
    await expect(guarded(null, new FormData())).resolves.toEqual({ error: "fallback" });
    spy.mockRestore();
  });
});
