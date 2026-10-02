import type { Track } from "../types/track";
import type { MatchResult } from "./types";
import { scoreTrackMatch } from "./match";

const MATCH_THRESHOLD = 0.9;
const UNCERTAIN_THRESHOLD = 0.7;

export function findBestMatch(
  source: Track,
  candidates: Track[]
): MatchResult {
  if (candidates.length === 0) {
    return {
      confidence: 0,
      status: "unmatched",
    };
  }

  let bestTrack: Track | undefined;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreTrackMatch(source, candidate);

    if (score > bestScore) {
      bestScore = score;
      bestTrack = candidate;
    }
  }

  if (!bestTrack || bestScore < UNCERTAIN_THRESHOLD) {
    return {
      confidence: bestScore,
      status: "unmatched",
    };
  }

  if (bestScore < MATCH_THRESHOLD) {
    return {
      track: bestTrack,
      confidence: bestScore,
      status: "uncertain",
    };
  }

  return {
    track: bestTrack,
    confidence: bestScore,
    status: "matched",
  };
}