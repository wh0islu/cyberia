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
import { ScrollArea } from "../components/ScrollArea";
import { Select } from "../components/Select";
import { DatePicker } from "../components/DatePicker";

type BookFormData = {
  cover: File | null;
  title: string;
  author: string;
  pages: string;
  genre: string;
  status: string;
  current_page: string;
  started_at: string;
  rating: number;
  finished_at: string;
  notes: string;
  sources: FormSource[];
};

type BookSubmission = Omit<
  BookFormData,
  "pages" | "current_page" | "started_at" | "rating" | "finished_at" | "sources"
> & {
  pages: number;
  current_page: number | null;
  started_at: string | null;
  rating: number | null;
  finished_at: string | null;
  sources: CleanedSource[];
};

type BookFormProps = {
  initial?: Partial<BookFormData>;
  onSubmit: (data: BookSubmission) => void | Promise<void>;
  onCancel: () => void;
};

type StringField = {
  [Key in keyof BookFormData]: BookFormData[Key] extends string ? Key : never;
}[keyof BookFormData];

/* BookSource.FORMAT_OPTIONS */
export const BOOK_FORMATS: SourceFormat[] = [
  {
    value: "PH",
    label: "Physical",
    location: {
      label: "Location",
      placeholder: "E.g., living room shelf, borrowed by Ana",
    },
    url: null,
  },
  {
    value: "PDF",
    label: "PDF",
    location: {
      label: "Folder or device",
      placeholder: "E.g., Kindle, Drive/Books",
    },
    url: { label: "Link" },
  },
  {
    value: "EPUB",
    label: "EPUB",
    location: {
      label: "Folder or device",
      placeholder: "E.g., Kindle, Drive/Books",
    },
    url: { label: "Link" },
  },
  {
    value: "WEB",
    label: "Online",
    location: null,
    url: { label: "Link", required: true },
  },
];

/* Replace these values with the choices from your Book model. */
const STATUS = [
  { value: "WANT", label: "Want to read" },
  { value: "READING", label: "Reading" },
  { value: "READ", label: "Read" },
  { value: "DROPPED", label: "Abandoned" },
];

const GENRES = [
  "Romance",
  "Fiction",
  "Nonfiction",
  "Technical",
  "Poesia",
  "Biografia",
];

const empty = {
  cover: null,
  title: "",
  author: "",
  pages: "",
  genre: "",
  status: "WANT",
  current_page: "",
  started_at: "",
  rating: 0,
  finished_at: "",
  notes: "",
  sources: [{ format: "PH", location: "", url: "" }],
};

export function BookForm({ initial, onSubmit, onCancel }: BookFormProps) {
  const [data, setData] = useState<BookFormData>({ ...empty, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const set =
    <Key extends keyof BookFormData>(key: Key) =>
    (value: BookFormData[Key]) =>
      setData((previousData) => ({ ...previousData, [key]: value }));
  const setFromInput =
    (key: StringField) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setData((previousData) => ({
        ...previousData,
        [key]: event.currentTarget.value,
      }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...data,
        pages: Number(data.pages),
        current_page:
          data.status === "READING" && data.current_page !== ""
            ? Number(data.current_page)
            : null,
        started_at: data.status === "READING" ? data.started_at || null : null,
        rating: data.status === "READ" && data.rating ? data.rating : null,
        finished_at: data.status === "READ" ? data.finished_at || null : null,
        sources: cleanSources(data.sources, BOOK_FORMATS),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ScrollArea className="form__body">
        <div className="row row--nowrap">
          <ImageDrop
            label="Add cover"
            shape="cover"
            value={data.cover}
            onChange={set("cover")}
          />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <Field label="Title" required full>
              <input
                className="in"
                required
                placeholder="E.g., Dom Casmurro"
                value={data.title}
                onChange={setFromInput("title")}
                autoFocus
              />
            </Field>
            <Field label="Author" required full>
              <input
                className="in"
                required
                placeholder="E.g., Machado de Assis"
                value={data.author}
                onChange={setFromInput("author")}
              />
            </Field>
          </div>
        </div>

        <div className="row">
          <Field label="Number of pages" required>
            <input
              className="in"
              type="number"
              min="1"
              required
              placeholder="256"
              value={data.pages}
              onChange={setFromInput("pages")}
            />
          </Field>
          <Field label="Genre">
            <Select
              className="in"
              value={data.genre}
              onChange={setFromInput("genre")}
            >
              <option value="">Select</option>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Segmented
          label="Status"
          options={STATUS}
          value={data.status}
          onChange={set("status")}
        />

        {data.status === "READING" && (
          <div className="row">
            <Field label="Current page">
              <input
                className="in"
                type="number"
                min="0"
                max={data.pages || undefined}
                placeholder="0"
                value={data.current_page}
                onChange={setFromInput("current_page")}
              />
            </Field>
            <Field label="Started on">
              <DatePicker
                value={data.started_at}
                onChange={set("started_at")}
              />
            </Field>
          </div>
        )}

        {data.status === "READ" && (
          <div className="row" style={{ alignItems: "flex-end" }}>
            <Stars value={data.rating} onChange={set("rating")} />
            <Field label="Finished on">
              <DatePicker
                value={data.finished_at}
                onChange={set("finished_at")}
              />
            </Field>
          </div>
        )}

        <SourcesField
          title="Book location"
          formats={BOOK_FORMATS}
          defaultFormat="PH"
          locationMax={255}
          value={data.sources}
          onChange={set("sources")}
        />

        <Field label="Notes" full>
          <textarea
            className="in"
            rows={3}
            placeholder="Why I want to read it, who recommended it, quotes…"
            value={data.notes}
            onChange={setFromInput("notes")}
          />
        </Field>
      </ScrollArea>

      <FormFooter
        submitLabel={initial ? "Save" : "Add book"}
        onCancel={onCancel}
        submitting={submitting}
      />
    </form>
  );
}
