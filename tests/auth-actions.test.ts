import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, redirectMock, createSessionMock, deleteSessionMock } = vi.hoisted(() => ({
  dbMock: { user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } },
  redirectMock: vi.fn(),
  createSessionMock: vi.fn(),
  deleteSessionMock: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/session", () => ({
  createSession: createSessionMock,
  deleteSession: deleteSessionMock,
}));

import { signupAction, loginAction, logoutAction } from "@/lib/auth-actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signupAction", () => {
  it("rejects an invalid password", async () => {
    const result = await signupAction(
      null,
      formData({ name: "Ada", email: "ada@example.com", password: "short" })
    );
    expect(result).toEqual({ error: expect.stringContaining("8 characters") });
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email", async () => {
    dbMock.user.findUnique.mockResolvedValue({ id: "existing-user" });
    const result = await signupAction(
      null,
      formData({ name: "Ada", email: "ada@example.com", password: "password123" })
    );
    expect(result).toEqual({ error: expect.stringContaining("already exists") });
    expect(dbMock.user.create).not.toHaveBeenCalled();
  });

  it("creates a user and starts a session on success", async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    dbMock.user.create.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      role: "UNPAID",
      name: "Ada",
    });

    await signupAction(
      null,
      formData({ name: "Ada", email: "ada@example.com", password: "password123" })
    );

    expect(dbMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Ada", email: "ada@example.com" }),
      })
    );
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", email: "ada@example.com" })
    );
    expect(redirectMock).toHaveBeenCalledWith("/directory");
  });
});

describe("loginAction", () => {
  it("rejects an unknown email", async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    const result = await loginAction(
      null,
      formData({ email: "nobody@example.com", password: "password123" })
    );
    expect(result).toEqual({ error: "Invalid email or password." });
  });

  it("rejects an incorrect password", async () => {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("correct-password", 12);
    dbMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      passwordHash,
      role: "UNPAID",
      name: "Ada",
    });

    const result = await loginAction(
      null,
      formData({ email: "ada@example.com", password: "wrong-password" })
    );
    expect(result).toEqual({ error: "Invalid email or password." });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("logs in and starts a session on correct credentials", async () => {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("correct-password", 12);
    dbMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "ada@example.com",
      passwordHash,
      role: "UNPAID",
      name: "Ada",
    });

    await loginAction(null, formData({ email: "ada@example.com", password: "correct-password" }));

    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", email: "ada@example.com" })
    );
    expect(redirectMock).toHaveBeenCalledWith("/directory");
  });
});

describe("logoutAction", () => {
  it("deletes the session and redirects home", async () => {
    await logoutAction();
    expect(deleteSessionMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});

// ── Brute-force + enumeration hardening ──────────────────────────────────────
describe("loginAction hardening", () => {
  const HASH = "$2b$12$Ktxau5oKziG9fGDeh5fzMeOkhC.F.S4MEOgnU/JWot.85TfFv9DhC";

  function user(over: Record<string, unknown> = {}) {
    return {
      id: "u1", email: "ada@example.com", name: "Ada", role: "UNPAID",
      passwordHash: HASH, failedLoginAttempts: 0, lockedUntil: null, ...over,
    };
  }

  it("gives the same message for an unknown email as for a wrong password", async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    const unknown = await loginAction(null, formData({ email: "nobody@example.com", password: "whatever1" }));

    dbMock.user.findUnique.mockResolvedValue(user());
    dbMock.user.update.mockResolvedValue({});
    const wrong = await loginAction(null, formData({ email: "ada@example.com", password: "wrongpass1" }));

    expect(unknown).toEqual({ error: "Invalid email or password." });
    expect(wrong).toEqual(unknown);
  });

  it("takes a comparable amount of time for an unknown email (no timing oracle)", async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    const t0 = Date.now();
    await loginAction(null, formData({ email: "nobody@example.com", password: "whatever1" }));
    // A short-circuit would return in ~0ms; a real bcrypt compare costs ~200ms.
    expect(Date.now() - t0).toBeGreaterThan(50);
  });

  it("counts failed attempts and locks the account at the threshold", async () => {
    dbMock.user.findUnique.mockResolvedValue(user({ failedLoginAttempts: 9 }));
    dbMock.user.update.mockResolvedValue({});
    await loginAction(null, formData({ email: "ada@example.com", password: "wrongpass1" }));

    const { data } = dbMock.user.update.mock.calls[0][0];
    expect(data.failedLoginAttempts).toBe(10);
    expect(data.lockedUntil).toBeInstanceOf(Date);
    expect(data.lockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it("refuses a locked account even when the password is correct", async () => {
    const lockedUntil = new Date(Date.now() + 10 * 60_000);
    dbMock.user.findUnique.mockResolvedValue(user({ lockedUntil }));
    const result = await loginAction(null, formData({ email: "ada@example.com", password: "password123" }));

    expect(result).toEqual({ error: expect.stringContaining("Too many failed sign-in attempts") });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("clears the counter after a successful sign-in", async () => {
    dbMock.user.findUnique.mockResolvedValue(user({ failedLoginAttempts: 3, passwordHash: HASH }));
    dbMock.user.update.mockResolvedValue({});
    // bcrypt.compare against the known hash fails, so drive the success path with
    // a hash of the actual password instead.
    const bcrypt = (await import("bcryptjs")).default;
    dbMock.user.findUnique.mockResolvedValue(
      user({ failedLoginAttempts: 3, passwordHash: await bcrypt.hash("password123", 10) })
    );
    await loginAction(null, formData({ email: "ada@example.com", password: "password123" }));

    expect(dbMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { failedLoginAttempts: 0, lockedUntil: null } })
    );
    expect(createSessionMock).toHaveBeenCalled();
  });
});
