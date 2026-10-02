import { SPOTIFY_SCOPES } from "./config";

const SPOTIFY_AUTHORIZE_URL =
  "https://accounts.spotify.com/authorize";

export interface SpotifyAuthorizationOptions {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
}

export function createSpotifyAuthorizationUrl({
  clientId,
  redirectUri,
  codeChallenge,
}: SpotifyAuthorizationOptions): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  return `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`;
}