import { useEffect, useMemo, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MealForm } from "../../forms";
import type { MealFormData } from "../../forms/MealForm";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import styles from "./styles.module.css";

type MealItem = { id: number; name: string };
type MealEntry = {
  id: number;
  category: string;
  date: string;
  time: string | null;
  photo: string | null;
  tags: string[];
  items: MealItem[];
  created_at: string;
};
type MealSlot = { category: string; meal: MealEntry | null };

const primaryCategories = ["BR", "LU", "SN", "DI"];
const categoryLabels: Record<string, string> = {
  BR: "Breakfast",
  LU: "Lunch",
  SN: "Snack",
  DI: "Dinner",
  OT: "Other",
};
const tagLabels: Record<string, string> = {
  home: "Homemade",
  out: "Eating out",
  delivery: "Delivery",
  quick: "Quick",
  healthy: "Healthy",
};
const tagValues = Object.fromEntries(Object.entries(tagLabels).map(([value, label]) => [label, value]));
const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(getErrorMessage).join(" ");
  if (value && typeof value === "object") {
    return Object.entries(value).map(([field, error]) => `${field}: ${getErrorMessage(error)}`).join("; ");
  }
  return "Unable to complete request.";
}

async function requestMeals(path = "", options: RequestInit = {}) {
  const csrf = document.cookie.split("; ").find((cookie) => cookie.startsWith("csrftoken="))?.split("=")[1];
  const response = await fetch(`/api/v1/meals/${path}`, {
    ...options,
    credentials: "include",
    headers: { ...(csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {}), ...options.headers },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data ? getErrorMessage(data) : `Request failed (${response.status}).`);
  return data;
}

export function Meals() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => today);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [newMealCategory, setNewMealCategory] = useState("LU");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [uploadingPhotoIds, setUploadingPhotoIds] = useState<number[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem("cyberia-meal-notes");
      return stored ? JSON.parse(stored) as Record<string, string> : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    requestMeals("", { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          if (!Array.isArray(data)) throw new Error("Unexpected meals response.");
          setMeals(data as MealEntry[]);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load meals.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const selectedDateKey = dateKey(selectedDate);
  const selectedMeals = meals.filter((meal) => meal.date === selectedDateKey);
  const displayedMeals: MealSlot[] = [
    ...primaryCategories.flatMap<MealSlot>((category) => {
      const entries = selectedMeals.filter((meal) => meal.category === category);
      return entries.length ? entries.map((meal) => ({ category, meal })) : [{ category, meal: null }];
    }),
    ...selectedMeals.filter((meal) => meal.category === "OT").map((meal) => ({ category: "OT", meal })),
  ];
  const registeredDates = new Set(meals.map((meal) => meal.date));
  const primaryMealsLogged = new Set(
    selectedMeals.filter((meal) => primaryCategories.includes(meal.category)).map((meal) => meal.category),
  ).size;
  const registeredDaysInMonth = new Set(
    meals
      .filter((meal) => {
        const date = parseDate(meal.date);
        return date.getFullYear() === calendarMonth.getFullYear() && date.getMonth() === calendarMonth.getMonth();
      })
      .map((meal) => meal.date),
  ).size;
  const itemCount = selectedMeals.reduce((total, meal) => total + meal.items.length, 0);
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const leadingDays = calendarMonth.getDay();
  const calendarCells: Array<Date | null> = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1)),
  ];
  const selectedIsToday = selectedDateKey === dateKey(today);
  const selectedDateLabel = selectedIsToday
    ? `Today · ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(selectedDate)}`
    : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(selectedDate);

  function updateNote(value: string) {
    const nextNotes = { ...notes, [selectedDateKey]: value };
    setNotes(nextNotes);
    try {
      localStorage.setItem("cyberia-meal-notes", JSON.stringify(nextNotes));
    } catch {
      // Notes remain available for the current session when storage is unavailable.
    }
  }

  function openMealForm(category = "LU", meal: MealEntry | null = null) {
    setEditingMeal(meal);
    setNewMealCategory(meal?.category ?? category);
    setFormError("");
    setIsModalOpen(true);
  }

  function closeMealForm() {
    setIsModalOpen(false);
    setEditingMeal(null);
    setFormError("");
  }

  function moveSelectedDate(amount: number) {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + amount);
    setSelectedDate(nextDate);
    setCalendarMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }

  function selectDate(date: Date) {
    setSelectedDate(date);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  async function handleSaveMeal(data: MealFormData) {
    setFormError("");
    const body = new FormData();
    body.append("category", data.meal);
    body.append("date", data.date);
    body.append("time", data.time);
    body.append("tags", JSON.stringify(data.tags.map((tag) => tagValues[tag] ?? tag)));
    body.append("items", JSON.stringify(data.items.map((name) => ({ name }))));
    if (data.photo) body.append("photo", data.photo);

    try {
      const saved = await requestMeals(editingMeal ? `${editingMeal.id}/` : "", {
        method: editingMeal ? "PATCH" : "POST",
        body,
      }) as MealEntry;
      setMeals((current) => editingMeal
        ? current.map((meal) => meal.id === saved.id ? saved : meal)
        : [...current, saved]);
      const savedDate = parseDate(saved.date);
      setSelectedDate(savedDate);
      setCalendarMonth(new Date(savedDate.getFullYear(), savedDate.getMonth(), 1));
      closeMealForm();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not save meal.";
      setFormError(message);
    }
  }

  async function handlePhotoUpload(meal: MealEntry, file: File | undefined) {
    if (!file || uploadingPhotoIds.includes(meal.id)) return;
    setUploadingPhotoIds((ids) => [...ids, meal.id]);
    setActionError("");
    const body = new FormData();
    body.append("photo", file);
    try {
      const saved = await requestMeals(`${meal.id}/`, { method: "PATCH", body }) as MealEntry;
      setMeals((current) => current.map((entry) => entry.id === saved.id ? saved : entry));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Could not upload photo.");
    } finally {
      setUploadingPhotoIds((ids) => ids.filter((id) => id !== meal.id));
    }
  }

  const formInitial: Partial<MealFormData> = editingMeal ? {
    meal: editingMeal.category,
    date: editingMeal.date,
    time: editingMeal.time?.slice(0, 5) ?? "",
    items: editingMeal.items.map((item) => item.name),
    tags: editingMeal.tags.map((tag) => tagLabels[tag] ?? tag),
  } : {
    meal: newMealCategory,
    date: selectedDateKey,
  };

  return (
    <>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1>Meal log</h1>
            <p>Daily meal log, with optional photos</p>
          </div>
          <div className={styles.headerActions}>
            {!selectedIsToday && <DefaultButton variant="secondary" size="sm" onClick={() => selectDate(today)}>Go to today</DefaultButton>}
            <div className={styles.dayNavigation} role="group" aria-label="Choose day">
              <DefaultButton className={styles.iconButton} variant="ghost" size="sm" icon={<ChevronLeft aria-hidden="true" />} aria-label="Previous day" onClick={() => moveSelectedDate(-1)} />
              <span aria-live="polite">{selectedDateLabel}</span>
              <DefaultButton className={styles.iconButton} variant="ghost" size="sm" icon={<ChevronRight aria-hidden="true" />} aria-label="Next day" onClick={() => moveSelectedDate(1)} />
            </div>
            <DefaultButton size="sm" icon={<Plus aria-hidden="true" />} disabled={loading || !!error} onClick={() => openMealForm()}>
              Log a meal
            </DefaultButton>
          </div>
        </header>

        {(error || actionError) && <p className={styles.error} role="alert">{error || actionError}</p>}

        <Card className={styles.summary} aria-label="Day summary">
          <div><span>Meals logged</span><strong>{primaryMealsLogged} of 4</strong></div>
          <div><span>Items logged</span><strong>{itemCount}</strong></div>
          <div><span>Days logged in {new Intl.DateTimeFormat("en-US", { month: "long" }).format(calendarMonth)}</span><strong>{registeredDaysInMonth}</strong></div>
        </Card>

        <div className={styles.contentGrid}>
          <section className={styles.mealsGrid} aria-label={`Meals for ${selectedDateLabel}`}>
            {loading && <p className={styles.pageMessage} role="status">Loading meals…</p>}
            {!loading && !error && displayedMeals.map(({ category, meal }, index) => (
              <Card as="article" className={`${styles.mealCard} ${!meal ? styles.emptyMeal : ""}`} key={meal?.id ?? `${category}-${index}`}>
                <header className={styles.mealHeader}>
                  <h2>{categoryLabels[category] ?? "Meal"}</h2>
                  {meal?.time && <time>{meal.time.slice(0, 5)}</time>}
                </header>
                {meal ? (
                  <>
                    {meal.photo ? (
                      <img className={styles.mealPhoto} src={meal.photo} alt={`${categoryLabels[category]} photo`} loading="lazy" />
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        <Camera aria-hidden="true" />
                        <DefaultButton
                          variant="secondary"
                          size="sm"
                          disabled={uploadingPhotoIds.includes(meal.id)}
                          onClick={() => document.getElementById(`meal-photo-${meal.id}`)?.click()}
                        >
                          {uploadingPhotoIds.includes(meal.id) ? "Uploading…" : "Add photo"}
                        </DefaultButton>
                        <input
                          id={`meal-photo-${meal.id}`}
                          type="file"
                          accept="image/*"
                          aria-label={`Upload a photo for ${categoryLabels[category]}`}
                          onChange={(event) => {
                            void handlePhotoUpload(meal, event.currentTarget.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                      </div>
                    )}
                    <ul className={styles.foodList}>
                      {meal.items.map((item) => <li key={item.id}>{item.name}</li>)}
                    </ul>
                    {meal.tags.length > 0 && <div className={styles.tags}>{meal.tags.map((tag) => <span key={tag}>{tagLabels[tag] ?? tag}</span>)}</div>}
                    <footer className={styles.mealFooter}>
                      <DefaultButton variant="secondary" size="sm" onClick={() => openMealForm(category, meal)}>Edit</DefaultButton>
                    </footer>
                  </>
                ) : (
                  <>
                    <p>Nothing logged yet.</p>
                    <DefaultButton variant="secondary" size="sm" icon={<Plus aria-hidden="true" />} onClick={() => openMealForm(category)}>Add</DefaultButton>
                  </>
                )}
              </Card>
            ))}
          </section>

          <aside className={styles.sidebar}>
            <Card className={styles.calendarCard}>
              <header className={styles.calendarHeader}>
                <div>
                  <h2>{new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(calendarMonth)}</h2>
                  <span>{registeredDaysInMonth} {registeredDaysInMonth === 1 ? "day logged" : "days logged"}</span>
                </div>
                <div className={styles.monthNavigation} role="group" aria-label="Choose month">
                  <DefaultButton className={styles.iconButton} variant="ghost" size="sm" icon={<ChevronLeft aria-hidden="true" />} aria-label="Previous month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} />
                  <DefaultButton className={styles.iconButton} variant="ghost" size="sm" icon={<ChevronRight aria-hidden="true" />} aria-label="Next month" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} />
                </div>
              </header>
              <div className={styles.calendarGrid} role="grid" aria-label="Meal calendar">
                {weekdays.map((weekday, index) => <span className={styles.weekday} key={`${weekday}-${index}`}>{weekday}</span>)}
                {calendarCells.map((date, index) => date ? (
                  <button
                    type="button"
                    className={`${styles.calendarDay} ${registeredDates.has(dateKey(date)) ? styles.dayRegistered : ""} ${dateKey(date) === dateKey(today) ? styles.dayToday : ""}`}
                    key={dateKey(date)}
                    aria-label={`${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)}${registeredDates.has(dateKey(date)) ? ", meals logged" : ", no meals logged"}`}
                    aria-pressed={dateKey(date) === selectedDateKey}
                    onClick={() => selectDate(date)}
                  >{date.getDate()}</button>
                ) : <span key={`blank-${index}`} />)}
              </div>
              <div className={styles.calendarLegend}>
                <span><i className={styles.legendRegistered} />Logged</span>
                <span><i className={styles.legendEmpty} />Not logged</span>
                <span><i className={styles.legendToday} />Today</span>
              </div>
            </Card>
            <Card className={styles.notesCard}>
              <h2>Daily notes</h2>
              <textarea
                value={notes[selectedDateKey] ?? ""}
                placeholder="How I felt, water, extra snacks…"
                aria-label="Daily notes"
                onChange={(event) => updateNote(event.currentTarget.value)}
              />
            </Card>
          </aside>
        </div>
      </main>

      <FormModal
        open={isModalOpen}
        title={editingMeal ? "Edit meal" : "Log a meal"}
        description={editingMeal ? "Update this meal entry." : "Quick to fill out; a photo is optional."}
        onClose={closeMealForm}
      >
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        <MealForm
          key={editingMeal?.id ?? `new-${selectedDateKey}-${newMealCategory}`}
          initial={formInitial}
          photoUrl={editingMeal?.photo}
          submitLabel={editingMeal ? "Save" : "Log meal"}
          onSubmit={handleSaveMeal}
          onCancel={closeMealForm}
        />
      </FormModal>
    </>
  );
}
