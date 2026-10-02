import { describe, expect, it } from "vitest";
import { mapSpotifyTrack } from "../mapper";
import type { SpotifyTrack } from "../types";

describe("mapSpotifyTrack", () => {
  it("maps a Spotify track to the shared Track model", () => {
    const spotifyTrack: SpotifyTrack = {
      id: "4cOdK2wGLETKBW3PvgPWqT",
      name: "Get Lucky",
      duration_ms: 369627,

      artists: [
        {
          id: "4tZwfgrHOc3mvqYlEYSvVi",
          name: "Daft Punk",
        },
        {
          id: "2RdwBSPQiwcmiDo9kixcl8",
          name: "Pharrell Williams",
        },
      ],

      album: {
        id: "4m2880jivSbbyEGAKfITCa",
        name: "Random Access Memories",
      },

      external_ids: {
        isrc: "USQX91300809",
      },

      external_urls: {
        spotify:
          "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
      },
    };

    const result = mapSpotifyTrack(spotifyTrack);

    expect(result).toEqual({
      id: "4cOdK2wGLETKBW3PvgPWqT",
      provider: "spotify",
      title: "Get Lucky",
      artists: [
        "Daft Punk",
        "Pharrell Williams",
      ],
      album: "Random Access Memories",
      durationMs: 369627,
      isrc: "USQX91300809",
      url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    });
  });

  it("maps tracks without an ISRC", () => {
    const spotifyTrack: SpotifyTrack = {
      id: "track-without-isrc",
      name: "Unknown Track",
      duration_ms: 180000,

      artists: [
        {
          id: "artist-1",
          name: "Unknown Artist",
        },
      ],

      album: {
        id: "album-1",
        name: "Unknown Album",
      },

      external_urls: {
        spotify: "https://open.spotify.com/track/example",
      },
    };

    const result = mapSpotifyTrack(spotifyTrack);

    expect(result.isrc).toBeUndefined();
  });
});