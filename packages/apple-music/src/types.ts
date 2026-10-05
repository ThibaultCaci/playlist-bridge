export interface AppleMusicArtwork {
  width: number;
  height: number;
  url: string;
}

export interface AppleMusicSongAttributes {
  name: string;
  artistName: string;
  albumName: string;
  durationInMillis: number;
  isrc?: string;
  url?: string;
  artwork?: AppleMusicArtwork;
}

export interface AppleMusicSong {
  id: string;
  type: "songs";
  href?: string;
  attributes: AppleMusicSongAttributes;
}

export interface AppleMusicSearchResult {
  results: {
    songs?: {
      href?: string;
      next?: string;
      data: AppleMusicSong[];
    };
  };
}