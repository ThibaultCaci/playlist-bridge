import { useEffect, useRef, useState } from "react";
import "./App.css";

import {
  createSpotifyAuthorizationUrl,
  exchangeSpotifyCode,
  generateCodeChallenge,
  generateCodeVerifier,
  mapSpotifyTrack,
  SpotifyClient,
} from "../../../packages/spotify/src";

import type {
  SpotifyPlaylistSummary,
} from "../../../packages/spotify/src";

import {
  AppleMusicClient,
} from "../../../packages/apple-music/src";

import {
  findBestMatch,
} from "../../../packages/core/src";

import type {
  MatchResult,
  Track,
} from "../../../packages/core/src";

const spotifyClientId =
  import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const spotifyRedirectUri =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

interface AppleMatchTest {
  sourceTrack: Track;
  result: MatchResult;
}

function getPlaylistTrackCount(
  playlist: SpotifyPlaylistSummary
): number {
  const compatiblePlaylist =
    playlist as SpotifyPlaylistSummary & {
      items?: {
        total?: number;
      };
      tracks?: {
        total?: number;
      };
    };

  return (
    compatiblePlaylist.items?.total ??
    compatiblePlaylist.tracks?.total ??
    0
  );
}

function App() {
  const [isConnecting, setIsConnecting] =
    useState(false);

  const [isConnected, setIsConnected] =
    useState(false);

  const [playlists, setPlaylists] =
    useState<SpotifyPlaylistSummary[]>([]);

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylistSummary | null>(null);

  const [tracks, setTracks] =
    useState<Track[]>([]);

  const [isLoadingTracks, setIsLoadingTracks] =
    useState(false);

  const [isTestingApple, setIsTestingApple] =
    useState(false);

  const [appleMatchTest, setAppleMatchTest] =
    useState<AppleMatchTest | null>(null);

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

      const codeVerifier =
        sessionStorage.getItem(
          "spotify_code_verifier"
        );

      if (!codeVerifier) {
        console.error(
          "Missing Spotify PKCE code verifier."
        );
        return;
      }

      if (
        !spotifyClientId ||
        !spotifyRedirectUri
      ) {
        console.error(
          "Missing Spotify environment configuration."
        );
        return;
      }

      try {
        const token =
          await exchangeSpotifyCode({
            clientId: spotifyClientId,
            code,
            redirectUri:
              spotifyRedirectUri,
            codeVerifier,
          });

        const spotify =
          new SpotifyClient(
            token.access_token
          );

        const user =
          await spotify.getCurrentUser();

        console.log(
          "Connected Spotify user:",
          user.display_name ?? user.id
        );

        const userPlaylists =
          await spotify.getAllCurrentUserPlaylists();

        console.log(
          `${userPlaylists.length} Spotify playlists loaded`
        );

        setPlaylists(userPlaylists);

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
    if (
      !spotifyClientId ||
      !spotifyRedirectUri
    ) {
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
          redirectUri:
            spotifyRedirectUri,
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
    const accessToken =
      sessionStorage.getItem(
        "spotify_access_token"
      );

    if (!accessToken) {
      console.error(
        "Missing Spotify access token."
      );
      return;
    }

    setSelectedPlaylist(playlist);
    setTracks([]);
    setAppleMatchTest(null);
    setIsLoadingTracks(true);

    try {
      const spotify =
        new SpotifyClient(accessToken);

      const items =
        await spotify.getAllPlaylistItems(
          playlist.id
        );

      const mappedTracks = items
        .map((playlistItem) => {
          const spotifyTrack =
            playlistItem.item ??
            playlistItem.track;

          if (!spotifyTrack) {
            return null;
          }

          return mapSpotifyTrack(
            spotifyTrack
          );
        })
        .filter(
          (track): track is Track =>
            track !== null
        );

      setTracks(mappedTracks);

      console.log(
        `${mappedTracks.length} tracks mapped from "${playlist.name}"`
      );
    } catch (error) {
      console.error(
        "Failed to load Spotify playlist:",
        error
      );
    } finally {
      setIsLoadingTracks(false);
    }
  }

  async function testFirstTrackOnAppleMusic() {
    const sourceTrack = tracks[0];

    if (!sourceTrack) {
      return;
    }

    setIsTestingApple(true);
    setAppleMatchTest(null);

    try {
      const appleMusic =
        new AppleMusicClient();

      const candidates =
        await appleMusic.searchTrack(
          sourceTrack
        );

      console.log(
        "Spotify source track:",
        sourceTrack
      );

      console.log(
        "Apple Music candidates:",
        candidates
      );

      const result =
        findBestMatch(
          sourceTrack,
          candidates
        );

      console.log(
        "PlaylistBridge match:",
        result
      );

      setAppleMatchTest({
        sourceTrack,
        result,
      });
    } catch (error) {
      console.error(
        "Apple Music matching test failed:",
        error
      );
    } finally {
      setIsTestingApple(false);
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>PlaylistBridge</h1>

        <p>
          Transfer your playlists between
          Spotify and Apple Music.
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

      {isConnected &&
        playlists.length > 0 && (
          <section className="playlists-section">
            <div className="section-heading">
              <div>
                <h2>
                  Your Spotify playlists
                </h2>

                <p>
                  Choose a playlist to
                  transfer to Apple Music.
                </p>
              </div>

              <span className="playlist-count">
                {playlists.length} playlists
              </span>
            </div>

            <div className="playlist-grid">
              {playlists.map(
                (playlist) => {
                  const image =
                    playlist.images?.[0];

                  const trackCount =
                    getPlaylistTrackCount(
                      playlist
                    );

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
                        <h3
                          title={
                            playlist.name
                          }
                        >
                          {playlist.name}
                        </h3>

                        <p>
                          {trackCount}{" "}
                          {trackCount === 1
                            ? "track"
                            : "tracks"}
                        </p>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          </section>
        )}

      {selectedPlaylist && (
        <section className="selected-playlist">
          <h2>
            {selectedPlaylist.name}
          </h2>

          {isLoadingTracks ? (
            <p>
              Loading all tracks...
            </p>
          ) : (
            <>
              <p>
                {tracks.length} tracks ready
                for conversion.
              </p>

              {tracks.length > 0 && (
                <button
                  className="spotify-button"
                  type="button"
                  onClick={() =>
                    void testFirstTrackOnAppleMusic()
                  }
                  disabled={
                    isTestingApple
                  }
                >
                  {isTestingApple
                    ? "Searching Apple Music..."
                    : "Test first track on Apple Music"}
                </button>
              )}

              {appleMatchTest && (
                <div>
                  <h3>
                    First real Apple Music match
                  </h3>

                  <p>
                    Spotify:{" "}
                    <strong>
                      {
                        appleMatchTest
                          .sourceTrack.title
                      }
                    </strong>{" "}
                    —{" "}
                    {appleMatchTest.sourceTrack.artists.join(
                      ", "
                    )}
                  </p>

                  <p>
                    Status:{" "}
                    <strong>
                      {
                        appleMatchTest
                          .result.status
                      }
                    </strong>
                  </p>

                  <p>
                    Score:{" "}
                    <strong>
                      {Math.round(
                        appleMatchTest
                          .result.confidence *
                          100
                      )}
                      %
                    </strong>
                  </p>

                  {appleMatchTest.result
                    .track && (
                    <p>
                      Apple Music:{" "}
                      <strong>
                        {
                          appleMatchTest
                            .result.track
                            .title
                        }
                      </strong>{" "}
                      —{" "}
                      {appleMatchTest.result.track.artists.join(
                        ", "
                      )}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}

export default App;