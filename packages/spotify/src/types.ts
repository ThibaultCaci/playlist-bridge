export interface SpotifyArtist {
    id: string;
    name: string;
  }
  
  export interface SpotifyAlbum {
    id: string;
    name: string;
  }
  
  export interface SpotifyExternalIds {
    isrc?: string;
  }
  
  export interface SpotifyExternalUrls {
    spotify: string;
  }
  
  export interface SpotifyTrack {
    id: string;
    name: string;
    duration_ms: number;
  
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
  
    external_ids?: SpotifyExternalIds;
    external_urls: SpotifyExternalUrls;
  }