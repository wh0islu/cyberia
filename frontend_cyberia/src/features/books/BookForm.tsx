import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Field,
  Segmented,
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

type BookFormData = {
  cover: File | null;
  title: string;
  author: string;
  pages: string;
  genre: string;
  status: string;
  current_page: string;
  started_at: string;
  notes: string;
  sources: FormSource[];
};

export type BookSubmission = Omit<
  BookFormData,
  "pages" | "current_page" | "started_at" | "sources"
> & {
  pages: number;
  current_page: number | null;
  started_at: string | null;
  sources: CleanedSource[];
};

export type BookFormInitial = Partial<BookFormData>;

type BookFormProps = {
  initial?: BookFormInitial;
  coverUrl?: string | null;
  onSubmit: (data: BookSubmission) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
};

type StringField = {
  [Key in keyof BookFormData]: BookFormData[Key] extends string ? Key : never;
}[keyof BookFormData];


const BOOK_FORMATS: SourceFormat[] = [
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


const STATUS = [
  { value: "NR", label: "Want to read" },
  { value: "RE", label: "Reading" },
  { value: "FD", label: "Read" },
];

const GENRES = [
  { value: "FI", label: "Fiction" },
  { value: "TC", label: "Technical" },
  { value: "FA", label: "Fantasy" },
  { value: "SF", label: "Science fiction" },
  { value: "HI", label: "Historical" },
  { value: "BI", label: "Biography" },
  { value: "NF", label: "Non-fiction" },
  { value: "OT", label: "Other" },
];

const empty = {
  cover: null,
  title: "",
  author: "",
  pages: "",
  genre: "",
  status: "NR",
  current_page: "",
  started_at: "",
  notes: "",
  sources: [{ format: "PH", location: "", url: "" }],
};

export function BookForm({ initial, coverUrl, onSubmit, onCancel, onDelete }: BookFormProps) {
  const [data, setData] = useState<BookFormData>({ ...empty, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
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
    ) => {
      const value = event.currentTarget.value;
      setData((previousData) => ({
        ...previousData,
        [key]: value,
      }));
    };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        ...data,
        pages: Number(data.pages),
        current_page:
          data.status === "RE" && data.current_page !== ""
            ? Number(data.current_page)
            : 0,
        started_at: data.status === "RE" ? data.started_at || null : null,
        sources: cleanSources(data.sources, BOOK_FORMATS),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save book.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ScrollArea className="form__body">
        {error && <p role="alert">{error}</p>}
        <div className="row row--nowrap">
          <ImageDrop
            label="Add cover"
            shape="cover"
            value={data.cover}
            imageUrl={coverUrl}
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
                maxLength={500}
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
                <option key={g.value} value={g.value}>{g.label}</option>
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

        {data.status === "RE" && (
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
        onDelete={onDelete}
        submitLabel={initial ? "Save" : "Add book"}
        onCancel={onCancel}
        submitting={submitting}
      />
    </form>
  );
}
