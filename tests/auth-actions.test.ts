import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, redirectMock, createSessionMock, deleteSessionMock } = vi.hoisted(() => ({
  dbMock: { user: { findUnique: vi.fn(), create: vi.fn() } },
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
