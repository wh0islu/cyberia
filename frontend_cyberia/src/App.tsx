import { useCollections } from "./hooks/useCollections";
import { Activity, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
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

export function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const transitionRef = useRef<ViewTransition | null>(null);
  const showPath = useCallback((path: string) => {
    transitionRef.current?.skipTransition();

    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrentPath(path);
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => setCurrentPath(path));
    });
    transitionRef.current = transition;
    // Rapid navigation may deliberately skip a snapshot before it is ready.
    void transition.ready.catch(() => undefined);
  }, []);

  useEffect(() => () => transitionRef.current?.skipTransition(), []);
  const { data, failedSections } = useCollections<{
    books: unknown[]; movies: unknown[]; series: unknown[]; habits: unknown[]; courses: unknown[];
  }>(["books", "movies", "series", "habits", "courses"]);
  const counts = {
    books: failedSections.includes("books") ? undefined : data.books.length,
    movies: failedSections.includes("movies") || failedSections.includes("series")
      ? undefined : data.movies.length + data.series.length,
    routine: failedSections.includes("habits") ? undefined : data.habits.length,
    courses: failedSections.includes("courses") ? undefined : data.courses.length,
  };

  useEffect(() => {
    const updateCurrentPath = () => showPath(window.location.pathname);
    window.addEventListener("popstate", updateCurrentPath);

    return () => window.removeEventListener("popstate", updateCurrentPath);
  }, [showPath]);

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
    showPath(href);
  }

  const pages: Record<string, ReactNode> = {
    "/": <Home />,
    "/books": <Books />,
    "/movies/series": <Movies />,
    "/meals": <Meals />,
    "/courses": <Courses />,
    "/routine": <Routine />,
    "/insights": <Insights />,
  };

  const activePath = pages[currentPath] ? currentPath : "/";

  return (
    <div className={styles.app}>
      <Sidebar
        currentPath={currentPath}
        counts={counts}
        onNavigate={navigateTo}
      />
      <div className={styles.app__conteudo}>
        {Object.entries(pages).map(([path, page]) => (
          <Activity
            key={path}
            mode={activePath === path ? "visible" : "hidden"}
          >
            <div className={styles.page}>{page}</div>
          </Activity>
        ))}
      </div>
    </div>
  );
}
