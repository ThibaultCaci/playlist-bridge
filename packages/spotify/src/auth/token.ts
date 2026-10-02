export interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
  }
  
  export interface ExchangeSpotifyCodeOptions {
    clientId: string;
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }
  
  const SPOTIFY_TOKEN_URL =
    "https://accounts.spotify.com/api/token";
  
  export async function exchangeSpotifyCode({
    clientId,
    code,
    redirectUri,
    codeVerifier,
  }: ExchangeSpotifyCodeOptions): Promise<SpotifyTokenResponse> {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });
  
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  
    if (!response.ok) {
      const errorBody = await response.text();
  
      throw new Error(
        `Spotify token exchange failed (${response.status}): ${errorBody}`
      );
    }
  
    return response.json() as Promise<SpotifyTokenResponse>;
  }