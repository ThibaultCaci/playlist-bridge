export type {
    MusicProviderName,
    Track,
  } from "./types/track";
  
  export type {
    Playlist,
  } from "./types/playlist";
  
  export type {
    MusicProvider,
  } from "./types/provider";

  export type {
    MatchResult,
    MatchStatus,
  } from "./matching/types";
  
  export {
    scoreTrackMatch,
  } from "./matching/match";
  
  export {
    findBestMatch,
  } from "./matching/find-best-match";