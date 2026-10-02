import { describe, expect, it } from "vitest";
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from "../auth/pkce";

describe("Spotify PKCE", () => {
  it("generates a code verifier with the requested length", () => {
    const verifier = generateCodeVerifier(64);

    expect(verifier).toHaveLength(64);
  });

  it("generates different code verifiers", () => {
    const first = generateCodeVerifier();
    const second = generateCodeVerifier();

    expect(first).not.toBe(second);
  });

  it("only uses PKCE-compatible characters", () => {
    const verifier = generateCodeVerifier();

    expect(verifier).toMatch(
      /^[A-Za-z0-9\-._~]+$/
    );
  });

  it("generates a deterministic code challenge", async () => {
    const verifier =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";

    const first =
      await generateCodeChallenge(verifier);

    const second =
      await generateCodeChallenge(verifier);

    expect(first).toBe(second);
  });

  it("generates a base64url code challenge", async () => {
    const verifier = generateCodeVerifier();

    const challenge =
      await generateCodeChallenge(verifier);

    expect(challenge).toMatch(
      /^[A-Za-z0-9_-]+$/
    );

    expect(challenge).not.toContain("=");
  });
});