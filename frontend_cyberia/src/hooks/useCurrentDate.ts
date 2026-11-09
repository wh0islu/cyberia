import { useEffect, useState } from "react";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function useCurrentDate() {
  const [today, setToday] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    const delay = Math.max(1_000, nextDay.getTime() - Date.now());
    const timeout = window.setTimeout(() => setToday(startOfDay(new Date())), delay);
    return () => window.clearTimeout(timeout);
  }, [today]);

  return today;
}
