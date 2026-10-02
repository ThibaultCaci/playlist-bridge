import { useEffect, useRef, useState } from "react";
import "./App.css";

import {
  createSpotifyAuthorizationUrl,
  exchangeSpotifyCode,
  generateCodeChallenge,
  generateCodeVerifier,
} from "../../../packages/spotify/src";

const spotifyClientId =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const spotifyRedirectUri =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

function App() {
  const [isConnecting, setIsConnecting] =
    useState(false);

  const [isConnected, setIsConnected] =
    useState(false);

  const callbackHandled = useRef(false);

  useEffect(() => {
    async function handleSpotifyCallback() {
      if (callbackHandled.current) {
        return;
      }

      const params = new URLSearchParams(
        window.location.search
      );

      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        console.error(
          "Spotify authorization failed:",
          error
        );
        return;
      }

      if (!code) {
        return;
      }

      callbackHandled.current = true;

      const codeVerifier = sessionStorage.getItem(
        "spotify_code_verifier"
      );

      if (!codeVerifier) {
        console.error(
          "Missing Spotify PKCE code verifier."
        );
        return;
      }

      if (!spotifyClientId || !spotifyRedirectUri) {
        console.error(
          "Missing Spotify environment configuration."
        );
        return;
      }

      try {
        const token = await exchangeSpotifyCode({
          clientId: spotifyClientId,
          code,
          redirectUri: spotifyRedirectUri,
          codeVerifier,
        });

        sessionStorage.removeItem(
          "spotify_code_verifier"
        );

        sessionStorage.setItem(
          "spotify_access_token",
          token.access_token
        );

        setIsConnected(true);

        console.log(
          "Spotify authentication successful."
        );

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (error) {
        console.error(
          "Spotify token exchange failed:",
          error
        );
      }
    }

    void handleSpotifyCallback();
  }, []);

  async function connectToSpotify() {
    if (!spotifyClientId || !spotifyRedirectUri) {
      console.error(
        "Missing Spotify environment configuration."
      );
      return;
    }

    setIsConnecting(true);

    try {
      const codeVerifier =
        generateCodeVerifier();

      const codeChallenge =
        await generateCodeChallenge(codeVerifier);

      sessionStorage.setItem(
        "spotify_code_verifier",
        codeVerifier
      );

      const authorizationUrl =
        createSpotifyAuthorizationUrl({
          clientId: spotifyClientId,
          redirectUri: spotifyRedirectUri,
          codeChallenge,
        });

      window.location.assign(
        authorizationUrl
      );
    } catch (error) {
      console.error(
        "Failed to start Spotify authentication:",
        error
      );

      setIsConnecting(false);
    }
  }

  return (
    <main>
      <h1>PlaylistBridge</h1>

      <p>
        Transfer your playlists between Spotify and
        Apple Music.
      </p>

      {isConnected ? (
        <p>Connected to Spotify ✓</p>
      ) : (
        <button
          type="button"
          onClick={connectToSpotify}
          disabled={isConnecting}
        >
          {isConnecting
            ? "Connecting..."
            : "Connect with Spotify"}
        </button>
      )}
    </main>
  );
}

export default App;