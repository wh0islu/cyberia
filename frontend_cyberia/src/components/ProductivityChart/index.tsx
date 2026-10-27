import styles from "./styles.module.css";

type ProductivityDay = {
  date: Date;
  activities: number;
};

const weeklyActivityCounts = [3, 2, 4, 1, 4, 4, 3];

function createDemoWeek(): ProductivityDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  return weeklyActivityCounts.map((activities, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return {
      date,
      activities: date > today ? 0 : activities,
    };
  });
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(date);
}

type ProductivityChartProps = {
  showDetails?: boolean;
};

export function ProductivityChart({
  showDetails = true,
}: ProductivityChartProps) {
  const days = createDemoWeek();
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7;
  const todayActivities = days[todayIndex].activities;
  const weeklyActivities = days.reduce((total, day) => total + day.activities, 0);
  const maxActivities = Math.max(...days.map((day) => day.activities), 1);

  return (
    <section
      id="productivity"
      className={styles.panel}
      aria-labelledby="productivity-title"
    >
      <div className={styles.header}>
        <h3 id="productivity-title">Productivity</h3>
        {showDetails && <a href="/insights">Details ›</a>}
      </div>

      <div className={styles.summary}>
        <div>
          <span>Today, {formatDate(today)}</span>
          <strong>{todayActivities} {todayActivities === 1 ? "record" : "records"}</strong>
        </div>
        <div className={styles.weekSummary}>
          <span>This week</span>
          <strong>{weeklyActivities} records</strong>
        </div>
      </div>

      <div
        className={styles.chart}
        role="img"
        aria-label={`Productivity this week: ${weeklyActivities} records across seven days`}
      >
        {days.map((day, index) => {
          const weekday = new Intl.DateTimeFormat("en-US", {
            weekday: "short",
          })
            .format(day.date)
            .toLowerCase();
          const isToday = index === todayIndex;
          const height = `${(day.activities / maxActivities) * 100}%`;

          return (
            <div className={styles.chartDay} key={day.date.toISOString()}>
              <span className={styles.chartCount}>{day.activities || ""}</span>
              <div className={styles.barTrack}>
                <span
                  className={[
                    styles.bar,
                    isToday && styles.barToday,
                    day.activities === 0 && styles.barEmpty,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ height }}
                  title={`${day.date.toLocaleDateString("en-US")}: ${day.activities} records`}
                />
              </div>
              <span className={isToday ? styles.todayLabel : styles.dayLabel}>
                {isToday ? "today" : weekday}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
