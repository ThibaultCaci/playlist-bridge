import type { Track } from "../../core/src";
import type { SpotifyTrack } from "./types";

export function mapSpotifyTrack(track: SpotifyTrack): Track {
  const mappedTrack: Track = {
    id: track.id,
    provider: "spotify",
    title: track.name,
    artists: track.artists.map((artist) => artist.name),
    album: track.album.name,
    durationMs: track.duration_ms,
    url: track.external_urls.spotify,
  };

  if (track.external_ids?.isrc) {
    mappedTrack.isrc = track.external_ids.isrc;
  }

  return mappedTrack;
}