import { LoadingPlaceholder } from "../LoadingPlaceholder";
import {
  BarElement, CategoryScale, Chart as ChartJS, LinearScale, Legend, Tooltip,
  type BarElement as ChartBarElement, type ChartData, type ChartOptions, type Plugin,
} from "chart.js";
import { Chart as ReactChart } from "react-chartjs-2";
import { Card } from "../Card";
import { ProductivityChart } from "../ProductivityChart";
import { getMonths, getRecentActivities, localDate, useInsightsData, type Section } from "./data";
import styles from "./styles.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function displayDate(date: Date, hasTime: boolean) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (first: Date, second: Date) =>
    first.toDateString() === second.toDateString();
  if (sameDay(date, today)) return hasTime
    ? `Today · ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date)}`
    : "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

const monthlyTotalsPlugin: Plugin<"bar"> = {
  id: "monthlyTotals",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    const topBars = chart.getDatasetMeta(data.datasets.length - 1).data as ChartBarElement[];
    ctx.save();
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--text-default").trim() || "#171717";
    ctx.font = "12px Geist, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    topBars.forEach((bar, index) => {
      const total = data.datasets.reduce((sum, dataset) =>
        sum + Number(dataset.data[index] ?? 0), 0);
      if (total > 0) {
        const { x, y } = bar.getProps(["x", "y"], true);
        if (x !== null && y !== null) ctx.fillText(String(total), x, y - 7);
      }
    });
    ctx.restore();
  },
};

const activityTrendOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top", align: "end",
      labels: { usePointStyle: true, pointStyle: "rect", boxWidth: 8,
        boxHeight: 8, padding: 14, color: "#777", font: { size: 10 } },
    },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: { stacked: true, grid: { display: false }, border: { display: false },
      ticks: { color: "#777", font: { size: 11 } } },
    y: { stacked: true, beginAtZero: true,
      grid: { color: "rgba(128, 128, 128, 0.18)" }, border: { display: false },
      ticks: { precision: 0, color: "#888", padding: 8 } },
  },
};

export function Insights() {
  const { data, failedSections, loading } = useInsightsData();
  const activities = getRecentActivities(data);
  const months = getMonths();
  const monthlyCounts = (dates: Date[]) => months.map(({ year, month }) =>
    dates.filter((date) => date.getFullYear() === year && date.getMonth() === month).length);
  const monthlyData: ChartData<"bar", number[], string> = {
    labels: months.map(({ label }) => label),
    datasets: [
      { label: "Books updated", data: monthlyCounts(data.books.flatMap((book) =>
        book.last_read_at ? [new Date(book.last_read_at)] : [])), backgroundColor: "#0da170" },
      { label: "Meals logged", data: monthlyCounts(data.meals.map((meal) => localDate(meal.date))), backgroundColor: "#69c9a5" },
      { label: "Habits completed", data: monthlyCounts(data["habit-completions"]
        .filter((item) => item.completed).map((item) => localDate(item.date))), backgroundColor: "#b8e4d4" },
    ].map((dataset) => ({ ...dataset, borderSkipped: false as const, borderRadius: 2,
      stack: "monthlyActivity", categoryPercentage: 0.62, barPercentage: 0.82, maxBarThickness: 84 })),
  };
  const activitySections: Section[] = ["books", "meals", "habits", "habit-completions"];
  const activityError = activitySections.some((section) => failedSections.includes(section));
  const chartSections: Section[] = ["books", "meals", "habit-completions"];
  const chartUnavailable = chartSections.every((section) => failedSections.includes(section));
  const hasMonthlyActivity = monthlyData.datasets.some((dataset) =>
    dataset.data.some((count) => count > 0));
  const summary: { label: string; value: number; sections: Section[] }[] = [
    { label: "Books finished", value: data.books.filter((book) => book.status === "FD").length, sections: ["books"] },
    { label: "Recorded pages", value: data.books.reduce((sum, book) => sum + book.current_page, 0), sections: ["books"] },
    { label: "Titles watched", value: data.movies.filter((movie) => movie.status === "WT").length +
      data.series.filter((series) => series.status === "WD").length, sections: ["movies", "series"] },
    { label: "Lessons completed", value: data.courses.reduce((sum, course) => sum + course.completed_lessons, 0), sections: ["courses"] },
  ];

  return (
    <main className={styles.insights}>
      <header className={styles.pageHeader}>
        <div><h1>Insights</h1><p>Your activity across Cyberia</p></div>
        <span className={styles.period}>Recent activity · last 7 days</span>
      </header>

      <div className={styles.insightsGrid}>
        <Card title="Recent activity" className={styles.activityCard}>
          {activities.length ? <div className={styles.activityList}>
            {activities.map((activity) => <div className={styles.activityItem} key={activity.id}>
              <time dateTime={activity.date.toISOString()}>{displayDate(activity.date, activity.hasTime)}</time>
              <span className={styles.category}>{activity.category}</span>
              <span className={styles.description}>{activity.description}</span>
            </div>)}
          </div> : <p className={styles.emptyMessage}>{loading ? <LoadingPlaceholder compact /> : activityError
            ? "Could not load all recent activity." : "No recorded activity in the last 7 days."}</p>}
          {activityError && activities.length > 0 && <p className={styles.dataNote}>Some activity could not be loaded.</p>}
        </Card>
        <aside className={styles.sideColumn} aria-label="Productivity">
          <ProductivityChart showDetails={false} />
        </aside>
      </div>

      <Card className={styles.monthCard} aria-label="Library totals">
        <div className={styles.monthHeader}><h2>Library totals</h2><span>Current snapshot</span></div>
        <div className={styles.monthStats}>
          {summary.map((stat) => <div key={stat.label}>
            <span>{stat.label}</span>
            <strong>{loading || stat.sections.some((section) => failedSections.includes(section))
              ? "—" : stat.value.toLocaleString("en-US")}</strong>
          </div>)}
        </div>
      </Card>

      <Card title="Activity by month" className={styles.trendCard}>
        <p className={styles.demoNote}>Dated records by type · last 6 months</p>
        {loading ? <LoadingPlaceholder /> : chartUnavailable
          ? <p className={styles.emptyMessage}>Could not load monthly activity.</p>
          : !hasMonthlyActivity
          ? <p className={styles.emptyMessage}>No dated activity in the last 6 months.</p> :
          <div className={styles.trendChart}>
            <ReactChart type="bar" data={monthlyData} options={activityTrendOptions}
              plugins={[monthlyTotalsPlugin]} />
          </div>}
        <p className={styles.chartFootnote}>
          {activityError ? "Some records could not be loaded. " : ""}
          Books count their latest reading update; movies and lessons have no activity dates yet.
        </p>
      </Card>
    </main>
  );
}
