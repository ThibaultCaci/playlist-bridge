import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";

import SpotifyLibrary from "./components/SpotifyLibrary/SpotifyLibrary";
import PlaylistDetails from "./components/PlaylistDetails/PlaylistDetails";
import ConversionModal from "./components/ConversionModal/ConversionModal";

import {
  usePlaylistConversion,
} from "./hooks/usePlaylistConversion";

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

import type {
  Track,
} from "../../../packages/core/src";

const spotifyClientId =
  import.meta.env
    .VITE_SPOTIFY_CLIENT_ID;

const spotifyRedirectUri =
  import.meta.env
    .VITE_SPOTIFY_REDIRECT_URI;

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
  ] = useState<string | null>(
    null
  );

  const {
    isConversionModalOpen,

    conversionStatus,

    conversionView,
    setConversionView,

    conversionResults,

    currentTrack,

    processedCount,

    isAuthorizingAppleMusic,

    appleMusicAuthorizationError,

    createdTrackCount,

    matchedCount,
    uncertainCount,
    unmatchedCount,
    progress,

    startConversionAnalysis,
    continueToAppleMusic,
    closeConversionModal,
  } = usePlaylistConversion({
    tracks,
    selectedPlaylist,
  });

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

        setSpotifyUserId(
          user.id
        );

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
    setSelectedPlaylist(
      null
    );

    setTracks([]);
  }

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
            playlists={
              playlists
            }
            currentUserId={
              spotifyUserId
            }
            onSelectPlaylist={
              handlePlaylistClick
            }
          />
        )}

      {selectedPlaylist && (
        <PlaylistDetails
          playlist={
            selectedPlaylist
          }
          tracks={
            tracks
          }
          isLoading={
            isLoadingTracks
          }
          onBack={
            handleBackToLibrary
          }
          onTransfer={() =>
            void startConversionAnalysis()
          }
        />
      )}

      <ConversionModal
        isOpen={
          isConversionModalOpen
        }
        playlistName={
          selectedPlaylist?.name ??
          ""
        }
        trackCount={
          tracks.length
        }
        conversionStatus={
          conversionStatus
        }
        conversionView={
          conversionView
        }
        conversionResults={
          conversionResults
        }
        currentTrack={
          currentTrack
        }
        processedCount={
          processedCount
        }
        progress={
          progress
        }
        matchedCount={
          matchedCount
        }
        uncertainCount={
          uncertainCount
        }
        unmatchedCount={
          unmatchedCount
        }
        createdTrackCount={
          createdTrackCount
        }
        isAuthorizingAppleMusic={
          isAuthorizingAppleMusic
        }
        appleMusicAuthorizationError={
          appleMusicAuthorizationError
        }
        onClose={
          closeConversionModal
        }
        onViewChange={
          setConversionView
        }
        onContinueToAppleMusic={
          continueToAppleMusic
        }
      />
    </main>
  );
}

export default App;