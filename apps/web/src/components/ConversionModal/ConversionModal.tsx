import {
  useState,
} from "react";

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

type ReviewDecision =
  | "accepted"
  | "ignored";

type ReviewFilter =
  | "all"
  | "review"
  | "ready"
  | "not-found";

interface ConversionResult {
  sourceTrack: Track;
  match: MatchResult;
  reviewDecision?: ReviewDecision;
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
  onContinueToAppleMusic:
    () => void | Promise<void>;
  onAcceptUncertainMatch: (
    sourceTrackId: string
  ) => void;
  onIgnoreUncertainMatch: (
    sourceTrackId: string
  ) => void;
  onResetUncertainMatch: (
    sourceTrackId: string
  ) => void;
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
  onAcceptUncertainMatch,
  onIgnoreUncertainMatch,
  onResetUncertainMatch,
}: ConversionModalProps) {
  const [
    reviewFilter,
    setReviewFilter,
  ] = useState<ReviewFilter>(
    "all"
  );

  if (!isOpen) {
    return null;
  }

  const readyResults =
    conversionResults.filter(
      (result) =>
        result.match.status ===
          "matched" ||
        (
          result.match.status ===
            "uncertain" &&
          result.reviewDecision ===
            "accepted"
        )
    );

  const reviewResults =
    conversionResults.filter(
      (result) =>
        result.match.status ===
          "uncertain" &&
        !result.reviewDecision
    );

  const notFoundResults =
    conversionResults.filter(
      (result) =>
        result.match.status ===
          "unmatched" ||
        (
          result.match.status ===
            "uncertain" &&
          result.reviewDecision ===
            "ignored"
        )
    );

  const filteredResults =
    reviewFilter === "ready"
      ? readyResults
      : reviewFilter === "review"
        ? reviewResults
        : reviewFilter ===
            "not-found"
          ? notFoundResults
          : conversionResults;

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
              <strong>✓</strong>

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
                    tracks ready
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
                  Ready
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
                  To review
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
                {matchedCount} ready
              </strong>
            </div>

            <div className="conversion-review-filters">
              <button
                className={
                  reviewFilter === "all"
                    ? "active"
                    : ""
                }
                type="button"
                onClick={() =>
                  setReviewFilter(
                    "all"
                  )
                }
              >
                All
                <span>
                  {
                    conversionResults.length
                  }
                </span>
              </button>

              <button
                className={
                  reviewFilter ===
                  "review"
                    ? "active review"
                    : "review"
                }
                type="button"
                onClick={() =>
                  setReviewFilter(
                    "review"
                  )
                }
              >
                To review
                <span>
                  {
                    reviewResults.length
                  }
                </span>
              </button>

              <button
                className={
                  reviewFilter ===
                  "ready"
                    ? "active ready"
                    : "ready"
                }
                type="button"
                onClick={() =>
                  setReviewFilter(
                    "ready"
                  )
                }
              >
                Ready
                <span>
                  {
                    readyResults.length
                  }
                </span>
              </button>

              <button
                className={
                  reviewFilter ===
                  "not-found"
                    ? "active not-found"
                    : "not-found"
                }
                type="button"
                onClick={() =>
                  setReviewFilter(
                    "not-found"
                  )
                }
              >
                Not found
                <span>
                  {
                    notFoundResults.length
                  }
                </span>
              </button>
            </div>

            <div className="conversion-review-list">
              {filteredResults.length >
              0 ? (
                filteredResults.map(
                  (
                    {
                      sourceTrack,
                      match,
                      reviewDecision,
                    },
                    index
                  ) => {
                    const isMatched =
                      match.status ===
                      "matched";

                    const isUncertain =
                      match.status ===
                      "uncertain";

                    const isAccepted =
                      isUncertain &&
                      reviewDecision ===
                        "accepted";

                    const isIgnored =
                      isUncertain &&
                      reviewDecision ===
                        "ignored";

                    const displayStatus =
                      isAccepted
                        ? "matched"
                        : isIgnored
                          ? "unmatched"
                          : match.status;

                    const statusLabel =
                      isMatched
                        ? "Matched"
                        : isAccepted
                          ? "Accepted"
                          : isIgnored
                            ? "Ignored"
                            : isUncertain
                              ? "Check"
                              : "Not found";

                    const statusSymbol =
                      isMatched ||
                      isAccepted
                        ? "✓"
                        : isIgnored ||
                            match.status ===
                              "unmatched"
                          ? "×"
                          : "?";

                    return (
                      <article
                        className={`conversion-review-item ${displayStatus}`}
                        key={`${sourceTrack.id}-${index}`}
                      >
                        <div
                          className={`conversion-review-status ${displayStatus}`}
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

                          {isUncertain && (
                            <div className="conversion-review-actions">
                              {!reviewDecision ? (
                                <>
                                  <button
                                    type="button"
                                    className="conversion-review-accept"
                                    onClick={() =>
                                      onAcceptUncertainMatch(
                                        sourceTrack.id
                                      )
                                    }
                                  >
                                    Accept
                                  </button>

                                  <button
                                    type="button"
                                    className="conversion-review-ignore"
                                    onClick={() =>
                                      onIgnoreUncertainMatch(
                                        sourceTrack.id
                                      )
                                    }
                                  >
                                    Ignore
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="conversion-review-reset"
                                  onClick={() =>
                                    onResetUncertainMatch(
                                      sourceTrack.id
                                    )
                                  }
                                >
                                  Undo decision
                                </button>
                              )}
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
                )
              ) : (
                <div className="conversion-review-empty">
                  <strong>
                    Nothing here
                  </strong>

                  <span>
                    No tracks match
                    this filter.
                  </span>
                </div>
              )}
            </div>

            {appleMusicAuthorizationError && (
              <div className="conversion-error">
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