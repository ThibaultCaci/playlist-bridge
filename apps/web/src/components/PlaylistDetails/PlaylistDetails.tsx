import type {
    SpotifyPlaylistSummary,
} from "../../../../../packages/spotify/src";

import type {
    Track,
} from "../../../../../packages/core/src";

import "./PlaylistDetails.css";

interface PlaylistDetailsProps {
  playlist: SpotifyPlaylistSummary;

  tracks: Track[];

  isLoading: boolean;

  onBack: () => void;

  onTransfer: () => void;
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

function formatDuration(
  durationMs?: number
): string {
  if (!durationMs) {
    return "—";
  }

  const totalSeconds =
    Math.floor(
      durationMs / 1000
    );

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function PlaylistDetails({
  playlist,
  tracks,
  isLoading,
  onBack,
  onTransfer,
}: PlaylistDetailsProps) {
  const image =
    playlist.images?.[0];

  const expectedTrackCount =
    getPlaylistTrackCount(
      playlist
    );

  const displayedTrackCount =
    isLoading
      ? expectedTrackCount
      : tracks.length;

  return (
    <section className="playlist-details">
      <button
        className="playlist-details-back"
        type="button"
        onClick={onBack}
      >
        <span aria-hidden="true">
          ←
        </span>

        Back to library
      </button>

      <div className="playlist-details-hero">
        <div className="playlist-details-cover">
          {image ? (
            <img
              src={image.url}
              alt=""
            />
          ) : (
            <div className="playlist-details-placeholder">
              ♪
            </div>
          )}
        </div>

        <div className="playlist-details-meta">
          <span className="playlist-details-eyebrow">
            Spotify playlist
          </span>

          <h2>
            {playlist.name}
          </h2>

          {playlist.description && (
            <p className="playlist-details-description">
              {playlist.description}
            </p>
          )}

          <div className="playlist-details-stats">
            <span>
              {displayedTrackCount}{" "}
              {displayedTrackCount === 1
                ? "track"
                : "tracks"}
            </span>

            {playlist.owner
              .display_name && (
              <>
                <span
                  className="playlist-details-dot"
                  aria-hidden="true"
                >
                  •
                </span>

                <span>
                  {
                    playlist.owner
                      .display_name
                  }
                </span>
              </>
            )}
          </div>

          <button
            className="playlist-details-transfer"
            type="button"
            disabled={
              isLoading ||
              tracks.length === 0
            }
            onClick={
              onTransfer
            }
          >
            {isLoading
              ? "Loading tracks..."
              : "Transfer to Apple Music"}
          </button>
        </div>
      </div>

      <div className="playlist-details-content">
        <div className="playlist-details-table-header">
          <span>
            #
          </span>

          <span>
            Title
          </span>

          <span>
            Album
          </span>

          <span>
            Duration
          </span>
        </div>

        {isLoading ? (
          <div className="playlist-details-loading">
            <div className="playlist-details-spinner" />

            <strong>
              Loading playlist
            </strong>

            <p>
              Fetching all tracks
              from Spotify...
            </p>
          </div>
        ) : tracks.length >
          0 ? (
          <div className="playlist-details-track-list">
            {tracks.map(
              (
                track,
                index
              ) => (
                <article
                  className="playlist-details-track"
                  key={`${track.id}-${index}`}
                >
                  <span className="playlist-details-track-number">
                    {index + 1}
                  </span>

                  <div className="playlist-details-track-main">
                    <strong
                      title={
                        track.title
                      }
                    >
                      {
                        track.title
                      }
                    </strong>

                    <span
                      title={track.artists.join(
                        ", "
                      )}
                    >
                      {track.artists.join(
                        ", "
                      )}
                    </span>
                  </div>

                  <span
                    className="playlist-details-album"
                    title={
                      track.album ??
                      ""
                    }
                  >
                    {track.album ??
                      "—"}
                  </span>

                  <span className="playlist-details-duration">
                    {formatDuration(
                      track.durationMs
                    )}
                  </span>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="playlist-details-empty">
            <span>
              ♫
            </span>

            <strong>
              No tracks found
            </strong>

            <p>
              This playlist does
              not contain any
              available tracks.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default PlaylistDetails;