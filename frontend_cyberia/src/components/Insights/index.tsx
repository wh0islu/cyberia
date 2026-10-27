import { Card } from "../Card";
import { ProductivityChart } from "../ProductivityChart";
import { SpotifyNowPlaying } from "../SpotifyNowPlaying";
import styles from "./styles.module.css";

const recentActivities = [
  {
    date: "Today · 8:10 AM",
    category: "Book",
    description: "Moved from page 100 to 120 in Dom Casmurro",
  },
  {
    date: "Yesterday",
    category: "Movie",
    description: "Watched Central do Brasil · rating 5/5",
  },
  {
    date: "Yesterday",
    category: "Course",
    description: "Completed lesson 24 of Interface Design",
  },
  {
    date: "Oct 20",
    category: "Meal",
    description: "Logged lunch",
  },
  {
    date: "Oct 19",
    category: "Routine",
    description: "Completed all 5 daily habits",
  },
];

export function Insights() {
  return (
    <main className={styles.insights}>
      <header className={styles.pageHeader}>
        <div>
          <span>Your activity across Cyberia</span>
          <h1>Insights</h1>
        </div>
        <span className={styles.period}>Last 7 days</span>
      </header>

      <div className={styles.insightsGrid}>
        <div className={styles.mainColumn}>
          <Card title="Recent activity" className={styles.activityCard}>
            <div className={styles.activityList}>
              {recentActivities.map((activity) => (
                <div className={styles.activityItem} key={`${activity.date}-${activity.category}`}>
                  <time>{activity.date}</time>
                  <span className={styles.category}>{activity.category}</span>
                  <span className={styles.description}>{activity.description}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="This month" className={styles.monthCard}>
            <div className={styles.monthStats}>
              <div>
                <span>Books finished</span>
                <strong>2</strong>
              </div>
              <div>
                <span>Pages read</span>
                <strong>486</strong>
              </div>
              <div>
                <span>Movies and episodes</span>
                <strong>9</strong>
              </div>
              <div>
                <span>Lessons completed</span>
                <strong>11</strong>
              </div>
            </div>
          </Card>
        </div>

        <aside className={styles.sideColumn} aria-label="Productivity and music">
          <ProductivityChart showDetails={false} />
          <SpotifyNowPlaying />
        </aside>
      </div>
    </main>
  );
}
