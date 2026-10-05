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

interface ConversionResult {
  sourceTrack: Track;
  match: MatchResult;
}

type ConversionStatus =
  | "idle"
  | "running"
  | "complete";

type ConversionView =
  | "summary"
  | "review";

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

  const [
    selectedPlaylist,
    setSelectedPlaylist,
  ] =
    useState<SpotifyPlaylistSummary | null>(
      null
    );

  const [tracks, setTracks] =
    useState<Track[]>([]);

  const [
    isLoadingTracks,
    setIsLoadingTracks,
  ] = useState(false);

  const [
    isConversionModalOpen,
    setIsConversionModalOpen,
  ] = useState(false);

  const [
    conversionStatus,
    setConversionStatus,
  ] =
    useState<ConversionStatus>("idle");

  const [
    conversionView,
    setConversionView,
  ] =
    useState<ConversionView>("summary");

  const [
    conversionResults,
    setConversionResults,
  ] =
    useState<ConversionResult[]>([]);

  const [
    currentTrack,
    setCurrentTrack,
  ] =
    useState<Track | null>(null);

  const [
    processedCount,
    setProcessedCount,
  ] = useState(0);

  const callbackHandled =
    useRef(false);

  useEffect(() => {
    async function handleSpotifyCallback() {
      if (callbackHandled.current) {
        return;
      }

      const params =
        new URLSearchParams(
          window.location.search
        );

      const code =
        params.get("code");

      const error =
        params.get("error");

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
            clientId:
              spotifyClientId,

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
          user.display_name ??
            user.id
        );

        const userPlaylists =
          await spotify.getAllCurrentUserPlaylists();

        console.log(
          `${userPlaylists.length} Spotify playlists loaded`
        );

        setPlaylists(
          userPlaylists
        );

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
          clientId:
            spotifyClientId,

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
    playlist:
      SpotifyPlaylistSummary
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

    setSelectedPlaylist(
      playlist
    );

    setTracks([]);

    setIsLoadingTracks(
      true
    );

    try {
      const spotify =
        new SpotifyClient(
          accessToken
        );

      const items =
        await spotify.getAllPlaylistItems(
          playlist.id
        );

      const mappedTracks =
        items
          .map(
            (
              playlistItem
            ) => {
              const spotifyTrack =
                playlistItem.item ??
                playlistItem.track;

              if (!spotifyTrack) {
                return null;
              }

              return mapSpotifyTrack(
                spotifyTrack
              );
            }
          )
          .filter(
            (
              track
            ): track is Track =>
              track !== null
          );

      setTracks(
        mappedTracks
      );

      console.log(
        `${mappedTracks.length} tracks mapped from "${playlist.name}"`
      );
    } catch (error) {
      console.error(
        "Failed to load Spotify playlist:",
        error
      );
    } finally {
      setIsLoadingTracks(
        false
      );
    }
  }

  async function startConversionAnalysis() {
    if (
      tracks.length === 0 ||
      !selectedPlaylist
    ) {
      return;
    }

    setIsConversionModalOpen(
      true
    );

    setConversionView(
      "summary"
    );

    setConversionStatus(
      "running"
    );

    setConversionResults(
      []
    );

    setProcessedCount(
      0
    );

    setCurrentTrack(
      null
    );

    const appleMusic =
      new AppleMusicClient();

    const results:
      ConversionResult[] = [];

    for (
      const track of tracks
    ) {
      setCurrentTrack(
        track
      );

      try {
        const candidates =
          await appleMusic.searchTrack(
            track
          );

        const match =
          findBestMatch(
            track,
            candidates
          );

        const result:
          ConversionResult = {
            sourceTrack:
              track,

            match,
          };

        results.push(
          result
        );

        setConversionResults(
          [...results]
        );

        console.log(
          `Match: ${track.title}`,
          match
        );
      } catch (error) {
        console.error(
          `Failed to match "${track.title}":`,
          error
        );

        const failedMatch:
          MatchResult = {
            track: undefined,
            confidence: 0,
            status: "unmatched",
          };

        results.push({
          sourceTrack:
            track,

          match:
            failedMatch,
        });

        setConversionResults(
          [...results]
        );
      }

      setProcessedCount(
        results.length
      );
    }

    setCurrentTrack(
      null
    );

    setConversionStatus(
      "complete"
    );
  }

  function closeConversionModal() {
    if (
      conversionStatus ===
      "running"
    ) {
      return;
    }

    setIsConversionModalOpen(
      false
    );

    setConversionView(
      "summary"
    );
  }

  const matchedCount =
    conversionResults.filter(
      (result) =>
        result.match.status ===
        "matched"
    ).length;

  const uncertainCount =
    conversionResults.filter(
      (result) =>
        result.match.status ===
        "uncertain"
    ).length;

  const unmatchedCount =
    conversionResults.filter(
      (result) =>
        result.match.status ===
        "unmatched"
    ).length;

  const progress =
    tracks.length > 0
      ? Math.round(
          (processedCount /
            tracks.length) *
            100
        )
      : 0;

  return (
    <main className="app">
      <header className="app-header">
        <h1>
          PlaylistBridge
        </h1>

        <p>
          Transfer your playlists
          between Spotify and Apple
          Music.
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
            onClick={
              connectToSpotify
            }
            disabled={
              isConnecting
            }
          >
            {isConnecting
              ? "Connecting..."
              : "Connect with Spotify"}
          </button>
        )}
      </header>

      {isConnected &&
        playlists.length >
          0 && (
          <section className="playlists-section">
            <div className="section-heading">
              <div>
                <h2>
                  Your Spotify
                  playlists
                </h2>

                <p>
                  Choose a playlist
                  to transfer to Apple
                  Music.
                </p>
              </div>

              <span className="playlist-count">
                {
                  playlists.length
                }{" "}
                playlists
              </span>
            </div>

            <div className="playlist-grid">
              {playlists.map(
                (
                  playlist
                ) => {
                  const image =
                    playlist
                      .images?.[0];

                  const trackCount =
                    getPlaylistTrackCount(
                      playlist
                    );

                  return (
                    <article
                      className="playlist-card"
                      key={
                        playlist.id
                      }
                      onClick={() =>
                        void handlePlaylistClick(
                          playlist
                        )
                      }
                    >
                      <div className="playlist-cover">
                        {image ? (
                          <img
                            src={
                              image.url
                            }
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
                          {
                            playlist.name
                          }
                        </h3>

                        <p>
                          {
                            trackCount
                          }{" "}
                          {trackCount ===
                          1
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
            {
              selectedPlaylist.name
            }
          </h2>

          {isLoadingTracks ? (
            <p>
              Loading all
              tracks...
            </p>
          ) : (
            <>
              <p>
                {tracks.length}{" "}
                tracks ready for
                conversion.
              </p>

              {tracks.length >
                0 && (
                <button
                  className="spotify-button"
                  type="button"
                  onClick={() =>
                    void startConversionAnalysis()
                  }
                >
                  Convert to Apple
                  Music
                </button>
              )}
            </>
          )}
        </section>
      )}

      {isConversionModalOpen && (
        <div
          className="conversion-overlay"
          role="presentation"
        >
          <section
            className={`conversion-modal ${
              conversionView ===
              "review"
                ? "conversion-modal-review"
                : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="conversion-title"
          >
            <div className="conversion-modal-header">
              <div>
                <span className="conversion-eyebrow">
                  Spotify → Apple
                  Music
                </span>

                <h2 id="conversion-title">
                  {conversionView ===
                  "review"
                    ? "Review conversion"
                    : conversionStatus ===
                        "complete"
                      ? "Conversion analysis complete"
                      : "Converting to Apple Music"}
                </h2>
              </div>

              <button
                className="conversion-close"
                type="button"
                aria-label="Close"
                onClick={
                  closeConversionModal
                }
                disabled={
                  conversionStatus ===
                  "running"
                }
              >
                ×
              </button>
            </div>

            {conversionView ===
            "summary" ? (
              <>
                <div className="conversion-playlist">
                  <strong>
                    {
                      selectedPlaylist?.name
                    }
                  </strong>

                  <span>
                    {
                      tracks.length
                    }{" "}
                    tracks
                  </span>
                </div>

                <div className="conversion-progress-row">
                  <span>
                    {
                      processedCount
                    }{" "}
                    /{" "}
                    {
                      tracks.length
                    }
                  </span>

                  <strong>
                    {progress}%
                  </strong>
                </div>

                <div className="conversion-progress">
                  <div
                    className="conversion-progress-bar"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                {conversionStatus ===
                  "running" &&
                  currentTrack && (
                    <div className="conversion-current">
                      <span>
                        Searching
                        Apple Music
                      </span>

                      <strong>
                        {
                          currentTrack.title
                        }
                      </strong>

                      <p>
                        {currentTrack.artists.join(
                          ", "
                        )}
                      </p>
                    </div>
                  )}

                {conversionStatus ===
                  "complete" && (
                  <div className="conversion-complete">
                    <strong>
                      {
                        matchedCount
                      }{" "}
                      /{" "}
                      {
                        tracks.length
                      }
                    </strong>

                    <span>
                      tracks
                      matched
                    </span>
                  </div>
                )}

                <div className="conversion-stats">
                  <div className="conversion-stat">
                    <span className="conversion-stat-icon matched">
                      ✓
                    </span>

                    <strong>
                      {
                        matchedCount
                      }
                    </strong>

                    <span>
                      Matched
                    </span>
                  </div>

                  <div className="conversion-stat">
                    <span className="conversion-stat-icon uncertain">
                      ?
                    </span>

                    <strong>
                      {
                        uncertainCount
                      }
                    </strong>

                    <span>
                      Uncertain
                    </span>
                  </div>

                  <div className="conversion-stat">
                    <span className="conversion-stat-icon unmatched">
                      ×
                    </span>

                    <strong>
                      {
                        unmatchedCount
                      }
                    </strong>

                    <span>
                      Not found
                    </span>
                  </div>
                </div>

                {conversionStatus ===
                  "complete" && (
                  <div className="conversion-actions">
                    <button
                      className="conversion-secondary-button"
                      type="button"
                      onClick={
                        closeConversionModal
                      }
                    >
                      Close
                    </button>

                    <button
                      className="spotify-button"
                      type="button"
                      onClick={() =>
                        setConversionView(
                          "review"
                        )
                      }
                    >
                      Review results
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="conversion-review">
                <div className="conversion-review-summary">
                  <span>
                    {
                      conversionResults.length
                    }{" "}
                    tracks analysed
                  </span>

                  <strong>
                    {
                      matchedCount
                    }{" "}
                    matched
                  </strong>
                </div>

                <div className="conversion-review-list">
                  {conversionResults.map(
                    (
                      {
                        sourceTrack,
                        match,
                      },
                      index
                    ) => {
                      const isMatched =
                        match.status ===
                        "matched";

                      const isUncertain =
                        match.status ===
                        "uncertain";

                      const statusLabel =
                        isMatched
                          ? "Matched"
                          : isUncertain
                            ? "Check"
                            : "Not found";

                      const statusSymbol =
                        isMatched
                          ? "✓"
                          : isUncertain
                            ? "?"
                            : "×";

                      return (
                        <article
                          className={`conversion-review-item ${match.status}`}
                          key={`${sourceTrack.id}-${index}`}
                        >
                          <div
                            className={`conversion-review-status ${match.status}`}
                          >
                            {
                              statusSymbol
                            }
                          </div>

                          <div className="conversion-review-track">
                            <strong>
                              {
                                sourceTrack.title
                              }
                            </strong>

                            <span>
                              {sourceTrack.artists.join(
                                ", "
                              )}
                            </span>

                            {match.track ? (
                              <div className="conversion-review-match">
                                <span>
                                  Apple
                                  Music
                                </span>

                                <p>
                                  {
                                    match
                                      .track
                                      .title
                                  }
                                  {" — "}
                                  {match.track.artists.join(
                                    ", "
                                  )}
                                </p>
                              </div>
                            ) : (
                              <div className="conversion-review-match">
                                <span>
                                  Apple
                                  Music
                                </span>

                                <p>
                                  No
                                  reliable
                                  match
                                  found
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="conversion-review-score">
                            <strong>
                              {Math.round(
                                match.confidence *
                                  100
                              )}
                              %
                            </strong>

                            <span>
                              {
                                statusLabel
                              }
                            </span>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>

                <div className="conversion-actions">
                  <button
                    className="conversion-secondary-button"
                    type="button"
                    onClick={() =>
                      setConversionView(
                        "summary"
                      )
                    }
                  >
                    Back
                  </button>

                  <button
                    className="spotify-button"
                    type="button"
                    onClick={() => {
                      console.log(
                        "Ready for Apple Music creation:",
                        conversionResults
                      );
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default App;