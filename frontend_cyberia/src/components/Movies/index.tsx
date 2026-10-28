import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { MediaForm } from "../../forms";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import {
  MediaDetailsModal,
  type MediaDetailsItem,
} from "../MediaDetailsModal";
import { ProgressBar } from "../ProgressBar";
import { Select } from "../Select";
import styles from "./styles.module.css";

type MediaKind = "movie" | "series";
type MediaStatus = "NW" | "WG" | "WT" | "PA" | "RW" | "WD";
type MediaFilter = "all" | "movie" | "series" | "watchlist";

type MediaItem = {
  key: string;
  kind: MediaKind;
  tmdbId: number;
  title: string;
  cover: string | null;
  status: MediaStatus;
  updatedAt: number;
  rating?: number;
  currentMinute?: number;
  runtimeMinutes?: number;
  currentSeason?: number;
  currentEpisode?: number;
  episodesInSeason?: number;
};

const initialMediaItems: MediaItem[] = [
  {
    key: "cangaco-novo",
    kind: "series",
    tmdbId: 0,
    title: "Cangaço Novo",
    cover: null,
    status: "WT",
    updatedAt: 2,
    currentSeason: 1,
    currentEpisode: 5,
    episodesInSeason: 10,
  },
  {
    key: "big-bang-theory",
    kind: "series",
    tmdbId: 1418,
    title: "The Big Bang Theory",
    cover: null,
    status: "WT",
    updatedAt: 1,
    currentSeason: 1,
    currentEpisode: 2,
    episodesInSeason: 8,
  },
  {
    key: "the-batman",
    kind: "movie",
    tmdbId: 414906,
    title: "The Batman",
    cover: null,
    status: "WG",
    updatedAt: 3,
    currentMinute: 72,
    runtimeMinutes: 185,
  },
  {
    key: "central-do-brasil",
    kind: "movie",
    tmdbId: 666,
    title: "Central do Brasil",
    cover: null,
    status: "WT",
    updatedAt: 0,
    rating: 3,
  },
  {
    key: "interestelar",
    kind: "movie",
    tmdbId: 0,
    title: "Interestelar",
    cover: null,
    status: "WT",
    updatedAt: 0,
    rating: 5,
  },
  {
    key: "duna-parte-dois",
    kind: "movie",
    tmdbId: 0,
    title: "Duna: Parte Dois",
    cover: null,
    status: "WT",
    updatedAt: 0,
    rating: 4,
  },
  {
    key: "bacurau",
    kind: "movie",
    tmdbId: 594718,
    title: "Bacurau",
    cover: null,
    status: "WT",
    updatedAt: 0,
    rating: 5,
  },
];

const statusOptions = {
  movie: [
    { value: "NW", label: "Want to watch" },
    { value: "WG", label: "Watching" },
    { value: "PA", label: "Paused" },
    { value: "RW", label: "Rewatching" },
    { value: "WT", label: "Watched" },
  ],
  series: [
    { value: "NW", label: "Want to watch" },
    { value: "WT", label: "Watching" },
    { value: "PA", label: "Paused" },
    { value: "RW", label: "Rewatching" },
    { value: "WD", label: "Watched" },
  ],
} satisfies Record<MediaKind, { value: MediaStatus; label: string }[]>;

function isWatching(item: MediaItem) {
  return item.status === (item.kind === "movie" ? "WG" : "WT");
}

function isWatched(item: MediaItem) {
  return item.status === (item.kind === "movie" ? "WT" : "WD");
}

function getStatusLabel(item: MediaItem) {
  return statusOptions[item.kind].find(({ value }) => value === item.status)?.label ?? "Want to watch";
}

function getDetailsItem(item: MediaItem): MediaDetailsItem {
  return {
    kind: item.kind,
    tmdbId: item.tmdbId,
    title: item.title,
    cover: item.cover,
    status: getStatusLabel(item),
    rating: item.rating,
    currentMinute: item.currentMinute,
    currentSeason: item.currentSeason,
    currentEpisode: item.currentEpisode,
  };
}

export function Movies() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaDetailsItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("all");
  const [mediaItems, setMediaItems] = useState(initialMediaItems);
  const lastUpdatedAt = useRef(Date.now());

  useEffect(() => {
    const controller = new AbortController();

    async function loadTmdbPosters() {
      const results = await Promise.all(
        initialMediaItems.map(async (item) => {
          try {
            const query = new URLSearchParams({ type: item.kind, query: item.title });
            const response = await fetch(`/api/v1/media-search/?${query}`, {
              signal: controller.signal,
            });
            if (!response.ok) return null;

            const payload: {
              results: {
                tmdb_id: number;
                title: string;
                poster_url: string | null;
              }[];
            } = await response.json();
            const normalizedTitle = item.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const exactMatch = payload.results.find((result) =>
              result.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normalizedTitle,
            );
            const match =
              (exactMatch?.poster_url ? exactMatch : null) ??
              exactMatch ??
              payload.results.find((result) => result.poster_url) ??
              payload.results[0];

            if (!match) return null;
            return { key: item.key, tmdbId: match.tmdb_id, title: match.title, cover: match.poster_url };
          } catch {
            return null;
          }
        }),
      );

      if (controller.signal.aborted) return;
      setMediaItems((currentItems) =>
        currentItems.map((item) => {
          const tmdbItem = results.find((result) => result?.key === item.key);
          return tmdbItem
            ? { ...item, tmdbId: tmdbItem.tmdbId, title: tmdbItem.title, cover: tmdbItem.cover }
            : item;
        }),
      );
    }

    void loadTmdbPosters();
    return () => controller.abort();
  }, []);

  const filteredItems = mediaItems.filter((item) => {
    if (activeFilter === "movie") return item.kind === "movie";
    if (activeFilter === "series") return item.kind === "series";
    if (activeFilter === "watchlist") return item.status === "NW";
    return true;
  });
  const recentInProgressItems = activeFilter === "all"
    ? filteredItems.filter(isWatching).sort((first, second) => second.updatedAt - first.updatedAt).slice(0, 2)
    : [];
  const recentItemKeys = new Set(recentInProgressItems.map((item) => item.key));
  const libraryItems = filteredItems.filter(
    (item) =>
      !recentItemKeys.has(item.key) &&
      !(activeFilter === "all" && isWatching(item)),
  );

  function openMedia(item: MediaItem) {
    if (!item.tmdbId) return;
    setSelectedMedia(getDetailsItem(item));
  }

  function handleMediaCardKeyDown(
    event: KeyboardEvent<HTMLElement>,
    item: MediaItem,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMedia(item);
    }
  }

  function updateStatus(itemKey: string, status: string) {
    const updatedAt = ++lastUpdatedAt.current;
    setMediaItems((currentItems) =>
      currentItems.map((item) =>
        item.key === itemKey
          ? { ...item, status: status as MediaStatus, updatedAt }
          : item,
      ),
    );
  }

  function updateProgress(
    itemKey: string,
    field: "currentMinute" | "currentSeason" | "currentEpisode",
    value: string,
  ) {
    const updatedAt = ++lastUpdatedAt.current;
    setMediaItems((currentItems) =>
      currentItems.map((item) =>
        item.key === itemKey
          ? { ...item, [field]: value === "" ? undefined : Number(value), updatedAt }
          : item,
      ),
    );
  }

  function saveProgress(itemKey: string) {
    const updatedAt = ++lastUpdatedAt.current;
    setMediaItems((currentItems) =>
      currentItems.map((item) =>
        item.key === itemKey ? { ...item, updatedAt } : item,
      ),
    );
  }

  function renderProgressEditor(item: MediaItem) {
    if (!isWatching(item)) return null;

    return (
      <div
        className={styles.progressEditor}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {item.kind === "movie" ? (
          <label>
            Minute
            <input
              type="number"
              min="0"
              aria-label={`Current minute for ${item.title}`}
              value={item.currentMinute ?? ""}
              onChange={(event) => updateProgress(item.key, "currentMinute", event.currentTarget.value)}
            />
          </label>
        ) : (
          <>
            <label>
              Season
              <input
                type="number"
                min="1"
                aria-label={`Current season for ${item.title}`}
                value={item.currentSeason ?? ""}
                onChange={(event) => updateProgress(item.key, "currentSeason", event.currentTarget.value)}
              />
            </label>
            <label>
              Episode
              <input
                type="number"
                min="1"
                aria-label={`Current episode for ${item.title}`}
                value={item.currentEpisode ?? ""}
                onChange={(event) => updateProgress(item.key, "currentEpisode", event.currentTarget.value)}
              />
            </label>
          </>
        )}
        <DefaultButton
          size="sm"
          onClick={() => saveProgress(item.key)}
        >
          Save
        </DefaultButton>
        <div className={styles.cardStatus}>
          <Select
            compact
            className={styles.statusSelect}
            value={item.status}
            aria-label={`Status for ${item.title}`}
            onChange={(event) => updateStatus(item.key, event.currentTarget.value)}
          >
            {statusOptions[item.kind].map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>
      </div>
    );
  }

  async function handleSalvarMidia(_dados: unknown) {
    setIsModalOpen(false);
  }

  const filterCounts: Record<MediaFilter, number> = {
    all: mediaItems.length,
    movie: mediaItems.filter((item) => item.kind === "movie").length,
    series: mediaItems.filter((item) => item.kind === "series").length,
    watchlist: mediaItems.filter((item) => item.status === "NW").length,
  };
  const filters: { value: MediaFilter; label: string }[] = [
    { value: "all", label: `All (${filterCounts.all})` },
    { value: "movie", label: `Movies (${filterCounts.movie})` },
    { value: "series", label: `Series (${filterCounts.series})` },
    { value: "watchlist", label: `Watchlist (${filterCounts.watchlist})` },
  ];

  return (
    <>
      <main className={styles.moviesPage}>
        <section className={styles.pageIntro}>
          <div>
            <h1>Movies &amp; Series</h1>
            <p>[n] movies · [n] series · [n] hours watched</p>
          </div>
          <DefaultButton
            size="sm"
            icon={<Plus aria-hidden="true" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add movie or series
          </DefaultButton>
        </section>

        <Card
          as="nav"
          compact
          className={styles.filters}
          aria-label="Movie and series filters"
        >
          <div className={styles.filterPills}>
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={activeFilter === filter.value ? styles.activeFilter : ""}
                aria-pressed={activeFilter === filter.value}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className={styles.filterControls}>
            <label>
              Year
              <Select compact defaultValue="2026" aria-label="Filter by year">
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </Select>
            </label>
            <label>
              Genre
              <Select compact defaultValue="all" aria-label="Filter by genre">
                <option value="all">All</option>
                <option value="action">Action</option>
                <option value="comedy">Comedy</option>
                <option value="drama">Drama</option>
              </Select>
            </label>
          </div>
        </Card>

        {recentInProgressItems.length > 0 && (
          <section className={styles.inProgressSection}>
            <h2>Recently in progress</h2>
            <div className={styles.seriesGrid}>
              {recentInProgressItems.map((item) => (
                <Card
                  as="article"
                  className={styles.seriesCard}
                  key={item.key}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="dialog"
                  aria-label={`View ${item.title} details`}
                  onClick={() => openMedia(item)}
                  onKeyDown={(event) => handleMediaCardKeyDown(event, item)}
                >
                  {item.cover ? (
                    <img className={styles.seriesPoster} src={item.cover} alt={`${item.title} poster`} />
                  ) : (
                    <div className={`${styles.seriesPoster} ${styles.posterPlaceholder}`} aria-label="Poster loading" />
                  )}
                  <div className={styles.seriesDetails}>
                    <h3>{item.title}</h3>
                    {item.kind === "movie" && item.currentMinute != null && item.runtimeMinutes != null ? (
                      <>
                        <div className={styles.progressHeader}>
                          <span>Minute {item.currentMinute} of {item.runtimeMinutes} min</span>
                          <strong>{Math.round((item.currentMinute / item.runtimeMinutes) * 100)}%</strong>
                        </div>
                        <ProgressBar
                          value={item.currentMinute}
                          max={item.runtimeMinutes}
                          className={styles.progress}
                        />
                        <small>{item.runtimeMinutes - item.currentMinute} min left</small>
                      </>
                    ) : item.kind === "series" && item.currentEpisode != null && item.episodesInSeason != null ? (
                      <>
                        <div className={styles.progressHeader}>
                          <span>S{item.currentSeason} · ep. {item.currentEpisode} of {item.episodesInSeason}</span>
                          <strong>{Math.round((item.currentEpisode / item.episodesInSeason) * 100)}%</strong>
                        </div>
                        <ProgressBar value={item.currentEpisode} max={item.episodesInSeason} className={styles.progress} />
                        <small>{item.episodesInSeason - item.currentEpisode} episodes left this season</small>
                      </>
                    ) : (
                      <p>Progress not set</p>
                    )}
                    {renderProgressEditor(item)}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className={styles.watchedSection}>
          <h2>{activeFilter === "watchlist" ? "Watchlist" : "Library"}</h2>
          {libraryItems.length > 0 ? (
            <div className={styles.watchedGrid}>
              {libraryItems.map((item) => (
                <Card
                  as="article"
                  className={styles.watchedItem}
                  key={item.key}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="dialog"
                  aria-label={`View ${item.title} details`}
                  onClick={() => openMedia(item)}
                  onKeyDown={(event) => handleMediaCardKeyDown(event, item)}
                >
                  {item.cover ? (
                    <img src={item.cover} alt={`${item.title} poster`} loading="lazy" />
                  ) : (
                    <div className={styles.posterPlaceholder} aria-label="Poster loading" />
                  )}
                  <h3>{item.title}</h3>
                  <p>{item.kind === "series" ? "Series" : "Movie"} · [year]</p>
                  {isWatched(item) && item.rating != null ? (
                    <strong>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</strong>
                  ) : (
                    <small className={styles.statusLabel}>{getStatusLabel(item)}</small>
                  )}
                  {renderProgressEditor(item)}
                  {!isWatched(item) && (
                    <div className={styles.cardStatus} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                      <Select
                        compact
                        className={styles.statusSelect}
                        value={item.status}
                        aria-label={`Status for ${item.title}`}
                        onChange={(event) => updateStatus(item.key, event.currentTarget.value)}
                      >
                        {statusOptions[item.kind].map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>There are no titles in this section yet.</p>
          )}
        </section>
      </main>

      <FormModal
        open={isModalOpen}
        title="Log a movie or series"
        description="Track what you watched, are watching, or want to watch."
        onClose={() => setIsModalOpen(false)}
      >
        <MediaForm
          initial={undefined}
          onSubmit={handleSalvarMidia}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
      <MediaDetailsModal
        item={selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </>
  );
}
