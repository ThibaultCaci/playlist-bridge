import type { SpotifyTrack } from "./types";

const SPOTIFY_API_URL = "https://api.spotify.com/v1";

export class SpotifyApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  email?: string;
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
}

export interface SpotifyPlaylistImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  description: string;
  public: boolean;
  collaborative: boolean;
  images: SpotifyPlaylistImage[];
  owner: {
    id: string;
    display_name: string | null;
  };
  external_urls: {
    spotify: string;
  };
  tracks: {
    total: number;
  };
}

export interface SpotifyPaging<T> {
  items: T[];
  limit: number;
  offset: number;
  total: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifyPlaylistItem {
  added_at: string | null;
  track: SpotifyTrack | null;
}

export class SpotifyClient {
  constructor(
    private readonly accessToken: string
  ) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(
      `${SPOTIFY_API_URL}${endpoint}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          ...options.headers,
        },
      }
    );

    if (!response.ok) {
      const body = await response.text();

      throw new SpotifyApiError(
        response.status,
        `Spotify API request failed (${response.status}): ${body}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    return this.request<SpotifyUser>("/me");
  }

  async getCurrentUserPlaylists(
    limit = 50,
    offset = 0
  ): Promise<SpotifyPaging<SpotifyPlaylistSummary>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.request<
      SpotifyPaging<SpotifyPlaylistSummary>
    >(`/me/playlists?${params.toString()}`);
  }

  async getPlaylistItems(
    playlistId: string,
    limit = 50,
    offset = 0
  ): Promise<SpotifyPaging<SpotifyPlaylistItem>> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.request<
      SpotifyPaging<SpotifyPlaylistItem>
    >(
      `/playlists/${encodeURIComponent(
        playlistId
      )}/items?${params.toString()}`
    );
  }

  async getAllPlaylistItems(
    playlistId: string
  ): Promise<SpotifyPlaylistItem[]> {
    const items: SpotifyPlaylistItem[] = [];

    let offset = 0;
    const limit = 50;

    while (true) {
      const page = await this.getPlaylistItems(
        playlistId,
        limit,
        offset
      );

      items.push(...page.items);

      if (
        page.next === null ||
        page.items.length === 0
      ) {
        break;
      }

      offset += page.items.length;
    }

    return items;
  }
}