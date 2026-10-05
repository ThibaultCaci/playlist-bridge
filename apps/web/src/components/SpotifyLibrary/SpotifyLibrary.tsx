import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  SpotifyPlaylistSummary,
} from "../../../../../packages/spotify/src";

import "./SpotifyLibrary.css";

const PLAYLISTS_PER_PAGE = 12;

type PlaylistFilter =
  | "mine"
  | "all"
  | "saved";

interface SpotifyLibraryProps {
  playlists: SpotifyPlaylistSummary[];

  currentUserId: string | null;

  onSelectPlaylist: (
    playlist: SpotifyPlaylistSummary
  ) => void | Promise<void>;
}

function getPlaylistTrackCount(
  playlist: SpotifyPlaylistSummary
): number {
  const compatiblePlaylist =
    playlist as SpotifyPlaylistSummary & {
      items?: {
        total?: number;
      };

      tracks?: {
        total?: number;
      };
    };

  return (
    compatiblePlaylist.items?.total ??
    compatiblePlaylist.tracks?.total ??
    0
  );
}

function SpotifyLibrary({
  playlists,
  currentUserId,
  onSelectPlaylist,
}: SpotifyLibraryProps) {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    sortDirection,
    setSortDirection,
  ] = useState<"asc" | "desc">(
    "asc"
  );

  const [
    playlistFilter,
    setPlaylistFilter,
  ] = useState<PlaylistFilter>(
    "mine"
  );

  const mineCount =
    useMemo(
      () =>
        currentUserId
          ? playlists.filter(
              (playlist) =>
                playlist.owner.id ===
                currentUserId
            ).length
          : 0,
      [
        playlists,
        currentUserId,
      ]
    );

  const savedCount =
    playlists.length -
    mineCount;

  const filteredPlaylists =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLocaleLowerCase();

      return playlists
        .filter(
          (playlist) => {
            if (
              !currentUserId ||
              playlistFilter ===
                "all"
            ) {
              return true;
            }

            const isMine =
              playlist.owner.id ===
              currentUserId;

            if (
              playlistFilter ===
              "mine"
            ) {
              return isMine;
            }

            return !isMine;
          }
        )
        .filter(
          (playlist) => {
            if (
              !normalizedQuery
            ) {
              return true;
            }

            return playlist.name
              .toLocaleLowerCase()
              .includes(
                normalizedQuery
              );
          }
        )
        .sort((a, b) => {
          const comparison =
            a.name.localeCompare(
              b.name,
              undefined,
              {
                sensitivity:
                  "base",
                numeric: true,
              }
            );

          return sortDirection ===
            "asc"
            ? comparison
            : -comparison;
        });
    }, [
      playlists,
      currentUserId,
      playlistFilter,
      searchQuery,
      sortDirection,
    ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredPlaylists.length /
          PLAYLISTS_PER_PAGE
      )
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    playlistFilter,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const pageStart =
    (currentPage - 1) *
    PLAYLISTS_PER_PAGE;

  const visiblePlaylists =
    filteredPlaylists.slice(
      pageStart,
      pageStart +
        PLAYLISTS_PER_PAGE
    );

  function changePage(
    page: number
  ) {
    const nextPage =
      Math.min(
        Math.max(page, 1),
        totalPages
      );

    setCurrentPage(
      nextPage
    );
  }

  function changeFilter(
    filter: PlaylistFilter
  ) {
    setPlaylistFilter(
      filter
    );

    setCurrentPage(1);
  }

  function getVisiblePageNumbers() {
    const pages: number[] =
      [];

    const start =
      Math.max(
        1,
        Math.min(
          currentPage - 2,
          totalPages - 4
        )
      );

    const end =
      Math.min(
        totalPages,
        start + 4
      );

    for (
      let page = start;
      page <= end;
      page += 1
    ) {
      pages.push(page);
    }

    return pages;
  }

  const visiblePageNumbers =
    getVisiblePageNumbers();

  const hasSearch =
    searchQuery.trim().length >
    0;

  return (
    <section className="spotify-library">
      <div className="spotify-library-heading">
        <div>
          <h2>
            Your Spotify playlists
          </h2>

          <p>
            Choose a playlist to
            transfer to Apple Music.
          </p>
        </div>

        <span className="spotify-library-count">
          {hasSearch ? (
            <>
              {
                filteredPlaylists.length
              }{" "}
              {filteredPlaylists.length ===
              1
                ? "result"
                : "results"}
              {" · "}
              {
                playlists.length
              }{" "}
              playlists
            </>
          ) : (
            <>
              {
                playlists.length
              }{" "}
              playlists
            </>
          )}
        </span>
      </div>

      <div className="spotify-library-filters">
        <button
          type="button"
          className={
            playlistFilter ===
            "mine"
              ? "active"
              : ""
          }
          onClick={() =>
            changeFilter(
              "mine"
            )
          }
        >
          Mine
          <span>
            {mineCount}
          </span>
        </button>

        <button
          type="button"
          className={
            playlistFilter ===
            "all"
              ? "active"
              : ""
          }
          onClick={() =>
            changeFilter(
              "all"
            )
          }
        >
          All
          <span>
            {playlists.length}
          </span>
        </button>

        <button
          type="button"
          className={
            playlistFilter ===
            "saved"
              ? "active"
              : ""
          }
          onClick={() =>
            changeFilter(
              "saved"
            )
          }
        >
          Saved
          <span>
            {savedCount}
          </span>
        </button>
      </div>

      <div className="spotify-library-toolbar">
        <label className="spotify-library-search">
          <span className="spotify-library-search-icon">
            ⌕
          </span>

          <input
            type="search"
            value={
              searchQuery
            }
            placeholder="Search playlists..."
            aria-label="Search playlists"
            onChange={(
              event
            ) =>
              setSearchQuery(
                event.target
                  .value
              )
            }
          />

          {searchQuery && (
            <button
              type="button"
              className="spotify-library-search-clear"
              aria-label="Clear search"
              onClick={() =>
                setSearchQuery(
                  ""
                )
              }
            >
              ×
            </button>
          )}
        </label>

        <button
          className="spotify-library-sort"
          type="button"
          onClick={() => {
            setSortDirection(
              (current) =>
                current ===
                "asc"
                  ? "desc"
                  : "asc"
            );

            setCurrentPage(1);
          }}
          aria-label={
            sortDirection ===
            "asc"
              ? "Sort playlists Z to A"
              : "Sort playlists A to Z"
          }
        >
          <span>
            Sort
          </span>

          <strong>
            {sortDirection ===
            "asc"
              ? "A → Z"
              : "Z → A"}
          </strong>
        </button>
      </div>

      {visiblePlaylists.length >
      0 ? (
        <>
          <div className="spotify-library-grid">
            {visiblePlaylists.map(
              (playlist) => {
                const image =
                  playlist
                    .images?.[0];

                const trackCount =
                  getPlaylistTrackCount(
                    playlist
                  );

                return (
                  <button
                    className="spotify-library-card"
                    type="button"
                    key={
                      playlist.id
                    }
                    onClick={() =>
                      void onSelectPlaylist(
                        playlist
                      )
                    }
                  >
                    <div className="spotify-library-cover">
                      {image ? (
                        <img
                          src={
                            image.url
                          }
                          alt=""
                        />
                      ) : (
                        <div className="spotify-library-placeholder">
                          ♪
                        </div>
                      )}
                    </div>

                    <div className="spotify-library-info">
                      <h3
                        title={
                          playlist.name
                        }
                      >
                        {
                          playlist.name
                        }
                      </h3>

                      <p>
                        {
                          trackCount
                        }{" "}
                        {trackCount ===
                        1
                          ? "track"
                          : "tracks"}
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {totalPages > 1 && (
            <nav
              className="spotify-library-pagination"
              aria-label="Playlist pages"
            >
              <button
                type="button"
                className="spotify-library-pagination-arrow"
                disabled={
                  currentPage ===
                  1
                }
                onClick={() =>
                  changePage(
                    currentPage -
                      1
                  )
                }
              >
                <span aria-hidden="true">
                  ←
                </span>

                <span className="spotify-library-pagination-label">
                  Previous
                </span>
              </button>

              <div className="spotify-library-pages">
                {visiblePageNumbers[0] >
                  1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        changePage(
                          1
                        )
                      }
                    >
                      1
                    </button>

                    {visiblePageNumbers[0] >
                      2 && (
                      <span className="spotify-library-ellipsis">
                        …
                      </span>
                    )}
                  </>
                )}

                {visiblePageNumbers.map(
                  (page) => (
                    <button
                      type="button"
                      key={
                        page
                      }
                      className={
                        page ===
                        currentPage
                          ? "active"
                          : ""
                      }
                      aria-current={
                        page ===
                        currentPage
                          ? "page"
                          : undefined
                      }
                      onClick={() =>
                        changePage(
                          page
                        )
                      }
                    >
                      {page}
                    </button>
                  )
                )}

                {visiblePageNumbers[
                  visiblePageNumbers.length -
                    1
                ] < totalPages && (
                  <>
                    {visiblePageNumbers[
                      visiblePageNumbers.length -
                        1
                    ] <
                      totalPages -
                        1 && (
                      <span className="spotify-library-ellipsis">
                        …
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        changePage(
                          totalPages
                        )
                      }
                    >
                      {
                        totalPages
                      }
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                className="spotify-library-pagination-arrow"
                disabled={
                  currentPage ===
                  totalPages
                }
                onClick={() =>
                  changePage(
                    currentPage +
                      1
                  )
                }
              >
                <span className="spotify-library-pagination-label">
                  Next
                </span>

                <span aria-hidden="true">
                  →
                </span>
              </button>
            </nav>
          )}

          <div className="spotify-library-page-status">
            Page {currentPage} of{" "}
            {totalPages}
          </div>
        </>
      ) : (
        <div className="spotify-library-empty">
          <span>
            ♫
          </span>

          <strong>
            No playlists found
          </strong>

          <p>
            {hasSearch
              ? `No playlist matches “${searchQuery}”.`
              : playlistFilter ===
                  "mine"
                ? "You don't have any personal playlists."
                : playlistFilter ===
                    "saved"
                  ? "You don't have any saved playlists."
                  : "No playlists available."}
          </p>

          {hasSearch && (
            <button
              type="button"
              onClick={() =>
                setSearchQuery(
                  ""
                )
              }
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default SpotifyLibrary;