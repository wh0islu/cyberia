import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import {
  Field,
  Segmented,
  Stars,
  ImageDrop,
  SourcesField,
  FormFooter,
  type FormSource,
  type CleanedSource,
  type SourceFormat,
} from "../../components/FormFields";
import { cleanSources } from "../../components/FormFields/sources";
import { ScrollArea } from "../../components/ScrollArea";
import { Select } from "../../components/Select";
import { DatePicker } from "../../components/DatePicker";

type MediaKind = "movie" | "series";

export type MediaFormData = {
  kind: MediaKind;
  poster: File | null;
  tmdb_id: number | null;
  tmdb_poster_path: string | null;
  tmdb_synopsis: string;
  poster_url: string | null;
  title: string;
  year: string;
  genre: string;
  status: string;
  current_minute: string;
  current_season: string;
  episode: string;
  season_episodes: string[];
  rating: number;
  watched_at: string;
  comment: string;
  sources: FormSource[];
};

export type MediaSubmission = Omit<
  MediaFormData,
  "year" | "current_minute" | "current_season" | "episode" | "season_episodes" | "rating" | "watched_at" | "sources" | "poster_url"
> & {
  year: number | null;
  current_minute: number | null;
  current_season: number | null;
  current_episode: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  seasons: { number: number; episode_count: number }[];
  rating: number | null;
  watched_at: string | null;
  sources: CleanedSource[];
};

type TmdbResult = {
  tmdb_id: number;
  title: string;
  year: string | null;
  tmdb_poster_path: string | null;
  poster_url: string | null;
  genres: string[];
  overview: string;
};

type TmdbSeriesDetails = {
  tmdb_id: number;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: { number: number; episode_count: number }[];
};

type MediaFormProps = {
  initial?: Partial<MediaFormData>;
  onSubmit: (data: MediaSubmission) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  lockKind?: boolean;
};

type StringField = {
  [Key in keyof MediaFormData]: MediaFormData[Key] extends string ? Key : never;
}[keyof MediaFormData];


const MEDIA_FORMATS: SourceFormat[] = [
  { value: "STR", label: "Streaming", location: { label: "Service", placeholder: "E.g., Netflix, Hulu" }, url: { label: "Link" } },
  { value: "FILE", label: "File", location: { label: "Folder or device", placeholder: "E.g., external drive/Movies" }, url: null },
  { value: "DVD", label: "DVD", location: { label: "Location", placeholder: "E.g., living room shelf" }, url: null },
  { value: "BR", label: "Blu-ray", location: { label: "Location", placeholder: "E.g., living room shelf" }, url: null },
];

const KINDS = [
  { value: "movie", label: "Movie" },
  { value: "series", label: "Series" },
];

const STATUS = [
  { value: "WANT", label: "Want to watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "WATCHED", label: "Watched" },
  { value: "PA", label: "Paused" },
  { value: "RW", label: "Rewatching" },
];

const GENRES = ["Drama", "Comedy", "Action", "Documentary", "Animation", "Horror", "Science fiction"];

const empty: MediaFormData = {
  kind: "movie",
  poster: null,
  tmdb_id: null,
  tmdb_poster_path: null,
  tmdb_synopsis: "",
  poster_url: null,
  title: "",
  year: "",
  genre: "",
  status: "WANT",
  current_minute: "",
  current_season: "",
  episode: "",
  season_episodes: [""],
  rating: 0,
  watched_at: "",
  comment: "",
  sources: [{ format: "STR", location: "", url: "" }],
};





export function MediaForm({
  initial,
  onSubmit,
  onCancel,
  onDelete,
  lockKind = false,
}: MediaFormProps) {
  const [data, setData] = useState<MediaFormData>({ ...empty, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbResult[]>([]);
  const [tmdbGenreOptions, setTmdbGenreOptions] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [seriesDetails, setSeriesDetails] = useState<TmdbSeriesDetails | null>(null);
  const [loadingSeriesDetails, setLoadingSeriesDetails] = useState(false);
  const [seriesDetailsError, setSeriesDetailsError] = useState("");
  const [editingSeriesDetails, setEditingSeriesDetails] = useState(false);
  const seriesDetailsController = useRef<AbortController | null>(null);

  useEffect(() => () => seriesDetailsController.current?.abort(), []);
  const set = <Key extends keyof MediaFormData>(key: Key) =>
    (value: MediaFormData[Key]) =>
      setData((previousData) => ({ ...previousData, [key]: value }));
  const setFromInput = (key: StringField) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      const value = event.currentTarget.value;
      setData((previousData) => ({
        ...previousData,
        [key]: value,
      }));
    };

  const isSeries = data.kind === "series";
  const toNum = (value: string) => (value === "" ? null : Number(value));

  useEffect(() => {
    const query = data.title.trim();
    if (query.length < 2 || data.tmdb_id !== null) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const params = new URLSearchParams({
          type: data.kind,
          query,
        });
        const response = await fetch(`/api/v1/media-search/?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail || "Search is unavailable.");
        }
        setTmdbResults(payload.results ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTmdbResults([]);
        setSearchError(error instanceof Error ? error.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [data.kind, data.title, data.tmdb_id]);

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const title = event.currentTarget.value;
    seriesDetailsController.current?.abort();
    setSeriesDetails(null);
    setEditingSeriesDetails(false);
    setLoadingSeriesDetails(false);
    setSeriesDetailsError("");
    setTmdbResults([]);
    setSearching(false);
    setSearchError("");
    setData((previousData) => ({
      ...previousData,
      title,
      genre: "",
      tmdb_id: null,
      tmdb_poster_path: null,
      tmdb_synopsis: "",
      poster_url: null,
      season_episodes: [""],
      current_minute: "",
      current_season: "",
      episode: "",
    }));
    setTmdbGenreOptions([]);
  }

  async function selectTmdbResult(result: TmdbResult) {
    seriesDetailsController.current?.abort();
    setSeriesDetails(null);
    setEditingSeriesDetails(false);
    setSeriesDetailsError("");
    setData((previousData) => ({
      ...previousData,
      title: result.title,
      year: result.year ?? previousData.year,
      genre: result.genres[0] ?? "",
      tmdb_id: result.tmdb_id,
      tmdb_poster_path: result.tmdb_poster_path,
      tmdb_synopsis: result.overview ?? "",
      poster_url: result.poster_url,
      poster: null,
      ...(data.kind === "series" ? { season_episodes: [""] } : {}),
    }));
    setTmdbGenreOptions(result.genres);
    setTmdbResults([]);
    setSearching(false);
    setSearchError("");

    if (data.kind !== "series") return;

    const controller = new AbortController();
    seriesDetailsController.current = controller;
    setLoadingSeriesDetails(true);
    try {
      const response = await fetch(`/api/v1/tmdb/series/${result.tmdb_id}/`, {
        signal: controller.signal,
      });
      const details: TmdbSeriesDetails & { detail?: string } = await response.json();
      if (!response.ok) throw new Error(details.detail || "Could not load series details.");

      setSeriesDetails(details);
      setData((previousData) => previousData.tmdb_id === result.tmdb_id
        ? {
            ...previousData,
            season_episodes: details.seasons.length
              ? details.seasons.map((season) => season.episode_count ? String(season.episode_count) : "")
              : [""],
          }
        : previousData);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSeriesDetailsError(error instanceof Error ? error.message : "Could not load series details.");
    } finally {
      if (!controller.signal.aborted) setLoadingSeriesDetails(false);
    }
  }

  function changeMediaKind(kind: string) {
    seriesDetailsController.current?.abort();
    setSeriesDetails(null);
    setEditingSeriesDetails(false);
    setLoadingSeriesDetails(false);
    setSeriesDetailsError("");
    setData((previousData) => ({
      ...previousData,
      kind: kind as MediaKind,
      genre: "",
      tmdb_id: null,
      tmdb_poster_path: null,
      tmdb_synopsis: "",
      poster_url: null,
      season_episodes: [""],
      current_minute: "",
      current_season: "",
      episode: "",
    }));
    setTmdbGenreOptions([]);
    setTmdbResults([]);
    setSearching(false);
    setSearchError("");
  }

  function updateSeasonEpisodes(index: number, episodeCount: string) {
    setData((previousData) => ({
      ...previousData,
      season_episodes: previousData.season_episodes.map((count, seasonIndex) =>
        seasonIndex === index ? episodeCount : count,
      ),
    }));
  }

  function addSeason() {
    setData((previousData) => ({
      ...previousData,
      season_episodes: [...previousData.season_episodes, ""],
    }));
  }

  function removeSeason(index: number) {
    setData((previousData) => ({
      ...previousData,
      season_episodes:
        previousData.season_episodes.length > 1
          ? previousData.season_episodes.filter((_, seasonIndex) => seasonIndex !== index)
          : [""],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const { season_episodes, ...formData } = data;
      const status = data.status === "WANT"
        ? "NW"
        : data.status === "WATCHING"
          ? (isSeries ? "WT" : "WG")
          : data.status === "WATCHED"
            ? (isSeries ? "WD" : "WT")
            : data.status;
      await onSubmit({
        ...formData,
        year: toNum(data.year),
        status,
        current_minute: !isSeries && data.status === "WATCHING" ? toNum(data.current_minute) : null,
        current_season: isSeries && data.status === "WATCHING" ? toNum(data.current_season) : null,
        current_episode: isSeries && data.status === "WATCHING" ? toNum(data.episode) : null,
        number_of_seasons: isSeries ? season_episodes.length : null,
        number_of_episodes: isSeries
          ? season_episodes.reduce((total, count) => total + (toNum(count) ?? 0), 0)
          : null,
        seasons: isSeries
          ? season_episodes.flatMap((episodeCount, index) => {
              const count = toNum(episodeCount);
              return count === null
                ? []
                : [{ number: index + 1, episode_count: count }];
            })
          : [],
        rating: data.status === "WATCHED" && data.rating ? data.rating : null,
        watched_at: data.status === "WATCHED" ? data.watched_at || null : null,
        sources: cleanSources(data.sources, MEDIA_FORMATS),
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save this title.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ScrollArea className="form__body">
        {!lockKind && <Segmented hideLabel label="Type" options={KINDS} value={data.kind} onChange={changeMediaKind} />}

        <div className="row row--nowrap">
          <ImageDrop label="Add poster" shape="cover" value={data.poster} imageUrl={data.poster_url} onChange={set("poster")} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Title" required full>
              <input
                className="in"
                required
                autoFocus
                placeholder={isSeries ? "E.g., Breaking Bad" : "E.g., Inception"}
                value={data.title}
                onChange={handleTitleChange}
              />
            </Field>
            {(searching || searchError || tmdbResults.length > 0) && (
              <div className="tmdb-search" aria-live="polite">
                {searching && <p className="tmdb-search__message">Searching TMDB…</p>}
                {searchError && <p className="tmdb-search__message">{searchError}</p>}
                {tmdbResults.map((result) => (
                  <button
                    className="tmdb-search__result"
                    key={result.tmdb_id}
                    type="button"
                    onClick={() => selectTmdbResult(result)}
                  >
                    {result.poster_url ? (
                      <img src={result.poster_url} alt="" />
                    ) : (
                      <span className="tmdb-search__poster-placeholder" />
                    )}
                    <span>
                      <strong>{result.title}</strong>
                      <small>
                        {[result.year, ...result.genres].filter(Boolean).join(" · ") || "Details unavailable"}
                      </small>
                    </span>
                  </button>
                ))}
                <p className="tmdb-search__credit">
                  This product uses the TMDB API but is not endorsed or certified by TMDB.
                </p>
              </div>
            )}
            <div className="row">
              <Field label="Year">
                <input className="in" type="number" min="1900" max="2100" placeholder="2026" value={data.year} onChange={setFromInput("year")} />
              </Field>
              <Field label="Genre">
                <Select className="in" value={data.genre} onChange={setFromInput("genre")}>
                  <option value="">Select</option>
                  {[...new Set([...GENRES, ...tmdbGenreOptions, ...(data.genre ? [data.genre] : [])])].map((genre) => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </div>

        <Segmented label="Status" options={STATUS} value={data.status} onChange={set("status")} />

        {isSeries && (
          <div className="field field--full">
            <div className="series-details-heading">
              <span className="lbl">Episodes per season</span>
              {seriesDetails && (
                <span className="series-details-summary">
                  {seriesDetails.number_of_seasons} seasons · {seriesDetails.number_of_episodes} episodes · TMDB
                </span>
              )}
              {seriesDetails && (
                <button
                  type="button"
                  className="series-edit-btn"
                  aria-pressed={editingSeriesDetails}
                  onClick={() => setEditingSeriesDetails((isEditing) => !isEditing)}
                >
                  {editingSeriesDetails ? "Done" : "Edit data"}
                </button>
              )}
            </div>
            {loadingSeriesDetails && <p className="tmdb-search__message">Loading season and episode counts…</p>}
            {seriesDetailsError && <p className="tmdb-search__message" role="status">{seriesDetailsError} You can enter the counts manually.</p>}
            {seriesDetails && !editingSeriesDetails && !loadingSeriesDetails ? (
              <ul className="series-season-list">
                {seriesDetails.seasons.map((season) => (
                  <li key={season.number}>
                    <span>Season {season.number}</span>
                    <span>{season.episode_count} {season.episode_count === 1 ? "episode" : "episodes"}</span>
                  </li>
                ))}
              </ul>
            ) : !loadingSeriesDetails && (
              <>
                {data.season_episodes.map((episodeCount, index) => (
                  <div className="row season-count-row" key={index}>
                    <Field label={`Season ${index + 1} · episodes`}>
                      <input
                        className="in"
                        type="number"
                        min="1"
                        placeholder="10"
                        value={episodeCount}
                        onChange={(event) =>
                          updateSeasonEpisodes(index, event.currentTarget.value)
                        }
                      />
                    </Field>
                    {data.season_episodes.length > 1 && (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Remove season ${index + 1}`}
                        onClick={() => removeSeason(index)}
                      >
                        <X aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="add-btn" onClick={addSeason}>
                  <Plus size={16} aria-hidden="true" /> Add season
                </button>
              </>
            )}
          </div>
        )}

        {!isSeries && data.status === "WATCHING" && (
          <Field label="Stopped at (minute)">
            <input className="in" type="number" min="0" required placeholder="E.g., 42" value={data.current_minute} onChange={setFromInput("current_minute")} />
          </Field>
        )}

        {isSeries && data.status === "WATCHING" && (
          <div className="row">
            <Field label="Current season">
              <input className="in" type="number" min="1" max={data.season_episodes.length} required placeholder="1" value={data.current_season} onChange={setFromInput("current_season")} />
            </Field>
            <Field label="Current episode">
              <input className="in" type="number" min="1" max={toNum(data.season_episodes[Number(data.current_season) - 1] ?? "") ?? undefined} required placeholder="1" value={data.episode} onChange={setFromInput("episode")} />
            </Field>
          </div>
        )}

        {data.status === "WATCHED" && (
          <div className="row" style={{ alignItems: "flex-end" }}>
            <Stars value={data.rating} onChange={set("rating")} />
            <Field label="Watched on">
              <DatePicker value={data.watched_at} onChange={set("watched_at")} />
            </Field>
          </div>
        )}

        <SourcesField
          title="Where to watch"
          formats={MEDIA_FORMATS}
          defaultFormat="FILE"
          locationMax={500}
          value={data.sources}
          onChange={set("sources")}
        />

        <Field label="Comment" full>
          <textarea className="in" rows={2} placeholder="What you thought, who you watched with…" value={data.comment} onChange={setFromInput("comment")} />
        </Field>
      </ScrollArea>

      {submitError && <p className="field-error" role="alert">{submitError}</p>}
      <FormFooter onDelete={onDelete} submitLabel="Save" onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
