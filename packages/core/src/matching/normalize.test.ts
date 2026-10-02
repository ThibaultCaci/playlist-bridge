import { describe, expect, it } from "vitest";
import { normalizeText } from "./normalize";

describe("normalizeText", () => {
  it("converts text to lowercase", () => {
    expect(normalizeText("Get Lucky")).toBe("get lucky");
  });

  it("removes accents", () => {
    expect(normalizeText("Été 90")).toBe("ete 90");
  });

  it("normalizes punctuation", () => {
    expect(normalizeText("AC/DC")).toBe("ac dc");
  });

  it("normalizes whitespace", () => {
    expect(normalizeText("  One   More Time  ")).toBe(
      "one more time"
    );
  });
});