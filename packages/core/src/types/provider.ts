import type { Playlist } from "./playlist";
import type { MusicProviderName, Track } from "./track";

export interface MusicProvider {
  readonly name: MusicProviderName;

  authenticate(): Promise<void>;

  getPlaylist(url: string): Promise<Playlist>;

  searchTrack(track: Track): Promise<Track[]>;

  createPlaylist(
    name: string,
    tracks: Track[],
    description?: string
  ): Promise<Playlist>;
}