import type { MusicProviderName, Track } from "./track";

export interface Playlist {
  id: string;
  provider: MusicProviderName;

  name: string;
  description?: string;

  tracks: Track[];

  url?: string;
}