import type {
  MatchResult,
  Track,
} from "../../../../packages/core/src";

interface ConversionResult {
  sourceTrack: Track;
  match: MatchResult;
  reviewDecision?: "accepted" | "ignored";
}

export interface AppleTransferTrack {
  sourceTrack: Track;
  appleTrack: Track;
}

export function buildAppleTransferTracks(
  conversionResults: ConversionResult[]
): AppleTransferTrack[] {
  return conversionResults.flatMap(
    (result) => {
      const isReady =
        result.match.status ===
          "matched" ||
        (
          result.match.status ===
            "uncertain" &&
          result.reviewDecision ===
            "accepted"
        );

      if (
        !isReady ||
        !result.match.track
      ) {
        return [];
      }

      return [
        {
          sourceTrack:
            result.sourceTrack,
          appleTrack:
            result.match.track,
        },
      ];
    }
  );
}

export function buildAppleTrackIds(
  conversionResults: ConversionResult[]
): string[] {
  return Array.from(
    new Set(
      buildAppleTransferTracks(
        conversionResults
      ).map(
        (result) =>
          result.appleTrack.id
      )
    )
  );
}