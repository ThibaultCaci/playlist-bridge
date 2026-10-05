import {
  useState,
} from "react";

import {
  mapSpotifyTrack,
  SpotifyClient,
} from "../../../../packages/spotify/src";

import type {
  SpotifyPlaylistSummary,
} from "../../../../packages/spotify/src";

import type {
  Track,
} from "../../../../packages/core/src";

export function useSpotifyPlaylist() {
  const [
    selectedPlaylist,
    setSelectedPlaylist,
  ] =
    useState<SpotifyPlaylistSummary | null>(
      null
    );

  const [
    tracks,
    setTracks,
  ] = useState<Track[]>([]);

  const [
    isLoadingTracks,
    setIsLoadingTracks,
  ] = useState(false);

  async function selectPlaylist(
    playlist:
      SpotifyPlaylistSummary
  ) {
    const accessToken =
      sessionStorage.getItem(
        "spotify_access_token"
      );

    if (!accessToken) {
      console.error(
        "Missing Spotify access token."
      );

      return;
    }

    setSelectedPlaylist(
      playlist
    );

    setTracks([]);

    setIsLoadingTracks(
      true
    );

    try {
      const spotify =
        new SpotifyClient(
          accessToken
        );

      const items =
        await spotify.getAllPlaylistItems(
          playlist.id
        );

      const mappedTracks =
        items
          .map(
            (
              playlistItem
            ) => {
              const spotifyTrack =
                playlistItem.item ??
                playlistItem.track;

              if (
                !spotifyTrack
              ) {
                return null;
              }

              return mapSpotifyTrack(
                spotifyTrack
              );
            }
          )
          .filter(
            (
              track
            ): track is Track =>
              track !== null
          );

      setTracks(
        mappedTracks
      );
    } catch (error) {
      console.error(
        "Failed to load Spotify playlist:",
        error
      );
    } finally {
      setIsLoadingTracks(
        false
      );
    }
  }

  function clearSelectedPlaylist() {
    setSelectedPlaylist(
      null
    );

    setTracks([]);
  }

  return {
    selectedPlaylist,
    tracks,
    isLoadingTracks,
    selectPlaylist,
    clearSelectedPlaylist,
  };
}