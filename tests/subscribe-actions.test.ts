import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock, redirectMock, getSessionMock, createSessionMock, stripeMock, revalidatePathMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  dbMock: { user: { findUnique: vi.fn(), update: vi.fn() } },
  redirectMock: vi.fn(),
  getSessionMock: vi.fn(),
  createSessionMock: vi.fn(),
  stripeMock: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
  },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  createSession: createSessionMock,
}));
vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
  PRICE_MONTHLY: "price_monthly",
  PRICE_ANNUAL: "price_annual",
}));

import { createCheckoutSession, simulatePayment, manageSubscriptionPortal } from "@/lib/subscribe-actions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("simulatePayment", () => {
  it("does nothing when there's no session", async () => {
    getSessionMock.mockResolvedValue(null);
    await simulatePayment();
    expect(dbMock.user.update).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("upgrades the user to PAID, refreshes the session, and redirects to a mock success page", async () => {
    getSessionMock.mockResolvedValue({ userId: "user-1", email: "a@example.com", role: "UNPAID" });
    await simulatePayment();

    expect(dbMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { role: "PAID", subStatus: "active" },
    });
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", role: "PAID" })
    );
    expect(redirectMock).toHaveBeenCalledWith("/subscribe/success?mock=1");
  });
});

describe("createCheckoutSession", () => {
  it("creates a Stripe customer for first-time subscribers and checks out with the monthly price", async () => {
    getSessionMock.mockResolvedValue({ userId: "user-1" });
    dbMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@example.com",
      name: "Ada",
      stripeCustomerId: null,
    });
    stripeMock.customers.create.mockResolvedValue({ id: "cus_123" });
    stripeMock.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    await createCheckoutSession("monthly");

    expect(stripeMock.customers.create).toHaveBeenCalledWith({ email: "a@example.com", name: "Ada" });
    expect(dbMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_123" },
    });
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123",
        line_items: [{ price: "price_monthly", quantity: 1 }],
      })
    );
    expect(redirectMock).toHaveBeenCalledWith("https://checkout.stripe.com/session");
  });

  it("reuses an existing Stripe customer and checks out with the annual price", async () => {
    getSessionMock.mockResolvedValue({ userId: "user-1" });
    dbMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@example.com",
      name: "Ada",
      stripeCustomerId: "cus_existing",
    });
    stripeMock.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    await createCheckoutSession("annual");

    expect(stripeMock.customers.create).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing", line_items: [{ price: "price_annual", quantity: 1 }] })
    );
  });
});

describe("manageSubscriptionPortal", () => {
  it("does nothing when the user has no Stripe customer id", async () => {
    getSessionMock.mockResolvedValue({ userId: "user-1" });
    dbMock.user.findUnique.mockResolvedValue({ stripeCustomerId: null });

    await manageSubscriptionPortal();

    expect(stripeMock.billingPortal.sessions.create).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("opens the billing portal for an existing customer", async () => {
    getSessionMock.mockResolvedValue({ userId: "user-1" });
    dbMock.user.findUnique.mockResolvedValue({ stripeCustomerId: "cus_123" });
    stripeMock.billingPortal.sessions.create.mockResolvedValue({ url: "https://billing.stripe.com/portal" });

    await manageSubscriptionPortal();

    expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_123" })
    );
    expect(redirectMock).toHaveBeenCalledWith("https://billing.stripe.com/portal");
  });
});
