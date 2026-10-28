import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Legend,
  Tooltip,
  type BarElement as ChartBarElement,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Chart as ReactChart } from "react-chartjs-2";
import { Card } from "../Card";
import { ProductivityChart } from "../ProductivityChart";
import styles from "./styles.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const activityTrendData: ChartData<"bar", number[], string> = {
  labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct*"],
  datasets: [
    {
      label: "Books",
      data: [1, 2, 1, 3, 2, 2],
      backgroundColor: "#0da170",
      borderSkipped: false,
      borderRadius: 2,
      stack: "monthlyActivity",
      categoryPercentage: 0.62,
      barPercentage: 0.82,
      maxBarThickness: 84,
    },
    {
      label: "Movies and series",
      data: [2, 3, 4, 4, 7, 9],
      backgroundColor: "#69c9a5",
      borderSkipped: false,
      borderRadius: 2,
      stack: "monthlyActivity",
      categoryPercentage: 0.62,
      barPercentage: 0.82,
      maxBarThickness: 84,
    },
    {
      label: "Lessons",
      data: [3, 2, 5, 3, 4, 11],
      backgroundColor: "#b8e4d4",
      borderSkipped: false,
      borderRadius: 2,
      stack: "monthlyActivity",
      categoryPercentage: 0.62,
      barPercentage: 0.82,
      maxBarThickness: 84,
    },
  ],
};

const monthlyTotalsPlugin: Plugin<"bar"> = {
  id: "monthlyTotals",
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    const topBars = chart.getDatasetMeta(2).data as ChartBarElement[];
    const totals =
      activityTrendData.labels?.map((_, index) =>
        activityTrendData.datasets.reduce(
          (sum, dataset) => sum + (dataset.data[index] ?? 0),
          0,
        ),
      ) ?? [];

    ctx.save();
    ctx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--text-default")
        .trim() || "#171717";
    ctx.font = "12px Geist, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    topBars.forEach((bar, index) => {
      const { x, y } = bar.getProps(["x", "y"], true);
      if (x !== null && y !== null)
        ctx.fillText(String(totals[index]), x, y - 7);
    });
    ctx.restore();
  },
};

const activityTrendOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        usePointStyle: true,
        pointStyle: "rect",
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
        color: "#777",
        font: { size: 10 },
      },
    },
    tooltip: { mode: "index", intersect: false },
  },
  scales: {
    x: {
      stacked: true,
      grid: { display: false },
      border: { display: false },
      ticks: { color: "#777", font: { size: 11 } },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      suggestedMax: 24,
      grid: { color: "rgba(128, 128, 128, 0.18)" },
      border: { display: false },
      ticks: { stepSize: 6, precision: 0, color: "#888", padding: 8 },
    },
  },
};

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
          <h1>Insights</h1>
          <p>Your activity across Cyberia</p>
        </div>
        <span className={styles.period}>Demo data · Last 7 days</span>
      </header>

      <div className={styles.insightsGrid}>
        <Card title="Recent activity" className={styles.activityCard}>
          <div className={styles.activityList}>
            {recentActivities.map((activity) => (
              <div
                className={styles.activityItem}
                key={`${activity.date}-${activity.category}`}
              >
                <time>{activity.date}</time>
                <span className={styles.category}>{activity.category}</span>
                <span className={styles.description}>
                  {activity.description}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <aside className={styles.sideColumn} aria-label="Productivity">
          <ProductivityChart showDetails={false} />
        </aside>
      </div>

      <Card className={styles.monthCard} aria-label="This month summary">
        <div className={styles.monthHeader}>
          <h2>This month</h2>
          <span>October through today</span>
        </div>
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

      <Card title="Activity by month" className={styles.trendCard}>
        <p className={styles.demoNote}>
          Completed items by type · May to October
        </p>
        <div className={styles.trendChart}>
          <ReactChart
            type="bar"
            data={activityTrendData}
            options={activityTrendOptions}
            plugins={[monthlyTotalsPlugin]}
          />
        </div>
        <p className={styles.chartFootnote}>
          Oct* is partial: the month is still in progress.
        </p>
      </Card>
    </main>
  );
}
