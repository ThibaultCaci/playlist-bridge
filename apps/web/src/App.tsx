import "./App.css";

import SpotifyLibrary from "./components/SpotifyLibrary/SpotifyLibrary";
import PlaylistDetails from "./components/PlaylistDetails/PlaylistDetails";
import ConversionModal from "./components/ConversionModal/ConversionModal";

import {
  usePlaylistConversion,
} from "./hooks/usePlaylistConversion";

import {
  useSpotifyAuth,
} from "./hooks/useSpotifyAuth";

import {
  useSpotifyPlaylist,
} from "./hooks/useSpotifyPlaylist";

function App() {
  const {
    isConnecting,
    isConnected,
    playlists,
    spotifyUserId,
    connectToSpotify,
  } = useSpotifyAuth();

  const {
    selectedPlaylist,
    tracks,
    isLoadingTracks,
    selectPlaylist,
    clearSelectedPlaylist,
  } = useSpotifyPlaylist();

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

    acceptUncertainMatch,
    ignoreUncertainMatch,
    resetUncertainMatch,
  } = usePlaylistConversion({
    tracks,
    selectedPlaylist,
  });

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
              selectPlaylist
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
            clearSelectedPlaylist
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
        onAcceptUncertainMatch={
          acceptUncertainMatch
        }
        onIgnoreUncertainMatch={
          ignoreUncertainMatch
        }
        onResetUncertainMatch={
          resetUncertainMatch
        }
      />
    </main>
  );
}

export default App;