import type {
  MatchResult,
  Track,
} from "../../../../../packages/core/src";

import "./ConversionModal.css";

type ConversionStatus =
  | "idle"
  | "running"
  | "complete";

type ConversionView =
  | "summary"
  | "review"
  | "success";

interface ConversionResult {
  sourceTrack: Track;
  match: MatchResult;
}

interface ConversionModalProps {
  isOpen: boolean;

  playlistName: string;

  trackCount: number;

  conversionStatus: ConversionStatus;

  conversionView: ConversionView;

  conversionResults: ConversionResult[];

  currentTrack: Track | null;

  processedCount: number;

  progress: number;

  matchedCount: number;

  uncertainCount: number;

  unmatchedCount: number;

  createdTrackCount: number;

  isAuthorizingAppleMusic: boolean;

  appleMusicAuthorizationError: string | null;

  onClose: () => void;

  onViewChange: (
    view: ConversionView
  ) => void;

  onContinueToAppleMusic: () =>
    void | Promise<void>;
}

function ConversionModal({
  isOpen,
  playlistName,
  trackCount,
  conversionStatus,
  conversionView,
  conversionResults,
  currentTrack,
  processedCount,
  progress,
  matchedCount,
  uncertainCount,
  unmatchedCount,
  createdTrackCount,
  isAuthorizingAppleMusic,
  appleMusicAuthorizationError,
  onClose,
  onViewChange,
  onContinueToAppleMusic,
}: ConversionModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="conversion-overlay"
      role="presentation"
    >
      <section
        className={`conversion-modal ${
          conversionView === "review"
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
              Spotify → Apple Music
            </span>

            <h2 id="conversion-title">
              {conversionView === "review"
                ? "Review conversion"
                : conversionView === "success"
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
            onClick={onClose}
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
                Playlist created in
                Apple Music
              </span>
            </div>

            <div className="conversion-playlist">
              <strong>
                {playlistName}
              </strong>

              <span>
                {createdTrackCount}{" "}
                tracks transferred
              </span>
            </div>

            <div className="conversion-stats">
              <div className="conversion-stat">
                <span className="conversion-stat-icon matched">
                  ✓
                </span>

                <strong>
                  {createdTrackCount}
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
                  {uncertainCount}
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
                  {unmatchedCount}
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
                onClick={onClose}
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
                {playlistName}
              </strong>

              <span>
                {trackCount} tracks
              </span>
            </div>

            <div className="conversion-progress-row">
              <span>
                {processedCount} /{" "}
                {trackCount}
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
                    Searching Apple
                    Music
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
                  {matchedCount} /{" "}
                  {trackCount}
                </strong>

                <span>
                  tracks matched
                </span>
              </div>
            )}

            <div className="conversion-stats">
              <div className="conversion-stat">
                <span className="conversion-stat-icon matched">
                  ✓
                </span>

                <strong>
                  {matchedCount}
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
                  {uncertainCount}
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
                  {unmatchedCount}
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
                  onClick={onClose}
                >
                  Close
                </button>

                <button
                  className="spotify-button"
                  type="button"
                  onClick={() =>
                    onViewChange(
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
                {matchedCount} matched
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
                              Apple Music
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
                              Apple Music
                            </span>

                            <p>
                              No reliable
                              match found
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
                  onViewChange(
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
                  void onContinueToAppleMusic()
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
  );
}

export default ConversionModal;