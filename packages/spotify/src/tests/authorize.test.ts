import { describe, expect, it } from "vitest";
import {
  createSpotifyAuthorizationUrl,
} from "../auth/authorize";

describe("createSpotifyAuthorizationUrl", () => {
  const clientId = "test-client-id";

  const redirectUri =
    "http://127.0.0.1:5173/callback";

  const codeChallenge =
    "test-code-challenge";

  it("creates a Spotify authorization URL", () => {
    const result = createSpotifyAuthorizationUrl({
      clientId,
      redirectUri,
      codeChallenge,
    });

    const url = new URL(result);

    expect(url.origin).toBe(
      "https://accounts.spotify.com"
    );

    expect(url.pathname).toBe("/authorize");
  });

  it("includes the client ID", () => {
    const result = createSpotifyAuthorizationUrl({
      clientId,
      redirectUri,
      codeChallenge,
    });

    const url = new URL(result);

    expect(url.searchParams.get("client_id")).toBe(
      clientId
    );
  });

  it("uses the authorization code flow", () => {
    const result = createSpotifyAuthorizationUrl({
      clientId,
      redirectUri,
      codeChallenge,
    });

    const url = new URL(result);

    expect(url.searchParams.get("response_type")).toBe(
      "code"
    );
  });

  it("includes the redirect URI", () => {
    const result = createSpotifyAuthorizationUrl({
      clientId,
      redirectUri,
      codeChallenge,
    });

    const url = new URL(result);

    expect(url.searchParams.get("redirect_uri")).toBe(
      redirectUri
    );
  });

  it("uses the S256 PKCE challenge", () => {
    const result = createSpotifyAuthorizationUrl({
      clientId,
      redirectUri,
      codeChallenge,
    });

    const url = new URL(result);

    expect(
      url.searchParams.get("code_challenge_method")
    ).toBe("S256");

    expect(
      url.searchParams.get("code_challenge")
    ).toBe(codeChallenge);
  });

  it("includes the required playlist scopes", () => {
    const result = createSpotifyAuthorizationUrl({
      clientId,
      redirectUri,
      codeChallenge,
    });

    const url = new URL(result);

    const scopes =
      url.searchParams.get("scope")?.split(" ") ?? [];

    expect(scopes).toContain(
      "playlist-read-private"
    );

    expect(scopes).toContain(
      "playlist-read-collaborative"
    );

    expect(scopes).toContain(
      "playlist-modify-private"
    );

    expect(scopes).toContain(
      "playlist-modify-public"
    );
  });
});