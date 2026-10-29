import { useEffect, useState, type ReactNode } from "react";
import { Home } from "./components/Home";
import { Books } from "./components/Books";
import { Courses } from "./components/Courses";
import { Meals } from "./components/Meals";
import { Movies } from "./components/Movies";
import { Routine } from "./components/Routine";
import { Sidebar } from "./components/Sidebar";
import { Insights } from "./components/Insights";
import "./styles/global.css";
import "./styles/theme.css";
import styles from "./App.module.css";

async function fetchCollectionCount(section: string, signal: AbortSignal) {
  const response = await fetch(`/api/v1/${section}/`, {
    signal,
    credentials: "include",
  });
  if (!response.ok) throw new Error(`Could not load ${section}.`);
  const items: unknown = await response.json();
  if (!Array.isArray(items)) throw new Error(`Unexpected ${section} response.`);
  return items.length;
}

export function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [counts, setCounts] = useState<{ books?: number; movies?: number; routine?: number; courses?: number }>({});
  const [countVersion, setCountVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCounts() {
      const [books, movies, series, habits, courses] = await Promise.allSettled(
        ["books", "movies", "series", "habits", "courses"].map((section) =>
          fetchCollectionCount(section, controller.signal),
        ),
      );
      if (controller.signal.aborted) return;

      setCounts({
        books: books.status === "fulfilled" ? books.value : undefined,
        movies: movies.status === "fulfilled" && series.status === "fulfilled"
          ? movies.value + series.value : undefined,
        routine: habits.status === "fulfilled" ? habits.value : undefined,
        courses: courses.status === "fulfilled" ? courses.value : undefined,
      });
    }

    void loadCounts();
    return () => controller.abort();
  }, [currentPath, countVersion]);

  function refreshCounts() {
    setCountVersion((version) => version + 1);
  }

  useEffect(() => {
    const updateCurrentPath = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", updateCurrentPath);

    return () => window.removeEventListener("popstate", updateCurrentPath);
  }, []);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      navigateTo(url.pathname);
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  });

  function navigateTo(href: string) {
    if (href === window.location.pathname) return;

    window.history.pushState({}, "", href);
    setCurrentPath(href);
  }

  const pages: Record<string, ReactNode> = {
    "/books": <Books onCollectionChange={refreshCounts} />,
    "/movies/series": <Movies onCollectionChange={refreshCounts} />,
    "/meals": <Meals />,
    "/courses": <Courses onCollectionChange={refreshCounts} />,
    "/routine": <Routine onCollectionChange={refreshCounts} />,
    "/insights": <Insights />,
  };

  return (
    <div className={styles.app}>
      <Sidebar
        currentPath={currentPath}
        counts={counts}
        onNavigate={navigateTo}
      />
      <div className={styles.app__conteudo}>
        {pages[currentPath] ?? <Home />}
      </div>
    </div>
  );
}
