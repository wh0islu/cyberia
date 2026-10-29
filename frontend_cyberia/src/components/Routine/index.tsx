import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { HabitForm } from "../../forms";
import { FormModal } from "../FormModal";
import styles from "./styles.module.css";

type Completion = { id: number; habit: number; date: string; completed: boolean };
type Habit = {
  id: number;
  name: string;
  weekdays: number[];
  time: string | null;
  goal: string;
  linked_section: string | null;
  reminder: boolean;
  completions: Completion[];
};
type NewHabit = Pick<Habit, "name" | "weekdays" | "time" | "goal" | "linked_section" | "reminder">;

const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(date: Date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return monday;
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

function errorMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(errorMessage).join(" ");
  if (value && typeof value === "object") {
    return Object.entries(value).map(([field, error]) => `${field}: ${errorMessage(error)}`).join("; ");
  }
  return "Unable to complete request.";
}

async function requestRoutine(path: string, options: RequestInit = {}) {
  const csrf = document.cookie.split("; ").find((cookie) => cookie.startsWith("csrftoken="))?.split("=")[1];
  const response = await fetch(`/api/v1/${path}`, {
    ...options,
    credentials: "include",
    headers: { ...(csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {}), ...options.headers },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data ? errorMessage(data) : `Request failed (${response.status}).`);
  return data;
}

function isCompleted(habit: Habit, day: string) {
  return habit.completions.some((completion) => completion.date === day && completion.completed);
}

export function Routine({ onCollectionChange }: { onCollectionChange?: () => void }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [pendingDays, setPendingDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadHabits() {
      try {
        const data = await requestRoutine("habits/", { signal: controller.signal });
        if (!controller.signal.aborted) {
          if (!Array.isArray(data)) throw new Error("Unexpected habits response.");
          setHabits(data as Habit[]);
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load habits.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadHabits();
    return () => controller.abort();
  }, []);

  const today = new Date();
  const todayKey = dateKey(today);
  const todayWeekday = (today.getDay() + 6) % 7;
  const weekStart = getWeekStart(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekDates = weekdays.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const scheduledCount = habits.reduce((total, habit) => total + habit.weekdays.length, 0);
  const completedCount = habits.reduce(
    (total, habit) => total + weekDates.filter((date, index) =>
      habit.weekdays.includes(index) && isCompleted(habit, dateKey(date)),
    ).length, 0,
  );
  const percentage = scheduledCount ? Math.round(completedCount / scheduledCount * 100) : 0;
  const todaysHabits = habits.filter((habit) => habit.weekdays.includes(todayWeekday))
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));

  async function toggleCompletion(habit: Habit, date: Date) {
    const day = dateKey(date);
    const key = `${habit.id}-${day}`;
    if (pendingDays.includes(key)) return;
    const previous = habit.completions.find((completion) => completion.date === day);
    const completed = !previous?.completed;
    setPendingDays((days) => [...days, key]);
    setError("");
    try {
      const completion = await requestRoutine(
        previous ? `habit-completions/${previous.id}/` : "habit-completions/",
        {
          method: previous ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(previous ? { completed } : { habit: habit.id, date: day, completed }),
        },
      ) as Completion;
      setHabits((current) => current.map((item) => item.id === habit.id ? {
        ...item,
        completions: previous
          ? item.completions.map((entry) => entry.id === completion.id ? completion : entry)
          : [...item.completions, completion],
      } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this day.");
    } finally {
      setPendingDays((days) => days.filter((item) => item !== key));
    }
  }

  async function handleCreateHabit(data: NewHabit) {
    setFormError("");
    try {
      const habit = await requestRoutine("habits/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }) as Habit;
      setHabits((current) => [...current, habit]);
      setIsModalOpen(false);
      onCollectionChange?.();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not create habit.");
    }
  }

  return (
    <>
      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div><h1>Routine</h1><p>Weekly habits and daily schedule</p></div>
          <div className={styles.headerActions}>
            <div className={styles.weekControls} aria-label="Navigate weeks">
              <button type="button" aria-label="Previous week" onClick={() => setWeekOffset((offset) => offset - 1)}><ChevronLeft size={16} /></button>
              <span>{formatDate(weekDates[0], { day: "numeric", month: "short" })} – {formatDate(weekDates[6], { day: "numeric", month: "short" })}</span>
              <button type="button" aria-label="Next week" onClick={() => setWeekOffset((offset) => offset + 1)}><ChevronRight size={16} /></button>
            </div>
            <button className={styles.primaryButton} type="button" onClick={() => { setFormError(""); setIsModalOpen(true); }}>
              <Plus size={16} aria-hidden="true" /> New habit
            </button>
          </div>
        </header>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.columns}>
          <section className={styles.weekPanel}>
            <header className={styles.panelHeader}><h2>Weekly habits</h2><span>{percentage}% complete</span></header>
            <div className={styles.weekGrid}>
              <div className={styles.gridCorner} />
              {weekDates.map((date, index) => <div className={styles.dayHeading} key={dateKey(date)}>
                <span>{weekdays[index]}</span><time dateTime={dateKey(date)}>{formatDate(date, { day: "numeric" })}</time>
              </div>)}
              <span className={styles.totalHeading}>Total</span>
              {habits.map((habit) => <div className={styles.habitRow} key={habit.id}>
                <span className={styles.habitName} title={habit.name}>{habit.name}</span>
                {weekDates.map((date, index) => {
                  const day = dateKey(date);
                  const scheduled = habit.weekdays.includes(index);
                  const done = isCompleted(habit, day);
                  return <button
                    className={done ? styles.dayDone : scheduled ? styles.dayScheduled : styles.dayEmpty}
                    type="button"
                    key={day}
                    aria-label={`${habit.name}, ${formatDate(date, { weekday: "long", month: "short", day: "numeric" })}${done ? ", completed" : ", not completed"}`}
                    aria-pressed={done}
                    disabled={!scheduled || day > todayKey || pendingDays.includes(`${habit.id}-${day}`)}
                    onClick={() => void toggleCompletion(habit, date)}
                  >{done ? "✓" : ""}</button>;
                })}
                <span className={styles.habitTotal}>
                  {weekDates.filter((date, index) => habit.weekdays.includes(index) && isCompleted(habit, dateKey(date))).length}/{habit.weekdays.length}
                </span>
              </div>)}
            </div>
            {loading && <p className={styles.weekHint}>Loading habits…</p>}
            {!loading && !error && habits.length === 0 && <p className={styles.weekHint}>No habits yet. Create your first habit.</p>}
            {habits.length > 0 && <p className={styles.weekHint}>Click a scheduled day to mark or unmark it.</p>}
          </section>
          <section className={styles.todayPanel}>
            <header className={styles.todayHeader}><div><h2>Today</h2>
              <p>{formatDate(today, { weekday: "long", day: "numeric", month: "short" })}</p>
            </div></header>
            <div className={styles.agendaList}>
              {todaysHabits.map((habit) => {
                const done = isCompleted(habit, todayKey);
                return <article className={styles.agendaItem} key={habit.id}>
                  <time>{habit.time?.slice(0, 5) ?? "—"}</time>
                  <div className={styles.agendaDetails}>
                    <div><h3>{habit.name}</h3>{habit.goal && <p>{habit.goal}</p>}</div>
                    <span className={done ? styles.statusDone : styles.statusLater}>{done ? "Done" : "Pending"}</span>
                  </div>
                </article>;
              })}
              {!loading && !error && todaysHabits.length === 0 && <p className={styles.weekHint}>No habits scheduled today.</p>}
            </div>
          </section>
        </div>
      </main>
      <FormModal open={isModalOpen} title="New habit" description="It will appear in the weekly tracker and today's schedule." onClose={() => setIsModalOpen(false)}>
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        <HabitForm onSubmit={handleCreateHabit} onCancel={() => setIsModalOpen(false)} />
      </FormModal>
    </>
  );
}
