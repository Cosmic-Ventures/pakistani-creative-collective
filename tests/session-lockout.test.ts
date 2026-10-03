import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, cookiesMock, jwtVerifyMock } = vi.hoisted(() => ({
  dbMock: { user: { findUnique: vi.fn() } },
  cookiesMock: vi.fn(),
  jwtVerifyMock: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("jose", () => ({ jwtVerify: jwtVerifyMock, SignJWT: class {} }));
// react's cache() is identity outside a request scope.
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));

import { getSession } from "@/lib/session";

beforeEach(() => {
  vi.clearAllMocks();
  cookiesMock.mockResolvedValue({ get: () => ({ value: "a.valid.jwt" }) });
  jwtVerifyMock.mockResolvedValue({ payload: { userId: "u1", email: "a@b.co", role: "ADMIN" } });
});

// The lockout: a cookie whose signature verifies but whose account is gone (or
// whose database is briefly unreachable) made the edge think "signed in" while
// every page thought "signed out". proxy.ts bounced the visitor off
// /auth/signin, the header offered "Sign in", clicking it went nowhere, and only
// clearing cookies escaped. getSession has to report signed-out for both of
// these so the auth pages render and the person can sign in again.
describe("getSession with a valid token but no usable account", () => {
  it("reports signed out when the user row is gone", async () => {
    dbMock.user.findUnique.mockResolvedValue(null);
    await expect(getSession()).resolves.toBeNull();
  });

  it("reports signed out, not a crash, when the database is unreachable", async () => {
    dbMock.user.findUnique.mockRejectedValue(new Error("connection lost"));
    await expect(getSession()).resolves.toBeNull();
  });

  it("logs a database failure instead of swallowing it silently", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    dbMock.user.findUnique.mockRejectedValue(new Error("connection lost"));
    await getSession();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("database unreachable"), expect.anything());
    spy.mockRestore();
  });

  it("names the orphaned user id so the report is diagnosable", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    dbMock.user.findUnique.mockResolvedValue(null);
    await getSession();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("u1"));
    spy.mockRestore();
  });

  it("still resolves a healthy session, taking the role from the database", async () => {
    dbMock.user.findUnique.mockResolvedValue({ role: "PAID", name: "Real Name" });
    await expect(getSession()).resolves.toEqual(
      expect.objectContaining({ userId: "u1", role: "PAID", name: "Real Name" })
    );
  });

  it("reports signed out for a bad signature without touching the database", async () => {
    jwtVerifyMock.mockRejectedValue(new Error("bad signature"));
    await expect(getSession()).resolves.toBeNull();
    expect(dbMock.user.findUnique).not.toHaveBeenCalled();
  });
});
