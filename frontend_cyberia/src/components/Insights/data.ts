import { useEffect, useState } from "react";

type Book = { id: number; title: string; status: string; current_page: number; last_read_at: string | null };
type Movie = { id: number; status: string };
type Series = { id: number; status: string };
type Course = { id: number; completed_lessons: number };
type Meal = { id: number; category: string; date: string; time: string | null };
type Habit = { id: number; name: string };
type Completion = { id: number; habit: number; date: string; completed: boolean };

export type InsightsData = {
  books: Book[];
  movies: Movie[];
  series: Series[];
  courses: Course[];
  meals: Meal[];
  habits: Habit[];
  "habit-completions": Completion[];
};
export type Section = keyof InsightsData;
export type Activity = { id: string; date: Date; hasTime: boolean; category: string; description: string };

const sections: Section[] = ["books", "movies", "series", "courses", "meals", "habits", "habit-completions"];
const emptyData: InsightsData = {
  books: [], movies: [], series: [], courses: [], meals: [], habits: [], "habit-completions": [],
};
const mealNames: Record<string, string> = {
  BR: "breakfast", LU: "lunch", SN: "a snack", DI: "dinner", OT: "a meal",
};

async function loadCollection(section: Section, signal: AbortSignal) {
  const response = await fetch(`/api/v1/${section}/`, { credentials: "include", signal });
  if (!response.ok) throw new Error(`Could not load ${section} (${response.status})`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error(`Unexpected response for ${section}`);
  return data;
}

export function useInsightsData() {
  const [data, setData] = useState<InsightsData>(emptyData);
  const [failedSections, setFailedSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadInsights() {
      const results = await Promise.allSettled(
        sections.map((section) => loadCollection(section, controller.signal)),
      );
      if (controller.signal.aborted) return;

      const nextData: InsightsData = { ...emptyData };
      const failures: Section[] = [];
      results.forEach((result, index) => {
        const section = sections[index];
        if (result.status === "fulfilled") Object.assign(nextData, { [section]: result.value });
        else failures.push(section);
      });
      setData(nextData);
      setFailedSections(failures);
      setLoading(false);
    }

    void loadInsights();
    return () => controller.abort();
  }, []);

  return { data, failedSections, loading };
}

export function localDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function getRecentActivities(data: InsightsData) {
  const activities: Activity[] = [];
  const habitNames = new Map(data.habits.map((habit) => [habit.id, habit.name]));

  data.books.forEach((book) => {
    if (book.last_read_at) activities.push({
      id: `book-${book.id}`, date: new Date(book.last_read_at), hasTime: true, category: "Book",
      description: `Reading ${book.title} · page ${book.current_page}`,
    });
  });
  data.meals.forEach((meal) => {
    const date = localDate(meal.date);
    if (meal.time) {
      const [hour, minute] = meal.time.split(":").map(Number);
      date.setHours(hour, minute);
    }
    activities.push({
      id: `meal-${meal.id}`, date, hasTime: Boolean(meal.time), category: "Meal",
      description: `Logged ${mealNames[meal.category] ?? "a meal"}`,
    });
  });
  data["habit-completions"].forEach((completion) => {
    if (completion.completed) activities.push({
      id: `completion-${completion.id}`, date: localDate(completion.date), hasTime: false,
      category: "Routine", description: `Completed ${habitNames.get(completion.habit) ?? "a habit"}`,
    });
  });

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return activities.filter((item) => item.date >= start && item.date <= end)
    .sort((first, second) => second.date.getTime() - first.date.getTime())
    .slice(0, 5);
}

export function getMonths() {
  const today = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    return {
      year: date.getFullYear(), month: date.getMonth(),
      label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
    };
  });
}
