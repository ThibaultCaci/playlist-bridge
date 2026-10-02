import { describe, expect, it } from "vitest";
import type { Track } from "../types/track";
import { scoreTrackMatch } from "./match";

const spotifyTrack: Track = {
  id: "spotify-1",
  provider: "spotify",
  title: "Get Lucky",
  artists: ["Daft Punk", "Pharrell Williams"],
  album: "Random Access Memories",
  durationMs: 369627,
  isrc: "USQX91300809",
};

function createAppleTrack(
  overrides: Partial<Track> = {},
  withoutIsrc = false
): Track {
  const track: Track = {
    id: "apple-1",
    provider: "apple-music",
    title: "Get Lucky",
    artists: ["Daft Punk", "Pharrell Williams"],
    album: "Random Access Memories",
    durationMs: 369000,
    isrc: "USQX91300809",
    ...overrides,
  };

  if (withoutIsrc) {
    delete track.isrc;
  }

  return track;
}

describe("scoreTrackMatch", () => {
  it("returns 1 for identical ISRCs", () => {
    expect(
      scoreTrackMatch(spotifyTrack, createAppleTrack())
    ).toBe(1);
  });

  it("matches equivalent metadata without an ISRC", () => {
    const { isrc: _sourceIsrc, ...source } = spotifyTrack;

    const candidate = createAppleTrack({}, true);

    expect(
      scoreTrackMatch(source, candidate)
    ).toBeGreaterThan(0.9);
  });

  it("handles remastered titles", () => {
    const {
      isrc: _sourceIsrc,
      ...sourceWithoutIsrc
    } = spotifyTrack;

    const source: Track = {
      ...sourceWithoutIsrc,
      title: "Get Lucky (Remastered 2025)",
    };

    const candidate = createAppleTrack(
      {
        title: "Get Lucky",
      },
      true
    );

    expect(
      scoreTrackMatch(source, candidate)
    ).toBeGreaterThan(0.9);
  });

  it("penalizes a different artist", () => {
    const { isrc: _sourceIsrc, ...source } = spotifyTrack;

    const candidate = createAppleTrack(
      {
        artists: ["Completely Different Artist"],
      },
      true
    );

    expect(
      scoreTrackMatch(source, candidate)
    ).toBeLessThan(0.7);
  });

  it("penalizes a very different duration", () => {
    const { isrc: _sourceIsrc, ...source } = spotifyTrack;

    const candidate = createAppleTrack(
      {
        durationMs: 180000,
      },
      true
    );

    expect(
      scoreTrackMatch(source, candidate)
    ).toBeLessThan(0.9);
  });

  it("returns a low score for an unrelated track", () => {
    const { isrc: _sourceIsrc, ...source } = spotifyTrack;

    const candidate = createAppleTrack(
      {
        title: "Around the World",
        artists: ["Red Hot Chili Peppers"],
        album: "Californication",
        durationMs: 238000,
      },
      true
    );

    expect(
      scoreTrackMatch(source, candidate)
    ).toBeLessThan(0.3);
  });
});