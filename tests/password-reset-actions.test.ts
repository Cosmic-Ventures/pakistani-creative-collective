import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, redirectMock, sendResetMock } = vi.hoisted(() => ({
  dbMock: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  redirectMock: vi.fn(),
  // Called with .catch(), so it has to return a real promise. Typed (rather
  // than given placeholder parameters) so the assertions below can read the
  // arguments back off `mock.calls` without tripping no-unused-vars.
  sendResetMock: vi.fn<(firstName: string, email: string, resetUrl: string) => Promise<void>>(
    () => Promise.resolve()
  ),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: sendResetMock,
  appUrl: () => "https://pcc.example",
  PASSWORD_RESET_EXPIRY_HOURS: 1,
}));

import { requestPasswordResetAction, resetPasswordAction } from "@/lib/password-reset-actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const USER = { id: "user-1", email: "sara@example.com", name: "Sara Khan" };

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.passwordResetToken.count.mockResolvedValue(0);
  dbMock.$transaction.mockResolvedValue([]);
});

describe("requestPasswordResetAction", () => {
  it("emails a link when the account exists", async () => {
    dbMock.user.findUnique.mockResolvedValue(USER);

    const result = await requestPasswordResetAction(null, formData({ email: USER.email }));

    expect(result).toEqual({ sent: true });
    expect(sendResetMock).toHaveBeenCalledWith(
      "Sara",
      USER.email,
      expect.stringContaining("https://pcc.example/auth/reset?token=")
    );
  });

  it("says exactly the same thing for an address with no account", async () => {
    dbMock.user.findUnique.mockResolvedValue(null);

    const result = await requestPasswordResetAction(null, formData({ email: "nobody@example.com" }));

    // Anything else would turn the form into a way to find out who has an
    // account — the same reasoning as the generic sign-in error.
    expect(result).toEqual({ sent: true });
    expect(sendResetMock).not.toHaveBeenCalled();
    expect(dbMock.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("stores a hash of the token, never the token itself", async () => {
    dbMock.user.findUnique.mockResolvedValue(USER);

    await requestPasswordResetAction(null, formData({ email: USER.email }));

    const stored = dbMock.passwordResetToken.create.mock.calls[0][0].data.tokenHash;
    const emailedUrl = sendResetMock.mock.calls[0][2];
    const rawToken = emailedUrl.split("token=")[1];

    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(stored).not.toBe(rawToken);
  });

  it("invalidates any earlier outstanding link", async () => {
    dbMock.user.findUnique.mockResolvedValue(USER);

    await requestPasswordResetAction(null, formData({ email: USER.email }));

    expect(dbMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: USER.id, usedAt: null },
    });
  });

  it("stops sending once the hourly cap is hit, still without saying so", async () => {
    dbMock.user.findUnique.mockResolvedValue(USER);
    dbMock.passwordResetToken.count.mockResolvedValue(5);

    const result = await requestPasswordResetAction(null, formData({ email: USER.email }));

    expect(result).toEqual({ sent: true });
    expect(sendResetMock).not.toHaveBeenCalled();
  });

  it("rejects a malformed address", async () => {
    const result = await requestPasswordResetAction(null, formData({ email: "not-an-email" }));
    expect(result).toEqual({ error: expect.stringContaining("valid email") });
  });
});

describe("resetPasswordAction", () => {
  const validRecord = {
    id: "token-1",
    userId: USER.id,
    usedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
  };

  it("rejects a password that wouldn't be accepted at sign-up", async () => {
    const result = await resetPasswordAction(
      null,
      formData({ token: "abc", password: "short", confirm: "short" })
    );
    expect(result).toEqual({ error: expect.stringContaining("8 characters") });
    expect(dbMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects mismatched confirmations", async () => {
    const result = await resetPasswordAction(
      null,
      formData({ token: "abc", password: "password123", confirm: "password124" })
    );
    expect(result).toEqual({ error: expect.stringContaining("don't match") });
  });

  it("rejects an unknown token", async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue(null);
    const result = await resetPasswordAction(
      null,
      formData({ token: "abc", password: "password123", confirm: "password123" })
    );
    expect(result).toEqual({ error: expect.stringContaining("expired") });
  });

  it("rejects an expired token", async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue({
      ...validRecord,
      expiresAt: new Date(Date.now() - 60_000),
    });
    const result = await resetPasswordAction(
      null,
      formData({ token: "abc", password: "password123", confirm: "password123" })
    );
    expect(result).toEqual({ error: expect.stringContaining("expired") });
  });

  it("rejects a token that has already been used", async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue({ ...validRecord, usedAt: new Date() });
    const result = await resetPasswordAction(
      null,
      formData({ token: "abc", password: "password123", confirm: "password123" })
    );
    expect(result).toEqual({ error: expect.stringContaining("already been used") });
  });

  it("sets the new password, clears any lockout, and spends the token", async () => {
    dbMock.passwordResetToken.findUnique.mockResolvedValue(validRecord);

    await resetPasswordAction(
      null,
      formData({ token: "abc", password: "password123", confirm: "password123" })
    );

    expect(dbMock.user.update).toHaveBeenCalledWith({
      where: { id: USER.id },
      data: {
        passwordHash: expect.stringMatching(/^\$2[aby]\$/),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    expect(dbMock.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: validRecord.id },
      data: { usedAt: expect.any(Date) },
    });
    expect(dbMock.$transaction).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/auth/signin?reset=1");
  });
});
