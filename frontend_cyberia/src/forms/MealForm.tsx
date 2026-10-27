import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  Field,
  Segmented,
  ImageDrop,
  ChipGroup,
  FormFooter,
  XIcon,
} from "../components/FormFields";

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

type StringField = {
  [Key in keyof MealFormData]: MealFormData[Key] extends string ? Key : never;
}[keyof MealFormData];

const MEALS = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "SNACK", label: "Snack" },
  { value: "DINNER", label: "Dinner" },
  { value: "OTHER", label: "Other" },
];

const TAGS = ["Homemade", "Eating out", "Delivery", "Quick", "Healthy"];

const today = () => new Date().toISOString().slice(0, 10);
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
  const set = <Key extends keyof MealFormData>(key: Key) =>
    (value: MealFormData[Key]) =>
      setData((previousData) => ({ ...previousData, [key]: value }));
  const setFromInput = (key: StringField) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      setData((previousData) => ({
        ...previousData,
        [key]: event.currentTarget.value,
      }));

  function addItem() {
    const item = draft.trim();
    if (!item) return;
    set("items")([...data.items, item]);
    setDraft("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      <div className="form__body">
        <Segmented hideLabel label="Meal" options={MEALS} value={data.meal} onChange={set("meal")} />

        <div className="row">
          <Field label="Date" required>
            <input className="in" type="date" required value={data.date} onChange={setFromInput("date")} />
          </Field>
          <Field label="Time">
            <input className="in" type="time" value={data.time} onChange={setFromInput("time")} />
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
      </div>

      <FormFooter submitLabel="Log meal" onCancel={onCancel} submitting={submitting} />
    </form>
  );
}
