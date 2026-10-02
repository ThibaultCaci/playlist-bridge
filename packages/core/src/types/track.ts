export type MusicProviderName = "spotify" | "apple-music";

export interface Track {
  id: string;
  provider: MusicProviderName;

  title: string;
  artists: string[];

  album?: string;
  durationMs?: number;
  isrc?: string;

  url?: string;
}