import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Field,
  Segmented,
  Switch,
  ImageDrop,
  SourcesField,
  cleanSources,
  FormFooter,
  XIcon,
  type FormSource,
  type CleanedSource,
  type SourceFormat,
} from "../components/FormFields";
import { ScrollArea } from "../components/ScrollArea";
import { DatePicker } from "../components/DatePicker";

type CourseFormData = {
  image: File | null;
  title: string;
  platform: string;
  instructor: string;
  status: string;
  total_lessons: string;
  done_lessons: string;
  goal_date: string;
  certificate: boolean;
  sources: FormSource[];
  modules: string[];
};

type CourseSubmission = Omit<
  CourseFormData,
  "total_lessons" | "done_lessons" | "goal_date" | "sources"
> & {
  total_lessons: number;
  done_lessons: number;
  goal_date: string | null;
  sources: CleanedSource[];
};

type CourseFormProps = {
  initial?: Partial<CourseFormData>;
  onSubmit: (data: CourseSubmission) => void | Promise<void>;
  onCancel: () => void;
};

type StringField = {
  [Key in keyof CourseFormData]: CourseFormData[Key] extends string ? Key : never;
}[keyof CourseFormData];

/* CourseSource.FORMAT_OPTIONS */
export const COURSE_FORMATS: SourceFormat[] = [
  { value: "WEB", label: "Online", location: null, url: { label: "Course link", required: true } },
  { value: "VID", label: "Video", location: { label: "Folder (if downloaded)", placeholder: "E.g., external drive/Courses" }, url: { label: "Video or playlist link" } },
  { value: "LOC", label: "Local files", location: { label: "Folder", placeholder: "E.g., external drive/Courses/Design" }, url: null },
];

/* Replace these values with the choices from your Course model. */
const STATUS = [
  { value: "QUEUE", label: "Queued" },
  { value: "ONGOING", label: "In progress" },
  { value: "DONE", label: "Completed" },
];

const empty = {
  image: null,
  title: "",
  platform: "",
  instructor: "",
  status: "ONGOING",
  total_lessons: "",
  done_lessons: "",
  goal_date: "",
  certificate: false,
  sources: [{ format: "WEB", location: "", url: "" }],
  modules: [],
};

export function CourseForm({ initial, onSubmit, onCancel }: CourseFormProps) {
  const [data, setData] = useState<CourseFormData>({ ...empty, ...initial });
  const [newModule, setNewModule] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const set = <Key extends keyof CourseFormData>(key: Key) =>
    (value: CourseFormData[Key]) =>
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

  function addModule() {
    const name = newModule.trim();
    if (!name) return;
    set("modules")([...data.modules, name]);
    setNewModule("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...data,
        total_lessons: Number(data.total_lessons),
        done_lessons: data.done_lessons === "" ? 0 : Number(data.done_lessons),
        goal_date: data.goal_date || null,
        sources: cleanSources(data.sources, COURSE_FORMATS),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ScrollArea className="form__body">
        <div className="row row--nowrap" style={{ alignItems: "flex-start" }}>
          <ImageDrop label="Image" shape="thumb" value={data.image} onChange={set("image")} />
          <Field label="Course name" required>
            <input className="in" required autoFocus placeholder="E.g., Interface Design" value={data.title} onChange={setFromInput("title")} />
          </Field>
        </div>

        <div className="row">
          <Field label="Platform">
            <input className="in" placeholder="E.g., Udemy, YouTube…" value={data.platform} onChange={setFromInput("platform")} />
          </Field>
          <Field label="Instructor">
            <input className="in" placeholder="Name" value={data.instructor} onChange={setFromInput("instructor")} />
          </Field>
        </div>

        <Segmented label="Status" options={STATUS} value={data.status} onChange={set("status")} />

        <div className="row">
          <Field label="Total lessons" required>
            <input className="in" type="number" min="1" required placeholder="40" value={data.total_lessons} onChange={setFromInput("total_lessons")} />
          </Field>
          <Field label="Completed lessons">
            <input
              className="in"
              type="number"
              min="0"
              max={data.total_lessons || undefined}
              placeholder="0"
              value={data.done_lessons}
              onChange={setFromInput("done_lessons")}
            />
          </Field>
          <Field label="Goal date">
            <DatePicker value={data.goal_date} onChange={set("goal_date")} />
          </Field>
        </div>

        <SourcesField
          title="Where to access"
          formats={COURSE_FORMATS}
          defaultFormat="WEB"
          locationMax={255}
          value={data.sources}
          onChange={set("sources")}
        />

        <Switch label="Certificate available" checked={data.certificate} onChange={set("certificate")} />

        <div className="field field--full">
          <span className="lbl">Modules <span className="lbl__opt">(optional)</span></span>
          {data.modules.map((m, i) => (
            <div className="list-item" key={i}>
              <span className="list-item__n">{i + 1}</span>
              <span className="list-item__name">{m}</span>
              <button type="button" className="icon-btn" aria-label={`Remove module ${m}`} onClick={() => set("modules")(data.modules.filter((_, j) => j !== i))}>
                <XIcon />
              </button>
            </div>
          ))}
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input
              className="in"
              aria-label="New module name"
              placeholder="E.g., Typography"
              value={newModule}
              onChange={(e) => setNewModule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Prevent form submission.
                  addModule();
                }
              }}
            />
            <button type="button" className="add-btn" onClick={addModule}>+ Module</button>
          </div>
        </div>
      </ScrollArea>

      <FormFooter submitLabel={initial ? "Save" : "Add course"} onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
