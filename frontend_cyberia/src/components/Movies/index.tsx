import { useQueries } from "@tanstack/react-query";
import { useCollection } from "../../hooks/useCollections";
import { apiFetch, deleteCollectionItem } from "../../services/collections";
import { LoadingPlaceholder } from "../LoadingPlaceholder";
import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { Plus, Search, SquarePen } from "lucide-react";
import { MediaForm } from "../../forms";
import type { MediaFormData, MediaSubmission } from "../../forms/MediaForm";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import { HorizontalCarousel } from "../HorizontalCarousel";
import {
  MediaDetailsModal,
  type MediaDetailsItem,
} from "../MediaDetailsModal";
import { ProgressBar } from "../ProgressBar";
import { Select } from "../Select";
import styles from "./styles.module.css";

type MediaKind = "movie" | "series";
type MediaStatus = "NW" | "WG" | "WT" | "PA" | "RW" | "WD";
type MediaFilter = "all" | "watching" | "wantToWatch" | "watched";

type MediaItem = {
  key: string;
  persistedId?: number;
  kind: MediaKind;
  tmdbId: number;
  title: string;
  year?: number | null;
  genre?: string;
  cover: string | null;
  synopsis: string;
  status: MediaStatus;
  updatedAt: number;
  rating?: number;
  currentMinute?: number;
  runtimeMinutes?: number;
  currentSeason?: number;
  currentEpisode?: number;
  episodesInSeason?: number;
  seasonEpisodeCounts?: Record<number, number>;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
};

type MediaProgress = {
  currentMinute?: number;
  currentSeason?: number;
  currentEpisode?: number;
};

type TmdbProgressDetails = {
  runtime: number | null;
  seasons: { number: number; episode_count: number }[];
};

async function fetchProgressDetails(item: MediaItem) {
  if (!isWatching(item) || !item.tmdbId) return null;

  const response = await apiFetch(`/api/v1/tmdb/${item.kind}/${item.tmdbId}/`);
  if (!response.ok) return null;

  const details: TmdbProgressDetails = await response.json();
  return {
    runtimeMinutes: details.runtime ?? undefined,
    seasonEpisodeCounts: Object.fromEntries(
      details.seasons.map((season) => [season.number, season.episode_count]),
    ),
  };
}

type ProgressDetails = NonNullable<Awaited<ReturnType<typeof fetchProgressDetails>>>;

function withProgressDetails(item: MediaItem, details: ProgressDetails): MediaItem {
  return {
    ...item,
    ...details,
    episodesInSeason: details.seasonEpisodeCounts[item.currentSeason ?? 1] ?? item.episodesInSeason,
  };
}

type MediaApiResponse = {
  id: number;
  title: string;
  genre: string;
  year?: number | null;
  start_year?: number | null;
  status: MediaStatus;
  tmdb_id: number | null;
  tmdb_poster_path: string | null;
  cover: string | null;
  tmdb_synopsis?: string;
  current_minute?: number | null;
  current_season?: number | null;
  current_episode?: number | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  sources?: { format: string; location: string | null; url: string | null }[];
};

function apiItemToMediaItem(item: MediaApiResponse, kind: MediaKind): MediaItem {
  return {
    key: `${kind}-${item.id}`,
    persistedId: item.id,
    kind,
    tmdbId: item.tmdb_id ?? 0,
    title: item.title,
    year: kind === "movie" ? item.year : item.start_year,
    genre: item.genre,
    cover: item.cover || (item.tmdb_poster_path
      ? `https://image.tmdb.org/t/p/w500${item.tmdb_poster_path}`
      : null),
    synopsis: item.tmdb_synopsis ?? "",
    status: item.status,
    updatedAt: item.id,
    currentMinute: item.current_minute ?? undefined,
    currentSeason: item.current_season ?? undefined,
    currentEpisode: item.current_episode ?? undefined,
    numberOfSeasons: item.number_of_seasons ?? undefined,
    numberOfEpisodes: item.number_of_episodes ?? undefined,
  };
}

function mediaApiError(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(mediaApiError).join(" ");
  if (data && typeof data === "object") {
    return Object.entries(data).map(([field, value]) => `${field}: ${mediaApiError(value)}`).join("; ");
  }
  return "Unable to save this title.";
}

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
    persistedId: item.persistedId,
    tmdbId: item.tmdbId,
    title: item.title,
    cover: item.cover,
    synopsis: item.synopsis,
    year: item.year ? String(item.year) : undefined,
    genre: item.genre,
    runtimeMinutes: item.runtimeMinutes,
    numberOfSeasons: item.numberOfSeasons,
    numberOfEpisodes: item.numberOfEpisodes,
    seasonEpisodeCounts: item.seasonEpisodeCounts,
    status: getStatusLabel(item),
    rating: item.rating,
    currentMinute: item.currentMinute,
    currentSeason: item.currentSeason,
    currentEpisode: item.currentEpisode,
  };
}

function MediaProgressEditor({
  item,
  error,
  onSave,
  onEdit,
}: {
  item: MediaItem;
  error: string;
  onSave: (item: MediaItem, progress: MediaProgress) => Promise<void>;
  onEdit: (item: MediaItem) => void;
}) {
  const [minute, setMinute] = useState(String(item.currentMinute ?? ""));
  const [season, setSeason] = useState(String(item.currentSeason ?? ""));
  const [episode, setEpisode] = useState(String(item.currentEpisode ?? ""));
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave(item, item.kind === "movie"
        ? { currentMinute: minute === "" ? undefined : Number(minute) }
        : {
            currentSeason: season === "" ? undefined : Number(season),
            currentEpisode: episode === "" ? undefined : Number(episode),
          });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className={styles.progressEditor}
      onSubmit={(event) => void save(event)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {item.kind === "movie" ? (
        <label>
          Minute
          <input
            type="number"
            min="0"
            max={item.runtimeMinutes}
            aria-label={`Current minute for ${item.title}`}
            value={minute}
            onChange={(event) => setMinute(event.currentTarget.value)}
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
              value={season}
              onChange={(event) => setSeason(event.currentTarget.value)}
            />
          </label>
          <label>
            Episode
            <input
              type="number"
              min="1"
              max={item.seasonEpisodeCounts?.[Number(season)]}
              aria-label={`Current episode for ${item.title}`}
              value={episode}
              onChange={(event) => setEpisode(event.currentTarget.value)}
            />
          </label>
        </>
      )}
      <DefaultButton type="submit" size="sm" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </DefaultButton>
      <button
        type="button"
        className={styles.editStatusButton}
        aria-label={`Edit ${item.title}`}
        title="Edit"
        onClick={() => onEdit(item)}
      >
        <SquarePen size={15} aria-hidden="true" />
      </button>
      {error && <small role="alert">{error}</small>}
    </form>
  );
}

export function Movies() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<{
    item: MediaItem; initial: Partial<MediaFormData>;
  } | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaDetailsItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("all");
  const moviesQuery = useCollection<MediaApiResponse>("movies");
  const seriesQuery = useCollection<MediaApiResponse>("series");
  const loading = moviesQuery.loading || seriesQuery.loading;
  const loadError = moviesQuery.error || seriesQuery.error;
  const [presentation, setPresentation] = useState<Record<string, Partial<Pick<MediaItem,
    "updatedAt" | "rating" | "episodesInSeason"
  >>>>({});
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [progressErrors, setProgressErrors] = useState<Record<string, string>>({});
  const savedItems = useMemo(() => [
    ...moviesQuery.data.map((item) => apiItemToMediaItem(item, "movie")),
    ...seriesQuery.data.map((item) => apiItemToMediaItem(item, "series")),
  ], [moviesQuery.data, seriesQuery.data]);
  const watching = savedItems.filter((item) => isWatching(item) && item.tmdbId);
  const detailsQueries = useQueries({ queries: watching.map((item) => ({
    queryKey: ["tmdb-progress", item.kind, item.tmdbId],
    queryFn: () => fetchProgressDetails(item),
    staleTime: 60 * 60_000,
  })) });
  const detailsByKey = new Map(watching.map((item, index) => [item.key, detailsQueries[index].data]));
  const mediaItems = savedItems.map((item) => {
    const enriched = { ...item, ...presentation[item.key] };
    const details = detailsByKey.get(item.key);
    return details ? withProgressDetails(enriched, details) : enriched;
  });

  const filteredItems = mediaItems.filter((item) => {
    if (search && !item.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) return false;
    if (yearFilter && String(item.year ?? "") !== yearFilter) return false;
    if (genreFilter && item.genre !== genreFilter) return false;
    if (activeFilter === "watching") return isWatching(item);
    if (activeFilter === "wantToWatch") return item.status === "NW";
    if (activeFilter === "watched") return isWatched(item);
    return true;
  });
  const availableYears = [...new Set(mediaItems.map((item) => item.year).filter((year): year is number => year != null))].sort((a, b) => b - a);
  const availableGenres = [...new Set(mediaItems.map((item) => item.genre).filter((genre): genre is string => !!genre))].sort();
  const watchingItems = filteredItems
    .filter(isWatching)
    .sort((first, second) => second.updatedAt - first.updatedAt);
  const recentInProgressItems = activeFilter === "all" ? watchingItems.slice(0, 2) : watchingItems;
  const recentItemKeys = new Set(recentInProgressItems.map((item) => item.key));
  const libraryItems = filteredItems.filter(
    (item) =>
      !recentItemKeys.has(item.key) &&
      !(activeFilter === "all" && isWatching(item)),
  );

  function openMedia(item: MediaItem) {
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

  function openMediaForm(item?: MediaItem) {
    if (item) {
      const original = (item.kind === "movie" ? moviesQuery.data : seriesQuery.data)
        .find((entry) => entry.id === item.persistedId);
      if (!original) return;
      setEditingMedia({ item, initial: {
        kind: item.kind,
        title: item.title,
        year: item.year == null ? "" : String(item.year),
        genre: item.genre ?? "",
        status: isWatched(item) ? "WATCHED" : isWatching(item) ? "WATCHING"
          : item.status === "NW" ? "WANT" : item.status,
        tmdb_id: original.tmdb_id,
        tmdb_poster_path: original.tmdb_poster_path,
        tmdb_synopsis: original.tmdb_synopsis ?? "",
        poster_url: item.cover,
        current_minute: String(item.currentMinute ?? ""),
        current_season: String(item.currentSeason ?? ""),
        episode: String(item.currentEpisode ?? ""),
        season_episodes: Array.from({ length: item.numberOfSeasons ?? 1 }, (_, index) =>
          String(item.seasonEpisodeCounts?.[index + 1] ?? "")),
        rating: item.rating ?? 0,
        sources: (original.sources ?? []).map((source) => ({
          format: source.format, location: source.location ?? "", url: source.url ?? "",
        })),
      } });
    } else {
      setEditingMedia(null);
    }
    setIsModalOpen(true);
  }

  async function saveProgress(item: MediaItem, progress: MediaProgress) {
    if (!item.persistedId) return;

    const body = item.kind === "movie"
      ? { current_minute: progress.currentMinute ?? null }
      : { current_season: progress.currentSeason ?? null, current_episode: progress.currentEpisode ?? null };
    const csrf = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("csrftoken="))
      ?.split("=")[1];

    try {
      const response = await apiFetch(`/api/v1/${item.kind === "movie" ? "movies" : "series"}/${item.persistedId}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error ? mediaApiError(error) : `Request failed (${response.status}).`);
      }

      setPresentation((current) => ({
        ...current, [item.key]: { ...current[item.key], updatedAt: Date.now() },
      }));
      setProgressErrors((errors) => ({ ...errors, [item.key]: "" }));
    } catch (error) {
      setProgressErrors((errors) => ({
        ...errors,
        [item.key]: error instanceof Error ? error.message : "Could not save progress.",
      }));
    }
  }

  async function handleSalvarMidia(data: MediaSubmission) {
    const body = new FormData();
    body.append("title", data.title.trim());
    body.append("genre", data.genre);
    body.append("status", data.status);
    body.append("sources", JSON.stringify(data.sources));
    if (data.year !== null) body.append(data.kind === "movie" ? "year" : "start_year", String(data.year));
    if (data.tmdb_id !== null) body.append("tmdb_id", String(data.tmdb_id));
    if (data.tmdb_poster_path) body.append("tmdb_poster_path", data.tmdb_poster_path);
    body.append("tmdb_synopsis", data.tmdb_synopsis);
    if (data.poster) body.append("cover", data.poster);
    if (data.kind === "movie") {
      if (data.current_minute !== null) body.append("current_minute", String(data.current_minute));
    } else {

      const initialCounts = editingMedia?.initial.season_episodes ?? [];
      const initialSeasons = initialCounts.flatMap((count, index) =>
        count === "" ? [] : [{ number: index + 1, episode_count: Number(count) }]);
      const countsChanged = !editingMedia || data.number_of_seasons !== initialCounts.length
        || JSON.stringify(data.seasons) !== JSON.stringify(initialSeasons);
      if (countsChanged) {
        if (data.number_of_seasons !== null) body.append("number_of_seasons", String(data.number_of_seasons));
        if (data.number_of_episodes !== null) body.append("number_of_episodes", String(data.number_of_episodes));
      }
      if (data.current_season !== null) body.append("current_season", String(data.current_season));
      if (data.current_episode !== null) body.append("current_episode", String(data.current_episode));
    }

    const csrf = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("csrftoken="))
      ?.split("=")[1];
    const collection = data.kind === "movie" ? "movies" : "series";
    const endpoint = editingMedia
      ? `/api/v1/${collection}/${editingMedia.item.persistedId}/`
      : `/api/v1/${collection}/`;
    const response = await apiFetch(endpoint, {
      method: editingMedia ? "PATCH" : "POST",
      body,
      credentials: "include",
      headers: csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {},
    });
    const result: MediaApiResponse | Record<string, unknown> | null = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result ? mediaApiError(result) : `Request failed (${response.status}).`);
    }

    const saved = apiItemToMediaItem(result as MediaApiResponse, data.kind);
    setPresentation((current) => ({
      ...current,
      [saved.key]: {
        rating: data.rating ?? undefined,
        updatedAt: Date.now(),
        episodesInSeason: data.seasons.find((season) => season.number === data.current_season)?.episode_count,
      },
    }));
    setProgressErrors((errors) => ({ ...errors, [saved.key]: "" }));
    setActiveFilter("all");
    setSearch("");
    setYearFilter("");
    setGenreFilter("");
    setIsModalOpen(false);
  }

  const filterCounts: Record<MediaFilter, number> = {
    all: mediaItems.length,
    watching: mediaItems.filter(isWatching).length,
    wantToWatch: mediaItems.filter((item) => item.status === "NW").length,
    watched: mediaItems.filter(isWatched).length,
  };
  const filters: { value: MediaFilter; label: string }[] = [
    { value: "all", label: `All (${filterCounts.all})` },
    { value: "watching", label: `Watching (${filterCounts.watching})` },
    { value: "wantToWatch", label: `Want to watch (${filterCounts.wantToWatch})` },
    { value: "watched", label: `Watched (${filterCounts.watched})` },
  ];

  return (
    <>
      <main className={styles.moviesPage}>
        <section className={styles.pageIntro}>
          <div>
            <h1>Movies &amp; Series</h1>
            <p>{mediaItems.filter((item) => item.kind === "movie").length} movies · {mediaItems.filter((item) => item.kind === "series").length} series</p>
          </div>
          <div className={styles.pageActions}>
            <label className={styles.searchBox}>
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search your library"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
            </label>
            <DefaultButton
              size="sm"
              icon={<Plus aria-hidden="true" />}
              onClick={() => openMediaForm()}
            >
              Add movie or series
            </DefaultButton>
          </div>
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
              <Select compact value={yearFilter} onChange={(event) => setYearFilter(event.currentTarget.value)} aria-label="Filter by year">
                <option value="">All</option>
                {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </Select>
            </label>
            <label>
              Genre
              <Select compact value={genreFilter} onChange={(event) => setGenreFilter(event.currentTarget.value)} aria-label="Filter by genre">
                <option value="">All</option>
                {availableGenres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </Select>
            </label>
          </div>
        </Card>

        {loading && <LoadingPlaceholder />}
        {loadError && <p role="alert">{loadError} Reload the page to retry.</p>}

        {!loading && !loadError && recentInProgressItems.length > 0 && (
          <Card title={activeFilter === "watching" ? "Watching" : "Recently in progress"} className={`${styles.sectionPanel} ${styles.inProgressSection}`}>
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
                    <div className={`${styles.seriesPoster} ${styles.posterPlaceholder}`} aria-label="No poster available" />
                  )}
                  <div className={styles.seriesDetails}>
                    <h3>{item.title}</h3>
                    {item.kind === "movie" && item.currentMinute != null && item.runtimeMinutes != null && item.runtimeMinutes > 0 ? (
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
                        <small>{Math.max(0, item.runtimeMinutes - item.currentMinute)} min left</small>
                      </>
                    ) : item.kind === "series" && item.currentEpisode != null && item.episodesInSeason != null && item.episodesInSeason > 0 ? (
                      <>
                        <div className={styles.progressHeader}>
                          <span>S{item.currentSeason} · ep. {item.currentEpisode} of {item.episodesInSeason}</span>
                          <strong>{Math.round((item.currentEpisode / item.episodesInSeason) * 100)}%</strong>
                        </div>
                        <ProgressBar value={item.currentEpisode} max={item.episodesInSeason} className={styles.progress} />
                        <small>{Math.max(0, item.episodesInSeason - item.currentEpisode)} episodes left this season</small>
                      </>
                    ) : (
                      <p>{item.kind === "movie"
                        ? item.currentMinute == null ? "Set the current minute" : "Loading or unavailable runtime"
                        : item.currentEpisode == null ? "Set the current episode" : "Loading or unavailable episode count"}</p>
                    )}
                    <MediaProgressEditor
                      key={`${item.key}-${item.currentMinute}-${item.currentSeason}-${item.currentEpisode}`}
                      item={item}
                      error={progressErrors[item.key] ?? ""}
                      onSave={saveProgress}
                      onEdit={openMediaForm}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {!loading && !loadError && (libraryItems.length > 0 ? (
          <Card title={activeFilter === "wantToWatch" ? "Want to watch" : activeFilter === "watched" ? "Watched" : "Library"} className={`${styles.sectionPanel} ${styles.watchedSection}`}>
            <HorizontalCarousel label="Movies and series library carousel">
              {libraryItems.map((item) => (
                <article
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
                    <img src={item.cover} alt={`${item.title} poster`} loading="lazy" draggable={false} />
                  ) : (
                    <div className={styles.posterPlaceholder} aria-label="No poster available" />
                  )}
                  <h3>{item.title}</h3>
                  <p>{item.kind === "series" ? "Series" : "Movie"}{item.year ? ` · ${item.year}` : ""}</p>
                  {isWatched(item) && item.rating != null && (
                    <strong>{"\u2605".repeat(item.rating)}{"\u2606".repeat(5 - item.rating)}</strong>
                  )}
                  {isWatching(item) && (
                    <MediaProgressEditor
                      key={`${item.key}-${item.currentMinute}-${item.currentSeason}-${item.currentEpisode}`}
                      item={item}
                      error={progressErrors[item.key] ?? ""}
                      onSave={saveProgress}
                      onEdit={openMediaForm}
                    />
                  )}
                  <div className={styles.shelfStatusRow}>
                    <span className={styles.mediaBadge}>
                      <span aria-hidden="true" />{getStatusLabel(item)}
                    </span>
                    {!isWatching(item) && (
                      <button
                        type="button"
                        className={styles.editStatusButton}
                        aria-label={`Edit ${item.title}`}
                        title="Edit"
                        onClick={(event) => { event.stopPropagation(); openMediaForm(item); }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <SquarePen size={15} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {!isWatching(item) && progressErrors[item.key] && (
                    <small role="alert">{progressErrors[item.key]}</small>
                  )}
                </article>
              ))}
            </HorizontalCarousel>
          </Card>
        ) : recentInProgressItems.length > 0 ? null : (
          <p className={styles.emptyState}>
            {mediaItems.length === 0 ? "Your library is empty. Add your first movie or series." : "No titles match these filters."}
          </p>
        ))}
      </main>

      <FormModal
        open={isModalOpen}
        title={editingMedia ? `Edit ${editingMedia.item.title}` : "Log a movie or series"}
        description="Track what you watched, are watching, or want to watch."
        onClose={() => setIsModalOpen(false)}
      >
        <MediaForm
          key={editingMedia?.item.key ?? "new"}
          initial={editingMedia?.initial}
          lockKind={!!editingMedia}
          onSubmit={handleSalvarMidia}
          onCancel={() => setIsModalOpen(false)}
          onDelete={editingMedia?.item.persistedId ? async () => {
            await deleteCollectionItem(editingMedia.item.kind === "movie" ? "movies" : "series", editingMedia.item.persistedId!);
            setSelectedMedia(null);
            setIsModalOpen(false);
            setEditingMedia(null);
          } : undefined}
        />
      </FormModal>
      <MediaDetailsModal
        item={selectedMedia}
        onClose={() => setSelectedMedia(null)}

      />
    </>
  );
}
