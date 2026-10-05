import { useEffect, useRef, useState } from "react";
import "./App.css";

import {
  createSpotifyAuthorizationUrl,
  exchangeSpotifyCode,
  generateCodeChallenge,
  generateCodeVerifier,
  SpotifyClient,
} from "../../../packages/spotify/src";

import type {
  SpotifyPlaylistSummary,
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

  const [playlists, setPlaylists] =
    useState<SpotifyPlaylistSummary[]>([]);

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

        const spotify = new SpotifyClient(
          token.access_token
        );

        const user =
          await spotify.getCurrentUser();

        console.log(
          "Connected Spotify user:",
          user.display_name ?? user.id
        );

        const playlistResponse =
          await spotify.getCurrentUserPlaylists();

        setPlaylists(playlistResponse.items);

        sessionStorage.removeItem(
          "spotify_code_verifier"
        );

        sessionStorage.setItem(
          "spotify_access_token",
          token.access_token
        );

        setIsConnected(true);

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (error) {
        console.error(
          "Spotify authentication failed:",
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
        await generateCodeChallenge(
          codeVerifier
        );

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

  async function handlePlaylistClick(
    playlist: SpotifyPlaylistSummary
  ) {
    const accessToken = sessionStorage.getItem(
      "spotify_access_token"
    );

    if (!accessToken) {
      console.error(
        "Missing Spotify access token."
      );
      return;
    }

    try {
      const spotify = new SpotifyClient(
        accessToken
      );

      console.log(
        `Loading playlist: ${playlist.name}`
      );

      const response =
        await spotify.getPlaylistItems(
          playlist.id
        );

      console.log(
        `${response.total} items in "${playlist.name}"`
      );

      console.table(
        response.items
          .filter(
            (item) => item.track !== null
          )
          .map((item) => ({
            title: item.track!.name,
            artist: item.track!.artists
              .map((artist) => artist.name)
              .join(", "),
            album: item.track!.album.name,
            duration:
              Math.round(
                item.track!.duration_ms / 1000
              ) + "s",
          }))
      );
    } catch (error) {
      console.error(
        "Failed to load Spotify playlist:",
        error
      );
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>PlaylistBridge</h1>

        <p>
          Transfer your playlists between Spotify and
          Apple Music.
        </p>

        {isConnected ? (
          <div className="connection-status">
            <span className="status-dot" />
            Connected to Spotify
          </div>
        ) : (
          <button
            className="spotify-button"
            type="button"
            onClick={connectToSpotify}
            disabled={isConnecting}
          >
            {isConnecting
              ? "Connecting..."
              : "Connect with Spotify"}
          </button>
        )}
      </header>

      {isConnected && playlists.length > 0 && (
        <section className="playlists-section">
          <div className="section-heading">
            <div>
              <h2>Your Spotify playlists</h2>

              <p>
                Choose a playlist to transfer to
                Apple Music.
              </p>
            </div>

            <span className="playlist-count">
              {playlists.length} playlists
            </span>
          </div>

          <div className="playlist-grid">
            {playlists.map((playlist) => {
              const image = playlist.images?.[0];

              return (
                <article
                  className="playlist-card"
                  key={playlist.id}
                  onClick={() =>
                    void handlePlaylistClick(
                      playlist
                    )
                  }
                >
                  <div className="playlist-cover">
                    {image ? (
                      <img
                        src={image.url}
                        alt=""
                      />
                    ) : (
                      <div className="playlist-placeholder">
                        ♪
                      </div>
                    )}
                  </div>

                  <div className="playlist-info">
                    <h3 title={playlist.name}>
                      {playlist.name}
                    </h3>

                    <p>
                      {playlist.tracks.total}{" "}
                      {playlist.tracks.total === 1
                        ? "track"
                        : "tracks"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;