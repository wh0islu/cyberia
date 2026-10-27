import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Field,
  Segmented,
  Stars,
  ImageDrop,
  SourcesField,
  cleanSources,
  FormFooter,
  type FormSource,
  type CleanedSource,
  type SourceFormat,
} from "../components/FormFields";

type MediaKind = "movie" | "series";

type MediaFormData = {
  kind: MediaKind;
  poster: File | null;
  title: string;
  year: string;
  genre: string;
  status: string;
  season: string;
  episode: string;
  total_episodes: string;
  rating: number;
  watched_at: string;
  comment: string;
  sources: FormSource[];
};

type MediaSubmission = Omit<
  MediaFormData,
  "year" | "season" | "episode" | "total_episodes" | "rating" | "watched_at" | "sources"
> & {
  year: number | null;
  season: number | null;
  episode: number | null;
  total_episodes: number | null;
  rating: number | null;
  watched_at: string | null;
  sources: CleanedSource[];
};

type MediaFormProps = {
  initial?: Partial<MediaFormData>;
  onSubmit: (data: MediaSubmission) => void | Promise<void>;
  onCancel: () => void;
  lockKind?: boolean;
};

type StringField = {
  [Key in keyof MediaFormData]: MediaFormData[Key] extends string ? Key : never;
}[keyof MediaFormData];

/* MovieSource / SeriesSource.FORMAT_OPTIONS (same for both models). */
export const MEDIA_FORMATS: SourceFormat[] = [
  { value: "STR", label: "Streaming", location: { label: "Service", placeholder: "E.g., Netflix, Hulu" }, url: { label: "Link" } },
  { value: "FILE", label: "File", location: { label: "Folder or device", placeholder: "E.g., external drive/Movies" }, url: null },
  { value: "DVD", label: "DVD", location: { label: "Location", placeholder: "E.g., living room shelf" }, url: null },
  { value: "BR", label: "Blu-ray", location: { label: "Location", placeholder: "E.g., living room shelf" }, url: null },
];

const KINDS = [
  { value: "movie", label: "Movie" },
  { value: "series", label: "Series" },
];

/* Replace these values with the choices from your models. */
const STATUS = [
  { value: "WANT", label: "Want to watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "WATCHED", label: "Watched" },
];

const GENRES = ["Drama", "Comedy", "Action", "Documentary", "Animation", "Horror", "Science fiction"];

const empty: MediaFormData = {
  kind: "movie",
  poster: null,
  title: "",
  year: "",
  genre: "",
  status: "WANT",
  season: "",
  episode: "",
  total_episodes: "",
  rating: 0,
  watched_at: "",
  comment: "",
  sources: [{ format: "STR", location: "", url: "" }],
};

/**
 * Form for movies and series.
 * onSubmit receives { kind: "movie" | "series", ...data }; use kind to select the endpoint.
 */
export function MediaForm({
  initial,
  onSubmit,
  onCancel,
  lockKind = false,
}: MediaFormProps) {
  const [data, setData] = useState<MediaFormData>({ ...empty, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const set = <Key extends keyof MediaFormData>(key: Key) =>
    (value: MediaFormData[Key]) =>
      setData((previousData) => ({ ...previousData, [key]: value }));
  const setFromInput = (key: StringField) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setData((previousData) => ({
        ...previousData,
        [key]: event.currentTarget.value,
      }));

  const isSeries = data.kind === "series";
  const toNum = (value: string) => (value === "" ? null : Number(value));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...data,
        year: toNum(data.year),
        season: isSeries && data.status === "WATCHING" ? toNum(data.season) : null,
        episode: isSeries && data.status === "WATCHING" ? toNum(data.episode) : null,
        total_episodes: isSeries ? toNum(data.total_episodes) : null,
        rating: data.status === "WATCHED" && data.rating ? data.rating : null,
        watched_at: data.status === "WATCHED" ? data.watched_at || null : null,
        sources: cleanSources(data.sources, MEDIA_FORMATS),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__body">
        {!lockKind && <Segmented hideLabel label="Type" options={KINDS} value={data.kind} onChange={(kind) => set("kind")(kind as MediaKind)} />}

        <div className="row row--nowrap">
          <ImageDrop label="Add poster" shape="cover" value={data.poster} onChange={set("poster")} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Title" required full>
              <input
                className="in"
                required
                autoFocus
                placeholder={isSeries ? "E.g., Cangaço Novo" : "E.g., Central do Brasil"}
                value={data.title}
                onChange={setFromInput("title")}
              />
            </Field>
            <div className="row">
              <Field label="Year">
                <input className="in" type="number" min="1900" max="2100" placeholder="2026" value={data.year} onChange={setFromInput("year")} />
              </Field>
              <Field label="Genre">
                <select className="in" value={data.genre} onChange={setFromInput("genre")}>
                  <option value="">Select</option>
                  {GENRES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        <Segmented label="Status" options={STATUS} value={data.status} onChange={set("status")} />

        {isSeries && data.status === "WATCHING" && (
          <div className="row">
            <Field label="Season">
              <input className="in" type="number" min="1" placeholder="1" value={data.season} onChange={setFromInput("season")} />
            </Field>
            <Field label="Current episode">
              <input className="in" type="number" min="0" placeholder="0" value={data.episode} onChange={setFromInput("episode")} />
            </Field>
            <Field label="Total episodes">
              <input className="in" type="number" min="1" placeholder="8" value={data.total_episodes} onChange={setFromInput("total_episodes")} />
            </Field>
          </div>
        )}

        {data.status === "WATCHED" && (
          <div className="row" style={{ alignItems: "flex-end" }}>
            <Stars value={data.rating} onChange={set("rating")} />
            <Field label="Watched on">
              <input className="in" type="date" value={data.watched_at} onChange={setFromInput("watched_at")} />
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
      </div>

      <FormFooter submitLabel="Save" onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
