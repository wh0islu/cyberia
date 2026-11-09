import { useCollection } from "../../hooks/useCollections";
import { useCurrentDate } from "../../hooks/useCurrentDate";
import { apiFetch, deleteCollectionItem } from "../../services/collections";
import { LoadingPlaceholder } from "../../components/LoadingPlaceholder";
import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, SquarePen } from "lucide-react";
import { HabitForm } from "./HabitForm";
import { Card } from "../../components/Card";
import { DefaultButton } from "../../components/DefaultButton";
import { FormModal } from "../../components/FormModal";
import { ProgressBar } from "../../components/ProgressBar";
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
  const response = await apiFetch(`/api/v1/${path}`, {
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

export function Routine() {
  const { data: habits, loading, error: queryError } = useCollection<Habit>("habits");
  const [weekOffset, setWeekOffset] = useState(0);
  const [pendingDays, setPendingDays] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = useCurrentDate();
  const todayKey = dateKey(today);
  const todayWeekday = (today.getDay() + 6) % 7;
  const weekStart = getWeekStart(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekDates = weekdays.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const currentWeekIsVisible = weekDates.some((date) => dateKey(date) === todayKey);
  const scheduledCount = habits.reduce((total, habit) => total + habit.weekdays.length, 0);
  const completedCount = habits.reduce(
    (total, habit) => total + weekDates.filter((date, index) =>
      habit.weekdays.includes(index) && isCompleted(habit, dateKey(date)),
    ).length, 0,
  );
  const percentage = scheduledCount ? Math.round(completedCount / scheduledCount * 100) : 0;
  const todaysHabits = currentWeekIsVisible
    ? habits.filter((habit) => habit.weekdays.includes(todayWeekday))
      .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"))
    : [];
  const todayCompletedCount = todaysHabits.filter((habit) => isCompleted(habit, todayKey)).length;

  async function toggleCompletion(habit: Habit, date: Date) {
    const day = dateKey(date);
    const key = `${habit.id}-${day}`;
    if (pendingDays.includes(key)) return;
    const previous = habit.completions.find((completion) => completion.date === day);
    const completed = !previous?.completed;
    setPendingDays((days) => [...days, key]);
    setError("");
    try {
      await requestRoutine(
        previous ? `habit-completions/${previous.id}/` : "habit-completions/",
        {
          method: previous ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(previous ? { completed } : { habit: habit.id, date: day, completed }),
        },
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this day.");
    } finally {
      setPendingDays((days) => days.filter((item) => item !== key));
    }
  }

  async function handleSaveHabit(data: NewHabit) {
    setFormError("");
    try {
      await requestRoutine(editingHabit ? `habits/${editingHabit.id}/` : "habits/", {
        method: editingHabit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setIsModalOpen(false);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Could not save habit.");
    }
  }

  function openHabitForm(habit: Habit | null = null) {
    setEditingHabit(habit);
    setFormError("");
    setIsModalOpen(true);
  }

  return (
    <>
      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Routine</h1>
            <p>{habits.length} {habits.length === 1 ? "habit" : "habits"} · {completedCount} completed this week</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.weekControls} role="group" aria-label="Choose week">
              <DefaultButton className={styles.iconButton} variant="ghost" size="sm" icon={<ChevronLeft aria-hidden="true" />} aria-label="Previous week" onClick={() => setWeekOffset((offset) => offset - 1)} />
              <span>{formatDate(weekDates[0], { day: "numeric", month: "short" })} – {formatDate(weekDates[6], { day: "numeric", month: "short" })}</span>
              <DefaultButton className={styles.iconButton} variant="ghost" size="sm" icon={<ChevronRight aria-hidden="true" />} aria-label="Next week" onClick={() => setWeekOffset((offset) => offset + 1)} />
            </div>
            {weekOffset !== 0 && <DefaultButton variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>Current week</DefaultButton>}
            <DefaultButton size="sm" icon={<Plus aria-hidden="true" />} onClick={() => openHabitForm()}>New habit</DefaultButton>
          </div>
        </header>

        {(error || queryError) && <p className={styles.error} role="alert">{error || queryError}</p>}

        <section className={styles.summary} aria-label="Week summary">
          <Card className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Week completion</span>
            <strong className={styles.summaryValue}>{percentage}%</strong>
            <ProgressBar className={styles.summaryProgress} value={completedCount} max={scheduledCount || 1} />
          </Card>
          <Card className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Completed days</span>
            <strong className={styles.summaryValue}>{completedCount} of {scheduledCount}</strong>
            <p>Only scheduled days are counted.</p>
          </Card>
          <Card className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Today</span>
            <strong className={styles.summaryValue}>{currentWeekIsVisible ? `${todayCompletedCount} of ${todaysHabits.length}` : "—"}</strong>
            <p>{currentWeekIsVisible ? "habits completed today" : "outside this week"}</p>
          </Card>
        </section>

        <div className={styles.contentGrid}>
          <Card className={styles.weekPanel}>
            <header className={styles.panelHeader}>
              <h2>Weekly habits</h2>
              <span>Select a scheduled day to mark it</span>
            </header>
            <div className={styles.tableScroll}>
              <div className={styles.weekGrid}>
                <span />
                {weekDates.map((date, index) => {
                  const isToday = dateKey(date) === todayKey;
                  return <div className={`${styles.dayHeading} ${isToday ? styles.todayColumn : ""}`} key={dateKey(date)}>
                    <span>{weekdays[index]}</span>
                    <time className={isToday ? styles.todayDate : ""} dateTime={dateKey(date)}>{formatDate(date, { day: "numeric" })}</time>
                    <small>{isToday ? "Today" : ""}</small>
                  </div>;
                })}
                <span className={styles.totalHeading}>Total</span>

                {habits.map((habit) => {
                  const habitCompleted = weekDates.filter((date, index) => habit.weekdays.includes(index) && isCompleted(habit, dateKey(date))).length;
                  return <div className={styles.habitRow} key={habit.id}>
                    <div className={styles.habitNameRow}>
                      <span className={styles.habitName} title={habit.name}>{habit.name}</span>
                      <button type="button" className={styles.editHabitButton} aria-label={`Edit ${habit.name}`} title="Edit habit" onClick={() => openHabitForm(habit)}>
                        <SquarePen size={14} aria-hidden="true" />
                      </button>
                    </div>
                    {weekDates.map((date, index) => {
                      const day = dateKey(date);
                      const scheduled = habit.weekdays.includes(index);
                      const done = isCompleted(habit, day);
                      const missed = scheduled && day < todayKey && !done;
                      const pending = pendingDays.includes(`${habit.id}-${day}`);
                      const stateClass = done ? styles.dayDone : missed ? styles.dayMissed : scheduled ? styles.dayScheduled : styles.dayEmpty;
                      return <div className={`${styles.daySlot} ${day === todayKey ? styles.todayColumn : ""}`} key={day}>
                        <button className={`${styles.dayCell} ${stateClass}`} type="button" aria-label={`${habit.name}, ${formatDate(date, { weekday: "long", month: "short", day: "numeric" })}${done ? ", completed" : missed ? ", missed" : scheduled ? ", scheduled" : ", not scheduled"}`} aria-pressed={done} disabled={!scheduled || day > todayKey || pending} onClick={() => void toggleCompletion(habit, date)}>
                          {done ? <Check aria-hidden="true" /> : !scheduled ? <span aria-hidden="true">–</span> : null}
                        </button>
                      </div>;
                    })}
                    <div className={styles.habitTotal}>
                      <span>{habitCompleted}/{habit.weekdays.length}</span>
                      <ProgressBar value={habitCompleted} max={habit.weekdays.length || 1} />
                    </div>
                  </div>;
                })}
              </div>
            </div>

            {loading && <LoadingPlaceholder />}
            {!loading && !error && habits.length === 0 && <p className={styles.panelMessage}>No habits yet. Create your first habit.</p>}
            <div className={styles.legend} aria-label="Legend">
              <span><span className={`${styles.legendSwatch} ${styles.dayDone}`} aria-hidden="true"><Check /></span>Done</span>
              <span><span className={`${styles.legendSwatch} ${styles.dayScheduled}`} aria-hidden="true" />Scheduled</span>
              <span><span className={`${styles.legendSwatch} ${styles.dayMissed}`} aria-hidden="true" />Missed</span>
              <span><span className={`${styles.legendSwatch} ${styles.dayEmpty}`} aria-hidden="true">&ndash;</span>Not scheduled</span>
            </div>
          </Card>

          <Card className={styles.todayPanel}>
            <header className={styles.todayHeader}>
              <h2>Today</h2>
              <p>{formatDate(today, { weekday: "long", day: "numeric", month: "short" })}</p>
            </header>
            {!currentWeekIsVisible ? (
              <p className={styles.panelMessage}>Today is outside this week. Return to the current week to update it.</p>
            ) : (
              <div className={styles.todayList}>
                {todaysHabits.map((habit) => {
                  const done = isCompleted(habit, todayKey);
                  return <article className={styles.todayItem} key={habit.id}>
                    <div className={styles.todayInfo}>
                      <strong>{habit.name}</strong>
                      <span className={done ? styles.statusDone : ""}>{done ? "Done" : "Pending"}</span>
                    </div>
                    <button type="button" className={styles.editHabitButton} aria-label={`Edit ${habit.name}`} title="Edit habit" onClick={() => openHabitForm(habit)}>
                      <SquarePen size={14} aria-hidden="true" />
                    </button>
                    <button className={`${styles.todayCheck} ${done ? styles.todayCheckDone : ""}`} type="button" aria-label={`Mark ${habit.name} ${done ? "as pending" : "as done"}`} aria-pressed={done} disabled={pendingDays.includes(`${habit.id}-${todayKey}`)} onClick={() => void toggleCompletion(habit, today)}>
                      {done && <Check aria-hidden="true" />}
                    </button>
                  </article>;
                })}
                {!loading && !error && todaysHabits.length === 0 && <p className={styles.panelMessage}>No habits scheduled today.</p>}
              </div>
            )}
          </Card>
        </div>
      </main>

      <FormModal open={isModalOpen} title={editingHabit ? "Edit habit" : "New habit"} description={editingHabit ? "Update this habit and its schedule." : "It will appear in the weekly tracker and today's schedule."} onClose={() => setIsModalOpen(false)}>
        {formError && <p className={styles.error} role="alert">{formError}</p>}
        <HabitForm
          key={editingHabit?.id ?? "new-habit"}
          initial={editingHabit ? {
            name: editingHabit.name,
            days: weekdays.map((_, index) => editingHabit.weekdays.includes(index)),
            time: editingHabit.time?.slice(0, 5) ?? "",
            goal: editingHabit.goal,
            linked_section: editingHabit.linked_section ?? "",
            reminder: editingHabit.reminder,
          } : undefined}
          onSubmit={handleSaveHabit}
          onCancel={() => setIsModalOpen(false)}
          onDelete={editingHabit ? async () => {
            await deleteCollectionItem("habits", editingHabit.id);
            setIsModalOpen(false);
            setEditingHabit(null);
          } : undefined}
        />
      </FormModal>
    </>
  );
}
