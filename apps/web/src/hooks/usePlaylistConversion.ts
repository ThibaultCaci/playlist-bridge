import {
  useState,
} from "react";

import type {
  SpotifyPlaylistSummary,
} from "../../../../packages/spotify/src";

import {
  AppleMusicClient,
} from "../../../../packages/apple-music/src";

import {
  findBestMatch,
} from "../../../../packages/core/src";

import type {
  MatchResult,
  Track,
} from "../../../../packages/core/src";

import {
  authorizeAppleMusic,
  createAppleMusicPlaylist,
} from "../musickit";

export interface ConversionResult {
  sourceTrack: Track;
  match: MatchResult;
  reviewDecision?: "accepted" | "ignored";
}

export type ConversionStatus =
  | "idle"
  | "running"
  | "complete";

export type ConversionView =
  | "summary"
  | "review"
  | "success";

interface UsePlaylistConversionOptions {
  tracks: Track[];
  selectedPlaylist: SpotifyPlaylistSummary | null;
}

export function usePlaylistConversion({
  tracks,
  selectedPlaylist,
}: UsePlaylistConversionOptions) {
  const [
    isConversionModalOpen,
    setIsConversionModalOpen,
  ] = useState(false);

  const [
    conversionStatus,
    setConversionStatus,
  ] = useState<ConversionStatus>(
    "idle"
  );

  const [
    conversionView,
    setConversionView,
  ] = useState<ConversionView>(
    "summary"
  );

  const [
    conversionResults,
    setConversionResults,
  ] = useState<ConversionResult[]>(
    []
  );

  const [
    currentTrack,
    setCurrentTrack,
  ] = useState<Track | null>(
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
  ] = useState<string | null>(
    null
  );

  const [
    createdTrackCount,
    setCreatedTrackCount,
  ] = useState(0);

  const matchedCount =
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
    ).length;

  const uncertainCount =
    conversionResults.filter(
      (result) =>
        result.match.status ===
          "uncertain" &&
        !result.reviewDecision
    ).length;

  const ignoredCount =
    conversionResults.filter(
      (result) =>
        result.match.status ===
          "uncertain" &&
        result.reviewDecision ===
          "ignored"
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

  function acceptUncertainMatch(
    sourceTrackId: string
  ) {
    setConversionResults(
      (results) =>
        results.map(
          (result) => {
            if (
              result.sourceTrack.id !==
                sourceTrackId ||
              result.match.status !==
                "uncertain"
            ) {
              return result;
            }

            return {
              ...result,
              reviewDecision:
                "accepted",
            };
          }
        )
    );
  }

  function ignoreUncertainMatch(
    sourceTrackId: string
  ) {
    setConversionResults(
      (results) =>
        results.map(
          (result) => {
            if (
              result.sourceTrack.id !==
                sourceTrackId ||
              result.match.status !==
                "uncertain"
            ) {
              return result;
            }

            return {
              ...result,
              reviewDecision:
                "ignored",
            };
          }
        )
    );
  }

  function resetUncertainMatch(
    sourceTrackId: string
  ) {
    setConversionResults(
      (results) =>
        results.map(
          (result) => {
            if (
              result.sourceTrack.id !==
                sourceTrackId ||
              result.match.status !==
                "uncertain"
            ) {
              return result;
            }

            const {
              reviewDecision,
              ...rest
            } = result;

            void reviewDecision;

            return rest;
          }
        )
    );
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

      const appleTrackIds =
        conversionResults
          .filter(
            (result) =>
              result.match.track &&
              (
                result.match.status ===
                  "matched" ||
                (
                  result.match.status ===
                    "uncertain" &&
                  result.reviewDecision ===
                    "accepted"
                )
              )
          )
          .map(
            (result) =>
              result.match
                .track!.id
          );

      if (
        appleTrackIds.length ===
        0
      ) {
        throw new Error(
          "No accepted tracks are available to transfer."
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

  return {
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
    ignoredCount,
    unmatchedCount,
    progress,
    startConversionAnalysis,
    continueToAppleMusic,
    closeConversionModal,
    acceptUncertainMatch,
    ignoreUncertainMatch,
    resetUncertainMatch,
  };
}