import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { HabitForm } from "../../forms";
import { FormModal } from "../FormModal";
import styles from "./styles.module.css";

type Habit = {
  id: number;
  name: string;
  goal: string;
  activeDays: number[];
  completedDays: boolean[];
};

type NewHabitData = {
  name: string;
  goal: string;
  weekdays: number[];
};

const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const initialHabits: Habit[] = [
  {
    id: 1,
    name: "Read 20 pages",
    goal: "reading",
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    completedDays: [true, true, true, true, false, false, false],
  },
  {
    id: 2,
    name: "Exercise",
    goal: "45 min",
    activeDays: [0, 2, 4, 6],
    completedDays: [true, false, true, false, false, false, false],
  },
  {
    id: 3,
    name: "Study a course",
    goal: "1 h",
    activeDays: [0, 1, 3, 5],
    completedDays: [true, true, false, true, false, false, false],
  },
  {
    id: 4,
    name: "Drink 2 L of water",
    goal: "2 L",
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    completedDays: [true, true, true, true, false, false, false],
  },
  {
    id: 5,
    name: "Sleep before 11 PM",
    goal: "sleep",
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    completedDays: [false, true, true, false, false, false, false],
  },
];

const schedule = [
  {
    time: "06:30",
    name: "Wake up",
    detail: "Goal: before 7 AM",
    status: "Done",
  },
  { time: "07:00", name: "Exercise", detail: "45 min", status: "Done" },
  { time: "09:00", name: "Work / study", detail: "4 hours", status: "Done" },
  { time: "13:00", name: "Lunch", detail: "1 hour", status: "Done" },
  {
    time: "19:00",
    name: "Study a course",
    detail: "1 hour · Interface Design",
    status: "Now",
  },
  {
    time: "22:00",
    name: "Reading",
    detail: "30 min · Dom Casmurro",
    status: "Later",
  },
];

function getWeekStart(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  const daysSinceMonday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return weekStart;
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function Routine() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habits, setHabits] = useState(initialHabits);
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const weekStart = getWeekStart(today);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const weekDates = weekdays.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const completedCount = habits.reduce(
    (total, habit) => total + habit.completedDays.filter(Boolean).length,
    0,
  );
  const scheduledCount = habits.reduce(
    (total, habit) => total + habit.activeDays.length,
    0,
  );
  const completionPercentage = scheduledCount
    ? Math.round((completedCount / scheduledCount) * 100)
    : 0;

  function toggleCompletion(habitId: number, dayIndex: number) {
    setHabits((currentHabits) =>
      currentHabits.map((habit) =>
        habit.id === habitId
          ? {
              ...habit,
              completedDays: habit.completedDays.map((completed, index) =>
                index === dayIndex ? !completed : completed,
              ),
            }
          : habit,
      ),
    );
  }

  async function handleCreateHabit(data: NewHabitData) {
    setHabits((currentHabits) => [
      ...currentHabits,
      {
        id: Date.now(),
        name: data.name,
        goal: data.goal || "—",
        activeDays: data.weekdays,
        completedDays: Array(7).fill(false),
      },
    ]);
    setIsModalOpen(false);
  }

  return (
    <>
      <main className={styles.page}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Routine</h1>
            <p>Weekly habits and daily schedule</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.weekControls} aria-label="Navigate weeks">
              <button
                type="button"
                aria-label="Previous week"
                onClick={() => setWeekOffset((offset) => offset - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                {formatDate(weekDates[0], { day: "numeric" })} –{" "}
                {formatDate(weekDates[6], {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <button
                type="button"
                aria-label="Next week"
                onClick={() => setWeekOffset((offset) => offset + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} aria-hidden="true" />
              New habit
            </button>
          </div>
        </header>

        <div className={styles.columns}>
          <section className={styles.weekPanel}>
            <header className={styles.panelHeader}>
              <h2>Weekly habits</h2>
              <span>{completionPercentage}% complete</span>
            </header>

            <div className={styles.weekGrid}>
              <div className={styles.gridCorner} />
              {weekDates.map((date, index) => (
                <div className={styles.dayHeading} key={date.toISOString()}>
                  <span>{weekdays[index]}</span>
                  <time dateTime={date.toISOString()}>
                    {formatDate(date, { day: "numeric" })}
                  </time>
                </div>
              ))}
              <span className={styles.totalHeading}>Total</span>

              {habits.map((habit) => (
                <div className={styles.habitRow} key={habit.id}>
                  <span className={styles.habitName}>{habit.name}</span>
                  {weekDates.map((date, index) => {
                    const isScheduled = habit.activeDays.includes(index);
                    const isCompleted = habit.completedDays[index];

                    return (
                      <button
                        className={
                          isCompleted
                            ? styles.dayDone
                            : isScheduled
                              ? styles.dayScheduled
                              : styles.dayEmpty
                        }
                        type="button"
                        key={`${habit.id}-${date.toISOString()}`}
                        aria-label={`${habit.name}, ${formatDate(date, { weekday: "long", day: "numeric" })}${isCompleted ? ", completed" : ", not completed"}`}
                        aria-pressed={isCompleted}
                        disabled={!isScheduled}
                        onClick={() => toggleCompletion(habit.id, index)}
                      >
                        {isCompleted ? "✓" : ""}
                      </button>
                    );
                  })}
                  <span className={styles.habitTotal}>
                    {habit.completedDays.filter(Boolean).length}/
                    {habit.activeDays.length}
                  </span>
                </div>
              ))}
            </div>

            <p className={styles.weekHint}>
              Click a day to mark or unmark it. Longest streak: 12 days
              (reading)
            </p>
          </section>

          <section className={styles.todayPanel}>
            <header className={styles.todayHeader}>
              <div>
                <h2>Today</h2>
                <p>
                  {formatDate(today, {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </header>

            <div className={styles.agendaList}>
              {schedule.map((item) => (
                <article className={styles.agendaItem} key={item.time}>
                  <time>{item.time}</time>
                  <div className={styles.agendaDetails}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.detail}</p>
                    </div>
                    <span className={styles[`status${item.status}`]}>
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <FormModal
        open={isModalOpen}
        title="New habit"
        description="It will appear in the weekly tracker and today's schedule."
        onClose={() => setIsModalOpen(false)}
      >
        <HabitForm
          initial={undefined}
          onSubmit={handleCreateHabit}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </>
  );
}
