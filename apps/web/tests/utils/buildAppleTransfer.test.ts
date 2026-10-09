import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  MatchResult,
  Track,
} from "../../../../packages/core/src";

import {
  buildAppleTrackIds,
  buildAppleTransferTracks,
} from "../../src/utils/buildAppleTransfer";

function createSpotifyTrack(
  id: string,
  title: string
): Track {
  return {
    id,
    provider: "spotify",
    title,
    artists: ["Test Artist"],
  };
}

function createAppleTrack(
  id: string,
  title: string
): Track {
  return {
    id,
    provider: "apple-music",
    title,
    artists: ["Test Artist"],
  };
}

function createMatch(
  track: Track | undefined,
  status:
    | "matched"
    | "uncertain"
    | "unmatched",
  confidence: number
): MatchResult {
  return {
    ...(track
      ? {
          track,
        }
      : {}),
    status,
    confidence,
  };
}

describe(
  "buildAppleTransferTracks",
  () => {
    it(
      "includes matched tracks",
      () => {
        const spotifyTrack =
          createSpotifyTrack(
            "spotify-1",
            "Track One"
          );

        const appleTrack =
          createAppleTrack(
            "apple-1",
            "Track One"
          );

        const result =
          buildAppleTransferTracks([
            {
              sourceTrack:
                spotifyTrack,
              match:
                createMatch(
                  appleTrack,
                  "matched",
                  0.98
                ),
            },
          ]);

        expect(result).toEqual([
          {
            sourceTrack:
              spotifyTrack,
            appleTrack,
          },
        ]);
      }
    );

    it(
      "includes accepted uncertain tracks",
      () => {
        const spotifyTrack =
          createSpotifyTrack(
            "spotify-2",
            "Track Two"
          );

        const appleTrack =
          createAppleTrack(
            "apple-2",
            "Track Two"
          );

        const result =
          buildAppleTransferTracks([
            {
              sourceTrack:
                spotifyTrack,
              match:
                createMatch(
                  appleTrack,
                  "uncertain",
                  0.78
                ),
              reviewDecision:
                "accepted",
            },
          ]);

        expect(result).toHaveLength(
          1
        );

        expect(
          result[0]?.appleTrack.id
        ).toBe("apple-2");
      }
    );

    it(
      "excludes undecided uncertain tracks",
      () => {
        const result =
          buildAppleTransferTracks([
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-3",
                  "Track Three"
                ),
              match:
                createMatch(
                  createAppleTrack(
                    "apple-3",
                    "Track Three"
                  ),
                  "uncertain",
                  0.75
                ),
            },
          ]);

        expect(result).toEqual(
          []
        );
      }
    );

    it(
      "excludes ignored uncertain tracks",
      () => {
        const result =
          buildAppleTransferTracks([
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-4",
                  "Track Four"
                ),
              match:
                createMatch(
                  createAppleTrack(
                    "apple-4",
                    "Track Four"
                  ),
                  "uncertain",
                  0.72
                ),
              reviewDecision:
                "ignored",
            },
          ]);

        expect(result).toEqual(
          []
        );
      }
    );

    it(
      "excludes unmatched tracks",
      () => {
        const result =
          buildAppleTransferTracks([
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-5",
                  "Track Five"
                ),
              match:
                createMatch(
                  undefined,
                  "unmatched",
                  0
                ),
            },
          ]);

        expect(result).toEqual(
          []
        );
      }
    );

    it(
      "excludes ready matches without an Apple Music track",
      () => {
        const result =
          buildAppleTransferTracks([
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-6",
                  "Track Six"
                ),
              match:
                createMatch(
                  undefined,
                  "matched",
                  0.95
                ),
            },
          ]);

        expect(result).toEqual(
          []
        );
      }
    );
  }
);

describe(
  "buildAppleTrackIds",
  () => {
    it(
      "returns only transferable Apple Music IDs",
      () => {
        const result =
          buildAppleTrackIds([
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-1",
                  "Track One"
                ),
              match:
                createMatch(
                  createAppleTrack(
                    "apple-1",
                    "Track One"
                  ),
                  "matched",
                  0.99
                ),
            },
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-2",
                  "Track Two"
                ),
              match:
                createMatch(
                  createAppleTrack(
                    "apple-2",
                    "Track Two"
                  ),
                  "uncertain",
                  0.8
                ),
              reviewDecision:
                "accepted",
            },
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-3",
                  "Track Three"
                ),
              match:
                createMatch(
                  createAppleTrack(
                    "apple-3",
                    "Track Three"
                  ),
                  "uncertain",
                  0.75
                ),
            },
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-4",
                  "Track Four"
                ),
              match:
                createMatch(
                  undefined,
                  "unmatched",
                  0
                ),
            },
          ]);

        expect(result).toEqual([
          "apple-1",
          "apple-2",
        ]);
      }
    );

    it(
      "removes duplicate Apple Music IDs",
      () => {
        const appleTrack =
          createAppleTrack(
            "apple-duplicate",
            "Same Track"
          );

        const result =
          buildAppleTrackIds([
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-1",
                  "Same Track"
                ),
              match:
                createMatch(
                  appleTrack,
                  "matched",
                  0.99
                ),
            },
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-2",
                  "Same Track"
                ),
              match:
                createMatch(
                  appleTrack,
                  "matched",
                  0.97
                ),
            },
          ]);

        expect(result).toEqual([
          "apple-duplicate",
        ]);
      }
    );

    it(
      "returns an empty array when nothing can be transferred",
      () => {
        const result =
          buildAppleTrackIds([
            {
              sourceTrack:
                createSpotifyTrack(
                  "spotify-1",
                  "Missing Track"
                ),
              match:
                createMatch(
                  undefined,
                  "unmatched",
                  0
                ),
            },
          ]);

        expect(result).toEqual(
          []
        );
      }
    );
  }
);