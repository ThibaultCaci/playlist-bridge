import type {
  Track,
} from "../../core/src";

import {
  mapAppleMusicSong,
} from "./mapper";

import type {
  AppleMusicSearchResult,
} from "./types";

const PLAYLIST_BRIDGE_API_URL =
  "http://127.0.0.1:3001";

export class AppleMusicClient {
  async searchTrack(
    track: Track
  ): Promise<Track[]> {
    const searchTerm = [
      track.title,
      ...track.artists,
    ].join(" ");

    const params = new URLSearchParams({
      term: searchTerm,
    });

    const response = await fetch(
      `${PLAYLIST_BRIDGE_API_URL}/api/apple/search?${params.toString()}`
    );

    if (!response.ok) {
      const body = await response.text();

      throw new Error(
        `PlaylistBridge Apple search failed (${response.status}): ${body}`
      );
    }

    const result =
      (await response.json()) as AppleMusicSearchResult;

    const songs =
      result.results.songs?.data ?? [];

    return songs.map(
      mapAppleMusicSong
    );
  }
}