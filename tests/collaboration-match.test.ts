import { describe, expect, it } from "vitest";
import { requesterMeetsPreference } from "@/lib/collaboration-match";
import { EXPERIENCE_LEVELS } from "@/lib/experience-levels";

const [emerging, developing, , , veteran] = EXPERIENCE_LEVELS;

describe("requesterMeetsPreference", () => {
  it("allows anyone when nothing is set or any level is chosen", () => {
    expect(requesterMeetsPreference(null, emerging)).toBe(true);
    expect(requesterMeetsPreference("", emerging)).toBe(true);
    expect(requesterMeetsPreference("Emerging Creative, Any level", veteran)).toBe(true);
  });

  it("allows only the chosen tiers", () => {
    const openTo = "Developing Professional, Established Creative";
    expect(requesterMeetsPreference(openTo, developing)).toBe(true);
    expect(requesterMeetsPreference(openTo, emerging)).toBe(false);
    expect(requesterMeetsPreference(openTo, veteran)).toBe(false);
  });

  it("does not block everyone on text it can't read", () => {
    expect(requesterMeetsPreference("whoever is nice", emerging)).toBe(true);
  });
});
