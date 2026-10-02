import { useState } from "react";
import "./App.css";

import {
  createSpotifyAuthorizationUrl,
  generateCodeChallenge,
  generateCodeVerifier,
} from "../../../packages/spotify/src";

const spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const spotifyRedirectUri =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

function App() {
  const [isConnecting, setIsConnecting] = useState(false);

  async function connectToSpotify() {
    if (!spotifyClientId || !spotifyRedirectUri) {
      console.error(
        "Missing Spotify environment configuration."
      );
      return;
    }

    setIsConnecting(true);

    try {
      const codeVerifier = generateCodeVerifier();
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

      window.location.assign(authorizationUrl);
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

      <button
        type="button"
        onClick={connectToSpotify}
        disabled={isConnecting}
      >
        {isConnecting
          ? "Connecting..."
          : "Connect with Spotify"}
      </button>
    </main>
  );
}

export default App;