import { LoadingPlaceholder } from "../LoadingPlaceholder";
import { useMemo } from "react";
import { useCollection } from "../../hooks/useCollections";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card } from "../Card";
import styles from "./styles.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type HabitCompletion = {
  date: string;
  completed: boolean;
};

type ProductivityChartProps = { showDetails?: boolean };

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentWeek() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function getCompletionDateKey(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return getLocalDateKey(new Date(year, month - 1, day));
}

export function ProductivityChart({ showDetails = true }: ProductivityChartProps) {
  const { data: completions, loading: isLoading, error } = useCollection<HabitCompletion>("habit-completions");
  const hasError = Boolean(error);
  const week = useMemo(() => getCurrentWeek(), []);
  const todayKey = getLocalDateKey(new Date());

  const dailyCounts = week.map((date) => {
    const dateKey = getLocalDateKey(date);
    return completions.filter((completion) =>
      completion.completed && getCompletionDateKey(completion.date) === dateKey,
    ).length;
  });
  const todayCount = dailyCounts.find((_, index) => getLocalDateKey(week[index]) === todayKey) ?? 0;
  const weeklyCount = dailyCounts.reduce((total, count) => total + count, 0);
  const weekLabels = week.map((date) => {
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" })
      .format(date)
      .toLowerCase();
    return getLocalDateKey(date) === todayKey ? "today" : weekday;
  });

  const chartData = {
    labels: weekLabels,
    datasets: [
      {
        data: dailyCounts,
        backgroundColor: week.map((date) =>
          getLocalDateKey(date) === todayKey ? "#0ba878" : "#9edac8",
        ),
        borderRadius: 6,
        borderSkipped: false as const,
        maxBarThickness: 30,
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: ({ parsed }) => `${parsed.y} habit ${parsed.y === 1 ? "completion" : "completions"}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(128, 128, 128, 0.16)" },
        border: { display: false },
        ticks: { color: "#777", font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(...dailyCounts, 1),
        ticks: { stepSize: 1, precision: 0, color: "#777", font: { size: 10 } },
        grid: { color: "rgba(128, 128, 128, 0.16)" },
        border: { display: false },
      },
    },
  };

  return (
    <Card
      title="Productivity"
      action={showDetails ? { label: "Details ›", href: "/insights" } : undefined}
      className={styles.productivityCard}
    >
      <div className={styles.summary}>
        <div>
          <span>Today</span>
          <strong>{isLoading ? "—" : `${todayCount} ${todayCount === 1 ? "completion" : "completions"}`}</strong>
        </div>
        <div className={styles.weekSummary}>
          <span>This week</span>
          <strong>{isLoading ? "—" : `${weeklyCount} ${weeklyCount === 1 ? "completion" : "completions"}`}</strong>
        </div>
      </div>

      {isLoading || hasError ? (
        <p className={styles.message}>{isLoading ? <LoadingPlaceholder /> : "Could not load habit activity."}</p>
      ) : (
        <div
          className={styles.chart}
          role="img"
          aria-label={`Habit completions this week: ${weeklyCount} across seven days`}
        >
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
      <p className={styles.note}>
        Based on completed routine habits
      </p>
    </Card>
  );
}
