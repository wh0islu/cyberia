import { Plus } from "lucide-react";
import { Card } from "../Card";
import { ProgressBar } from "../ProgressBar";
import styles from "./styles.module.css";

const cleanCodeCover = "/media/books/covers/cleancode.jpg";

const courses = [
  { title: "Interface Design", lesson: "Lesson 24 of 40", progress: 60 },
  { title: "React from Scratch", lesson: "Lesson 5 of 20", progress: 25 },
  { title: "Statistics with Python", lesson: "Lesson 16 of 20", progress: 80 },
];

const habits = [
  { time: "06:30", label: "Wake up", done: true },
  { time: "07:00", label: "Exercise", done: true },
  { time: "09:00", label: "Work / study", done: false },
  { time: "19:00", label: "Study a course", done: false },
  { time: "22:00", label: "Read 20 pages", done: false },
];

const meals = [
  { name: "Breakfast", description: "Tapioca with cheese", time: "07:15" },
  { name: "Lunch", description: "Grilled fish, rice, and beans", time: "12:40" },
  { name: "Snack", description: "Not recorded yet", time: "—" },
  { name: "Dinner", description: "Not recorded yet", time: "—" },
];

const watchedItems = [
  {
    title: "Central do Brasil",
    type: "Movie",
    image: "https://static.mostra.org/_img/_filmes/95182.jpg",
    alt: "Poster for Central do Brasil",
  },
  {
    title: "Cangaço Novo",
    type: "Series · S1E4",
    image:
      "https://assets.aboutamazon.com/dims4/default/0074566/2147483647/strip/true/crop/1080x1080%2B0%2B0/resize/743x743%21/quality/90/?url=https%3A%2F%2Fassets.aboutamazon.com%2F55%2F39%2F158a58ac4044a255daa4968dbcae%2F1080x1080-1.jpg",
    alt: "Poster for Cangaço Novo",
  },
  {
    title: "Bacurau",
    type: "Movie",
    image:
      "https://www.opovo.com.br/_midias/jpg/2022/03/03/bacurau_distopia_06_03_2022-18228962.jpg",
    alt: "Poster for Bacurau",
  },
];

const monthlyStats = [
  { label: "Books finished", value: "2" },
  { label: "Pages read", value: "486" },
  { label: "Movies / episodes", value: "9" },
  { label: "Lessons completed", value: "11" },
];

function getTodayDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function Home() {
  return (
    <main className={styles.home}>
      <header className={styles.pageHeader}>
        <span>{getTodayDate()}</span>
        <a className={styles.addAction} href="/books">
          <Plus aria-hidden="true" size={15} />
          Add a book
        </a>
      </header>

      <section className={styles.dashboard} aria-label="Dashboard overview">
        <Card
          title="Currently reading"
          action={{ label: "Bookshelf ›", href: "/books" }}
          className={styles.readingCard}
        >
          <div className={styles.bookCoverFrame}>
            <img className={styles.bookBackdrop} src={cleanCodeCover} alt="" aria-hidden="true" />
            <img className={styles.bookCover} src={cleanCodeCover} alt="Clean Code cover" />
          </div>
          <div className={styles.bookDetails}>
            <strong>Clean Code</strong>
            <span>Robert C. Martin</span>
          </div>
          <ProgressBar value={120} max={340} className={styles.progressBar} />
          <div className={styles.bookProgress}>
            <span>p. 120 / 340</span>
            <strong>35%</strong>
          </div>
        </Card>

        <Card
          title="Courses in progress"
          action={{ label: "View all ›", href: "/courses" }}
          className={styles.coursesCard}
        >
          <div className={styles.courseList}>
            {courses.map((course) => (
              <div className={styles.courseItem} key={course.title}>
                <div className={styles.courseHeading}>
                  <strong>{course.title}</strong>
                  <span>{course.progress}%</span>
                </div>
                <ProgressBar
                  value={course.progress}
                  max={100}
                  className={styles.progressBar}
                />
                <small>{course.lesson}</small>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Today's routine"
          action={{ label: "2 / 5", href: "/routine" }}
          className={styles.routineCard}
        >
          <ul className={styles.habitList}>
            {habits.map((habit) => (
              <li className={styles.habitItem} key={habit.time}>
                <span
                  className={habit.done ? styles.checkboxDone : styles.checkbox}
                  aria-hidden="true"
                />
                <time>{habit.time}</time>
                <span className={habit.done ? styles.habitDone : ""}>
                  {habit.label}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="What I ate today"
          action={{ label: "Log ›", href: "/meals" }}
          className={styles.mealsCard}
        >
          <div className={styles.mealList}>
            {meals.map((meal) => (
              <div className={styles.mealItem} key={meal.name}>
                <div>
                  <strong>{meal.name}</strong>
                  <small>{meal.description}</small>
                </div>
                <time>{meal.time}</time>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Recently watched"
          action={{ label: "View all ›", href: "/movies/series" }}
          className={styles.watchedCard}
        >
          <div className={styles.watchedList}>
            {watchedItems.map((item) => (
              <figure className={styles.watchedItem} key={item.title}>
                <img src={item.image} alt={item.alt} loading="lazy" />
                <figcaption>
                  <strong>{item.title}</strong>
                  <small>{item.type}</small>
                </figcaption>
              </figure>
            ))}
          </div>
        </Card>

        <Card title="Monthly summary" className={styles.summaryCard}>
          <div className={styles.summaryGrid}>
            {monthlyStats.map((stat) => (
              <div className={styles.summaryItem} key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
