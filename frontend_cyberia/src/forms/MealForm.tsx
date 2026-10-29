import { useState, type FormEvent } from "react";
import {
  Field,
  Segmented,
  ImageDrop,
  ChipGroup,
  FormFooter,
  XIcon,
} from "../components/FormFields";
import { ScrollArea } from "../components/ScrollArea";
import { DatePicker } from "../components/DatePicker";
import { TimePicker } from "../components/TimePicker";

type MealFormData = {
  meal: string;
  date: string;
  time: string;
  photo: File | null;
  items: string[];
  tags: string[];
};

type MealFormProps = {
  initial?: Partial<MealFormData>;
  onSubmit: (data: MealFormData) => void | Promise<void>;
  onCancel: () => void;
};

const MEALS = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "SNACK", label: "Snack" },
  { value: "DINNER", label: "Dinner" },
  { value: "OTHER", label: "Other" },
];

const TAGS = ["Homemade", "Eating out", "Delivery", "Quick", "Healthy"];

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};
const nowTime = () => new Date().toTimeString().slice(0, 5);

export function MealForm({ initial, onSubmit, onCancel }: MealFormProps) {
  const [data, setData] = useState<MealFormData>({
    meal: "LUNCH",
    date: today(),
    time: nowTime(),
    photo: null,
    items: [],
    tags: [],
    ...initial,
  });
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState(false);
  const set = <Key extends keyof MealFormData>(key: Key) =>
    (value: MealFormData[Key]) =>
      setData((previousData) => ({ ...previousData, [key]: value }));
  function addItem() {
    const item = draft.trim();
    if (!item) return;
    set("items")([...data.items, item]);
    setDraft("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data.date) {
      setDateError(true);
      return;
    }
    setDateError(false);
    setSubmitting(true);
    try {
      // Include any text still in the input that has not been added yet.
      const items = draft.trim() ? [...data.items, draft.trim()] : data.items;
      await onSubmit({ ...data, items });
    } finally {
      setSubmitting(false);
    }
  }

  const noItems = data.items.length === 0 && !draft.trim();

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ScrollArea className="form__body">
        <Segmented hideLabel label="Meal" options={MEALS} value={data.meal} onChange={set("meal")} />

        <div className="row">
          <Field label="Date" required>
            <DatePicker required value={data.date} onChange={set("date")} />
            {dateError && (
              <small className="field-error" role="alert">
                Choose a date to continue.
              </small>
            )}
          </Field>
          <Field label="Time">
            <TimePicker value={data.time} onChange={set("time")} />
          </Field>
        </div>

        <ImageDrop label="Add photo (optional)" shape="wide" value={data.photo} onChange={set("photo")} />

        <div className="field field--full">
          <span className="lbl">What I ate <span className="req">*</span></span>
          {data.items.length > 0 && (
            <div className="chips">
              {data.items.map((item, i) => (
                <span className="tag" key={i}>
                  {item}
                  <button type="button" className="icon-btn" aria-label={`Remove ${item}`} onClick={() => set("items")(data.items.filter((_, j) => j !== i))}>
                    <XIcon />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <input
              className="in"
              aria-label="New item"
              placeholder="E.g., rice and beans"
              required={noItems}
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
            <button type="button" className="add-btn" onClick={addItem}>Add</button>
          </div>
        </div>

        <ChipGroup label="Tags" options={TAGS} value={data.tags} onChange={set("tags")} />
      </ScrollArea>

      <FormFooter submitLabel="Log meal" onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
