import { useCollections } from "../../hooks/useCollections";

type Book = { id: number; title: string; status: string; current_page: number };
type Movie = { id: number; title: string; status: string };
type Series = { id: number; title: string; status: string };
type Course = { id: number; title: string; completed_lessons: number };
type ReadingSession = { id: number; book: number; date: string; from_page: number; to_page: number };
type MovieSession = { id: number; movie: number; date: string; from_minute: number; to_minute: number };
type SeriesSession = { id: number; series: number; date: string; to_season: number; to_episode: number };
type StudySession = { id: number; course: number; date: string; from_lesson: number; to_lesson: number };
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
  "reading-sessions": ReadingSession[];
  "movie-sessions": MovieSession[];
  "series-sessions": SeriesSession[];
  "study-sessions": StudySession[];
};
export type Section = keyof InsightsData;
export type Activity = { id: string; date: Date; hasTime: boolean; category: string; description: string };

const sections: Section[] = [
  "books", "movies", "series", "courses", "meals", "habits", "habit-completions",
  "reading-sessions", "movie-sessions", "series-sessions", "study-sessions",
];
const mealNames: Record<string, string> = {
  BR: "breakfast", LU: "lunch", SN: "a snack", DI: "dinner", OT: "a meal",
};

export function useInsightsData() {
  return useCollections<InsightsData>(sections);
}

export function localDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function getRecentActivities(data: InsightsData) {
  const activities: Activity[] = [];
  const habitNames = new Map(data.habits.map((habit) => [habit.id, habit.name]));
  const titles = (items: { id: number; title: string }[]) => new Map(items.map((item) => [item.id, item.title]));
  const bookTitles = titles(data.books);
  const movieTitles = titles(data.movies);
  const seriesTitles = titles(data.series);
  const courseTitles = titles(data.courses);
  const range = (from: number, to: number, unit: string) => from === to ? `${unit} ${to}` : `${unit} ${from} → ${to}`;

  data["reading-sessions"].forEach((session) => activities.push({
    id: `reading-${session.id}`, date: localDate(session.date), hasTime: false, category: "Book",
    description: `Read ${bookTitles.get(session.book) ?? "a book"} · ${range(session.from_page, session.to_page, "p.")}`,
  }));
  data["movie-sessions"].forEach((session) => activities.push({
    id: `movie-${session.id}`, date: localDate(session.date), hasTime: false, category: "Movie",
    description: `Watched ${movieTitles.get(session.movie) ?? "a movie"} · ${range(session.from_minute, session.to_minute, "min")}`,
  }));
  data["series-sessions"].forEach((session) => activities.push({
    id: `series-${session.id}`, date: localDate(session.date), hasTime: false, category: "Series",
    description: `Watched ${seriesTitles.get(session.series) ?? "a series"} · up to S${session.to_season}E${session.to_episode}`,
  }));
  data["study-sessions"].forEach((session) => activities.push({
    id: `study-${session.id}`, date: localDate(session.date), hasTime: false, category: "Course",
    description: `Studied ${courseTitles.get(session.course) ?? "a course"} · ${range(session.from_lesson, session.to_lesson, "lessons")}`,
  }));
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
