import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { constructEventMock, dbMock } = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  dbMock: { user: { updateMany: vi.fn() } },
}));
vi.mock("@/lib/stripe", () => ({ stripe: { webhooks: { constructEvent: constructEventMock } } }));
vi.mock("@/lib/db", () => ({ db: dbMock }));

import { POST } from "@/app/api/webhooks/stripe/route";

function fakeRequest(body: string, sig: string | null = "test-sig"): NextRequest {
  return {
    text: async () => body,
    headers: { get: (name: string) => (name === "stripe-signature" ? sig : null) },
  } as unknown as NextRequest;
}

function subscriptionEvent(
  type: "customer.subscription.created" | "customer.subscription.updated" | "customer.subscription.deleted",
  overrides: Partial<{ status: string; customer: string; id: string; noItems: boolean; currentPeriodEnd: number }> = {}
) {
  const {
    status = "active",
    customer = "cus_123",
    id = "sub_123",
    noItems = false,
    currentPeriodEnd = 1893456000,
  } = overrides;
  return {
    type,
    data: {
      object: {
        id,
        customer,
        status,
        items: {
          data: noItems ? [] : [{ current_period_end: currentPeriodEnd }],
        },
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.user.updateMany.mockResolvedValue({ count: 1 });
});

describe("Stripe webhook signature verification", () => {
  it("returns 400 and touches nothing when the signature is invalid", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const res = await POST(fakeRequest("{}"));

    expect(res.status).toBe(400);
    expect(dbMock.user.updateMany).not.toHaveBeenCalled();
  });
});

describe("customer.subscription.created / updated", () => {
  it("marks the user PAID with the period end pulled from the subscription item", async () => {
    constructEventMock.mockReturnValue(
      subscriptionEvent("customer.subscription.created", { currentPeriodEnd: 1893456000 })
    );

    await POST(fakeRequest("{}"));

    expect(dbMock.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
      data: {
        role: "PAID",
        stripeSubId: "sub_123",
        subStatus: "active",
        subCurrentPeriodEnd: new Date(1893456000 * 1000),
      },
    });
  });

  it("treats trialing as active", async () => {
    constructEventMock.mockReturnValue(
      subscriptionEvent("customer.subscription.updated", { status: "trialing" })
    );

    await POST(fakeRequest("{}"));

    expect(dbMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "PAID" }) })
    );
  });

  it("marks the user UNPAID when the subscription is past_due", async () => {
    constructEventMock.mockReturnValue(
      subscriptionEvent("customer.subscription.updated", { status: "past_due" })
    );

    await POST(fakeRequest("{}"));

    expect(dbMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "UNPAID", subStatus: "past_due" }) })
    );
  });

  it("falls back to null instead of an Invalid Date when the subscription has no items", async () => {
    constructEventMock.mockReturnValue(
      subscriptionEvent("customer.subscription.created", { noItems: true })
    );

    await POST(fakeRequest("{}"));

    expect(dbMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ subCurrentPeriodEnd: null }) })
    );
  });
});

describe("customer.subscription.deleted", () => {
  it("marks the user UNPAID and canceled", async () => {
    constructEventMock.mockReturnValue(subscriptionEvent("customer.subscription.deleted"));

    await POST(fakeRequest("{}"));

    expect(dbMock.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_123" },
      data: { role: "UNPAID", subStatus: "canceled" },
    });
  });
});
