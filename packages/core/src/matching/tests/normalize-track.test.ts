import { describe, expect, it } from "vitest";
import { normalizeTrackTitle } from "../normalize-track";

describe("normalizeTrackTitle", () => {
  it("normalizes a standard title", () => {
    expect(normalizeTrackTitle("Get Lucky")).toBe("get lucky");
  });

  it("removes remaster information", () => {
    expect(
      normalizeTrackTitle("One More Time (Remastered 2025)")
    ).toBe("one more time");
  });

  it("removes radio edit information", () => {
    expect(
      normalizeTrackTitle("Midnight City - Radio Edit")
    ).toBe("midnight city");
  });

  it("removes deluxe information", () => {
    expect(
      normalizeTrackTitle("Instant Crush (Deluxe Edition)")
    ).toBe("instant crush");
  });

  it("handles accents and version information together", () => {
    expect(
      normalizeTrackTitle("Été 90 - Remastered 2024")
    ).toBe("ete 90");
  });
});