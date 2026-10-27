import { useId, useState, type FormEvent } from "react";
import { Field, Switch, FormFooter } from "../components/FormFields";

type HabitFormData = {
  name: string;
  days: boolean[];
  time: string;
  goal: string;
  linked_section: string;
  reminder: boolean;
};

type HabitSubmission = Omit<HabitFormData, "days" | "time" | "linked_section"> & {
  weekdays: number[];
  time: string | null;
  linked_section: string | null;
};

type HabitFormProps = {
  initial?: Partial<HabitFormData>;
  onSubmit: (data: HabitSubmission) => void | Promise<void>;
  onCancel: () => void;
};

const DAYS = [
  { short: "M", long: "Monday" },
  { short: "T", long: "Tuesday" },
  { short: "W", long: "Wednesday" },
  { short: "T", long: "Thursday" },
  { short: "F", long: "Friday" },
  { short: "S", long: "Saturday" },
  { short: "S", long: "Sunday" },
];

const LINKS = [
  { value: "", label: "None" },
  { value: "books", label: "Books — counts pages read" },
  { value: "courses", label: "Courses — counts completed lessons" },
  { value: "meals", label: "Meals" },
];

export function HabitForm({ initial, onSubmit, onCancel }: HabitFormProps) {
  const daysId = useId();
  const [data, setData] = useState<HabitFormData>({
    name: "",
    days: [true, true, true, true, true, false, false], // Monday through Sunday.
    time: "",
    goal: "",
    linked_section: "",
    reminder: false,
    ...initial,
  });
  const [submitting, setSubmitting] = useState(false);
  const set = <Key extends keyof HabitFormData>(key: Key) =>
    (value: HabitFormData[Key]) =>
      setData((previousData) => ({ ...previousData, [key]: value }));

  const noDays = !data.days.some(Boolean);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (noDays) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...data,
        // 0 = Monday … 6 = Sunday (same convention as Python's date.weekday()).
        weekdays: data.days
          .map((ativo, indice) => (ativo ? indice : null))
          .filter((indice): indice is number => indice !== null),
        time: data.time || null,
        linked_section: data.linked_section || null,
        reminder: data.reminder && !!data.time,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__body">
        <Field label="Habit name" required full>
          <input className="in" required autoFocus placeholder="E.g., Read 20 pages" value={data.name} onChange={(e) => set("name")(e.target.value)} />
        </Field>

        <div className="field field--full">
          <div className="field__head">
            <span className="lbl" id={daysId}>Days of the week <span className="req">*</span></span>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" className="text-link" onClick={() => set("days")(Array(7).fill(true))}>Every day</button>
              <button type="button" className="text-link" onClick={() => set("days")([true, true, true, true, true, false, false])}>Weekdays</button>
            </div>
          </div>
          <div className="days" role="group" aria-labelledby={daysId}>
            {DAYS.map((d, i) => (
              <button
                key={d.long}
                type="button"
                className="day"
                aria-label={d.long}
                aria-pressed={data.days[i]}
                onClick={() => set("days")(data.days.map((v, j) => (j === i ? !v : v)))}
              >
                {d.short}
              </button>
            ))}
          </div>
          {noDays && <span className="lbl" role="alert" style={{ color: "var(--link-color)" }}>Choose at least one day.</span>}
        </div>

        <div className="row">
          <Field label="Time">
            <input className="in" type="time" value={data.time} onChange={(e) => set("time")(e.target.value)} />
          </Field>
          <Field label="Goal">
            <input className="in" placeholder="E.g., 20 pages, 2 L" value={data.goal} onChange={(e) => set("goal")(e.target.value)} />
          </Field>
        </div>

        <Field label="Link to a section" full>
          <select className="in" value={data.linked_section} onChange={(e) => set("linked_section")(e.target.value)}>
            {LINKS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </Field>

        <Switch
          label="Reminder"
          description={data.time ? "Notify me at the selected time" : "Set a time to enable reminders"}
          checked={data.reminder}
          onChange={set("reminder")}
        />
      </div>

      <FormFooter submitLabel={initial ? "Save" : "Create habit"} onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
