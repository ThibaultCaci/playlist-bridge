import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";

import SpotifyLibrary from "./components/SpotifyLibrary/SpotifyLibrary";
import PlaylistDetails from "./components/PlaylistDetails/PlaylistDetails";

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

import {
  authorizeAppleMusic,
  createAppleMusicPlaylist,
} from "./musickit";

const spotifyClientId =
  import.meta.env
    .VITE_SPOTIFY_CLIENT_ID;

const spotifyRedirectUri =
  import.meta.env
    .VITE_SPOTIFY_REDIRECT_URI;

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
  | "review"
  | "success";

function App() {
  const [
    isConnecting,
    setIsConnecting,
  ] = useState(false);

  const [
    isConnected,
    setIsConnected,
  ] = useState(false);

  const [
    playlists,
    setPlaylists,
  ] = useState<
    SpotifyPlaylistSummary[]
  >([]);

  const [
    selectedPlaylist,
    setSelectedPlaylist,
  ] =
    useState<SpotifyPlaylistSummary | null>(
      null
    );

  const [
    tracks,
    setTracks,
  ] = useState<Track[]>([]);

  const [
    isLoadingTracks,
    setIsLoadingTracks,
  ] = useState(false);

  const [
    spotifyUserId,
    setSpotifyUserId,
  ] = useState<string | null>(null);

  const [
    isConversionModalOpen,
    setIsConversionModalOpen,
  ] = useState(false);

  const [
    conversionStatus,
    setConversionStatus,
  ] =
    useState<ConversionStatus>(
      "idle"
    );

  const [
    conversionView,
    setConversionView,
  ] =
    useState<ConversionView>(
      "summary"
    );

  const [
    conversionResults,
    setConversionResults,
  ] = useState<
    ConversionResult[]
  >([]);

  const [
    currentTrack,
    setCurrentTrack,
  ] =
    useState<Track | null>(
      null
    );

  const [
    processedCount,
    setProcessedCount,
  ] = useState(0);

  const [
    isAuthorizingAppleMusic,
    setIsAuthorizingAppleMusic,
  ] = useState(false);

  const [
    appleMusicAuthorizationError,
    setAppleMusicAuthorizationError,
  ] =
    useState<string | null>(
      null
    );

  const [
    createdTrackCount,
    setCreatedTrackCount,
  ] = useState(0);

  const callbackHandled =
    useRef(false);

  useEffect(() => {
    async function handleSpotifyCallback() {
      if (
        callbackHandled.current
      ) {
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

      callbackHandled.current =
        true;

      const codeVerifier =
        sessionStorage.getItem(
          "spotify_code_verifier"
        );

      if (
        !codeVerifier
      ) {
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
          await exchangeSpotifyCode(
            {
              clientId:
                spotifyClientId,

              code,

              redirectUri:
                spotifyRedirectUri,

              codeVerifier,
            }
          );

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

        setSpotifyUserId(user.id);

        const userPlaylists =
          await spotify.getAllCurrentUserPlaylists();

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

        setIsConnected(
          true
        );

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

    setIsConnecting(
      true
    );

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
        createSpotifyAuthorizationUrl(
          {
            clientId:
              spotifyClientId,

            redirectUri:
              spotifyRedirectUri,

            codeChallenge,
          }
        );

      window.location.assign(
        authorizationUrl
      );
    } catch (error) {
      console.error(
        "Failed to start Spotify authentication:",
        error
      );

      setIsConnecting(
        false
      );
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

    if (
      !accessToken
    ) {
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

              if (
                !spotifyTrack
              ) {
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

  function handleBackToLibrary() {
    setSelectedPlaylist(null);
    setTracks([]);
  }

  async function startConversionAnalysis() {
    if (
      tracks.length ===
        0 ||
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

    setAppleMusicAuthorizationError(
      null
    );

    setCreatedTrackCount(
      0
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

        results.push({
          sourceTrack:
            track,

          match,
        });

        setConversionResults(
          [...results]
        );
      } catch (error) {
        console.error(
          `Failed to match "${track.title}":`,
          error
        );

        const failedMatch:
          MatchResult = {
            track:
              undefined,
            confidence: 0,
            status:
              "unmatched",
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

  async function continueToAppleMusic() {
    if (
      isAuthorizingAppleMusic ||
      !selectedPlaylist
    ) {
      return;
    }

    setIsAuthorizingAppleMusic(
      true
    );

    setAppleMusicAuthorizationError(
      null
    );

    try {
      const {
        musicUserToken,
      } =
        await authorizeAppleMusic();

      /*
       * Only automatically
       * transfer confident
       * matches.
       *
       * Uncertain and unmatched
       * tracks remain visible in
       * the review screen.
       */
      const appleTrackIds =
        conversionResults
          .filter(
            (
              result
            ) =>
              result.match
                .status ===
                "matched" &&
              result.match
                .track
          )
          .map(
            (
              result
            ) =>
              result.match
                .track!.id
          );

      if (
        appleTrackIds.length ===
        0
      ) {
        throw new Error(
          "No confidently matched tracks are available to transfer."
        );
      }

      const result =
        await createAppleMusicPlaylist(
          musicUserToken,
          selectedPlaylist.name,
          appleTrackIds,
          "Transferred with PlaylistBridge"
        );

      setCreatedTrackCount(
        result.trackCount
      );

      setConversionView(
        "success"
      );

      console.log(
        "Apple Music playlist created successfully:",
        result.playlistId
      );
    } catch (error) {
      console.error(
        "Apple Music playlist creation failed:",
        error
      );

      setAppleMusicAuthorizationError(
        error instanceof Error
          ? error.message
          : "Apple Music playlist creation failed."
      );
    } finally {
      setIsAuthorizingAppleMusic(
        false
      );
    }
  }

  function closeConversionModal() {
    if (
      conversionStatus ===
        "running" ||
      isAuthorizingAppleMusic
    ) {
      return;
    }

    setIsConversionModalOpen(
      false
    );

    setConversionView(
      "summary"
    );

    setAppleMusicAuthorizationError(
      null
    );
  }

  const matchedCount =
    conversionResults.filter(
      (
        result
      ) =>
        result.match
          .status ===
        "matched"
    ).length;

  const uncertainCount =
    conversionResults.filter(
      (
        result
      ) =>
        result.match
          .status ===
        "uncertain"
    ).length;

  const unmatchedCount =
    conversionResults.filter(
      (
        result
      ) =>
        result.match
          .status ===
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
          Transfer your
          playlists between
          Spotify and Apple
          Music.
        </p>

        {isConnected ? (
          <div className="connection-status">
            <span className="status-dot" />

            Connected to
            Spotify
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
        playlists.length > 0 &&
        !selectedPlaylist && (
          <SpotifyLibrary
            playlists={playlists}
            currentUserId={spotifyUserId}
            onSelectPlaylist={
              handlePlaylistClick
            }
          />
        )}

      {selectedPlaylist && (
        <PlaylistDetails
          playlist={selectedPlaylist}
          tracks={tracks}
          isLoading={isLoadingTracks}
          onBack={handleBackToLibrary}
          onTransfer={() =>
            void startConversionAnalysis()
          }
        />
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
                  Spotify →
                  Apple Music
                </span>

                <h2 id="conversion-title">
                  {conversionView ===
                  "review"
                    ? "Review conversion"
                    : conversionView ===
                        "success"
                      ? "Transfer complete"
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
                    "running" ||
                  isAuthorizingAppleMusic
                }
              >
                ×
              </button>
            </div>

            {conversionView ===
            "success" ? (
              <>
                <div className="conversion-complete">
                  <strong>
                    ✓
                  </strong>

                  <span>
                    Playlist
                    created in
                    Apple Music
                  </span>
                </div>

                <div className="conversion-playlist">
                  <strong>
                    {
                      selectedPlaylist?.name
                    }
                  </strong>

                  <span>
                    {
                      createdTrackCount
                    }{" "}
                    tracks
                    transferred
                  </span>
                </div>

                <div className="conversion-stats">
                  <div className="conversion-stat">
                    <span className="conversion-stat-icon matched">
                      ✓
                    </span>

                    <strong>
                      {
                        createdTrackCount
                      }
                    </strong>

                    <span>
                      Transferred
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
                      Skipped
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

                <div className="conversion-actions">
                  <button
                    className="spotify-button"
                    type="button"
                    onClick={
                      closeConversionModal
                    }
                  >
                    Done
                  </button>
                </div>
              </>
            ) : conversionView ===
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
                      Review
                      results
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
                    tracks
                    analysed
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
                                  {
                                    " — "
                                  }
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

                {appleMusicAuthorizationError && (
                  <div
                    style={{
                      marginTop:
                        "16px",

                      padding:
                        "12px 14px",

                      borderRadius:
                        "10px",

                      background:
                        "rgba(248, 113, 113, 0.08)",

                      color:
                        "#f87171",

                      fontSize:
                        "0.85rem",
                    }}
                  >
                    {
                      appleMusicAuthorizationError
                    }
                  </div>
                )}

                <div className="conversion-actions">
                  <button
                    className="conversion-secondary-button"
                    type="button"
                    disabled={
                      isAuthorizingAppleMusic
                    }
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
                    disabled={
                      isAuthorizingAppleMusic
                    }
                    onClick={() =>
                      void continueToAppleMusic()
                    }
                  >
                    {isAuthorizingAppleMusic
                      ? "Creating playlist..."
                      : `Transfer ${matchedCount} tracks`}
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