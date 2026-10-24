import { describe, it, expect, vi } from "vitest";

// Separate file because it needs @/lib/stripe mocked as *configured*; the main
// subscribe-actions tests cover the unconfigured (demo) path.
const { dbMock, getSessionMock } = vi.hoisted(() => ({
  dbMock: { user: { findUnique: vi.fn(), update: vi.fn() } },
  getSessionMock: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: getSessionMock, createSession: vi.fn() }));
vi.mock("@/lib/stripe", () => ({
  stripe: {},
  PRICE_MONTHLY: "price_monthly",
  PRICE_ANNUAL: "price_annual",
  isStripeConfigured: true,
}));

import { simulatePayment } from "@/lib/subscribe-actions";

describe("simulatePayment once Stripe is live", () => {
  it("refuses to grant a free membership", async () => {
    getSessionMock.mockResolvedValue({ userId: "user-1", email: "a@example.com", role: "UNPAID" });
    await simulatePayment();
    expect(dbMock.user.update).not.toHaveBeenCalled();
  });
});
