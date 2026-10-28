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

export function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

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
    "/books": <Books />,
    "/movies/series": <Movies />,
    "/meals": <Meals />,
    "/courses": <Courses />,
    "/routine": <Routine />,
    "/insights": <Insights />,
  };

  return (
    <div className={styles.app}>
      <Sidebar
        currentPath={currentPath}
        counts={{ books: 26, movies: 44, routine: 5, meals: 16, courses: 3 }}
        onNavigate={navigateTo}
      />
      <div className={styles.app__conteudo}>
        {pages[currentPath] ?? <Home />}
      </div>
    </div>
  );
}
