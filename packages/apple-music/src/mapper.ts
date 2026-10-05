import type {
  Track,
} from "../../core/src";

import type {
  AppleMusicSong,
} from "./types";

export function mapAppleMusicSong(
  song: AppleMusicSong
): Track {
  const attributes = song.attributes;

  return {
    id: song.id,
    provider: "apple-music",
    title: attributes.name,
    artists: [attributes.artistName],
    album: attributes.albumName,
    durationMs: attributes.durationInMillis,

    ...(attributes.isrc
      ? {
          isrc: attributes.isrc,
        }
      : {}),

    ...(attributes.url
      ? {
          url: attributes.url,
        }
      : {}),
  };
}