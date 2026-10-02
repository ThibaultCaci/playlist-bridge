import type { Track } from "../types/track";
import { normalizeText } from "./normalize";
import { normalizeTrackTitle } from "./normalize-track";

function compareStrings(a?: string, b?: string): number {
  if (!a || !b) {
    return 0;
  }

  return normalizeText(a) === normalizeText(b) ? 1 : 0;
}

function compareArtists(a: string[], b: string[]): number {
  const normalizedA = a.map(normalizeText);
  const normalizedB = b.map(normalizeText);

  if (normalizedA.length === 0 || normalizedB.length === 0) {
    return 0;
  }

  const matches = normalizedA.filter((artist) =>
    normalizedB.includes(artist)
  );

  return (
    matches.length /
    Math.max(normalizedA.length, normalizedB.length)
  );
}

function compareDuration(a?: number, b?: number): number {
  if (a === undefined || b === undefined) {
    return 0;
  }

  const difference = Math.abs(a - b);

  if (difference <= 2000) return 1;
  if (difference <= 5000) return 0.8;
  if (difference <= 10000) return 0.5;

  return 0;
}

export function scoreTrackMatch(
  source: Track,
  candidate: Track
): number {
  // Matching ISRCs are the strongest possible signal.
  if (
    source.isrc &&
    candidate.isrc &&
    source.isrc.toUpperCase() === candidate.isrc.toUpperCase()
  ) {
    return 1;
  }

  const hasConflictingIsrc =
  source.isrc !== undefined &&
  candidate.isrc !== undefined &&
  source.isrc.toUpperCase() !== candidate.isrc.toUpperCase();

  const titleScore =
    normalizeTrackTitle(source.title) ===
    normalizeTrackTitle(candidate.title)
      ? 1
      : 0;

  const artistScore = compareArtists(
    source.artists,
    candidate.artists
  );

  const albumScore = compareStrings(
    source.album,
    candidate.album
  );

  const durationScore = compareDuration(
    source.durationMs,
    candidate.durationMs
  );

  let score =
    titleScore * 0.5 +
    artistScore * 0.3 +
    albumScore * 0.1 +
    durationScore * 0.1;

  // No matching artist is a major warning.
  if (artistScore === 0) {
    score = Math.min(score, 0.4);
  }

  // A large duration difference prevents an automatic match.
  if (
    source.durationMs !== undefined &&
    candidate.durationMs !== undefined &&
    durationScore === 0
  ) {
    score = Math.min(score, 0.8);
  }

  // Different ISRCs strongly suggest different recordings.
  // Metadata can still make this an uncertain match,
  // but never an automatic one.
  if (hasConflictingIsrc) {
    score = Math.min(score, 0.8);
  }

  return Math.round(score * 1000) / 1000;
}