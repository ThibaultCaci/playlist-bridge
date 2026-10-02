import { describe, expect, it } from "vitest";
import type { Track } from "../types/track";
import { findBestMatch } from "./find-best-match";

const source: Track = {
  id: "spotify-source",
  provider: "spotify",
  title: "Get Lucky",
  artists: ["Daft Punk", "Pharrell Williams"],
  album: "Random Access Memories",
  durationMs: 369627,
  isrc: "USQX91300809",
};

const correctMatch: Track = {
  id: "apple-correct",
  provider: "apple-music",
  title: "Get Lucky",
  artists: ["Daft Punk", "Pharrell Williams"],
  album: "Random Access Memories",
  durationMs: 369000,
  isrc: "USQX91300809",
};

const wrongArtist: Track = {
  id: "apple-cover",
  provider: "apple-music",
  title: "Get Lucky",
  artists: ["Vitamin String Quartet"],
  album: "VSQ Performs Daft Punk",
  durationMs: 365000,
};

const unrelatedTrack: Track = {
  id: "apple-unrelated",
  provider: "apple-music",
  title: "Californication",
  artists: ["Red Hot Chili Peppers"],
  album: "Californication",
  durationMs: 329000,
};

describe("findBestMatch", () => {
  it("selects the best candidate", () => {
    const result = findBestMatch(source, [
      wrongArtist,
      unrelatedTrack,
      correctMatch,
    ]);

    expect(result.track?.id).toBe("apple-correct");
    expect(result.confidence).toBe(1);
    expect(result.status).toBe("matched");
  });

  it("does not depend on candidate order", () => {
    const result = findBestMatch(source, [
      correctMatch,
      wrongArtist,
      unrelatedTrack,
    ]);

    expect(result.track?.id).toBe("apple-correct");
  });

  it("returns unmatched when there are no candidates", () => {
    const result = findBestMatch(source, []);

    expect(result.track).toBeUndefined();
    expect(result.confidence).toBe(0);
    expect(result.status).toBe("unmatched");
  });

  it("returns unmatched for unrelated candidates", () => {
    const result = findBestMatch(source, [
      unrelatedTrack,
    ]);

    expect(result.status).toBe("unmatched");
    expect(result.track).toBeUndefined();
  });

  it("returns uncertain for a plausible but imperfect match", () => {
    const sourceWithoutIsrc: Track = {
      id: "spotify-source",
      provider: "spotify",
      title: "Get Lucky",
      artists: ["Daft Punk", "Pharrell Williams"],
      album: "Random Access Memories",
      durationMs: 369627,
    };

    const imperfectCandidate: Track = {
      id: "apple-imperfect",
      provider: "apple-music",
      title: "Get Lucky",
      artists: ["Daft Punk"],
      album: "Random Access Memories",
      durationMs: 369000,
    };

    const result = findBestMatch(
      sourceWithoutIsrc,
      [imperfectCandidate]
    );

    expect(result.status).toBe("uncertain");
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.confidence).toBeLessThan(0.9);
    expect(result.track?.id).toBe("apple-imperfect");
  });
});