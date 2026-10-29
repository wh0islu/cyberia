import { useEffect, useState } from "react";
import { Card } from "../Card";
import { ProgressBar } from "../ProgressBar";
import styles from "./styles.module.css";

type Book = {
  id: number;
  title: string;
  author: string;
  status: string;
  cover: string | null;
  current_page: number;
  number_of_pages: number | null;
  last_read_at: string | null;
  started_on: string | null;
};
type Course = {
  id: number;
  title: string;
  status: string;
  completed_lessons: number;
  number_of_lessons: number | null;
};
type Habit = {
  id: number;
  name: string;
  weekdays: number[];
  time: string | null;
  completions: { date: string; completed: boolean }[];
};
type Meal = {
  id: number;
  category: string;
  date: string;
  time: string | null;
  items: { name: string }[];
};
type Media = {
  id: number;
  title: string;
  status: string;
  cover: string | null;
  tmdb_poster_path: string | null;
  current_season?: number | null;
  current_episode?: number | null;
};
type DashboardData = {
  books: Book[];
  courses: Course[];
  habits: Habit[];
  meals: Meal[];
  movies: Media[];
  series: Media[];
};
type Section = keyof DashboardData;

const emptyData: DashboardData = { books: [], courses: [], habits: [], meals: [], movies: [], series: [] };
const mealCategories = [
  { code: "BR", name: "Breakfast" }, { code: "LU", name: "Lunch" },
  { code: "SN", name: "Snack" }, { code: "DI", name: "Dinner" },
];

async function loadCollection<K extends Section>(section: K, signal: AbortSignal): Promise<DashboardData[K]> {
  const response = await fetch(`/api/v1/${section}/`, { signal, credentials: "include" });
  if (!response.ok) throw new Error(`Could not load ${section}.`);
  return response.json();
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mediaCover(item: Media) {
  return item.cover || (item.tmdb_poster_path
    ? `https://image.tmdb.org/t/p/w500${item.tmdb_poster_path}` : null);
}

function getTodayDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function Home() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [failedSections, setFailedSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      const sections: Section[] = ["books", "courses", "habits", "meals", "movies", "series"];
      const results = await Promise.allSettled(
        sections.map((section) => loadCollection(section, controller.signal)),
      );
      if (controller.signal.aborted) return;

      const nextData: DashboardData = { ...emptyData };
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

    void loadDashboard();
    return () => controller.abort();
  }, []);

  const readingBook = data.books.filter((book) => book.status === "RE" || book.status === "RW")
    .sort((first, second) => {
      const firstRead = Date.parse(first.last_read_at ?? first.started_on ?? "") || 0;
      const secondRead = Date.parse(second.last_read_at ?? second.started_on ?? "") || 0;
      return secondRead - firstRead || second.id - first.id;
    })[0];
  const totalPages = readingBook?.number_of_pages ?? 0;
  const bookPercentage = readingBook && totalPages
    ? Math.min(100, Math.round(readingBook.current_page / totalPages * 100)) : 0;
  const coursesInProgress = data.courses.filter((course) => course.status === "IP")
    .sort((first, second) => second.id - first.id).slice(0, 3);
  const today = new Date();
  const todayKey = localDateKey(today);
  const weekday = (today.getDay() + 6) % 7;
  const todaysHabits = data.habits.filter((habit) => habit.weekdays.includes(weekday))
    .sort((first, second) => (first.time ?? "99:99").localeCompare(second.time ?? "99:99"));
  const completedHabits = todaysHabits.filter((habit) =>
    habit.completions.some((completion) => completion.date === todayKey && completion.completed),
  ).length;
  const todaysMeals = mealCategories.map((category) => ({
    ...category,
    meal: data.meals.filter((meal) => meal.category === category.code && meal.date === todayKey)
      .sort((first, second) => second.id - first.id)[0],
  }));
  const watchedItems = [
    ...data.movies.filter((movie) => movie.status === "WT").map((item) => ({ ...item, type: "Movie" })),
    ...data.series.filter((series) => series.status === "WD").map((item) => ({ ...item, type: "Series" })),
  ].sort((first, second) => second.id - first.id).slice(0, 3);
  const summary: { label: string; value: number; sections: Section[] }[] = [
    { label: "Books finished", value: data.books.filter((book) => book.status === "FD").length, sections: ["books"] },
    { label: "Pages read", value: data.books.reduce((total, book) => total + book.current_page, 0), sections: ["books"] },
    { label: "Titles watched", value: data.movies.filter((movie) => movie.status === "WT").length + data.series.filter((series) => series.status === "WD").length, sections: ["movies", "series"] },
    { label: "Lessons completed", value: data.courses.reduce((total, course) => total + course.completed_lessons, 0), sections: ["courses"] },
  ];

  function sectionMessage(sections: Section[], empty: string) {
    if (loading) return "Loading...";
    if (sections.some((section) => failedSections.includes(section))) return "Could not load this information.";
    return empty;
  }

  return (
    <main className={styles.home}>
      <header className={styles.pageHeader}>
        <span>{getTodayDate()}</span>
      </header>

      <section className={styles.dashboard} aria-label="Dashboard overview">
        <Card
          title="Currently reading"
          action={{ label: "Bookshelf ›", href: "/books" }}
          className={styles.readingCard}
        >
          {readingBook ? (
            <>
              <div className={styles.bookCoverFrame}>
                {readingBook.cover ? (
                  <>
                    <img className={styles.bookBackdrop} src={readingBook.cover} alt="" aria-hidden="true" />
                    <img className={styles.bookCover} src={readingBook.cover} alt={`Cover of ${readingBook.title}`} />
                  </>
                ) : <span className={styles.coverPlaceholder}>No cover</span>}
              </div>
              <div className={styles.bookDetails}>
                <strong>{readingBook.title}</strong>
                <span>{readingBook.author}</span>
              </div>
              <ProgressBar value={readingBook.current_page} max={totalPages} className={styles.progressBar} />
              <div className={styles.bookProgress}>
                <span>p. {readingBook.current_page} / {totalPages || "—"}</span>
                <strong>{bookPercentage}%</strong>
              </div>
            </>
          ) : <p className={styles.emptyMessage}>{sectionMessage(["books"], "No books in progress.")}</p>}
        </Card>

        <Card
          title="Courses in progress"
          action={{ label: "View all ›", href: "/courses" }}
          className={styles.coursesCard}
        >
          <div className={styles.courseList}>
            {coursesInProgress.map((course) => (
              <div className={styles.courseItem} key={course.id}>
                <div className={styles.courseHeading}>
                  <strong>{course.title}</strong>
                  <span>{course.number_of_lessons ? Math.round(course.completed_lessons / course.number_of_lessons * 100) : 0}%</span>
                </div>
                <ProgressBar
                  value={course.completed_lessons}
                  max={course.number_of_lessons ?? 0}
                  className={styles.progressBar}
                />
                <small>Lesson {course.completed_lessons} of {course.number_of_lessons ?? "—"}</small>
              </div>
            ))}
            {!coursesInProgress.length && <p className={styles.emptyMessage}>{sectionMessage(["courses"], "No courses in progress.")}</p>}
          </div>
        </Card>

        <Card
          title="Today's routine"
          action={{ label: loading || failedSections.includes("habits") ? "— / —" : `${completedHabits} / ${todaysHabits.length}`, href: "/routine" }}
          className={styles.routineCard}
        >
          <ul className={styles.habitList}>
            {todaysHabits.map((habit) => {
              const done = habit.completions.some((completion) => completion.date === todayKey && completion.completed);
              return <li className={styles.habitItem} key={habit.id}>
                <span
                  className={done ? styles.checkboxDone : styles.checkbox}
                  aria-hidden="true"
                />
                <time>{habit.time?.slice(0, 5) ?? "—"}</time>
                <span className={done ? styles.habitDone : ""}>
                  {habit.name}
                </span>
              </li>;
            })}
          </ul>
          {!todaysHabits.length && <p className={styles.emptyMessage}>{sectionMessage(["habits"], "No habits scheduled today.")}</p>}
        </Card>

        <Card
          title="What I ate today"
          action={{ label: "Log ›", href: "/meals" }}
          className={styles.mealsCard}
        >
          <div className={styles.mealList}>
            {todaysMeals.map(({ code, name, meal }) => (
              <div className={styles.mealItem} key={code}>
                <div>
                  <strong>{name}</strong>
                  <small>{meal ? (meal.items.length ? meal.items.map((item) => item.name).join(", ") : "Meal logged") : sectionMessage(["meals"], "Not recorded yet")}</small>
                </div>
                <time>{meal?.time?.slice(0, 5) ?? "—"}</time>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Watched titles"
          action={{ label: "View all ›", href: "/movies/series" }}
          className={styles.watchedCard}
        >
          <div className={styles.watchedList}>
            {watchedItems.map((item) => (
              <figure className={styles.watchedItem} key={`${item.type}-${item.id}`}>
                {mediaCover(item) ? <img src={mediaCover(item)!} alt={`Poster of ${item.title}`} loading="lazy" /> : <div className={styles.posterPlaceholder} role="img" aria-label={`No poster for ${item.title}`} />}
                <figcaption>
                  <strong>{item.title}</strong>
                  <small>{item.type === "Series" && item.current_season && item.current_episode
                    ? `Series · S${item.current_season}E${item.current_episode}`
                    : item.type}</small>
                </figcaption>
              </figure>
            ))}
          </div>
          {!watchedItems.length && <p className={styles.emptyMessage}>{sectionMessage(["movies", "series"], "No watched titles yet.")}</p>}
        </Card>

        <Card title="Library summary" className={styles.summaryCard}>
          <div className={styles.summaryGrid}>
            {summary.map((stat) => (
              <div className={styles.summaryItem} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{loading || stat.sections.some((section) => failedSections.includes(section)) ? "—" : stat.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
